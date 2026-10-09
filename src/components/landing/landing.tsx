'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Stethoscope, CalendarCheck2, Video, CreditCard, ShieldCheck, HeartPulse, Star, Users,
  ArrowLeft, Sparkles, Clock3, MessageCircle, BadgeCheck, Quote, Eye, Newspaper, Apple, Brain, Smile, Baby, Bone,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { Reveal, Counter, TiltCard, Orb, SectionHead, EcgLine } from '@/components/shared/motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatJalali, faPrice } from '@/lib/persian'

const specIcons: Record<string, any> = { HeartPulse, Sparkles, Apple, Brain, Smile, Baby, Bone, Eye }

export function Landing({ onLogout }: { onLogout: () => void }) {
  return (
    <>
      <Hero />
      <SpecialtiesMarquee />
      <HowItWorks />
      <TopDoctors />
      <OnlineVisitFeature />
      <StatsBand />
      <Testimonials />
      <BlogPreview />
      <CtaBand />
    </>
  )
}

/* ================= HERO ================= */
function Hero() {
  const { goBooking, setView, user, openAuth } = useApp()
  const { scrollY } = useScroll()
  const yVisual = useTransform(scrollY, [0, 600], [0, 90])
  const bgY = useTransform(scrollY, [0, 800], [0, 140])
  const opacity = useTransform(scrollY, [0, 450], [1, 0.15])

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-24 pb-16" aria-label="معرفی نوبت‌یار">
      {/* ===== suitable cinematic background image + subtle motion ===== */}
      <motion.div style={{ y: bgY }} className="absolute inset-0" aria-hidden>
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.14 }}
          animate={{ scale: [1.14, 1.03, 1.14] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image src="/images/hero-bg.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-25 dark:opacity-45" />
        </motion.div>
        {/* readability washes */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/92 via-background/72 to-background" />
        <div className="absolute inset-0 bg-gradient-to-l from-background/60 via-transparent to-background/40" />
        <div className="absolute inset-0 bg-grid" />
      </motion.div>

      <Orb variant="a" className="w-[520px] h-[520px] bg-primary/25 -top-32 -left-32" />
      <Orb variant="b" className="w-[460px] h-[460px] bg-accent/15 top-1/3 -right-40" />
      <Orb variant="a" className="w-[300px] h-[300px] bg-chart-4/10 bottom-0 left-1/3" />

      <motion.div style={{ opacity }} className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center w-full">
        {/* copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="inline-flex items-center gap-2 glass border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-6"
          >
            <Sparkles className="size-4" />
            پلتفرم هوشمند سلامت دیجیتال
            <Badge className="bg-accent/15 text-accent hover:bg-accent/15 border-0 text-[10px] px-1.5">جدید</Badge>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.15]">
            {['سلامتی شما،', 'اولویت ماست.'].map((line, i) => (
              <motion.span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.25 + i * 0.15, duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                >
                  {i === 1 ? <span className="bg-gradient-to-l from-primary to-chart-2 bg-clip-text text-transparent">{line}</span> : line}
                </motion.span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-muted-foreground text-lg leading-relaxed mt-6 max-w-[55ch]"
          >
            نوبت پزشک خود را در چند ثانیه رزرو کنید؛ حضوری یا آنلاین با ویدیو. چت مستقیم با پزشک،
            نسخه الکترونیک و پرداخت امن — همه در یک پلتفرم.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
            className="flex flex-wrap items-center gap-3 mt-8"
          >
            <Button size="lg" onClick={() => goBooking()} className="rounded-2xl h-13 px-7 text-base shadow-xl shadow-primary/30 hover:shadow-primary/45 hover:-translate-y-0.5 transition-all gpu">
              <CalendarCheck2 className="size-5 ml-1" strokeWidth={1.8} />
              رزرو نوبت آنی
            </Button>
            <Button size="lg" variant="outline" onClick={() => (user ? setView({ type: 'panel' }) : openAuth('login'))} className="rounded-2xl h-13 px-7 text-base glass">
              <Video className="size-5 ml-1" strokeWidth={1.8} />
              ویزیت آنلاین
            </Button>
          </motion.div>

          {/* trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-10 text-sm text-muted-foreground"
          >
            {[
              { icon: ShieldCheck, label: 'پرداخت امن SSL' },
              { icon: Clock3, label: 'دسترسی ۲۴/۷' },
              { icon: BadgeCheck, label: 'پزشکان تأییدشده' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="size-4 text-accent" strokeWidth={1.8} />
                {label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* cinematic visual — appointment card (previous design) */}
        <motion.div style={{ y: yVisual }} className="relative hidden lg:block gpu">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative"
          >
            <TiltCard>
              <Card className="border-2 shadow-2xl shadow-primary/10 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-l from-primary/10 via-transparent to-accent/10 p-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-14 ring-4 ring-primary/20">
                        <AvatarImage src="/images/doctor-sara.webp" alt="دکتر سارا محمدی" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-black">س</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-extrabold text-lg flex items-center gap-1.5">
                          دکتر سارا محمدی <BadgeCheck className="size-5 text-primary" />
                        </div>
                        <div className="text-sm text-muted-foreground">متخصص قلب و عروق — ۱۵ سال سابقه</div>
                      </div>
                    </div>
                    <EcgLine className="w-full text-primary/70 mt-5 h-14" />
                  </div>
                  <div className="p-6 pt-4 space-y-3">
                    {[
                      { time: '۱۰:۰۰', name: 'امیر تهرانی', type: 'ویزیت حضوری', status: 'تأیید شده' },
                      { time: '۱۱:۳۰', name: 'نگار صادقی', type: 'ویزیت آنلاین', status: 'در انتظار' },
                      { time: '۱۴:۰۰', name: 'رضا کریمی', type: 'ویزیت حضوری', status: 'تأیید شده' },
                    ].map((row, i) => (
                      <motion.div
                        key={row.time}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + i * 0.18, duration: 0.55 }}
                        className="flex items-center justify-between rounded-xl border p-3.5 bg-card hover:border-primary/40 transition-colors"
                      >
                        <span className="font-black text-primary text-lg w-14 text-center">{row.time}</span>
                        <span className="font-semibold text-sm flex-1 mr-3">{row.name}</span>
                        <Badge variant="secondary" className="text-[11px]">{row.type}</Badge>
                        <Badge variant={row.status === 'تأیید شده' ? 'default' : 'secondary'} className={`text-[11px] mr-2 ${row.status === 'تأیید شده' ? 'bg-accent/15 text-accent hover:bg-accent/15' : ''}`}>
                          {row.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TiltCard>

            {/* floating chips */}
            <motion.div
              className="absolute -top-6 -left-8 glass border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, -10, 0] }}
              transition={{ opacity: { delay: 1.2 }, y: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }}
            >
              <span className="grid place-items-center size-9 rounded-xl bg-accent/15 text-accent"><Video className="size-5" strokeWidth={1.8} /></span>
              <div className="text-xs"><div className="font-bold">ویزیت آنلاین</div><div className="text-muted-foreground">تصویری و رمزنگاری‌شده</div></div>
            </motion.div>

            <motion.div
              className="absolute -bottom-7 -right-6 glass border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, 10, 0] }}
              transition={{ opacity: { delay: 1.35 }, y: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' } }}
            >
              <span className="grid place-items-center size-9 rounded-xl bg-primary/15 text-primary"><Star className="size-5 fill-current" /></span>
              <div className="text-xs"><div className="font-bold">۴.۹ از ۵</div><div className="text-muted-foreground">رضایت ۱۲هزار بیمار</div></div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
      >
        <div className="size-9 rounded-full border-2 border-primary/30 grid place-items-center">
          <div className="size-1.5 rounded-full bg-primary" />
        </div>
      </motion.div>
    </section>
  )
}

/* ============ SPECIALTIES MARQUEE ============ */
function SpecialtiesMarquee() {
  const [specs, setSpecs] = useState<any[]>([])
  const { goBooking } = useApp()
  useEffect(() => { api('/api/specialties').then((r) => setSpecs(r.specialties ?? [])).catch(() => {}) }, [])

  return (
    <section className="py-16 md:py-20 overflow-hidden" aria-label="تخصص‌های پزشکی">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHead center kicker="تخصص‌ها" title="دسترسی به همه تخصص‌های پزشکی" sub="از قلب تا پوست و سلامت روان؛ پزشک موردنظرتان را در تخصص دلخواه پیدا کنید." />
      </div>
      <Reveal>
        <div className="relative">
          <div className="flex w-max marquee-track gap-4 px-4">
            {[...specs, ...specs].map((s, i) => {
              const Icon = specIcons[s.icon] ?? Stethoscope
              return (
                <button
                  key={`${s.id}-${i}`}
                  onClick={() => goBooking()}
                  className="group shrink-0 w-56 text-right rounded-2xl border bg-card p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-1 gpu"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="grid place-items-center size-11 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="size-5.5" strokeWidth={1.7} />
                    </span>
                    <Badge variant="secondary">{s.doctorsCount} پزشک</Badge>
                  </div>
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">رزرو نوبت <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-transform" /></div>
                </button>
              )
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-background to-transparent" />
        </div>
      </Reveal>
    </section>
  )
}

/* ============ HOW IT WORKS ============ */
function HowItWorks() {
  const steps = [
    { icon: Stethoscope, title: 'پزشک را انتخاب کنید', desc: 'بر اساس تخصص، سابقه، امتیاز و تعرفه، بهترین پزشک را بیابید.' },
    { icon: CalendarCheck2, title: 'تاریخ و ساعت را مشخص کنید', desc: 'تقویم شمسی و اسلات‌های آزاد لحظه‌ای به‌روز می‌شوند.' },
    { icon: CreditCard, title: 'پرداخت امن انجام دهید', desc: 'با درگاه بانکی امن؛ فاکتور و کد پیگیری فوراً صادر می‌شود.' },
    { icon: Video, title: 'ویزیت حضوری یا آنلاین', desc: 'در مطب حاضر شوید یا از اتاق ویدیویی رمزنگاری‌شده استفاده کنید.' },
  ]
  return (
    <section className="py-16 md:py-24 relative overflow-hidden" aria-label="مراحل رزرو">
      <Orb variant="b" className="w-[420px] h-[420px] bg-primary/10 -top-20 right-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHead kicker="فرآیند ساده" title="در ۴ گام نوبت بگیرید" sub="از انتخاب پزشک تا ویزیت، کل مسیر کمتر از ۳ دقیقه طول می‌کشد." />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.12}>
              <div className="relative group h-full">
                {i < 3 && <div className="hidden lg:block absolute top-10 -left-5 w-10 border-t-2 border-dashed border-primary/30" aria-hidden />}
                <Card className="h-full border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group-hover:-translate-y-1 gpu">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="grid place-items-center size-12 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <s.icon className="size-6" strokeWidth={1.7} />
                      </span>
                      <span className="text-4xl font-black text-primary/10 select-none">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="font-extrabold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ TOP DOCTORS ============ */
function TopDoctors() {
  const [doctors, setDoctors] = useState<any[]>([])
  const { goBooking } = useApp()
  useEffect(() => { api('/api/doctors').then((r) => setDoctors((r.doctors ?? []).slice(0, 4))).catch(() => {}) }, [])

  return (
    <section className="py-16 md:py-24" aria-label="پزشکان برتر">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <SectionHead kicker="پزشکان" title="پزشکان برتر پلتفرم" sub="امتیاز و نظرات واقعی بیماران، ملاک انتخاب شماست." />
          <Reveal className="mb-10 md:mb-14">
            <Button variant="outline" onClick={() => goBooking()} className="rounded-xl">همه پزشکان <ArrowLeft className="size-4" /></Button>
          </Reveal>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(doctors.length ? doctors : Array.from({ length: 4 })).map((d: any, i) => (
            <Reveal key={d?.id ?? i} delay={i * 0.1}>
              {!d ? (
                <Card><CardContent className="p-6 space-y-3"><div className="size-16 rounded-full shimmer" /><div className="h-4 rounded shimmer" /><div className="h-3 w-2/3 rounded shimmer" /></CardContent></Card>
              ) : (
                <TiltCard className="h-full">
                  <Card className="h-full border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all overflow-hidden">
                    <div className="relative h-52 overflow-hidden">
                      {d.avatar ? (
                        <Image src={d.avatar} alt={`عکس ${d.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-primary/15 via-card to-accent/10 grid place-items-center">
                          <span className="text-5xl font-black text-primary/30">{d.name?.[0]}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      <span className="absolute top-3 right-3 glass rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"><Star className="size-3 text-amber-500 fill-current" />{d.rating || '—'}</span>
                      <span className="absolute bottom-3 right-3 grid place-items-center size-7 rounded-full bg-accent text-white shadow-lg"><BadgeCheck className="size-4.5" /></span>
                    </div>
                    <CardContent className="p-5 text-center">
                      <h3 className="font-extrabold">{d.name}</h3>
                      <div className="text-sm text-primary font-semibold mt-0.5">{d.specialty}</div>
                      <div className="flex items-center justify-center gap-3 mt-2.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">({d.reviewsCount} نظر)</span>
                        <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{d.experience} سال سابقه</span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm">
                        <span className="text-muted-foreground">ویزیت از</span>
                        <span className="font-bold text-primary">{faPrice(Math.min(d.price, d.onlinePrice))}</span>
                      </div>
                      <Button className="w-full mt-4 rounded-xl" onClick={() => goBooking(d.id)}>رزرو نوبت</Button>
                    </CardContent>
                  </Card>
                </TiltCard>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ ONLINE VISIT FEATURE ============ */
function OnlineVisitFeature() {
  const { goBooking } = useApp()
  const features = [
    { icon: Video, title: 'ویدیو با کیفیت HD', desc: 'ارتباط تصویری پایدار با پزشک از هر نقطه ایران، بدون نیاز به نصب نرم‌افزار.' },
    { icon: ShieldCheck, title: 'رمزنگاری سرتاسری', desc: 'اطلاعات سلامت شما با استانداردهای امنیتی روز محافظت می‌شود.' },
    { icon: MessageCircle, title: 'پیگیری پس از ویزیت', desc: 'چت متنی با پزشک، دریافت نسخه الکترونیک و پیگیری درمان.' },
  ]
  return (
    <section className="py-16 md:py-24 relative overflow-hidden" aria-label="ویزیت آنلاین">
      <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-accent/5" aria-hidden />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <div className="relative">
            <div className="aspect-video rounded-3xl overflow-hidden border-2 shadow-2xl shadow-primary/15 relative">
              <Image src="/images/online-visit.webp" alt="ویزیت آنلاین تصویری با پزشک از طریق پلتفرم نوبت‌یار" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-background/15" />
              <EcgLine className="absolute inset-x-8 bottom-8 h-16 text-white/85 drop-shadow-lg" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative">
                  <span className="grid place-items-center size-20 rounded-full bg-primary text-white shadow-2xl shadow-primary/40"><Video className="size-9" strokeWidth={1.6} /></span>
                  <span className="absolute inset-0 rounded-full bg-primary/40 ring-pulse" />
                </div>
              </div>
              <div className="absolute top-4 right-4 glass rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-500 animate-pulse" /> اتاق ویزیت آنلاین
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 glass border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="flex -space-x-2 space-x-reverse">
                {['/images/patient-amir.webp', '/images/patient-negar.webp', '/images/patient-reza.webp'].map((src, i) => (
                  <Avatar key={src} className="size-8 ring-2 ring-background">
                    <AvatarImage src={src} alt="بیمار نوبت‌یار" />
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">{['ع', 'ن', 'ر'][i]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-xs"><div className="font-bold">۲,۴۰۰+ ویزیت آنلاین</div><div className="text-muted-foreground">در همین ماه</div></div>
            </div>
          </div>
        </Reveal>
        <div>
          <SectionHead kicker="ویزیت آنلاین" title="پزشک، در خانه‌ی شما" sub="بدون ترافیک، بدون انتظار؛ ویزیت تصویری با پزشک متخصص از طریق مرورگر." />
          <div className="space-y-4 -mt-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.12}>
                <div className="flex gap-4 rounded-2xl border bg-card/60 p-4 hover:border-primary/40 transition-colors">
                  <span className="grid place-items-center size-11 shrink-0 rounded-xl bg-primary/10 text-primary"><f.icon className="size-5.5" strokeWidth={1.7} /></span>
                  <div>
                    <div className="font-bold mb-1">{f.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.4}>
              <Button size="lg" onClick={() => goBooking()} className="rounded-2xl mt-2 shadow-lg shadow-primary/25">
                شروع ویزیت آنلاین <ArrowLeft className="size-4" />
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============ STATS BAND ============ */
function StatsBand() {
  const stats = [
    { value: 12500, suffix: '+', label: 'بیمار فعال' },
    { value: 340, suffix: '+', label: 'پزشک متخصص' },
    { value: 58200, suffix: '+', label: 'نوبت موفق' },
    { value: 98, suffix: '٪', label: 'رضایت کاربران' },
  ]
  return (
    <section className="py-14 bg-primary text-primary-foreground relative overflow-hidden" aria-label="آمار پلتفرم">
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1}>
            <div className="text-3xl md:text-5xl font-black tracking-tight"><Counter to={s.value} suffix={s.suffix} /></div>
            <div className="text-sm md:text-base opacity-80 mt-2">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ============ TESTIMONIALS ============ */
function Testimonials() {
  const quotes = [
    { name: 'نازنین م.', img: '/images/patient-negar.webp', role: 'بیمار پوست و مو', text: 'ساعت ۱۱ شب مشورت لازم داشتم؛ با ویزیت آنلاین دکتر رضایی در چند دقیقه ارتباط برقرار شد و نسخه الکترونیک گرفتم. فوق‌العاده بود.', rating: 5 },
    { name: 'حسین پ.', img: '/images/patient-reza.webp', role: 'بیمار قلب', text: 'قبلا ساعت‌ها در مطب منتظر می‌ماندم. الان دقیقا سر ساعت مقرر ویزیت می‌شوم. سیستم نوبت‌دهی واقعا دقیق است.', rating: 5 },
    { name: 'مریم ص.', img: '/images/patient-negar.webp', role: 'بیمار تغذیه', text: 'رژیم‌درمانی من کاملا آنلاین پیش رفت؛ چت با پزشک، پیگیری هفتگی و پشتیبانی عالی. وزنم ۸ کیلو کم شد!', rating: 4 },
  ]
  return (
    <section className="py-16 md:py-24" aria-label="نظرات بیماران">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHead center kicker="تجربه بیماران" title="چه می‌گویند بیماران ما؟" />
        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map((q, i) => (
            <Reveal key={q.name} delay={i * 0.12}>
              <Card className="h-full border hover:border-primary/40 hover:shadow-lg transition-all hover:-translate-y-1 gpu">
                <CardContent className="p-6">
                  <Quote className="size-8 text-primary/25 mb-3" />
                  <p className="text-sm leading-loose text-foreground/90 min-h-20">{q.text}</p>
                  <div className="flex items-center gap-1 mt-4 mb-5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`size-4 ${j < q.rating ? 'text-amber-500 fill-current' : 'text-muted-foreground/25'}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Avatar className="size-10 ring-2 ring-primary/15">
                      {q.img && <AvatarImage src={q.img} alt={q.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{q.name[0]}</AvatarFallback>
                    </Avatar>
                    <div><div className="font-bold text-sm">{q.name}</div><div className="text-xs text-muted-foreground">{q.role}</div></div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ BLOG PREVIEW ============ */
export function BlogPreview() {
  const [posts, setPosts] = useState<any[]>([])
  const { setView } = useApp()
  useEffect(() => { api('/api/blog').then((r) => setPosts((r.posts ?? []).slice(0, 3))).catch(() => {}) }, [])

  return (
    <section className="py-16 md:py-24" aria-label="بلاگ سلامت">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <SectionHead kicker="بلاگ سلامت" title="مطالب خواندنی پزشکی" sub="مقالات علمی به زبان ساده، توسط تیم پزشکی نوبت‌یار." />
          <Reveal className="mb-10 md:mb-14">
            <Button variant="outline" onClick={() => setView({ type: 'blog' })} className="rounded-xl">
              <Newspaper className="size-4" /> همه مقالات
            </Button>
          </Reveal>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <motion.article whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <button onClick={() => setView({ type: 'blog-post', slug: p.slug })} className="text-right w-full">
                  <Card className="h-full overflow-hidden border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all">
                    <BlogCover cover={p.cover} category={p.category} title={p.title} />
                    <CardContent className="p-5">
                      <h3 className="font-extrabold leading-snug line-clamp-2 min-h-14">{p.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2 line-clamp-2">{p.excerpt}</p>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{p.views} بازدید</span>
                        <span>{p.readTime} دقیقه مطالعه</span>
                        <span className="mr-auto">{formatJalali(p.createdAt, { short: true })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export const coverGradients: Record<string, string> = {
  teal: 'from-teal-500/80 via-cyan-600/70 to-emerald-500/80',
  rose: 'from-rose-500/80 via-red-400/70 to-orange-400/80',
  amber: 'from-amber-500/80 via-orange-400/70 to-yellow-400/80',
  violet: 'from-violet-500/80 via-purple-500/70 to-fuchsia-400/80',
  green: 'from-green-500/80 via-emerald-500/70 to-teal-400/80',
}

export function BlogCover({ cover, category, title }: { cover?: string | null; category?: string; title?: string }) {
  const isImage = !!cover && cover.startsWith('/')
  return (
    <div className="relative h-44 bg-gradient-to-br from-primary/70 via-chart-2/60 to-accent/70 overflow-hidden">
      {isImage ? (
        <Image src={cover!} alt={title ?? 'تصویر مقاله'} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 hover:scale-105" />
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${coverGradients[cover ?? 'teal'] ?? coverGradients.teal}`} />
          <div className="absolute inset-0 bg-grid opacity-40" />
          <Stethoscope className="absolute -bottom-4 left-4 size-24 text-white/15 rotate-12" strokeWidth={1} />
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
      {category && (
        <span className="absolute top-3 right-3 glass text-foreground text-xs font-bold rounded-full px-3 py-1.5">{category}</span>
      )}
    </div>
  )
}

/* ============ CTA ============ */
function CtaBand() {
  const { goBooking, openAuth } = useApp()
  return (
    <section className="pb-20 pt-4" aria-label="فراخوان ثبت‌نام">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-primary via-primary to-chart-1 p-10 md:p-16 text-primary-foreground">
            <div className="absolute inset-0 bg-grid opacity-25" aria-hidden />
            <Orb variant="a" className="w-96 h-96 bg-white/10 -top-24 -left-16" />
            <Orb variant="b" className="w-72 h-72 bg-accent/20 -bottom-16 right-1/4" />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">سلامتی‌تان را به ما بسپارید</h2>
              <p className="opacity-85 text-lg leading-relaxed mt-4">
                همین حالا حساب رایگان بسازید و اولین نوبت خود را در کمتر از ۳ دقیقه رزرو کنید.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Button size="lg" variant="secondary" onClick={() => goBooking()} className="rounded-2xl h-13 px-8 text-base shadow-xl">
                  رزرو نوبت
                </Button>
                <Button size="lg" variant="ghost" onClick={() => openAuth('register')} className="rounded-2xl h-13 px-8 text-base text-primary-foreground hover:bg-white/15 border border-white/25">
                  ساخت حساب رایگان
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ============ FOOTER ============ */
export function Footer() {
  const { setView, goBooking } = useApp()
  return (
    <footer className="mt-auto border-t bg-card/60" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid place-items-center size-10 rounded-xl bg-primary text-primary-foreground"><Stethoscope className="size-5" strokeWidth={1.8} /></span>
            <span className="text-lg font-extrabold">نوبت‌یار</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            پلتفرم جامع نوبت‌دهی و ویزیت آنلاین پزشکی؛ پلی امن بین بیماران و پزشکان متخصص ایران.
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-accent" /> اتصال امن با گواهی SSL/TLS
          </div>
        </div>
        <nav aria-label="دسترسی سریع">
          <h3 className="font-bold mb-4 text-sm">دسترسی سریع</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><button className="hover:text-primary transition-colors" onClick={() => setView({ type: 'landing' })}>صفحه اصلی</button></li>
            <li><button className="hover:text-primary transition-colors" onClick={() => goBooking()}>رزرو نوبت</button></li>
            <li><button className="hover:text-primary transition-colors" onClick={() => setView({ type: 'blog' })}>بلاگ سلامت</button></li>
          </ul>
        </nav>
        <nav aria-label="تخصص‌ها">
          <h3 className="font-bold mb-4 text-sm">تخصص‌های پرطرفدار</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {['قلب و عروق', 'پوست و مو', 'اعصاب و روان', 'تغذیه'].map((s) => (
              <li key={s}><button className="hover:text-primary transition-colors" onClick={() => goBooking()}>{s}</button></li>
            ))}
          </ul>
        </nav>
        <div>
          <h3 className="font-bold mb-4 text-sm">تماس با ما</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>تهران، خیابان ولیعصر، مرکز نوآوری سلامت</li>
            <li className="fa-num">۰۲۱-۹۱۰۰۲۰۰۰</li>
            <li>info@nobatyar.ir</li>
            <li className="flex items-center gap-1.5"><Clock3 className="size-3.5 text-primary" /> پشتیبانی ۲۴ ساعته، ۷ روز هفته</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-center text-xs text-muted-foreground">
          © ۱۴۰۵ نوبت‌یار — تمامی حقوق محفوظ است. ساخته‌شده با استانداردهای روز سلامت دیجیتال.
        </div>
      </div>
    </footer>
  )
}
