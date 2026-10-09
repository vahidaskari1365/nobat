import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const specialtyId = sp.get('specialtyId') || undefined
  const q = sp.get('q') || undefined

  const doctors = await db.user.findMany({
    where: {
      role: 'DOCTOR',
      status: 'ACTIVE',
      doctorProfile: { verified: true, ...(specialtyId ? { specialtyId } : {}) },
      ...(q ? { name: { contains: q } } : {}),
    },
    select: {
      id: true, name: true, avatar: true,
      doctorProfile: { include: { specialty: true } },
    },
    orderBy: { name: 'asc' },
  })

  // avg rating
  const result = []
  for (const d of doctors) {
    const reviews = await db.review.findMany({ where: { doctorId: d.id, status: 'APPROVED' }, select: { rating: true, comment: true, patient: { select: { name: true } }, createdAt: true } })
    const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
    result.push({
      id: d.id,
      name: d.name,
      avatar: d.avatar,
      specialty: d.doctorProfile?.specialty?.name ?? '',
      bio: d.doctorProfile?.bio ?? '',
      education: d.doctorProfile?.education ?? '',
      experience: d.doctorProfile?.experience ?? 0,
      price: d.doctorProfile?.price ?? 0,
      onlinePrice: d.doctorProfile?.onlinePrice ?? 0,
      city: d.doctorProfile?.city ?? 'تهران',
      rating: Math.round(rating * 10) / 10,
      reviewsCount: reviews.length,
      recentReviews: reviews.slice(0, 3),
    })
  }
  result.sort((a, b) => b.rating - a.rating)
  return Response.json({ ok: true, doctors: result })
}
