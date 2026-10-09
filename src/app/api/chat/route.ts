import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

/** GET ?conversationId=.. -> messages | (none) -> conversation list for current user */
export async function GET(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 })
  const sp = req.nextUrl.searchParams
  const conversationId = sp.get('conversationId')

  if (conversationId) {
    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: { select: { id: true, name: true, avatar: true, role: true } },
        doctor: { select: { id: true, name: true, avatar: true, role: true, doctorProfile: { include: { specialty: true } } } },
        messages: { include: { sender: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' } },
      },
    })
    if (!conv || (conv.patientId !== session.id && conv.doctorId !== session.id && !['ADMIN', 'SECRETARY'].includes(session.role)))
      return Response.json({ ok: false, error: 'یافت نشد' }, { status: 404 })
    await db.chatMessage.updateMany({ where: { conversationId, senderId: { not: session.id }, readAt: null }, data: { readAt: new Date() } })
    return Response.json({ ok: true, conversation: conv })
  }

  const conversations = await db.conversation.findMany({
    where: session.role === 'PATIENT' ? { patientId: session.id } : session.role === 'DOCTOR' ? { doctorId: session.id } : {},
    include: {
      patient: { select: { id: true, name: true, avatar: true } },
      doctor: { select: { id: true, name: true, avatar: true, doctorProfile: { include: { specialty: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { lastMessageAt: 'desc' },
  })
  return Response.json({ ok: true, conversations })
}

/** POST { doctorId | patientId } -> find-or-create conversation; { conversationId, content } -> persist message (REST fallback) */
export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 })
  const body = await req.json()

  if (body.conversationId && body.content) {
    const conv = await db.conversation.findUnique({ where: { id: body.conversationId } })
    if (!conv || (conv.patientId !== session.id && conv.doctorId !== session.id))
      return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
    const msg = await db.chatMessage.create({
      data: { conversationId: body.conversationId, senderId: session.id, content: body.content },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    })
    await db.conversation.update({ where: { id: body.conversationId }, data: { lastMessageAt: new Date() } })
    return Response.json({ ok: true, message: msg })
  }

  let patientId: string | undefined
  let doctorId: string | undefined
  if (session.role === 'PATIENT') { patientId = session.id; doctorId = body.doctorId }
  else if (session.role === 'DOCTOR') { doctorId = session.id; patientId = body.patientId }
  else return Response.json({ ok: false, error: 'نقش نامعتبر' }, { status: 403 })
  if (!patientId || !doctorId) return Response.json({ ok: false, error: 'پارامتر ناقص' }, { status: 400 })

  let conv = await db.conversation.findFirst({ where: { patientId, doctorId } })
  if (!conv) conv = await db.conversation.create({ data: { patientId, doctorId } })
  return Response.json({ ok: true, conversation: conv })
}
