'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Video, VideoOff, Mic, MicOff, PhoneOff, Send, Loader2, FileText, UserRound, Stethoscope, MonitorPlay,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { io } from 'socket.io-client'
import { PrescriptionDialog } from '@/components/panels/patient-panel'
import { formatJalali, faDigits, faPrice } from '@/lib/persian'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/** اتاق ویزیت آنلاین — WebRTC + chat. Room code = appointment code */
export function VisitRoom({ code }: { code: string }) {
  const { user, setView } = useApp()
  const [appt, setAppt] = useState<any>(null)
  const [joined, setJoined] = useState(false)
  const [peerInRoom, setPeerInRoom] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [msg, setMsg] = useState('')
  const [chat, setChat] = useState<any[]>([])
  const [rxOpen, setRxOpen] = useState(false)

  const localVideo = useRef<HTMLVideoElement>(null)
  const remoteVideo = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<any>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const chatEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // find appointment by code
    api('/api/appointments').then((r) => {
      const found = (r.appointments ?? []).find((a: any) => a.code === code)
      if (found) setAppt(found)
    }).catch(() => {})
  }, [code])

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  const cleanup = useCallback(() => {
    pcRef.current?.close(); pcRef.current = null
    localStream.current?.getTracks().forEach((t) => t.stop()); localStream.current = null
    socketRef.current?.emit('visit-call-ended', { room: code })
  }, [code])

  useEffect(() => () => cleanup(), [cleanup])

  const createPeer = useCallback(async () => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pcRef.current = pc
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localStream.current = stream
    if (localVideo.current) localVideo.current.srcObject = stream
    stream.getTracks().forEach((t) => pc.addTrack(t, stream))

    pc.onicecandidate = (e) => { if (e.candidate) socketRef.current?.emit('webrtc-ice', { room: code, candidate: e.candidate }) }
    pc.ontrack = (e) => { if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0]; setPeerInRoom(true) }
    return pc
  }, [code])

  const join = async () => {
    try {
      const s = io('/?XTransformPort=3003', { transports: ['websocket', 'polling'], reconnection: true })
      socketRef.current = s
      s.emit('join-visit', { room: code, userId: user.id, name: user.name, role: user.role })

      s.on('visit-joined', async ({ peers }: any) => {
        setJoined(true)
        if (peers <= 1) return // first one; wait for the peer
        // existing peer creates offer
        try {
          const pc = await createPeer()
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          s.emit('webrtc-offer', { room: code, sdp: offer })
        } catch { toast.error('دسترسی به دوربین/میکروفون داده نشد') }
      })

      s.on('visit-peer-joined', async ({ name }: any) => {
        toast.info(`${name} به اتاق ویزیت پیوست`)
        setPeerInRoom(true)
      })

      s.on('webrtc-offer', async ({ sdp }: any) => {
        try {
          const pc = pcRef.current ?? (await createPeer())
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          s.emit('webrtc-answer', { room: code, sdp: answer })
        } catch { toast.error('دسترسی به دوربین/میکروفون داده نشد') }
      })

      s.on('webrtc-answer', async ({ sdp }: any) => {
        if (pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp))
      })

      s.on('webrtc-ice', async ({ candidate }: any) => {
        try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
      })

      s.on('visit-message', (m: any) => setChat((prev) => [...prev, m]))
      s.on('visit-call-ended', () => { toast.info('ویزیت توسط طرف مقابل پایان یافت'); endCall(false) })

      // announce so the other side knows room size
      s.emit('join-conversation', `visit-${code}`)
    } catch (e: any) {
      toast.error('خطا در اتصال به اتاق ویزیت')
    }
  }

  const toggleMic = () => {
    const track = localStream.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled) }
  }
  const toggleCam = () => {
    const track = localStream.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled) }
  }
  const endCall = (notify = true) => {
    if (notify) socketRef.current?.emit('visit-call-ended', { room: code })
    cleanup()
    setJoined(false)
    setPeerInRoom(false)
    toast.success('ویزیت پایان یافت')
  }

  const sendMsg = () => {
    const content = msg.trim()
    if (!content) return
    const m = { room: code, message: { id: Date.now(), sender: { id: user.id, name: user.name }, content, at: new Date().toISOString() } }
    socketRef.current?.emit('visit-message', m)
    setChat((prev) => [...prev, m.message])
    setMsg('')
  }

  if (!user) return null

  const doctor = appt?.doctor
  const isDoctorSide = user.id === appt?.doctorId
  const other = isDoctorSide ? appt?.patient : doctor

  return (
    <div className="pt-24 pb-14 min-h-dvh">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <button onClick={() => setView({ type: 'panel' })} className="inline-flex items-center gap-1.5 text-sm text-primary font-bold hover:underline mb-5">
          <ArrowRight className="size-4" /> بازگشت به پنل
        </button>

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          {/* video area */}
          <div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gradient-to-br from-[#071e22] to-[#0c3a42]">
                  <video ref={remoteVideo} autoPlay playsInline className={cn('absolute inset-0 size-full object-cover', !peerInRoom && 'hidden')} />
                  {!peerInRoom && (
                    <div className="absolute inset-0 grid place-items-center">
                      {joined ? (
                        <div className="text-center text-white/70">
                          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-grid place-items-center size-20 rounded-full bg-white/10 mb-4">
                            <UserRound className="size-9" strokeWidth={1.5} />
                          </motion.div>
                          <p className="font-bold">در انتظار {isDoctorSide ? 'بیمار' : 'پزشک'}…</p>
                          <p className="text-sm mt-1 opacity-70">کد اتاق: <span dir="ltr">{code}</span></p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="inline-grid place-items-center size-20 rounded-full bg-white/10 mb-4"><Video className="size-9 text-white/80" strokeWidth={1.5} /></div>
                          <p className="text-white/80 font-bold mb-4">آماده شروع ویزیت آنلاین هستید؟</p>
                          <Button onClick={join} size="lg" className="rounded-2xl shadow-xl shadow-primary/30">
                            <Video className="size-5 ml-1.5" /> ورود به اتاق ویزیت
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* self view */}
                  <video ref={localVideo} autoPlay playsInline muted
                    className="absolute bottom-4 left-4 w-40 md:w-56 aspect-video object-cover rounded-xl border-2 border-white/20 shadow-2xl bg-black/60" />

                  {/* room badge */}
                  <div className="absolute top-4 right-4 glass rounded-xl px-3.5 py-2 text-xs font-bold text-white flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', joined ? 'bg-red-500 animate-pulse' : 'bg-white/40')} />
                    {joined ? 'ویزیت در جریان' : 'اتاق ویزیت آنلاین'}
                    <Badge variant="secondary" className="bg-white/15 text-white border-0 hover:bg-white/15">رمزنگاری‌شده</Badge>
                  </div>
                </div>

                {joined && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-card border-t">
                    <Button size="icon" variant={micOn ? 'secondary' : 'destructive'} onClick={toggleMic} className="rounded-full size-12" aria-label="میکروفون">
                      {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => endCall()} className="rounded-full size-12 shadow-lg shadow-red-500/30" aria-label="پایان تماس">
                      <PhoneOff className="size-5" />
                    </Button>
                    <Button size="icon" variant={camOn ? 'secondary' : 'destructive'} onClick={toggleCam} className="rounded-full size-12" aria-label="دوربین">
                      {camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
                    </Button>
                    {isDoctorSide && (
                      <Button variant="outline" onClick={() => setRxOpen(true)} className="rounded-full h-12 px-5">
                        <FileText className="size-4 ml-1" /> صدور نسخه
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {appt && (
              <Card className="mt-4">
                <CardContent className="p-5 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary"><Stethoscope className="size-5" strokeWidth={1.7} /></span>
                    <div>
                      <div className="font-bold">{doctor?.name}</div>
                      <div className="text-xs text-muted-foreground">{doctor?.doctorProfile?.specialty?.name}</div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <div className="text-muted-foreground text-xs">بیمار</div>
                    <div className="font-bold">{appt.patient?.name}</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <div className="text-muted-foreground text-xs">تاریخ و ساعت</div>
                    <div className="font-bold">{formatJalali(appt.date, { withWeekday: true })} — {faDigits(appt.time)}</div>
                  </div>
                  <div className="mr-auto font-bold text-primary">{faPrice(appt.price)}</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* in-room chat */}
          <Card className="flex flex-col max-h-[70dvh]">
            <CardContent className="p-0 flex flex-col flex-1">
              <div className="p-3.5 border-b font-bold text-sm flex items-center gap-2"><MonitorPlay className="size-4 text-primary" /> گفتگوی داخل ویزیت</div>
              <div className="flex-1 overflow-y-auto nice-scroll p-4 space-y-2.5 min-h-40">
                <AnimatePresence>
                  {chat.map((m) => {
                    const mine = m.sender?.id === user.id
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', mine ? 'justify-start' : 'justify-end')}>
                        <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2 text-sm', mine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md')}>{m.content}</div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {!chat.length && <p className="text-center text-xs text-muted-foreground py-6">پیامی نیست — گفتگو را شروع کنید</p>}
                <div ref={chatEnd} />
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMsg()} placeholder="پیام…" className="rounded-xl" />
                <Button onClick={sendMsg} size="icon" className="rounded-xl shrink-0" aria-label="ارسال"><Send className="size-4 -scale-x-100" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {rxOpen && appt && <PrescriptionDialog appt={{ ...appt, prescription: null }} onClose={() => setRxOpen(false)} onDone={() => toast.success('نسخه صادر شد')} />}
    </div>
  )
}
