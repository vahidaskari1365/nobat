'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays, Clock3, Star, MessageCircle, LayoutDashboard, Users, TrendingUp,
  CalendarPlus, FileText, Wallet, BadgeCheck, Video,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { ChatPanel } from '@/components/shared/chat-panel'
import { PanelHeader, StatCard, StatusBadge, Spinner, EmptyBox } from '@/components/panels/panel-helpers'
import { AppointmentRow, PrescriptionDialog } from '@/components/panels/patient-panel'
import { faDigits, faNumber, faPrice, formatJalali, WEEKDAYS, isoDate } from '@/lib/persian'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function DoctorPanel({ user }: { user: any }) {
  const { setView } = useApp()
  const [appts, setAppts] = useState<any[] | null>(null)
  const [reviews, setReviews] = useState<any[] | null>(null)
  const [stats, setStats] = useState({ today: 0, income: 0, rating: 0, count: 0 })
  const [rxFor, setRxFor] = useState<any>(null)

  const load = useCallback(() => {
    api('/api/appointments').then((r) => {
      const list = r.appointments ?? []
      setAppts(list)
      const today = isoDate(new Date())
      setStats((s) => ({
        ...s,
        today: list.filter((a) => a.date === today && a.status !== 'CANCELLED').length,
        income: list.filter((a) => a.payment?.status === 'PAID').reduce((sum, a) => sum + a.price, 0),
      }))
    }).catch(() => {})
    api(`/api/reviews?doctorId=${user.id}`).then((r) => {
      setReviews(r.reviews ?? [])
      setStats((s) => ({ ...s, rating: r.avg ?? 0, count: r.count ?? 0 }))
    }).catch(() => {})
  }, [user.id])
  useEffect(() => { load() }, [load])

  const changeStatus = async (id: string, status: string) => {
    try {
      await api('/api/appointments', { method: 'PATCH', body: { id, status } })
      toast.success(status === 'COMPLETED' ? 'ویزیت تکمیل شد' : 'وضعیت به‌روزرسانی شد')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const today = isoDate(new Date())
  const todayAppts = (appts ?? []).filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time))
  const upcoming = (appts ?? []).filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status) && a.date > today)

  return (
    <div className="pt-24 pb-16 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <PanelHeader title={user.name} sub={`پنل پزشکی — ${user.doctorProfile?.specialty?.name ?? ''}`}>
          <div className="flex items-center gap-2">
            <Badge className="bg-accent/12 text-accent border-0 hover:bg-accent/12 gap-1">
              <BadgeCheck className="size-3.5" /> پزشک تأییدشده
            </Badge>
          </div>
        </PanelHeader>

        <Tabs defaultValue="dashboard" dir="rtl">
          <TabsList className="mb-6 h-auto flex-wrap justify-start gap-1 rounded-2xl bg-muted p-1.5">
            {[
              ['dashboard', 'داشبورد', LayoutDashboard],
              ['appointments', 'نوبت‌ها', CalendarDays],
              ['schedule', 'برنامه کاری', Clock3],
              ['chat', 'گفتگو با بیماران', MessageCircle],
              ['reviews', 'نظرات بیماران', Star],
            ].map(([v, label, Icon]: any) => (
              <TabsTrigger key={v} value={v} className="gap-1.5 rounded-xl data-[state=active]:shadow"><Icon className="size-4" />{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CalendarDays} label="نوبت‌های امروز" value={stats.today} delay={0} />
              <StatCard icon={Wallet} label="درآمد کل" value={faPrice(stats.income)} tone="accent" delay={0.07} />
              <StatCard icon={Star} label="امتیاز بیماران" value={`${faDigits(stats.rating || '۰')} از ۵`} tone="amber" delay={0.14} />
              <StatCard icon={Users} label="تعداد نظرات" value={stats.count} tone="rose" delay={0.21} />
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-extrabold mb-4 flex items-center gap-2"><TrendingUp className="size-4.5 text-primary" /> برنامه امروز — {formatJalali(today, { withWeekday: true })}</h3>
                {todayAppts.length === 0 ? <EmptyBox icon={CalendarPlus} title="امروز نوبتی ندارید" sub="زمان استراحت خوبی است!" /> : (
                  <div className="space-y-3">
                    {todayAppts.map((a) => (
                      <AppointmentRow key={a.id} a={a} role="DOCTOR" onCancel={(id: string) => changeStatus(id, 'CANCELLED')}
                        onComplete={(id: string) => changeStatus(id, 'COMPLETED')}
                        onVisit={(x: any) => setView({ type: 'visit', code: x.code })}
                        onPrescribe={(x: any) => setRxFor(x)} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {upcoming.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-extrabold mb-4">نوبت‌های پیش‌رو</h3>
                  <div className="space-y-3">
                    {upcoming.slice(0, 5).map((a) => (
                      <AppointmentRow key={a.id} a={a} role="DOCTOR" onCancel={(id: string) => changeStatus(id, 'CANCELLED')}
                        onComplete={(id: string) => changeStatus(id, 'COMPLETED')}
                        onVisit={(x: any) => setView({ type: 'visit', code: x.code })}
                        onPrescribe={(x: any) => setRxFor(x)} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="appointments">
            <div className="space-y-3">
              {appts === null && <Spinner />}
              {appts?.map((a) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <AppointmentRow a={a} role="DOCTOR" onCancel={(id: string) => changeStatus(id, 'CANCELLED')}
                    onComplete={(id: string) => changeStatus(id, 'COMPLETED')}
                    onVisit={(x: any) => setView({ type: 'visit', code: x.code })}
                    onPrescribe={(x: any) => setRxFor(x)} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule"><ScheduleEditor doctorId={user.id} /></TabsContent>
          <TabsContent value="chat"><ChatPanel user={user} /></TabsContent>

          <TabsContent value="reviews">
            <div className="grid md:grid-cols-2 gap-4">
              {reviews === null && <Spinner />}
              {reviews?.length === 0 && <EmptyBox icon={Star} title="هنوز نظری ثبت نشده" />}
              {reviews?.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card><CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar><AvatarFallback className="bg-primary/10 text-primary font-bold">{r.patient?.name?.[0]}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-bold text-sm">{r.patient?.name}</div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={cn('size-3.5', j < r.rating ? 'text-amber-500 fill-current' : 'text-muted-foreground/25')} />
                          ))}
                        </div>
                      </div>
                      <span className="mr-auto text-xs text-muted-foreground">{timeAgoSafe(r.createdAt)}</span>
                    </div>
                    {r.comment && <p className="text-sm leading-relaxed text-muted-foreground">{r.comment}</p>}
                  </CardContent></Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {rxFor && <PrescriptionDialog appt={{ ...rxFor, prescription: null }} onClose={() => setRxFor(null)} onDone={load} />}
    </div>
  )
}

function timeAgoSafe(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 30) return formatJalali(d, { short: true })
  return `${faDigits(Math.max(1, days))} روز پیش`
}

/* ---------- weekly schedule editor ---------- */
function ScheduleEditor({ doctorId }: { doctorId: string }) {
  const [rows, setRows] = useState<any[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [prices, setPrices] = useState({ price: '', onlinePrice: '' })

  useEffect(() => {
    api(`/api/schedules?doctorId=${doctorId}`).then((r) => {
      const existing = r.schedules ?? []
      const full = WEEKDAYS.slice(0, 6).map((_, w) => existing.find((e: any) => e.weekday === w) ?? { weekday: w, startTime: '09:00', endTime: '17:00', slotMinutes: 30, isActive: false })
      setRows(full)
    }).catch(() => {})
    api('/api/auth').then((r) => {
      if (r.user?.doctorProfile) setPrices({ price: String(r.user.doctorProfile.price ?? ''), onlinePrice: String(r.user.doctorProfile.onlinePrice ?? '') })
    }).catch(() => {})
  }, [doctorId])

  const save = async () => {
    setBusy(true)
    try {
      await api('/api/schedules', { method: 'PUT', body: { schedules: rows } })
      await api('/api/profile', { method: 'PATCH', body: { price: Number(prices.price), onlinePrice: Number(prices.onlinePrice) } })
      toast.success('برنامه کاری ذخیره شد')
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }

  if (!rows) return <Spinner label="در حال بارگذاری برنامه…" />

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card><CardContent className="p-6">
        <h3 className="font-extrabold mb-5">ساعات کاری هفتگی</h3>
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className={cn('flex flex-wrap items-center gap-3 rounded-xl border p-3.5 transition-opacity', !r.isActive && 'opacity-50')}>
              <Switch checked={r.isActive} onCheckedChange={(v) => setRows(rows.map((x, j) => j === i ? { ...x, isActive: v } : x))} aria-label={WEEKDAYS[r.weekday]} />
              <span className="font-bold w-20 text-sm">{WEEKDAYS[r.weekday]}</span>
              <div className="flex items-center gap-1.5">
                <Input type="time" value={r.startTime} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, startTime: e.target.value } : x))} className="w-28 rounded-lg" dir="ltr" />
                <span className="text-muted-foreground text-xs">تا</span>
                <Input type="time" value={r.endTime} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, endTime: e.target.value } : x))} className="w-28 rounded-lg" dir="ltr" />
              </div>
              <span className="text-xs text-muted-foreground mr-auto">اسلات {faDigits(r.slotMinutes)} دقیقه‌ای</span>
            </div>
          ))}
        </div>
        <Button onClick={save} disabled={busy} className="mt-5 rounded-xl shadow-lg shadow-primary/25">{busy ? 'در حال ذخیره…' : 'ذخیره برنامه کاری'}</Button>
      </CardContent></Card>

      <Card><CardContent className="p-6">
        <h3 className="font-extrabold mb-5 flex items-center gap-2"><Wallet className="size-4.5 text-primary" /> تعرفه ویزیت</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>تعرفه ویزیت حضوری (تومان)</Label>
            <Input type="number" dir="ltr" value={prices.price} onChange={(e) => setPrices({ ...prices, price: e.target.value })} className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>تعرفه ویزیت آنلاین (تومان)</Label>
            <Input type="number" dir="ltr" value={prices.onlinePrice} onChange={(e) => setPrices({ ...prices, onlinePrice: e.target.value })} className="rounded-lg" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Video className="size-4 text-primary" /> اسلات‌های آزاد به‌صورت لحظه‌ای در تقویم رزرو نمایش داده می‌شوند.
          </div>
        </div>
      </CardContent></Card>
    </div>
  )
}
