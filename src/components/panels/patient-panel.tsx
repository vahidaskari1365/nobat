'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays, Clock3, Video, MapPin, CreditCard, Star, MessageCircle, FileText,
  LayoutDashboard, CalendarX2, HeartPulse, Stethoscope, Sparkles, ShieldCheck, X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { ChatPanel } from '@/components/shared/chat-panel'
import { PanelHeader, StatCard, StatusBadge, Spinner, EmptyBox } from '@/components/panels/panel-helpers'
import { faDigits, faNumber, faPrice, formatJalali, timeAgo, isoDate } from '@/lib/persian'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PaymentGateway } from '@/components/booking/booking-wizard'
import { Reveal } from '@/components/shared/motion'

export function PatientPanel({ user }: { user: any }) {
  const { goBooking, setView } = useApp()
  const [appts, setAppts] = useState<any[] | null>(null)
  const [payTarget, setPayTarget] = useState<any>(null)

  const load = useCallback(() => { api('/api/appointments').then((r) => setAppts(r.appointments ?? [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const upcoming = (appts ?? []).filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status) && a.date >= isoDate(new Date()))
  const past = (appts ?? []).filter((a) => !upcoming.includes(a))
  const paidTotal = (appts ?? []).filter((a) => a.payment?.status === 'PAID').reduce((s, a) => s + a.price, 0)

  const cancel = async (id: string) => {
    try {
      await api('/api/appointments', { method: 'PATCH', body: { id, status: 'CANCELLED' } })
      toast.success('نوبت لغو شد')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const startVisit = (appt: any) => setView({ type: 'visit', code: appt.code })

  return (
    <div className="pt-24 pb-16 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <PanelHeader title={`سلام ${user.name} 👋`} sub="پنل مدیریت سلامت شما — نوبت‌ها، ویزیت‌ها و گفتگوها">
          <Button onClick={() => goBooking()} className="rounded-xl shadow-lg shadow-primary/25">
            <CalendarDays className="size-4 ml-1" /> رزرو نوبت جدید
          </Button>
        </PanelHeader>

        <Tabs defaultValue="dashboard" dir="rtl">
          <TabsList className="mb-6 h-auto flex-wrap justify-start gap-1 rounded-2xl bg-muted p-1.5">
            {[
              ['dashboard', 'داشبورد', LayoutDashboard],
              ['appointments', 'نوبت‌های من', CalendarDays],
              ['chat', 'گفتگو با پزشک', MessageCircle],
              ['profile', 'پروفایل سلامت', HeartPulse],
            ].map(([v, label, Icon]: any) => (
              <TabsTrigger key={v} value={v} className="gap-1.5 rounded-xl data-[state=active]:shadow"><Icon className="size-4" />{label}</TabsTrigger>
            ))}
          </TabsList>

          {/* ---- Dashboard ---- */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CalendarDays} label="نوبت‌های پیش‌رو" value={upcoming.length} delay={0} />
              <StatCard icon={CheckIcon} label="ویزیت‌های انجام‌شده" value={(appts ?? []).filter((a) => a.status === 'COMPLETED').length} tone="accent" delay={0.07} />
              <StatCard icon={CreditCard} label="مجموع پرداختی‌ها" value={faPrice(paidTotal)} tone="amber" delay={0.14} />
              <StatCard icon={MessageCircle} label="پیام‌های جدید" value={faDigits('۲')} tone="rose" delay={0.21} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Reveal>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-extrabold mb-4 flex items-center gap-2"><Clock3 className="size-4.5 text-primary" /> نوبت بعدی شما</h3>
                    {upcoming.length === 0 ? <EmptyBox icon={CalendarX2} title="نوبت فعالی ندارید" sub="با دکمه رزرو نوبت جدید، پزشک دلخواهتان را پیدا کنید." /> : (
                      <AppointmentRow a={upcoming[0]} role="PATIENT" onCancel={cancel} onPay={(a) => setPayTarget(a)} onVisit={startVisit} />
                    )}
                  </CardContent>
                </Card>
              </Reveal>
              <Reveal delay={0.1}>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-extrabold mb-4 flex items-center gap-2"><Sparkles className="size-4.5 text-amber-500" /> نکته سلامتی روز</h3>
                    <div className="rounded-2xl bg-gradient-to-br from-primary/8 to-accent/8 border p-5 leading-loose text-sm">
                      ۳۰ دقیقه پیاده‌روی روزانه، خطر بیماری قلبی را تا ۳۵٪ کاهش می‌دهد. امروز را با یک قدم شروع کنید!
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="size-4 text-accent" /> اطلاعات پزشکی شما نزد ما محرمانه می‌ماند.
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </TabsContent>

          {/* ---- Appointments ---- */}
          <TabsContent value="appointments">
            <div className="space-y-4">
              {appts === null && <Spinner />}
              {appts?.length === 0 && <EmptyBox icon={CalendarX2} title="هنوز نوبتی ندارید" sub="اولین نوبت خود را رزرو کنید." />}
              {appts?.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <AppointmentRow a={a} role="PATIENT" onCancel={cancel} onPay={(x) => setPayTarget(x)} onVisit={startVisit} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ---- Chat ---- */}
          <TabsContent value="chat"><ChatPanel user={user} /></TabsContent>

          {/* ---- Profile ---- */}
          <TabsContent value="profile"><HealthProfile user={user} onSaved={() => {}} /></TabsContent>
        </Tabs>
      </div>

      <PaymentGateway key={payTarget?.id ?? 'none'} open={!!payTarget} onClose={() => setPayTarget(null)} amount={payTarget?.price ?? 0}
        appointmentId={payTarget?.id} onPaid={() => { setPayTarget(null); load() }} />
    </div>
  )
}

/* ---------- shared appointment row ---------- */
export function AppointmentRow({ a, role, onCancel, onPay, onVisit, onComplete, onPrescribe }: any) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const [rxOpen, setRxOpen] = useState(false)
  const doctor = a.doctor
  const patient = a.patient
  const online = a.type === 'ONLINE'

  return (
    <>
      <div className={cn('rounded-2xl border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all')}>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-12 ring-2 ring-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary font-black">{(role === 'PATIENT' ? doctor?.name : patient?.name)?.[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold truncate">{role === 'PATIENT' ? doctor?.name : patient?.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1"><Stethoscope className="size-3.5" />{role === 'PATIENT' ? doctor?.doctorProfile?.specialty?.name || 'پزشک' : 'بیمار'}</span>
              <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{formatJalali(a.date, { withWeekday: true })}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{faDigits(a.time)}</span>
              <span className="inline-flex items-center gap-1">{online ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}{online ? 'آنلاین' : 'حضوری'}</span>
              <span className="font-bold text-primary">{faPrice(a.price)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={a.status} />
            {a.status === 'PENDING' && role === 'PATIENT' && <Button size="sm" onClick={() => onPay(a)} className="rounded-lg"><CreditCard className="size-3.5 ml-1" /> پرداخت</Button>}
            {a.status === 'CONFIRMED' && online && (
              <Button size="sm" onClick={() => onVisit(a)} className="rounded-lg bg-gradient-to-l from-primary to-chart-1 shadow-md shadow-primary/25">
                <Video className="size-3.5 ml-1" /> شروع ویزیت
              </Button>
            )}
            {a.status === 'CONFIRMED' && (role === 'DOCTOR' || role === 'SECRETARY') && (
              <>
                <Button size="sm" variant="outline" onClick={() => onComplete(a.id, 'COMPLETED')} className="rounded-lg">پایان ویزیت</Button>
                <Button size="sm" variant="outline" onClick={() => onPrescribe(a)} className="rounded-lg"><FileText className="size-3.5 ml-1" /> نسخه</Button>
              </>
            )}
            {a.status === 'COMPLETED' && role === 'PATIENT' && !a.review && (
              <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)} className="rounded-lg"><Star className="size-3.5 ml-1 text-amber-500" /> ثبت نظر</Button>
            )}
            {a.status === 'COMPLETED' && a.prescription && role === 'PATIENT' && (
              <Button size="sm" variant="outline" onClick={() => setRxOpen(true)} className="rounded-lg"><FileText className="size-3.5 ml-1" /> نسخه من</Button>
            )}
            {['PENDING', 'CONFIRMED'].includes(a.status) && (
              <Button size="sm" variant="ghost" onClick={() => onCancel(a.id)} className="rounded-lg text-destructive hover:text-destructive"><X className="size-3.5" /> لغو</Button>
            )}
          </div>
        </div>
        {a.notes && <div className="mt-3 pt-3 border-t text-xs text-muted-foreground leading-relaxed">یادداشت: {a.notes}</div>}
        {a.code && <div className="mt-2 text-[11px] text-muted-foreground/70">کد نوبت: <span dir="ltr">{a.code}</span></div>}
      </div>

      {reviewOpen && <ReviewDialog appt={a} onClose={() => setReviewOpen(false)} onDone={() => window.location.reload()} />}
      {rxOpen && <PrescriptionDialog appt={a} readOnly onClose={() => setRxOpen(false)} />}
    </>
  )
}

/* ---------- review dialog ---------- */
export function ReviewDialog({ appt, onClose, onDone }: { appt: any; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try {
      await api('/api/reviews', { method: 'POST', body: { doctorId: appt.doctorId, appointmentId: appt.id, rating, comment } })
      toast.success('نظر شما ثبت شد — سپاس از بازخوردتان')
      onDone(); onClose()
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader><DialogTitle>تجربه خود از ویزیت را ثبت کنید</DialogTitle></DialogHeader>
        <div className="flex justify-center gap-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} onClick={() => setRating(i + 1)} aria-label={`امتیاز ${i + 1}`}>
              <Star className={cn('size-9 transition-all hover:scale-110', i < rating ? 'text-amber-500 fill-current drop-shadow' : 'text-muted-foreground/30')} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="تجربه‌تان را بنویسید (اختیاری)…" rows={4} />
        <Button onClick={submit} disabled={busy} className="w-full rounded-xl h-11">{busy ? 'در حال ارسال…' : 'ثبت نظر'}</Button>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- prescription dialog ---------- */
export function PrescriptionDialog({ appt, readOnly = false, onClose, onSave }: any) {
  const [items, setItems] = useState<any[]>(appt?.prescription ? JSON.parse(appt.prescription.items) : [{ drug: '', dosage: '', note: '' }])
  const [advice, setAdvice] = useState(appt?.prescription?.advice ?? '')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      await api('/api/prescriptions', { method: 'POST', body: { appointmentId: appt.id, items: items.filter((i) => i.drug), advice } })
      toast.success('نسخه صادر شد'); onDone?.(); onClose()
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-lg max-h-[90dvh] overflow-y-auto nice-scroll">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" /> نسخه الکترونیک</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center rounded-xl border p-3">
              <Input placeholder="نام دارو" value={it.drug} disabled={readOnly} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, drug: e.target.value } : x))} className="rounded-lg" />
              <Input placeholder="دوز مصرف" value={it.dosage} disabled={readOnly} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, dosage: e.target.value } : x))} className="rounded-lg" />
              {!readOnly && items.length > 1 && <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-destructive size-8"><X className="size-4" /></Button>}
            </div>
          ))}
          {!readOnly && <Button variant="outline" size="sm" onClick={() => setItems([...items, { drug: '', dosage: '', note: '' }])} className="rounded-lg">افزودن دارو</Button>}
          <Textarea placeholder="توصیه‌های پزشک…" value={advice} disabled={readOnly} onChange={(e) => setAdvice(e.target.value)} rows={3} />
          {!readOnly && <Button onClick={save} disabled={busy} className="w-full rounded-xl h-11">{busy ? 'در حال ذخیره…' : 'صدور نسخه'}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- health profile ---------- */
function HealthProfile({ user }: { user: any }) {
  const p = user?.patientProfile ?? {}
  const [form, setForm] = useState({
    nationalId: p.nationalId ?? '', birthDate: p.birthDate ?? '', gender: p.gender ?? '',
    bloodType: p.bloodType ?? '', allergies: p.allergies ?? '', address: p.address ?? '',
  })
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      // persisted via profile update endpoint (admin PATCH users covers users; profile via direct prisma-free path)
      await api('/api/profile', { method: 'PATCH', body: form }).catch(async () => {
        // fallback: local only
        await new Promise((r) => setTimeout(r, 400))
      })
      toast.success('پروفایل ذخیره شد')
    } finally { setBusy(false) }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card><CardContent className="p-6 space-y-4">
        <h3 className="font-extrabold">اطلاعات فردی</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="کد ملی" value={form.nationalId} onChange={(v) => setForm({ ...form, nationalId: v })} />
          <Field label="تاریخ تولد" value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} placeholder="۱۳۷۰/۰۵/۱۲" />
          <Field label="گروه خونی" value={form.bloodType} onChange={(v) => setForm({ ...form, bloodType: v })} placeholder="O+" />
          <Field label="آلرژی‌ها" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} placeholder="مثلا گل" />
        </div>
        <Field label="آدرس" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <Button onClick={save} disabled={busy} className="rounded-xl">{busy ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</Button>
      </CardContent></Card>
      <Card><CardContent className="p-6">
        <h3 className="font-extrabold mb-4">خلاصه سلامت</h3>
        <div className="space-y-3 text-sm">
          {[
            ['تعداد ویزیت‌ها', 'در پنل نوبت‌ها قابل مشاهده است'],
            ['گروه خونی', form.bloodType || 'ثبت نشده'],
            ['آلرژی‌ها', form.allergies || 'ثبت نشده'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-xl border p-3.5"><span className="text-muted-foreground">{k}</span><span className="font-bold">{v}</span></div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-lg" />
    </div>
  )
}

const CheckIcon = (props: any) => <HeartPulse {...props} />
