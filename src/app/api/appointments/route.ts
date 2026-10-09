import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { randomUUID } from 'crypto'

const code = () => 'NY-' + Math.floor(100000 + Math.random() * 900000)

export async function GET(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 })
  const sp = req.nextUrl.searchParams
  const status = sp.get('status') || undefined

  const base = {
    include: {
      patient: { select: { id: true, name: true, phone: true, avatar: true, patientProfile: true } },
      doctor: { select: { id: true, name: true, avatar: true, doctorProfile: { include: { specialty: true } } } },
      payment: true,
      review: true,
      prescription: true,
    },
    orderBy: [{ date: 'desc' }, { time: 'desc' }] as any,
    ...(status ? { where: { status } } : {}),
  }

  let appts
  if (session.role === 'PATIENT') {
    appts = await db.appointment.findMany({ ...base, where: { ...base.where, patientId: session.id } })
  } else if (session.role === 'DOCTOR') {
    appts = await db.appointment.findMany({ ...base, where: { ...base.where, doctorId: session.id } })
  } else {
    appts = await db.appointment.findMany(base)
  }
  return Response.json({ ok: true, appointments: appts })
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 })
  if (session.role === 'ADMIN')
    return Response.json({ ok: false, error: 'ادمین نمی‌تواند نوبت ثبت کند' }, { status: 403 })

  const body = await req.json()
  const { doctorId, date, time, type, notes, patientId: manualPatientId, patientName: walkInName } = body

  let patientId = session.id
  // Secretary can book for an existing patient or create a walk-in record
  if (session.role === 'SECRETARY') {
    if (manualPatientId) {
      patientId = manualPatientId
    } else if (walkInName) {
      const created = await db.user.create({
        data: {
          name: walkInName,
          email: `walkin.${randomUUID().slice(0, 8)}@placeholder.ir`,
          password: randomUUID(),
          role: 'PATIENT',
        },
      })
      await db.patientProfile.create({ data: { userId: created.id, phone: body.patientPhone || null } })
      patientId = created.id
    } else {
      return Response.json({ ok: false, error: 'بیمار را انتخاب کنید' }, { status: 400 })
    }
  }

  if (!doctorId || !date || !time)
    return Response.json({ ok: false, error: 'اطلاعات نوبت ناقص است' }, { status: 400 })

  const doctor = await db.user.findFirst({ where: { id: doctorId, role: 'DOCTOR' }, include: { doctorProfile: true } })
  if (!doctor?.doctorProfile) return Response.json({ ok: false, error: 'پزشک یافت نشد' }, { status: 404 })

  // conflict check
  const conflict = await db.appointment.findFirst({
    where: { doctorId, date, time, status: { in: ['PENDING', 'CONFIRMED'] } },
  })
  if (conflict) return Response.json({ ok: false, error: 'این زمان قبلا رزرو شده است' }, { status: 409 })

  const apptType = type === 'ONLINE' ? 'ONLINE' : 'IN_PERSON'
  const price = apptType === 'ONLINE' ? (doctor.doctorProfile.onlinePrice ?? 200000) : (doctor.doctorProfile.price ?? 300000)

  const appt = await db.appointment.create({
    data: { code: code(), patientId, doctorId, date, time, type: apptType, status: 'PENDING', price, notes },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true } },
      payment: true, review: true, prescription: true,
    },
  })
  await db.payment.create({ data: { appointmentId: appt.id, amount: price, status: 'PENDING', trackingCode: 'PAY-' + randomUUID().slice(0, 8).toUpperCase() } })

  await db.notification.createMany({
    data: [
      { userId: doctorId, title: 'نوبت جدید', body: `نوبت جدیدی برای ${appt.patient.name} ثبت شد.`, type: 'INFO' },
      { userId: patientId, title: 'نوبت شما ثبت شد', body: 'برای تأیید نهایی، پرداخت را انجام دهید.', type: 'INFO' },
    ],
  })
  return Response.json({ ok: true, appointment: appt })
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 })
  const { id, status, date, time, notes } = await req.json()
  const appt = await db.appointment.findUnique({ where: { id }, include: { patient: true, doctor: true } })
  if (!appt) return Response.json({ ok: false, error: 'نوبت یافت نشد' }, { status: 404 })

  const isOwnerPatient = session.role === 'PATIENT' && appt.patientId === session.id
  const isOwnerDoctor = session.role === 'DOCTOR' && appt.doctorId === session.id
  const isStaff = session.role === 'SECRETARY' || session.role === 'ADMIN'

  if (isOwnerPatient) {
    if (status && status !== 'CANCELLED')
      return Response.json({ ok: false, error: 'شما فقط می‌توانید نوبت را لغو کنید' }, { status: 403 })
  } else if (!isOwnerDoctor && !isStaff) {
    return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  const data: any = {}
  if (status) data.status = status
  if (isOwnerDoctor || isStaff) {
    if (date) data.date = date
    if (time) data.time = time
    if (notes !== undefined) data.notes = notes
  }

  const updated = await db.appointment.update({ where: { id }, data,
    include: { patient: { select: { name: true } }, doctor: { select: { name: true } }, payment: true, prescription: true, review: true } })

  if (status === 'CONFIRMED')
    await db.notification.create({ data: { userId: appt.patientId, title: 'نوبت شما تأیید شد', body: `نوبت شما با ${appt.doctor.name} تأیید شد.`, type: 'SUCCESS' } })
  if (status === 'CANCELLED')
    await db.notification.create({ data: { userId: appt.patientId, title: 'نوبت لغو شد', body: `نوبت شما با ${appt.doctor.name} لغو شد.`, type: 'ERROR' } })
  if (status === 'COMPLETED')
    await db.notification.create({ data: { userId: appt.patientId, title: 'ویزیت شما انجام شد', body: 'می‌توانید نظرات خود را ثبت کنید.', type: 'SUCCESS' } })

  return Response.json({ ok: true, appointment: updated })
}
