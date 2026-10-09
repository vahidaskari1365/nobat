import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { randomUUID } from 'crypto'

/**
 * POST /api/payments  { appointmentId, action: 'pay' | 'refund' }
 * شبیه‌سازی درگاه پرداخت (زرین‌پال‌مانند): ثبت پرداخت موفق + تأیید نوبت
 */
export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 })
  const { appointmentId, action } = await req.json()

  const appt = await db.appointment.findUnique({ where: { id: appointmentId } })
  if (!appt) return Response.json({ ok: false, error: 'نوبت یافت نشد' }, { status: 404 })
  if (session.role === 'PATIENT' && appt.patientId !== session.id)
    return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })

  if (action === 'pay') {
    if (appt.payment?.status === 'PAID')
      return Response.json({ ok: false, error: 'این نوبت قبلا پرداخت شده است' }, { status: 409 })
    const trackingCode = 'PAY-' + randomUUID().slice(0, 8).toUpperCase()
    const [payment] = await Promise.all([
      db.payment.upsert({
        where: { appointmentId },
        update: { status: 'PAID', trackingCode, paidAt: new Date(), amount: appt.price },
        create: { appointmentId, amount: appt.price, status: 'PAID', trackingCode, paidAt: new Date() },
      }),
      db.appointment.update({ where: { id: appointmentId }, data: { status: 'CONFIRMED' } }),
    ])
    await db.notification.createMany({
      data: [
        { userId: appt.patientId, title: 'پرداخت موفق', body: `پرداخت شما با کد پیگیری ${trackingCode} انجام شد و نوبت تأیید گردید.`, type: 'SUCCESS' },
        { userId: appt.doctorId, title: 'نوبت تأیید شد', body: `پرداخت نوبت ${appt.code} انجام و نوبت تأیید شد.`, type: 'SUCCESS' },
      ],
    })
    return Response.json({ ok: true, payment })
  }

  if (action === 'refund') {
    if (session.role === 'PATIENT') return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
    const payment = await db.payment.update({ where: { appointmentId }, data: { status: 'REFUNDED' } })
    await db.appointment.update({ where: { id: appointmentId }, data: { status: 'CANCELLED' } })
    return Response.json({ ok: true, payment })
  }

  return Response.json({ ok: false, error: 'action نامعتبر' }, { status: 400 })
}
