'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, CalendarDays, Clock3, Stethoscope, Video, MapPin, CreditCard,
  CheckCircle2, Loader2, Star, Search, TicketCheck, ShieldCheck, UserCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { faDigits, faNumber, faPrice, formatJalali, WEEKDAYS_SHORT, toJalali, jalaliMonthLength, jalaliToDate, isoDate, jalaliMonthName } from '@/lib/persian'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Reveal, Orb } from '@/components/shared/motion'

const steps = ['انتخاب پزشک', 'تاریخ و ساعت', 'نوع ویزیت', 'پرداخت', 'تأیید']

export function BookingWizard({ prefDoctorId }: { prefDoctorId?: string }) {
  const { user, openAuth, goBooking } = useApp()
  const [step, setStep] = useState(prefDoctorId ? 1 : 0)
  const [doctors, setDoctors] = useState<any[]>([])
  const [specs, setSpecs] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [specFilter, setSpecFilter] = useState('all')
  const [doctor, setDoctor] = useState<any>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [type, setType] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON')
  const [payOpen, setPayOpen] = useState(false)
  const [created, setCreated] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    api('/api/doctors').then((r) => setDoctors(r.doctors ?? [])).catch(() => {})
    api('/api/specialties').then((r) => setSpecs(r.specialties ?? [])).catch(() => {})
  }, [])

  const filtered = useMemo(() => doctors.filter((d) =>
    (specFilter === 'all' || d.specialty === specFilter) && (!q || d.name.includes(q) || d.specialty.includes(q))
  ), [doctors, specFilter, q])

  const price = doctor ? (type === 'ONLINE' ? doctor.onlinePrice : doctor.price) : 0

  const book = async () => {
    if (!user) { openAuth('login'); return }
    try {
      const r = await api('/api/appointments', { method: 'POST', body: { doctorId: doctor.id, date, time, type } })
      setCreated(r.appointment)
      setPayOpen(true)
    } catch (e: any) { toast.error(e.message) }
  }

  const onPaid = (payment: any) => {
    setPayOpen(false)
    setResult({ ...created, payment })
    setStep(4)
  }

  return (
    <div className="relative pt-28 pb-24 min-h-dvh overflow-hidden">
      <Orb variant="a" className="w-[420px] h-[420px] bg-primary/10 top-10 -right-32" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <Reveal>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">رزرو نوبت</h1>
          <p className="text-muted-foreground mb-8">در چند گام ساده، نوبت خود را رزرو کنید.</p>
        </Reveal>

        {/* stepper */}
        <Reveal delay={0.1}>
          <ol className="flex items-center gap-1.5 md:gap-2 mb-10 overflow-x-auto pb-2 nice-scroll" aria-label="مراحل رزرو">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <div className={cn('flex items-center gap-2 rounded-full px-3.5 py-2 text-xs md:text-sm font-bold transition-all',
                  i === step ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : i < step ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground')}>
                  {i < step ? <CheckCircle2 className="size-4" /> : <span className={cn('grid place-items-center size-5 rounded-full text-[11px]', i === step ? 'bg-white/25' : 'bg-muted-foreground/15')}>{faDigits(i + 1)}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < steps.length - 1 && <div className={cn('h-0.5 w-4 md:w-8 rounded', i < step ? 'bg-accent/50' : 'bg-border')} />}
              </li>
            ))}
          </ol>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35 }}>
            {/* STEP 0: doctor pick */}
            {step === 0 && (
              <div>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی پزشک یا تخصص…" className="pr-10 rounded-xl h-11" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 nice-scroll">
                    <Chip active={specFilter === 'all'} onClick={() => setSpecFilter('all')}>همه</Chip>
                    {specs.map((s) => <Chip key={s.id} active={specFilter === s.name} onClick={() => setSpecFilter(s.name)}>{s.name}</Chip>)}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((d) => (
                    <Card key={d.id} className={cn('border transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 gpu', doctor?.id === d.id && 'border-primary ring-2 ring-primary/20')}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="size-12 ring-2 ring-primary/15"><AvatarFallback className="bg-primary/10 text-primary font-black">{d.name[0]}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <div className="font-bold truncate">{d.name}</div>
                            <div className="text-xs text-primary font-semibold">{d.specialty}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                          <span className="inline-flex items-center gap-1"><Star className="size-3.5 text-amber-500 fill-current" />{d.rating || '—'}</span>
                          <span>{d.experience} سال سابقه</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-primary">از {faPrice(Math.min(d.price, d.onlinePrice))}</span>
                          <Button size="sm" onClick={() => { setDoctor(d); setStep(1) }} className="rounded-lg">انتخاب</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!filtered.length && <div className="col-span-full text-center py-16 text-muted-foreground">پزشکی با این مشخصات یافت نشد</div>}
                </div>
              </div>
            )}

            {/* STEP 1: date & time */}
            {step === 1 && doctor && (
              <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
                <JalaliCalendar selected={date} onSelect={(d) => { setDate(d); setTime(null) }} />
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-extrabold mb-1 flex items-center gap-2"><Clock3 className="size-4.5 text-primary" /> ساعت ویزیت</h3>
                    <p className="text-sm text-muted-foreground mb-5">{date ? formatJalali(date, { withWeekday: true }) : 'ابتدا تاریخ را انتخاب کنید'}</p>
                    {!date ? (
                      <Empty text="از تقویم یک تاریخ انتخاب کنید" />
                    ) : <Slots doctorId={doctor.id} date={date} time={time} onPick={setTime} />}
                    <div className="flex justify-between mt-6">
                      <Button variant="ghost" onClick={() => setStep(0)}><ArrowRight className="size-4" /> بازگشت</Button>
                      <Button disabled={!time} onClick={() => setStep(2)} className="rounded-xl">مرحله بعد <ArrowLeft className="size-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 2: type */}
            {step === 2 && doctor && (
              <div>
                <h3 className="font-extrabold mb-5">نوع ویزیت را انتخاب کنید</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: 'IN_PERSON', icon: MapPin, title: 'ویزیت حضوری', desc: 'مراجعه به مطب پزشک', price: doctor.price },
                    { key: 'ONLINE', icon: Video, title: 'ویزیت آنلاین', desc: 'تماس تصویری از طریق پلتفرم', price: doctor.onlinePrice },
                  ].map((t) => (
                    <button key={t.key} onClick={() => setType(t.key as any)}
                      className={cn('text-right rounded-2xl border-2 p-6 transition-all hover:-translate-y-1 gpu', type === t.key ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'hover:border-primary/40')}>
                      <span className={cn('grid place-items-center size-12 rounded-2xl mb-4', type === t.key ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                        <t.icon className="size-6" strokeWidth={1.7} />
                      </span>
                      <div className="font-extrabold mb-1">{t.title}</div>
                      <div className="text-sm text-muted-foreground mb-3">{t.desc}</div>
                      <div className="font-bold text-primary">{faPrice(t.price)}</div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => setStep(1)}><ArrowRight className="size-4" /> بازگشت</Button>
                  <Button onClick={() => setStep(3)} className="rounded-xl">ادامه به پرداخت <ArrowLeft className="size-4" /></Button>
                </div>
              </div>
            )}

            {/* STEP 3: pay */}
            {step === 3 && doctor && (
              <Card>
                <CardContent className="p-6 md:p-8">
                  <h3 className="font-extrabold mb-6 flex items-center gap-2"><TicketCheck className="size-5 text-primary" /> بازبینی و پرداخت</h3>
                  <div className="rounded-2xl border divide-y text-sm">
                    {[
                      ['پزشک', doctor.name],
                      ['تخصص', doctor.specialty],
                      ['تاریخ', formatJalali(date!, { withWeekday: true })],
                      ['ساعت', faDigits(time!)],
                      ['نوع ویزیت', type === 'ONLINE' ? 'ویزیت آنلاین' : 'ویزیت حضوری'],
                      ['مبلغ قابل پرداخت', faPrice(price)],
                    ].map(([k, v], i) => (
                      <div key={k} className={cn('flex items-center justify-between p-4', i === 5 && 'font-bold text-base')}>{k}<span className={i === 5 ? 'text-primary' : 'font-semibold'}>{v}</span></div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <ShieldCheck className="size-4 text-accent" /> پرداخت از طریق درگاه امن بانکی با گواهی SSL انجام می‌شود.
                  </div>
                  <div className="flex justify-between mt-8">
                    <Button variant="ghost" onClick={() => setStep(2)}><ArrowRight className="size-4" /> بازگشت</Button>
                    <Button onClick={book} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/25"><CreditCard className="size-4 ml-1" /> پرداخت و ثبت نوبت</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: done */}
            {step === 4 && result && (
              <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }} className="inline-grid place-items-center size-24 rounded-full bg-accent/15 text-accent mb-6">
                  <CheckCircle2 className="size-14" strokeWidth={1.5} />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-black mb-2">نوبت شما با موفقیت ثبت شد!</h2>
                <p className="text-muted-foreground mb-8">کد پیگیری پرداخت: <span className="font-bold text-foreground" dir="ltr">{result.payment?.trackingCode}</span></p>
                <Card className="max-w-md mx-auto text-right">
                  <CardContent className="p-6 space-y-3 text-sm">
                    {[['پزشک', result.doctor?.name ?? doctor?.name], ['تاریخ', formatJalali(result.date, { withWeekday: true })], ['ساعت', faDigits(result.time)], ['کد نوبت', result.code]].map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-bold" dir={k === 'کد نوبت' ? 'ltr' : undefined}>{v}</span></div>
                    ))}
                  </CardContent>
                </Card>
                <div className="flex justify-center gap-3 mt-8">
                  <Button onClick={() => goBooking()} variant="outline" className="rounded-xl">رزرو نوبت دیگر</Button>
                  <Button onClick={() => window.location.reload()} className="rounded-xl shadow-lg shadow-primary/25">بازگشت به صفحه اصلی</Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <PaymentGateway key={created?.id ?? 'none'} open={payOpen} onClose={() => setPayOpen(false)} amount={price} appointmentId={created?.id} onPaid={onPaid} />
    </div>
  )
}

/* ---------- Jalali Calendar ---------- */
export function JalaliCalendar({ selected, onSelect }: { selected: string | null; onSelect: (iso: string) => void }) {
  const today = new Date()
  const tj = toJalali(today)
  const [jy, setJy] = useState(tj.jy)
  const [jm, setJm] = useState(tj.jm)
  const [jd] = useState(tj.jd)

  const monthLen = jalaliMonthLength(jy, jm)
  const firstDay = jalaliToDate(jy, jm, 1)
  const startOffset = (firstDay.getDay() + 1) % 7 // شنبه=0

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: monthLen }, (_, i) => i + 1)]

  const prevMonth = () => {
    let y = jy, m = jm - 1
    if (m === 0) { m = 12; y-- }
    setJy(y); setJm(m)
  }
  const nextMonth = () => {
    let y = jy, m = jm + 1
    if (m === 13) { m = 1; y++ }
    setJy(y); setJm(m)
  }

  const isFutureOrToday = (day: number) => {
    const g = jalaliToDate(jy, jm, day)
    const iso = isoDate(g)
    const todayIso = isoDate(today)
    return iso >= todayIso
  }

  return (
    <Card>
      <CardContent className="p-5 w-full lg:w-80">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="ماه بعد"><ArrowLeft className="size-4" /></Button>
          <div className="font-extrabold">{jalaliMonthName(jm)} {faDigits(jy)}</div>
          <Button variant="ghost" size="icon" onClick={prevMonth} disabled={jy === tj.jy && jm === tj.jm} aria-label="ماه قبل"><ArrowRight className="size-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-bold text-muted-foreground">
          {WEEKDAYS_SHORT.map((w) => <div key={w} className="py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const g = jalaliToDate(jy, jm, day)
            const iso = isoDate(g)
            const enabled = isFutureOrToday(day)
            const isToday = jy === tj.jy && jm === tj.jm && day === jd
            const isSel = selected === iso
            return (
              <button
                key={i}
                disabled={!enabled}
                onClick={() => onSelect(iso)}
                className={cn(
                  'aspect-square rounded-xl text-sm font-semibold transition-all',
                  !enabled && 'text-muted-foreground/30 cursor-not-allowed',
                  enabled && !isSel && 'hover:bg-primary/10',
                  isToday && !isSel && 'ring-1 ring-primary/50 text-primary',
                  isSel && 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                )}
              >
                {faDigits(day)}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function jalaliMonthNameLocal(m: number) {
  return jalaliMonthName(m)
}

/* ---------- Slots ---------- */
function Slots({ doctorId, date, time, onPick }: { doctorId: string; date: string; time: string | null; onPick: (t: string) => void }) {
  const [slots, setSlots] = useState<any[] | null>(null)
  const [working, setWorking] = useState(true)
  useEffect(() => {
    let cancelled = false
    api(`/api/availability?doctorId=${doctorId}&date=${date}`)
      .then((r) => { if (!cancelled) { setSlots(r.slots ?? []); setWorking(r.working) } })
      .catch(() => { if (!cancelled) setSlots([]) })
    return () => { cancelled = true }
  }, [doctorId, date])

  if (slots === null) return <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 rounded-xl shimmer" />)}</div>
  if (!working) return <Empty text="پزشک در این روز ویزیت ندارد — روز دیگری را انتخاب کنید" />
  if (!slots.length) return <Empty text="اسلات آزادی برای این روز باقی نمانده" />

  return (
    <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto nice-scroll pl-1">
      {slots.map((s) => (
        <button key={s.time} disabled={!s.available} onClick={() => onPick(s.time)}
          className={cn('rounded-xl border py-2.5 text-sm font-bold transition-all',
            !s.available && 'opacity-35 line-through cursor-not-allowed',
            s.available && time !== s.time && 'hover:border-primary hover:text-primary hover:bg-primary/5',
            time === s.time && 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25')}>
          {faDigits(s.time)}
        </button>
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-2xl">{text}</div>
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('shrink-0 rounded-full px-4 py-2 text-xs font-bold border transition-all', active ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25' : 'hover:border-primary/50')}>
      {children}
    </button>
  )
}

/* ---------- Payment Gateway (mock ZarinPal-like) ---------- */
export function PaymentGateway({ open, onClose, amount, appointmentId, onPaid }: {
  open: boolean; onClose: () => void; amount: number; appointmentId?: string; onPaid: (payment: any) => void
}) {
  const [phase, setPhase] = useState<'review' | 'processing' | 'success'>('review')
  const [payment, setPayment] = useState<any>(null)

  const pay = async () => {
    if (!appointmentId) return
    setPhase('processing')
    try {
      await new Promise((r) => setTimeout(r, 1800)) // شبیه‌سازی رفت‌وبرگشت به درگاه
      const r = await api('/api/payments', { method: 'POST', body: { appointmentId, action: 'pay' } })
      setPayment(r.payment)
      setPhase('success')
      toast.success('پرداخت با موفقیت انجام شد')
      setTimeout(() => onPaid(r.payment), 1200)
    } catch (e: any) {
      setPhase('review')
      toast.error(e.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && phase !== 'processing' && onClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="size-5 text-primary" /> درگاه پرداخت امن</DialogTitle>
        </DialogHeader>

        {phase === 'review' && (
          <div className="space-y-5">
            <div className="rounded-2xl border p-5 text-sm space-y-3 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex justify-between"><span className="text-muted-foreground">پذیرنده</span><span className="font-bold">پلتفرم نوبت‌یار</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">مبلغ</span><span className="font-black text-lg text-primary">{faPrice(amount)}</span></div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-accent" /> این یک پرداخت آزمایشی در محیط دمو است.</div>
            <Button onClick={pay} className="w-full h-12 rounded-xl text-base shadow-lg shadow-primary/25">پرداخت {faPrice(amount)}</Button>
          </div>
        )}

        {phase === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="size-12 text-primary animate-spin mx-auto" />
            <p className="font-semibold">در حال انتقال به درگاه بانکی…</p>
            <div className="max-w-xs mx-auto h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full w-1/2 rounded-full shimmer bg-primary/40" /></div>
          </div>
        )}

        {phase === 'success' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="inline-grid place-items-center size-20 rounded-full bg-accent/15 text-accent mb-5">
              <CheckCircle2 className="size-11" strokeWidth={1.6} />
            </motion.div>
            <div className="font-extrabold text-xl mb-1">پرداخت موفق</div>
            <p className="text-sm text-muted-foreground">کد پیگیری: <span className="font-bold text-foreground" dir="ltr">{payment?.trackingCode}</span></p>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
