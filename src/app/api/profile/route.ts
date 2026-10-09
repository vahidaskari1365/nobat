import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

/** PATCH own role-profile */
export async function PATCH(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 })
  const body = await req.json()

  if (session.role === 'PATIENT') {
    const data: any = {}
    for (const k of ['nationalId', 'birthDate', 'gender', 'bloodType', 'allergies', 'address']) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    const profile = await db.patientProfile.upsert({ where: { userId: session.id }, update: data, create: { userId: session.id, ...data } })
    return Response.json({ ok: true, profile })
  }

  if (session.role === 'DOCTOR') {
    const data: any = {}
    for (const k of ['bio', 'education', 'experience', 'price', 'onlinePrice', 'city']) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    const profile = await db.doctorProfile.update({ where: { userId: session.id }, data })
    return Response.json({ ok: true, profile })
  }

  return Response.json({ ok: false, error: 'نقش پشتیبانی نمی‌شود' }, { status: 400 })
}
