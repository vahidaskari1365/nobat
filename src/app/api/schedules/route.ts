import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

/** GET ?doctorId= (public) | (own for doctor) */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const session = await getSessionUser()
  const doctorId = sp.get('doctorId') || (session?.role === 'DOCTOR' ? session.id : undefined)
  if (!doctorId) return Response.json({ ok: false, error: 'پارامتر ناقص' }, { status: 400 })
  const profile = await db.doctorProfile.findUnique({ where: { userId: doctorId } })
  if (!profile) return Response.json({ ok: true, schedules: [] })
  const schedules = await db.schedule.findMany({ where: { doctorId: profile.id }, orderBy: { weekday: 'asc' } })
  return Response.json({ ok: true, schedules })
}

/** PUT [{weekday, startTime, endTime, slotMinutes, isActive}] — replace doctor weekly schedule */
export async function PUT(req: NextRequest) {
  const session = await getSessionUser()
  if (session?.role !== 'DOCTOR' && session?.role !== 'SECRETARY')
    return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  const { doctorId, schedules } = await req.json()
  const targetDoctorId = session.role === 'DOCTOR' ? session.id : doctorId
  if (!targetDoctorId) return Response.json({ ok: false, error: 'پزشک مشخص نیست' }, { status: 400 })
  const profile = await db.doctorProfile.findUnique({ where: { userId: targetDoctorId } })
  if (!profile) return Response.json({ ok: false, error: 'پزشک یافت نشد' }, { status: 404 })
  await db.schedule.deleteMany({ where: { doctorId: profile.id } })
  if (Array.isArray(schedules) && schedules.length) {
    await db.schedule.createMany({ data: schedules.map((s: any) => ({ doctorId: profile.id, weekday: s.weekday, startTime: s.startTime, endTime: s.endTime, slotMinutes: s.slotMinutes || 30, isActive: s.isActive !== false })) })
  }
  const list = await db.schedule.findMany({ where: { doctorId: profile.id }, orderBy: { weekday: 'asc' } })
  return Response.json({ ok: true, schedules: list })
}
