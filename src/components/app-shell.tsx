'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { Navbar } from '@/components/shared/navbar'
import { Footer, Landing } from '@/components/landing/landing'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { BookingWizard } from '@/components/booking/booking-wizard'
import { BlogView, BlogPostView } from '@/components/blog/blog-view'
import { VisitRoom } from '@/components/visit/visit-room'
import { PatientPanel } from '@/components/panels/patient-panel'
import { DoctorPanel } from '@/components/panels/doctor-panel'
import { SecretaryPanel } from '@/components/panels/secretary-panel'
import { AdminPanel } from '@/components/panels/admin-panel'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AppShell() {
  const { view, user, setUser, setView } = useApp()
  const [booting, setBooting] = useState(true)

  // restore session on load
  useEffect(() => {
    api('/api/auth')
      .then((r) => { if (r.user) setUser(r.user) })
      .catch(() => {})
      .finally(() => setBooting(false))
  }, [setUser])

  const onLogout = useCallback(async () => {
    await api('/api/auth', { method: 'POST', body: { action: 'logout' } }).catch(() => {})
    setUser(null)
    setView({ type: 'landing' })
    toast.success('از حساب خود خارج شدید')
  }, [setUser, setView])

  if (booting) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="size-10 text-primary animate-spin" />
            <span className="absolute inset-0 rounded-full bg-primary/25 ring-pulse" />
          </div>
          <span className="text-sm text-muted-foreground font-semibold">در حال بارگذاری نوبت‌یار…</span>
        </div>
      </div>
    )
  }

  const viewKey = view.type + ('slug' in view ? view.slug : '') + ('code' in view ? view.code : '')
  const showFooter = view.type === 'landing' || view.type === 'blog' || view.type === 'blog-post'

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar user={user} onLogout={onLogout} />
      <main className="flex-1" id="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {view.type === 'landing' && <Landing onLogout={onLogout} />}
            {view.type === 'blog' && <BlogView />}
            {view.type === 'blog-post' && <BlogPostView slug={view.slug} />}
            {view.type === 'booking' && <BookingWizard prefDoctorId={view.doctorId} />}
            {view.type === 'visit' && <VisitRoom code={view.code} />}
            {view.type === 'panel' && (
              user ? (
                user.role === 'PATIENT' ? <PatientPanel user={user} />
                : user.role === 'DOCTOR' ? <DoctorPanel user={user} />
                : user.role === 'SECRETARY' ? <SecretaryPanel user={user} />
                : <AdminPanel user={user} />
              ) : (
                <NeedLogin />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      {showFooter && <Footer />}
      <AuthDialog />
    </div>
  )
}

function NeedLogin() {
  const { openAuth } = useApp()
  return (
    <div className="pt-32 pb-40 text-center">
      <h1 className="text-2xl font-extrabold mb-3">برای دسترسی به پنل، ابتدا وارد شوید</h1>
      <p className="text-muted-foreground mb-6">به پنل کاربری خود دسترسی دارید تا نوبت‌ها، چت و پروفایلتان را مدیریت کنید.</p>
      <button onClick={() => openAuth('login')} className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all">
        ورود / ثبت‌نام
      </button>
    </div>
  )
}
