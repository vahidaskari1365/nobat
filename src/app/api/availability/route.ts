import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/availability?doctorId=..&date=2026-10-15 -> slots for the given date */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const doctorId = sp.get('doctorId')
  const date = sp.get('date')
  if (!doctorId || !date) return Response.json({ ok: false, error: 'پارامتر ناقص' }, { status: 400 })

  const d = new Date(date + 'T00:00:00')
  const jsDay = d.getDay()
  const weekday = (jsDay + 1) % 7 // شنبه=0

  const profile = await db.doctorProfile.findUnique({ where: { userId: doctorId } })
  if (!profile) return Response.json({ ok: false, error: 'پزشک یافت نشد' }, { status: 404 })

  const schedules = await db.schedule.findMany({ where: { doctorId: profile.id, isActive: true } })
  const daySchedules = schedules.filter((s) => s.weekday === weekday)

  const booked = await db.appointment.findMany({
    where: { doctorId, date, status: { in: ['PENDING', 'CONFIRMED'] } },
    select: { time: true },
  })
  const taken = new Set(booked.map((b) => b.time))

  const now = new Date()
  const isToday = date === new Date().toISOString().slice(0, 10)

  const slots: { time: string; available: boolean }[] = []
  for (const sch of daySchedules) {
    const [sh, sm] = sch.startTime.split(':').map(Number)
    const [eh, em] = sch.endTime.split(':').map(Number)
    let cur = sh * 60 + sm
    const end = eh * 60 + em
    while (cur + sch.slotMinutes <= end) {
      const time = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`
      const pastToday = isToday && cur <= now.getHours() * 60 + now.getMinutes()
      slots.push({ time, available: !taken.has(time) && !pastToday })
      cur += sch.slotMinutes
    }
  }
  return Response.json({ ok: true, slots, working: daySchedules.length > 0 })
}
