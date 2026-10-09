'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { faNumber } from '@/lib/persian'
import { CheckCircle2, XCircle, Clock3, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const statusFa: Record<string, string> = {
  PENDING: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  COMPLETED: 'انجام شده',
  CANCELLED: 'لغو شده',
  PAID: 'پرداخت شده',
  FAILED: 'ناموفق',
  REFUNDED: 'بازگشت داده شده',
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFIRMED: 'bg-primary/12 text-primary hover:bg-primary/12',
    COMPLETED: 'bg-accent/12 text-accent hover:bg-accent/12',
    PAID: 'bg-accent/12 text-accent hover:bg-accent/12',
    PENDING: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 hover:bg-amber-500/12',
    CANCELLED: 'bg-destructive/10 text-destructive hover:bg-destructive/10',
    FAILED: 'bg-destructive/10 text-destructive hover:bg-destructive/10',
    REFUNDED: 'bg-muted text-muted-foreground hover:bg-muted',
  }
  return <Badge className={cn('border-0', map[status] ?? '')}>{statusFa[status] ?? status}</Badge>
}

export function PanelHeader({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{sub}</p>
      </div>
      {children}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, tone = 'primary', delay = 0, suffix }: {
  icon: LucideIcon; label: string; value: number | string; tone?: 'primary' | 'accent' | 'amber' | 'rose'; delay?: number; suffix?: string
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    amber: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/12 text-rose-500',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}>
      <Card className="border hover:border-primary/30 hover:shadow-md transition-all">
        <CardContent className="p-5 flex items-center gap-4">
          <span className={cn('grid place-items-center size-12 rounded-2xl shrink-0', tones[tone])}>
            <Icon className="size-5.5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <div className="text-2xl font-black tracking-tight">{typeof value === 'number' ? faNumber(value) : value}{suffix}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <Loader2 className="size-8 animate-spin mx-auto mb-3 text-primary" />
      <p className="text-sm font-semibold">{label ?? 'در حال بارگذاری…'}</p>
    </div>
  )
}

export function EmptyBox({ icon: Icon = CheckCircle2, title, sub }: { icon?: LucideIcon; title: string; sub?: string }) {
  return (
    <div className="py-14 text-center">
      <div className="inline-grid place-items-center size-16 rounded-2xl bg-muted mb-4"><Icon className="size-7 text-muted-foreground/50" strokeWidth={1.5} /></div>
      <p className="font-bold">{title}</p>
      {sub && <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">{sub}</p>}
    </div>
  )
}

export { Clock3 as ClockIcon, XCircle }
