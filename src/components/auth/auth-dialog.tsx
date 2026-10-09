'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogIn, UserPlus, ShieldCheck, Stethoscope, User, Loader2, Sparkles } from 'lucide-react'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { toast } from 'sonner'

const demoAccounts = [
  { label: 'بیمار', email: 'patient@demo.ir', icon: User },
  { label: 'پزشک', email: 'doctor@demo.ir', icon: Stethoscope },
  { label: 'منشی', email: 'secretary@demo.ir', icon: ShieldCheck },
  { label: 'ادمین', email: 'admin@demo.ir', icon: ShieldCheck },
]

export function AuthDialog() {
  const { authOpen, authMode, closeAuth, openAuth, setUser, setView } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [specs, setSpecs] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'PATIENT', specialtyId: '', bio: '' })

  useEffect(() => { api('/api/specialties').then((r) => setSpecs(r.specialties ?? [])).catch(() => {}) }, [])
  useEffect(() => { setError('') }, [authOpen, authMode])

  const doLogin = async (email: string, password: string) => {
    setLoading(true); setError('')
    try {
      const r = await api('/api/auth', { method: 'POST', body: { action: 'login', email, password } })
      setUser(r.user)
      closeAuth()
      toast.success(`خوش آمدید ${r.user.name}`)
      setView({ type: 'panel' })
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  const doRegister = async () => {
    setLoading(true); setError('')
    try {
      const r = await api('/api/auth', { method: 'POST', body: { action: 'register', ...form } })
      setUser(r.user)
      closeAuth()
      toast.success(form.role === 'DOCTOR' ? 'ثبت‌نام انجام شد؛ پس از تأیید مدیر، پروفایل شما فعال می‌شود' : 'حساب شما با موفقیت ساخته شد')
      setView({ type: 'panel' })
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={authOpen} onOpenChange={(o) => !o && closeAuth()}>
      <DialogContent className="sm:max-w-md max-h-[92dvh] overflow-y-auto nice-scroll" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <span className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary"><Sparkles className="size-4.5" /></span>
            ورود به نوبت‌یار
          </DialogTitle>
          <DialogDescription>سلامتی شما، اولویت ماست. به حساب خود وارد شوید یا ثبت‌نام کنید.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={authMode} onValueChange={(v) => openAuth(v as 'login' | 'register')} value={authMode}>
          <TabsList className="grid grid-cols-2 w-full mb-2">
            <TabsTrigger value="login" className="gap-1.5"><LogIn className="size-4" /> ورود</TabsTrigger>
            <TabsTrigger value="register" className="gap-1.5"><UserPlus className="size-4" /> ثبت‌نام</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <LoginForm onSubmit={doLogin} loading={loading} />
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="text-xs font-bold mb-2.5 flex items-center gap-1.5"><Sparkles className="size-3.5 text-amber-500" /> حساب‌های نمونه (رمز همه: ۱۲۳۴۵۶)</div>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((d) => (
                  <Button key={d.email} type="button" variant="outline" size="sm" className="justify-start rounded-lg"
                    disabled={loading}
                    onClick={() => doLogin(d.email, '123456')}>
                    <d.icon className="size-3.5 ml-1.5 text-primary" /> {d.label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="r-name">نام و نام خانوادگی</Label>
                <Input id="r-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلا امیر تهرانی" /></div>
              <div className="space-y-1.5"><Label htmlFor="r-email">ایمیل</Label>
                <Input id="r-email" type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@mail.ir" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="r-pass">رمز عبور</Label>
              <Input id="r-pass" type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="حداقل ۶ کاراکتر" /></div>
            <div className="space-y-1.5">
              <Label>نوع حساب</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm({ ...form, role: 'PATIENT' })}
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition-all ${form.role === 'PATIENT' ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/40'}`}>
                  <User className="size-4.5" /> بیمار هستم
                </button>
                <button type="button" onClick={() => setForm({ ...form, role: 'DOCTOR' })}
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition-all ${form.role === 'DOCTOR' ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/40'}`}>
                  <Stethoscope className="size-4.5" /> پزشک هستم
                </button>
              </div>
            </div>
            {form.role === 'DOCTOR' && (
              <>
                <div className="space-y-1.5">
                  <Label>تخصص</Label>
                  <Select value={form.specialtyId} onValueChange={(v) => setForm({ ...form, specialtyId: v })}>
                    <SelectTrigger><SelectValue placeholder="انتخاب تخصص" /></SelectTrigger>
                    <SelectContent>{specs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>درباره خود</Label>
                  <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="سابقه و تخصص خود را معرفی کنید..." rows={3} /></div>
                <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                  پس از ثبت‌نام، حساب شما توسط ادمین بررسی و تأیید می‌شود.
                </p>
              </>
            )}
            <Button onClick={doRegister} disabled={loading || !form.name || !form.email || !form.password} className="w-full rounded-xl h-11">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4 ml-1" />} ساخت حساب
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function LoginForm({ onSubmit, loading }: { onSubmit: (email: string, password: string) => void; loading: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password) }} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="l-email">ایمیل</Label>
        <Input id="l-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.ir" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="l-pass">رمز عبور</Label>
        <Input id="l-pass" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required />
      </div>
      <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4 ml-1" />} ورود به حساب
      </Button>
    </form>
  )
}
