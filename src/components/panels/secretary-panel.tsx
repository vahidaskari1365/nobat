'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays, Users, Wallet, ClipboardList, LayoutDashboard, UserPlus, Phone, Stethoscope,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { PanelHeader, StatCard, StatusBadge, Spinner, EmptyBox } from '@/components/panels/panel-helpers'
import { AppointmentRow } from '@/components/panels/patient-panel'
import { JalaliCalendar, jalaliMonthName } from '@/components/booking/booking-wizard'
import { faDigits, faPrice, formatJalali, isoDate } from '@/lib/persian'
import { toast } from 'sonner'

export function SecretaryPanel({ user }: { user: any }) {
  const { goBooking } = useApp()
  const [overview, setOverview] = useState<any>(null)
  const [appts, setAppts] = useState<any[] | null>(null)
  const [manualOpen, setManualOpen] = useState(false)

  const load = useCallback(() => {
    api('/api/secretary').then((r) => setOverview(r.overview)).catch(() => {})
    api('/api/appointments').then((r) => setAppts(r.appointments ?? [])).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const changeStatus = async (id: string, status: string) => {
    try { await api('/api/appointments', { method: 'PATCH', body: { id, status } }); toast.success('انجام شد'); load() }
    catch (e: any) { toast.error(e.message) }
  }

  const today = isoDate(new Date())
  const todayAppts = (appts ?? []).filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="pt-24 pb-16 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <PanelHeader title="پنل منشی" sub={user.secretaryProfile?.clinicName ?? 'مدیریت نوبت‌های کلینیک'}>
          <Button onClick={() => setManualOpen(true)} className="rounded-xl shadow-lg shadow-primary/25">
            <UserPlus className="size-4 ml-1" /> ثبت نوبت تلفنی
          </Button>
        </PanelHeader>

        <Tabs defaultValue="dashboard" dir="rtl">
          <TabsList className="mb-6 h-auto flex-wrap justify-start gap-1 rounded-2xl bg-muted p-1.5">
            {[
              ['dashboard', 'داشبورد', LayoutDashboard],
              ['today', 'نوبت‌های امروز', CalendarDays],
              ['appointments', 'همه نوبت‌ها', ClipboardList],
              ['patients', 'بیماران', Users],
            ].map(([v, label, Icon]: any) => (
              <TabsTrigger key={v} value={v} className="gap-1.5 rounded-xl data-[state=active]:shadow"><Icon className="size-4" />{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CalendarDays} label="نوبت‌های امروز" value={overview?.stats?.todayCount ?? '—'} delay={0} />
              <StatCard icon={Users} label="بیماران ثبت‌شده" value={overview?.stats?.patientsCount ?? '—'} tone="accent" delay={0.07} />
              <StatCard icon={ClipboardList} label="در انتظار پرداخت" value={overview?.stats?.pendingCount ?? '—'} tone="amber" delay={0.14} />
              <StatCard icon={Wallet} label="درآمد کلینیک" value={overview ? faPrice(overview.stats.revenue) : '—'} tone="rose" delay={0.21} />
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-extrabold mb-4">صف امروز</h3>
                {!todayAppts.length ? <EmptyBox icon={CalendarDays} title="امروز نوبتی ثبت نشده" sub="با دکمه «ثبت نوبت تلفنی» می‌توانید برای بیماران نوبت ثبت کنید." /> : (
                  <div className="space-y-3">
                    {todayAppts.map((a) => (
                      <AppointmentRow key={a.id} a={a} role="SECRETARY"
                        onCancel={(id: string) => changeStatus(id, 'CANCELLED')}
                        onComplete={(id: string) => changeStatus(id, 'COMPLETED')} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today">
            <div className="space-y-3">
              {todayAppts.map((a) => (
                <AppointmentRow key={a.id} a={a} role="SECRETARY"
                  onCancel={(id: string) => changeStatus(id, 'CANCELLED')}
                  onComplete={(id: string) => changeStatus(id, 'COMPLETED')} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="space-y-3">
              {appts === null && <Spinner />}
              {appts?.map((a) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <AppointmentRow key={a.id} a={a} role="SECRETARY"
                    onCancel={(id: string) => changeStatus(id, 'CANCELLED')}
                    onComplete={(id: string) => changeStatus(id, 'COMPLETED')} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview?.patients?.map((p: any) => (
                <Card key={p.id}><CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar><AvatarFallback className="bg-primary/10 text-primary font-bold">{p.name[0]}</AvatarFallback></Avatar>
                    <div><div className="font-bold text-sm">{p.name}</div><div className="text-xs text-muted-foreground">{p.email}</div></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3.5" /> {p.patientProfile?.phone || p.phone || '—'}
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ManualBooking open={manualOpen} onClose={() => setManualOpen(false)} onDone={load} doctors={overview?.doctors ?? []} />
    </div>
  )
}

/* ---------- manual (walk-in) booking ---------- */
function ManualBooking({ open, onClose, onDone, doctors }: { open: boolean; onClose: () => void; onDone: () => void; doctors: any[] }) {
  const [form, setForm] = useState({ patientName: '', patientPhone: '', patientId: '', doctorId: '', date: '', time: '', type: 'IN_PERSON' })
  const [slots, setSlots] = useState<any[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (form.doctorId && form.date) {
      api(`/api/availability?doctorId=${form.doctorId}&date=${form.date}`).then((r) => setSlots(r.slots ?? [])).catch(() => setSlots([]))
    } else setSlots([])
  }, [form.doctorId, form.date])

  const submit = async () => {
    setBusy(true)
    try {
      await api('/api/appointments', { method: 'POST', body: { ...form, walkInName: form.patientName } })
      toast.success('نوبت تلفنی با موفقیت ثبت شد')
      onDone(); onClose()
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-lg max-h-[90dvh] overflow-y-auto nice-scroll">
        <DialogHeader><DialogTitle>ثبت نوبت تلفنی / حضوری</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>نام بیمار</Label>
              <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="نام و نام خانوادگی" className="rounded-lg" /></div>
            <div className="space-y-1.5"><Label>تلفن</Label>
              <Input value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} placeholder="۰۹۱۲…" className="rounded-lg" dir="ltr" /></div>
          </div>
          <div className="space-y-1.5"><Label>پزشک</Label>
            <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
              <SelectTrigger className="rounded-lg"><SelectValue placeholder="انتخاب پزشک" /></SelectTrigger>
              <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.doctorProfile?.specialty?.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>نوع ویزیت</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PERSON">حضوری</SelectItem>
                <SelectItem value="ONLINE">آنلاین</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <JalaliCalendar selected={form.date} onSelect={(d) => setForm({ ...form, date: d })} />
          {form.date && (
            <div className="space-y-2">
              <Label>ساعت</Label>
              <div className="grid grid-cols-5 gap-2">
                {slots.map((s) => (
                  <button key={s.time} disabled={!s.available} onClick={() => setForm({ ...form, time: s.time })}
                    className={`rounded-lg border py-2 text-xs font-bold transition-all ${!s.available ? 'opacity-30 line-through' : form.time === s.time ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}>
                    {faDigits(s.time)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button onClick={submit} disabled={busy || !form.patientName || !form.doctorId || !form.date || !form.time} className="w-full rounded-xl h-11">
            {busy ? 'در حال ثبت…' : 'ثبت نوبت'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
