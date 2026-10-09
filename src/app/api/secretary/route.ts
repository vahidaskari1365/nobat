import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

/** GET: clinic overview for secretary (doctors + patients + today's appointments) */
export async function GET() {
  const session = await getSessionUser()
  if (!session || !['SECRETARY', 'ADMIN'].includes(session.role))
    return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })

  const today = new Date().toISOString().slice(0, 10)
  const [doctors, patients, todayAppts, allAppts] = await Promise.all([
    db.user.findMany({ where: { role: 'DOCTOR', status: 'ACTIVE' }, select: { id: true, name: true, avatar: true, doctorProfile: { include: { specialty: true } } } }),
    db.user.findMany({ where: { role: 'PATIENT' }, select: { id: true, name: true, phone: true, createdAt: true, email: true, patientProfile: true }, orderBy: { createdAt: 'desc' } }),
    db.appointment.findMany({
      where: { date: today },
      include: { patient: { select: { name: true, phone: true } }, doctor: { select: { name: true } }, payment: true },
      orderBy: { time: 'asc' },
    }),
    db.appointment.findMany({ select: { status: true, price: true, payment: { select: { status: true } } } }),
  ])

  const revenue = allAppts.filter((a) => a.payment?.status === 'PAID').reduce((s, a) => s + a.price, 0)
  return Response.json({
    ok: true,
    overview: {
      doctors, patients, todayAppts,
      stats: {
        todayCount: todayAppts.length,
        patientsCount: patients.length,
        pendingCount: allAppts.filter((a) => a.status === 'PENDING').length,
        revenue,
      },
    },
  })
}
