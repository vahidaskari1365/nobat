'use client'

import { motion, useInView, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { faDigits, faNumber } from '@/lib/persian'

/** Scroll reveal wrapper — cinematic stagger */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}

/** Animated Persian counter */
export function Counter({ to, suffix = '', duration = 1.8 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to, duration])
  return (
    <span ref={ref}>
      {faNumber(val)}
      {suffix}
    </span>
  )
}

/** 3D tilt card (cinematic hover) */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 260, damping: 22 })
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 260, damping: 22 })
  return (
    <motion.div
      ref={ref}
      className={`gpu ${className ?? ''}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left) / r.width - 0.5)
        y.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/** Floating animated orb for hero backgrounds */
export function Orb({ className, variant = 'a' }: { className?: string; variant?: 'a' | 'b' }) {
  return (
    <div className={`absolute rounded-full blur-3xl pointer-events-none ${variant === 'a' ? 'orb-a' : 'orb-b'} ${className ?? ''}`} />
  )
}

/** Section heading */
export function SectionHead({ kicker, title, sub, center }: { kicker: string; title: string; sub?: string; center?: boolean }) {
  return (
    <Reveal className={`mb-10 md:mb-14 ${center ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'}`}>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
        {kicker}
      </span>
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.25]">{title}</h2>
      {sub && <p className="text-muted-foreground leading-relaxed mt-4 max-w-[65ch]">{sub}</p>}
    </Reveal>
  )
}

/** Animated ECG line (medical cinematic element) */
export function EcgLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 100" fill="none" className={className} aria-hidden>
      <path
        d="M0 50 H120 l14-24 20 48 16-70 22 92 18-46 H340 l12-18 16 36 14-58 18 76 14-36 H600"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ecg-line"
      />
    </svg>
  )
}
