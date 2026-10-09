import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SECRET = process.env.AUTH_SECRET || 'nobatyar-dev-secret-2026'
export const TOKEN_COOKIE = 'ny_token'

export interface SessionUser {
  id: string
  name: string
  email: string | null
  role: 'PATIENT' | 'DOCTOR' | 'SECRETARY' | 'ADMIN'
  avatar: string | null
}

export function signToken(payload: object, days = 7) {
  return jwt.sign(payload, SECRET, { expiresIn: `${days}d` })
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const data = jwt.verify(token, SECRET) as any
    return { id: data.id, name: data.name, email: data.email, role: data.role, avatar: data.avatar ?? null }
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(TOKEN_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

/** Load full user row + role profile */
export async function getCurrentUser(full = false) {
  const session = await getSessionUser()
  if (!session) return null
  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      doctorProfile: { include: { specialty: true } },
      patientProfile: true,
      secretaryProfile: true,
    },
  })
  if (!user || user.status !== 'ACTIVE') return null
  return full ? user : session
}

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status })
}

export function jsonOk(data: any = {}) {
  return Response.json({ ok: true, ...data })
}
