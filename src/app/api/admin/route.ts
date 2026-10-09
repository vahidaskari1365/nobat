import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const session = await getSessionUser()
  if (session?.role !== 'ADMIN') return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })

  const [users, doctors, appointments, payments, reviews, posts] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, doctorProfile: { include: { specialty: true } } } }),
    db.doctorProfile.findMany({ include: { user: { select: { id: true, name: true, email: true, status: true } }, specialty: true } }),
    db.appointment.findMany({ include: { patient: { select: { name: true } }, doctor: { select: { name: true } }, payment: true } }),
    db.payment.findMany({ where: { status: 'PAID' } }),
    db.review.findMany({ include: { patient: { select: { name: true } }, doctor: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
    db.blogPost.findMany({ include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
  ])

  const revenue = payments.reduce((s, p) => s + p.amount, 0)

  // appointments last 7 days
  const days: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, count: appointments.filter((a) => a.date === key).length })
  }

  // revenue last 6 months
  const months: { month: string; total: number }[] = []
  const faMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const total = payments.filter((p) => p.paidAt && p.paidAt.toISOString().slice(0, 7) === key).reduce((s, p) => s + p.amount, 0)
    months.push({ month: faMonths[d.getMonth()], total })
  }

  const roleCounts = {
    PATIENT: users.filter((u) => u.role === 'PATIENT').length,
    DOCTOR: users.filter((u) => u.role === 'DOCTOR').length,
    SECRETARY: users.filter((u) => u.role === 'SECRETARY').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  }

  const statusCounts = {
    PENDING: appointments.filter((a) => a.status === 'PENDING').length,
    CONFIRMED: appointments.filter((a) => a.status === 'CONFIRMED').length,
    COMPLETED: appointments.filter((a) => a.status === 'COMPLETED').length,
    CANCELLED: appointments.filter((a) => a.status === 'CANCELLED').length,
  }

  return Response.json({ ok: true, stats: { users, doctors, appointments, revenue, reviews, posts, days, months, roleCounts, statusCounts } })
}

/** PATCH { userId, status? , verified? } — toggle account / verify doctor */
export async function PATCH(req: NextRequest) {
  const session = await getSessionUser()
  if (session?.role !== 'ADMIN') return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  const { userId, status, verified } = await req.json()
  if (status) {
    if (userId === session.id) return Response.json({ ok: false, error: 'نمی‌توانید خودتان را غیرفعال کنید' }, { status: 400 })
    await db.user.update({ where: { id: userId }, data: { status } })
  }
  if (verified !== undefined) await db.doctorProfile.update({ where: { userId }, data: { verified } })
  return Response.json({ ok: true })
}

/** POST { name, slug, icon, description } — add specialty */
export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (session?.role !== 'ADMIN') return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  const { name, description } = await req.json()
  if (!name) return Response.json({ ok: false, error: 'نام الزامی است' }, { status: 400 })
  const slug = 'spec-' + Math.random().toString(36).slice(2, 8)
  const specialty = await db.specialty.create({ data: { name, slug, description } })
  return Response.json({ ok: true, specialty })
}
