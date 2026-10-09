'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarCheck2, Stethoscope, Menu, X, LogOut, Bell, LayoutDashboard } from 'lucide-react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/components/shared/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const roleFa: Record<string, string> = { PATIENT: 'بیمار', DOCTOR: 'پزشک', SECRETARY: 'منشی', ADMIN: 'ادمین' }

export function Navbar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const { setView, view, openAuth, goBooking } = useApp()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!user) return
    api('/api/notifications').then((r) => setNotifCount(r?.unread ?? 0)).catch(() => {})
  }, [user])

  const isLanding = view.type === 'landing'

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled || !isLanding ? 'glass border-b shadow-sm' : 'bg-transparent'}`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4" aria-label="ناوبری اصلی">
        <button onClick={() => setView({ type: 'landing' })} className="flex items-center gap-2.5 group shrink-0" aria-label="نوبت‌یار">
          <span className="relative grid place-items-center size-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
            <Stethoscope className="size-5" strokeWidth={1.8} />
            <span className="absolute inset-0 rounded-xl ring-2 ring-primary/40 ring-pulse" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">نوبت‌یار</span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          <NavLink active={isLanding} onClick={() => setView({ type: 'landing' })}>خانه</NavLink>
          <NavLink onClick={() => goBooking()}>رزرو نوبت</NavLink>
          <NavLink onClick={() => setView({ type: 'blog' })}>بلاگ سلامت</NavLink>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="اعلان‌ها">
                    <Bell className="size-5" strokeWidth={1.7} />
                    {notifCount > 0 && (
                      <span className="absolute -top-0.5 -left-0.5 size-4 rounded-full bg-destructive text-[10px] text-white grid place-items-center">
                        {notifCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <NotifMenu />
              </DropdownMenu>

              <Button onClick={() => setView({ type: 'panel' })} className="hidden sm:inline-flex gap-2 rounded-xl">
                <LayoutDashboard className="size-4" strokeWidth={1.8} />
                پنل کاربری
              </Button>

              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-primary/30 hover:ring-primary/60 transition-all" aria-label="حساب کاربری">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {user.name?.[0] ?? '؟'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <div className="font-bold">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5 flex items-center gap-2">
                      {user.email}
                      <Badge variant="secondary" className="text-[10px] px-1.5">{roleFa[user.role]}</Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setView({ type: 'panel' })}>
                    <LayoutDashboard className="size-4 ml-2" /> پنل کاربری
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="size-4 ml-2" /> خروج از حساب
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => openAuth('login')} className="rounded-xl">ورود</Button>
              <Button onClick={() => openAuth('register')} className="rounded-xl shadow-lg shadow-primary/25 hidden sm:inline-flex">
                ثبت‌نام رایگان
              </Button>
            </>
          )}
          <button className="md:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)} aria-label="منوی موبایل">
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t bg-card/95 backdrop-blur-xl"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              <NavLink active={isLanding} onClick={() => { setView({ type: 'landing' }); setMobileOpen(false) }}>خانه</NavLink>
              <NavLink onClick={() => { goBooking(); setMobileOpen(false) }}>رزرو نوبت</NavLink>
              <NavLink onClick={() => { setView({ type: 'blog' }); setMobileOpen(false) }}>بلاگ سلامت</NavLink>
              {user && <NavLink onClick={() => { setView({ type: 'panel' }); setMobileOpen(false) }}>پنل کاربری</NavLink>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function NavLink({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary ${active ? 'text-primary bg-primary/10' : 'text-foreground/80'}`}
    >
      {children}
    </button>
  )
}

function NotifMenu() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    api('/api/notifications').then((r) => setItems(r.notifications ?? [])).catch(() => {})
  }, [])
  return (
    <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto nice-scroll">
      <DropdownMenuLabel className="flex items-center justify-between">
        اعلان‌ها
        <button
          className="text-xs text-primary hover:underline"
          onClick={(e) => { e.stopPropagation(); api('/api/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }) }).then(() => setItems(items.map((i) => ({ ...i, read: true })))) }}
        >
          علامت‌گذاری همه
        </button>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {items.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">اعلانی وجود ندارد</div>}
      {items.map((n) => (
        <div key={n.id} className={`px-3 py-2.5 mx-1 rounded-lg mb-1 text-sm ${n.read ? 'opacity-60' : 'bg-primary/5 border border-primary/10'}`}>
          <div className="font-semibold">{n.title}</div>
          {n.body && <div className="text-muted-foreground text-xs mt-1 leading-relaxed">{n.body}</div>}
        </div>
      ))}
    </DropdownMenuContent>
  )
}
