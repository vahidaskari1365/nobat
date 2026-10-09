'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, MessageCircle, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/persian'
import { api } from '@/components/shared/api'
import { io } from 'socket.io-client'
import { toast } from 'sonner'

/** Shared chat panel for PATIENT & DOCTOR — realtime via socket.io :3003 */
export function ChatPanel({ user }: { user: any }) {
  const [conversations, setConversations] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [q, setQ] = useState('')
  const socketRef = useRef<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<string | null>(null)

  useEffect(() => {
    api('/api/chat').then((r) => setConversations(r.conversations ?? [])).catch(() => {})
    const s = io('/?XTransformPort=3003', { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5 })
    socketRef.current = s
    s.on('connect', () => { if (user?.id) s.emit('join', { userId: user.id, name: user.name, role: user.role }) })
    s.on('new-message', (msg: any) => {
      if (msg.conversationId === activeRef.current) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      }
      setConversations((prev) => prev.map((c) => (c.id === msg.conversationId ? { ...c, messages: [msg], lastMessageAt: msg.createdAt } : c)))
    })
    s.on('chat-notification', (data: any) => {
      if (data.conversationId !== activeRef.current) toast.info(`${data.message.sender.name}: ${data.message.content.slice(0, 60)}`)
    })
    return () => { s.disconnect() }
  }, [user?.id])

  useEffect(() => { activeRef.current = active?.id ?? null }, [active])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const openConv = async (convId: string) => {
    const conv = conversations.find((c) => c.id === convId)
    setActive(conv)
    socketRef.current?.emit('join-conversation', convId)
    try {
      const r = await api(`/api/chat?conversationId=${convId}`)
      setMessages(r.conversation?.messages ?? [])
    } catch { setMessages([]) }
  }

  const send = async () => {
    const content = text.trim()
    if (!content || !active || sending) return
    setSending(true)
    setText('')
    const local = { id: 'tmp-' + Date.now(), content, createdAt: new Date().toISOString(), sender: { id: user.id, name: user.name } }
    setMessages((prev) => [...prev, local])
    socketRef.current?.emit('send-message', { conversationId: active.id, senderId: user.id, content }, async (res: any) => {
      if (res?.ok) {
        setMessages((prev) => prev.map((m) => (m.id === local.id ? res.message : m)))
      } else {
        // REST fallback
        try {
          const r = await api('/api/chat', { method: 'POST', body: { conversationId: active.id, content } })
          setMessages((prev) => prev.map((m) => (m.id === local.id ? r.message : m)))
        } catch (e: any) { toast.error(e.message) }
      }
      setSending(false)
    })
  }

  const other = (c: any) => (user.role === 'PATIENT' ? c.doctor : c.patient)
  const filtered = conversations.filter((c) => other(c)?.name?.includes(q))

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100dvh-16rem)] min-h-96">
      {/* conversations */}
      <div className="rounded-2xl border bg-card overflow-hidden flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو…" className="pr-9 h-9 rounded-lg text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageCircle className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              گفتگویی وجود ندارد
            </div>
          )}
          {filtered.map((c) => {
            const o = other(c)
            const last = c.messages?.[0]
            return (
              <button key={c.id} onClick={() => openConv(c.id)}
                className={cn('w-full text-right flex items-center gap-3 p-3.5 hover:bg-primary/5 transition-colors border-b last:border-0', active?.id === c.id && 'bg-primary/10')}>
                <Avatar className="size-10">{o?.avatar && <AvatarImage src={o.avatar} alt={o?.name ?? ""} />}<AvatarFallback className="bg-primary/10 text-primary font-bold">{o?.name?.[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{o?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{last?.content ?? 'شروع گفتگو…'}</div>
                </div>
                {last && <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.lastMessageAt)}</span>}
              </button>
            )
          })}
        </ScrollArea>
      </div>

      {/* messages */}
      <div className="rounded-2xl border bg-card flex flex-col overflow-hidden">
        {!active ? (
          <div className="flex-1 grid place-items-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="size-14 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.4} />
              <p className="font-semibold">یک گفتگو را انتخاب کنید</p>
              <p className="text-sm mt-1">پیام‌های شما رمزنگاری و امن هستند.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3.5 border-b bg-muted/30">
              <Avatar className="size-9">{other(active)?.avatar && <AvatarImage src={other(active).avatar} alt={other(active)?.name ?? ""} />}<AvatarFallback className="bg-primary/10 text-primary font-bold">{other(active)?.name?.[0]}</AvatarFallback></Avatar>
              <div>
                <div className="font-bold text-sm">{other(active)?.name}</div>
                <Badge variant="secondary" className="text-[10px]">{user.role === 'PATIENT' ? other(active)?.doctorProfile?.specialty?.name || 'پزشک' : 'بیمار'}</Badge>
              </div>
              <span className="mr-auto flex items-center gap-1.5 text-xs text-accent"><span className="size-2 rounded-full bg-accent animate-pulse" /> متصل</span>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2.5">
                {messages.map((m) => {
                  const mine = m.sender?.id === user.id || m.senderId === user.id
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('flex', mine ? 'justify-start' : 'justify-end')}>
                      <div className={cn('max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                        mine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md')}>
                        {m.content}
                        <div className={cn('text-[10px] mt-1', mine ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                          {timeAgo(m.createdAt)}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="پیام خود را بنویسید…" className="rounded-xl" />
              <Button onClick={send} disabled={sending || !text.trim()} size="icon" className="rounded-xl size-10 shrink-0" aria-label="ارسال">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 -scale-x-100" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
