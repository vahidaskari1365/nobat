import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: true, notifications: [] })
  const notifications = await db.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return Response.json({ ok: true, notifications, unread: notifications.filter((n) => !n.read).length })
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false }, { status: 401 })
  const { id, all } = await req.json()
  if (all) await db.notification.updateMany({ where: { userId: session.id, read: false }, data: { read: true } })
  else if (id) await db.notification.update({ where: { id }, data: { read: true } })
  return Response.json({ ok: true })
}
