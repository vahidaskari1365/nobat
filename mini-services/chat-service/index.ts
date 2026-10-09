/**
 * NobatYar realtime service: chat + online-visit WebRTC signaling
 * Port 3003 — accessed via gateway: io('/?XTransformPort=3003')
 */
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward requests
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

interface SocketMeta { userId?: string; name?: string; role?: string }

io.on('connection', (socket) => {
  const meta: SocketMeta = {}
  console.log('[rt] connected:', socket.id)

  socket.on('join', async (data: { userId: string; name: string; role: string }) => {
    meta.userId = data.userId
    meta.name = data.name
    meta.role = data.role
    socket.join(`user:${data.userId}`)
    console.log('[rt] join user', data.userId)
  })

  /** ---- 1:1 chat ---- */
  socket.on('join-conversation', (conversationId: string) => {
    socket.join(`conv:${conversationId}`)
  })

  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(`conv:${conversationId}`)
  })

  socket.on(
    'send-message',
    async (data: { conversationId: string; senderId: string; content: string }, ack?: (r: any) => void) => {
      try {
        const conv = await db.conversation.findUnique({ where: { id: data.conversationId } })
        if (!conv || (conv.patientId !== data.senderId && conv.doctorId !== data.senderId)) {
          ack?.({ ok: false, error: 'forbidden' })
          return
        }
        const msg = await db.chatMessage.create({
          data: { conversationId: data.conversationId, senderId: data.senderId, content: data.content },
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        })
        await db.conversation.update({ where: { id: data.conversationId }, data: { lastMessageAt: new Date() } })

        // realtime to the conversation room
        io.to(`conv:${data.conversationId}`).emit('new-message', msg)

        // notify the other party (even if not in the room)
        const otherId = conv.patientId === data.senderId ? conv.doctorId : conv.patientId
        io.to(`user:${otherId}`).emit('chat-notification', {
          conversationId: data.conversationId,
          message: msg,
        })
        ack?.({ ok: true, message: msg })
      } catch (e) {
        ack?.({ ok: false, error: 'db-error' })
      }
    }
  )

  socket.on('typing', (data: { conversationId: string; userId: string; name: string }) => {
    socket.to(`conv:${data.conversationId}`).emit('user-typing', { userId: data.userId, name: data.name })
  })

  socket.on('read-messages', async (data: { conversationId: string; userId: string }) => {
    await db.chatMessage.updateMany({
      where: { conversationId: data.conversationId, senderId: { not: data.userId }, readAt: null },
      data: { readAt: new Date() },
    })
    socket.to(`conv:${data.conversationId}`).emit('messages-read', { by: data.userId })
  })

  /** ---- Online visit room (WebRTC signaling) ---- */
  socket.on('join-visit', (data: { room: string; userId: string; name: string; role: string }) => {
    socket.join(`visit:${data.room}`)
    const peers = Array.from((io.sockets.adapter.rooms.get(`visit:${data.room}`) || []).length)
    // tell everyone in the room about the newcomer
    socket.to(`visit:${data.room}`).emit('visit-peer-joined', { userId: data.userId, name: data.name, role: data.role })
    socket.emit('visit-joined', { room: data.room, peers })
    socket.to(`visit:${data.room}`).emit('visit-peer-count', { count: peers.length ?? 0 })
  })

  socket.on('webrtc-offer', (data: { room: string; sdp: any }) => {
    socket.to(`visit:${data.room}`).emit('webrtc-offer', { sdp: data.sdp })
  })

  socket.on('webrtc-answer', (data: { room: string; sdp: any }) => {
    socket.to(`visit:${data.room}`).emit('webrtc-answer', { sdp: data.sdp })
  })

  socket.on('webrtc-ice', (data: { room: string; candidate: any }) => {
    socket.to(`visit:${data.room}`).emit('webrtc-ice', { candidate: data.candidate })
  })

  socket.on('visit-message', (data: { room: string; message: any }) => {
    io.to(`visit:${data.room}`).emit('visit-message', data.message)
  })

  socket.on('visit-call-ended', (data: { room: string }) => {
    socket.to(`visit:${data.room}`).emit('visit-call-ended')
  })

  socket.on('disconnect', () => {
    console.log('[rt] disconnected:', socket.id)
  })
})

httpServer.listen(3003, () => {
  console.log('[rt] realtime service ready on :3003')
})
