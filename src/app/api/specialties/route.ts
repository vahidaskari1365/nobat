import { db } from '@/lib/db'

export async function GET() {
  const specs = await db.specialty.findMany({
    include: { _count: { select: { doctors: { where: { verified: true } } } } },
    orderBy: { name: 'asc' },
  })
  return Response.json({ ok: true, specialties: specs.map((s) => ({ ...s, doctorsCount: s._count.doctors })) })
}
