'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, CalendarDays, Wallet, Star, LayoutDashboard, Newspaper, ShieldCheck, Ban,
  CheckCircle2, Plus, Trash2, Stethoscope, MessageSquareQuote, BarChart3, Activity,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { PanelHeader, StatCard, StatusBadge, Spinner, EmptyBox } from '@/components/panels/panel-helpers'
import { faDigits, faPrice, formatJalali, timeAgo } from '@/lib/persian'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const chartColors = ['#0891b2', '#16a34a', '#f59e0b', '#8b5cf6']

export function AdminPanel({ user }: { user: any }) {
  const [data, setData] = useState<any>(null)
  const [reviewFilter, setReviewFilter] = useState('APPROVED')

  const load = useCallback(() => {
    api('/api/admin').then((r) => setData(r.stats)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const toggleUser = async (userId: string, status: string) => {
    try {
      await api('/api/admin', { method: 'PATCH', body: { userId, status: status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } })
      toast.success(status === 'ACTIVE' ? 'حساب غیرفعال شد' : 'حساب فعال شد')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const verifyDoctor = async (userId: string, verified: boolean) => {
    try {
      await api('/api/admin', { method: 'PATCH', body: { userId, verified } })
      toast.success(verified ? 'پزشک تأیید شد' : 'تأیید پزشک لغو شد')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const moderateReview = async (id: string, status: string) => {
    try {
      await api('/api/reviews', { method: 'PATCH', body: { id, status } })
      toast.success('بررسی شد'); load()
    } catch (e: any) { toast.error(e.message) }
  }

  const users = data?.users ?? []
  const reviews = (data?.reviews ?? []).filter((r: any) => reviewFilter === 'ALL' || r.status === reviewFilter)

  return (
    <div className="pt-24 pb-16 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <PanelHeader title="پنل مدیریت" sub="آمار، کاربران، پزشکان و محتوای پلتفرم">
          <Badge className="bg-primary/12 text-primary border-0 hover:bg-primary/12 gap-1"><ShieldCheck className="size-3.5" /> دسترسی کامل ادمین</Badge>
        </PanelHeader>

        <Tabs defaultValue="dashboard" dir="rtl">
          <TabsList className="mb-6 h-auto flex-wrap justify-start gap-1 rounded-2xl bg-muted p-1.5">
            {[
              ['dashboard', 'داشبورد', BarChart3],
              ['users', 'کاربران', Users],
              ['doctors', 'پزشکان', Stethoscope],
              ['blog', 'بلاگ', Newspaper],
              ['reviews', 'نظرات', MessageSquareQuote],
            ].map(([v, label, Icon]: any) => (
              <TabsTrigger key={v} value={v} className="gap-1.5 rounded-xl data-[state=active]:shadow"><Icon className="size-4" />{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="کل کاربران" value={users.length} delay={0} />
              <StatCard icon={CalendarDays} label="کل نوبت‌ها" value={data?.appointments?.length ?? '—'} tone="accent" delay={0.07} />
              <StatCard icon={Wallet} label="درآمد پرداخت‌شده" value={data ? faPrice(data.revenue) : '—'} tone="amber" delay={0.14} />
              <StatCard icon={Newspaper} label="مقالات بلاگ" value={data?.posts?.length ?? '—'} tone="rose" delay={0.21} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <Card><CardContent className="p-6">
                  <h3 className="font-extrabold mb-5 flex items-center gap-2"><Activity className="size-4.5 text-primary" /> نوبت‌های ۷ روز اخیر</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data?.days ?? []}>
                      <defs>
                        <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0891b2" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d8e8ea" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(v) => formatJalali(v, { short: true })} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} width={30} />
                      <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #d8e8ea', fontFamily: 'Vazirmatn' }} labelFormatter={(v) => formatJalali(v, { withWeekday: true })} />
                      <Area type="monotone" dataKey="count" stroke="#0891b2" strokeWidth={2.5} fill="url(#apptGrad)" name="نوبت" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card><CardContent className="p-6">
                  <h3 className="font-extrabold mb-5 flex items-center gap-2"><Wallet className="size-4.5 text-accent" /> درآمد ۶ ماه اخیر</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data?.months ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d8e8ea" vertical={false} />
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}م`} fontSize={11} tickLine={false} axisLine={false} width={36} />
                      <Tooltip formatter={(v: any) => faPrice(Number(v))} contentStyle={{ borderRadius: 14, border: '1px solid #d8e8ea', fontFamily: 'Vazirmatn' }} />
                      <Bar dataKey="total" fill="#16a34a" radius={[8, 8, 0, 0]} name="درآمد" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card><CardContent className="p-6">
                <h3 className="font-extrabold mb-5">ترکیب نقش‌ها و وضعیت نوبت‌ها</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={[
                        { name: 'بیمار', value: data?.roleCounts?.PATIENT ?? 0 },
                        { name: 'پزشک', value: data?.roleCounts?.DOCTOR ?? 0 },
                        { name: 'منشی', value: data?.roleCounts?.SECRETARY ?? 0 },
                        { name: 'ادمین', value: data?.roleCounts?.ADMIN ?? 0 },
                      ]} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {(data ? [0, 1, 2, 3] : []).map((_, i) => <Cell key={i} fill={chartColors[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #d8e8ea', fontFamily: 'Vazirmatn' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 content-center">
                    {Object.entries(data?.statusCounts ?? {}).map(([k, v]: any, i) => (
                      <div key={k} className="rounded-xl border p-4 text-center">
                        <div className="text-2xl font-black">{faDigits(v as number)}</div>
                        <div className="text-xs text-muted-foreground mt-1"><StatusBadge status={k} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent></Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="users">
            <Card><CardContent className="p-0">
              <div className="overflow-x-auto nice-scroll">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="border-b text-muted-foreground text-xs">
                    <th className="p-4 text-right font-bold">کاربر</th>
                    <th className="p-4 text-right font-bold">نقش</th>
                    <th className="p-4 text-right font-bold">تاریخ عضویت</th>
                    <th className="p-4 text-right font-bold">وضعیت</th>
                    <th className="p-4 text-right font-bold">عملیات</th>
                  </tr></thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9"><AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{u.name?.[0]}</AvatarFallback></Avatar>
                            <div><div className="font-bold">{u.name}</div><div className="text-xs text-muted-foreground" dir="ltr">{u.email}</div></div>
                          </div>
                        </td>
                        <td className="p-4"><Badge variant="secondary">{{ PATIENT: 'بیمار', DOCTOR: 'پزشک', SECRETARY: 'منشی', ADMIN: 'ادمین' }[u.role]}</Badge></td>
                        <td className="p-4 text-xs text-muted-foreground">{formatJalali(u.createdAt, { short: true })}</td>
                        <td className="p-4"><Badge className={cn('border-0', u.status === 'ACTIVE' ? 'bg-accent/12 text-accent hover:bg-accent/12' : 'bg-destructive/10 text-destructive hover:bg-destructive/10')}>{u.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}</Badge></td>
                        <td className="p-4">
                          {u.id !== user.id && (
                            <Button size="sm" variant="outline" onClick={() => toggleUser(u.id, u.status)} className={cn('rounded-lg', u.status === 'ACTIVE' && 'text-destructive')}>
                              {u.status === 'ACTIVE' ? <><Ban className="size-3.5 ml-1" /> غیرفعال</> : <><CheckCircle2 className="size-3.5 ml-1" /> فعال</>}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="doctors">
            <div className="grid md:grid-cols-2 gap-4">
              {(data?.doctors ?? []).map((d: any) => (
                <Card key={d.id}><CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="size-12"><AvatarFallback className="bg-primary/10 text-primary font-black">{d.user?.name?.[0]}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="font-bold">{d.user?.name}</div>
                      <div className="text-xs text-muted-foreground">{d.specialty?.name} • {d.experience} سال سابقه</div>
                    </div>
                    <Badge className={cn('border-0', d.verified ? 'bg-accent/12 text-accent hover:bg-accent/12' : 'bg-amber-500/12 text-amber-600 hover:bg-amber-500/12')}>
                      {d.verified ? 'تأییدشده' : 'در انتظار تأیید'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={d.verified ? 'outline' : 'default'} onClick={() => verifyDoctor(d.userId, !d.verified)} className="rounded-lg">
                      {d.verified ? 'لغو تأیید' : <><CheckCircle2 className="size-3.5 ml-1" /> تأیید پزشک</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleUser(d.userId, d.user.status)} className={cn('rounded-lg', d.user.status === 'ACTIVE' && 'text-destructive')}>
                      {d.user.status === 'ACTIVE' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                    </Button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="blog"><BlogAdmin posts={data?.posts ?? []} reload={load} /></TabsContent>

          <TabsContent value="reviews">
            <div className="flex gap-2 mb-4">
              {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((f) => (
                <Button key={f} size="sm" variant={reviewFilter === f ? 'default' : 'outline'} onClick={() => setReviewFilter(f)} className="rounded-lg">
                  {{ ALL: 'همه', APPROVED: 'تأییدشده', PENDING: 'در انتظار', REJECTED: 'ردشده' }[f]}
                </Button>
              ))}
            </div>
            <div className="space-y-3">
              {reviews.length === 0 && <EmptyBox icon={Star} title="نظری در این دسته وجود ندارد" />}
              {reviews.map((r: any) => (
                <Card key={r.id}><CardContent className="p-5 flex flex-wrap items-center gap-4">
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={cn('size-4', j < r.rating ? 'text-amber-500 fill-current' : 'text-muted-foreground/25')} />)}</div>
                  <div className="flex-1 min-w-52">
                    <div className="text-sm font-bold">{r.patient?.name} <span className="text-muted-foreground font-normal text-xs"> درباره {r.doctor?.name}</span></div>
                    {r.comment && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.comment}</p>}
                    <div className="text-[11px] text-muted-foreground mt-1">{timeAgo(r.createdAt)}</div>
                  </div>
                  <StatusBadge status={r.status} />
                  {r.status !== 'APPROVED' && <Button size="sm" onClick={() => moderateReview(r.id, 'APPROVED')} className="rounded-lg">تأیید</Button>}
                  {r.status !== 'REJECTED' && <Button size="sm" variant="outline" onClick={() => moderateReview(r.id, 'REJECTED')} className="rounded-lg text-destructive">رد</Button>}
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/* ---------- blog management ---------- */
function BlogAdmin({ posts, reload }: { posts: any[]; reload: () => void }) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', category: 'سلامت عمومی', cover: 'teal', readTime: 5 })

  const openEditor = (post?: any) => {
    setEditing(post ?? null)
    setForm(post ? { title: post.title, excerpt: post.excerpt, content: post.content, category: post.category, cover: post.cover ?? 'teal', readTime: post.readTime } : { title: '', excerpt: '', content: '', category: 'سلامت عمومی', cover: 'teal', readTime: 5 })
    setEditorOpen(true)
  }

  const save = async (published: boolean) => {
    try {
      if (editing) {
        await api('/api/blog', { method: 'PATCH', body: { id: editing.id, ...form, published } })
      } else {
        await api('/api/blog', { method: 'POST', body: { ...form, published, tags: JSON.stringify([form.category]) } })
      }
      toast.success(published ? 'مقاله منتشر شد' : 'پیش‌نویس ذخیره شد')
      setEditorOpen(false); reload()
    } catch (e: any) { toast.error(e.message) }
  }

  const remove = async (id: string) => {
    try { await api(`/api/blog?id=${id}`, { method: 'DELETE' }); toast.success('حذف شد'); reload() } catch (e: any) { toast.error(e.message) }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => openEditor()} className="rounded-xl"><Plus className="size-4 ml-1" /> مقاله جدید</Button>
      </div>
      <div className="space-y-3">
        {posts.length === 0 && <EmptyBox icon={Newspaper} title="مقاله‌ای وجود ندارد" />}
        {posts.map((p) => (
          <Card key={p.id}><CardContent className="p-5 flex flex-wrap items-center gap-4">
            <div className={cn('size-14 rounded-xl bg-gradient-to-br shrink-0', { teal: 'from-teal-500 to-cyan-600', rose: 'from-rose-500 to-orange-400', amber: 'from-amber-500 to-yellow-400', violet: 'from-violet-500 to-fuchsia-400', green: 'from-green-500 to-teal-400' }[p.cover ?? 'teal'])} />
            <div className="flex-1 min-w-52">
              <div className="font-bold">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.category} • {p.views} بازدید • {formatJalali(p.createdAt, { short: true })}</div>
            </div>
            <Badge className={cn('border-0', p.published ? 'bg-accent/12 text-accent hover:bg-accent/12' : 'bg-muted text-muted-foreground')}>{p.published ? 'منتشرشده' : 'پیش‌نویس'}</Badge>
            <Button size="sm" variant="outline" onClick={() => openEditor(p)} className="rounded-lg">ویرایش</Button>
            <Button size="sm" variant="ghost" onClick={() => remove(p.id)} className="rounded-lg text-destructive"><Trash2 className="size-3.5" /></Button>
          </CardContent></Card>
        ))}
      </div>

      <Dialog open={editorOpen} onOpenChange={(o) => !o && setEditorOpen(false)}>
        <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[92dvh] overflow-y-auto nice-scroll">
          <DialogHeader><DialogTitle>{editing ? 'ویرایش مقاله' : 'مقاله جدید'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>عنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>دسته‌بندی</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg" /></div>
              <div className="space-y-1.5"><Label>زمان مطالعه (دقیقه)</Label><Input type="number" value={form.readTime} onChange={(e) => setForm({ ...form, readTime: Number(e.target.value) })} className="rounded-lg" dir="ltr" /></div>
            </div>
            <div className="space-y-1.5"><Label>چکیده</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5">
              <Label>متن مقاله (## برای تیتر)</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} className="min-h-56" />
            </div>
            <div className="space-y-1.5">
              <Label>رنگ کاور</Label>
              <div className="flex gap-2">
                {['teal', 'rose', 'amber', 'violet', 'green'].map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, cover: c })} className={cn('size-9 rounded-lg bg-gradient-to-br transition-transform hover:scale-110', { teal: 'from-teal-500 to-cyan-600', rose: 'from-rose-500 to-orange-400', amber: 'from-amber-500 to-yellow-400', violet: 'from-violet-500 to-fuchsia-400', green: 'from-green-500 to-teal-400' }[c], form.cover === c && 'ring-2 ring-offset-2 ring-primary')} aria-label={c} />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => save(true)} disabled={!form.title || !form.content} className="flex-1 rounded-xl">انتشار</Button>
              <Button onClick={() => save(false)} variant="outline" disabled={!form.title || !form.content} className="rounded-xl">ذخیره پیش‌نویس</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
