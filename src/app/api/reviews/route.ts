import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const doctorId = sp.get('doctorId')
  if (!doctorId) return Response.json({ ok: false, error: 'پارامتر ناقص' }, { status: 400 })
  const reviews = await db.review.findMany({
    where: { doctorId, status: 'APPROVED' },
    include: { patient: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  return Response.json({ ok: true, reviews, avg: Math.round(avg * 10) / 10, count: reviews.length })
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session || session.role !== 'PATIENT')
    return Response.json({ ok: false, error: 'فقط بیماران می‌توانند نظر ثبت کنند' }, { status: 403 })
  const { doctorId, appointmentId, rating, comment } = await req.json()
  if (!doctorId || !rating) return Response.json({ ok: false, error: 'امتیاز الزامی است' }, { status: 400 })

  if (appointmentId) {
    const appt = await db.appointment.findUnique({ where: { id: appointmentId } })
    if (!appt || appt.patientId !== session.id)
      return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
    if (appt.status !== 'COMPLETED')
      return Response.json({ ok: false, error: 'پس از انجام ویزیت می‌توانید نظر ثبت کنید' }, { status: 400 })
  }
  const dup = await db.review.findFirst({ where: { patientId: session.id, doctorId, appointmentId: appointmentId || null } })
  if (dup) return Response.json({ ok: false, error: 'شما قبلا برای این ویزیت نظر ثبت کرده‌اید' }, { status: 409 })

  const review = await db.review.create({ data: { patientId: session.id, doctorId, appointmentId: appointmentId || null, rating: Number(rating), comment } })

  const list = await db.review.findMany({ where: { doctorId, status: 'APPROVED' } })
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length
  await db.doctorProfile.updateMany({ where: { userId: doctorId }, data: { rating: Math.round(avg * 10) / 10, reviewsCount: list.length } })

  return Response.json({ ok: true, review })
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser()
  if (session?.role !== 'ADMIN') return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  const { id, status } = await req.json()
  const review = await db.review.update({ where: { id }, data: { status }, include: { doctor: true } })
  const list = await db.review.findMany({ where: { doctorId: review.doctorId, status: 'APPROVED' } })
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0
  await db.doctorProfile.updateMany({ where: { userId: review.doctorId }, data: { rating: Math.round(avg * 10) / 10, reviewsCount: list.length } })
  return Response.json({ ok: true, review })
}
