import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 })
  const appointmentId = req.nextUrl.searchParams.get('appointmentId')
  if (!appointmentId) return Response.json({ ok: false, error: 'پارامتر ناقص' }, { status: 400 })
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { prescription: true, doctor: { select: { name: true, doctorProfile: { include: { specialty: true } } } }, patient: { select: { name: true } } },
  })
  if (!appt) return Response.json({ ok: false, error: 'یافت نشد' }, { status: 404 })
  if (session.role === 'PATIENT' && appt.patientId !== session.id)
    return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  return Response.json({ ok: true, prescription: appt.prescription, appointment: appt })
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (session?.role !== 'DOCTOR') return Response.json({ ok: false, error: 'فقط پزشک می‌تواند نسخه ثبت کند' }, { status: 403 })
  const { appointmentId, items, advice } = await req.json()
  const appt = await db.appointment.findUnique({ where: { id: appointmentId } })
  if (!appt || appt.doctorId !== session.id) return Response.json({ ok: false, error: 'نوبت یافت نشد' }, { status: 404 })
  const prescription = await db.prescription.upsert({
    where: { appointmentId },
    update: { items: JSON.stringify(items), advice },
    create: { appointmentId, items: JSON.stringify(items), advice },
  })
  await db.notification.create({ data: { userId: appt.patientId, title: 'نسخه جدید', body: 'پزشک برای شما نسخه صادر کرد.', type: 'SUCCESS' } })
  return Response.json({ ok: true, prescription })
}
