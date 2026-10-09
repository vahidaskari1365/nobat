import { toJalaali as jToJalaali, toGregorian, jalaaliMonthLength as jml } from 'jalaali-js'

/** Persian digits */
export const faDigits = (s: string | number) =>
  String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

export const faNumber = (n: number) => faDigits(n.toLocaleString('en-US'))

export const faPrice = (n: number) => `${faNumber(n)} تومان`

const FA_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
const FA_WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
const FA_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

/** JS getDay() (0=Sun..6=Sat) -> Persian weekday index (0=Sat..6=Fri) */
export const faWeekdayIndex = (date: Date) => (date.getDay() + 1) % 7

export interface JDate { jy: number; jm: number; jd: number }

export function toJalali(date: Date): JDate {
  return jToJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function jalaliToDate(jy: number, jm: number, jd: number): Date {
  const g = toGregorian(jy, jm, jd)
  return new Date(g.gy, g.gm - 1, g.gd)
}

export function formatJalali(iso: string | Date, opts: { withWeekday?: boolean; short?: boolean } = {}): string {
  const d = typeof iso === 'string' ? new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')) : iso
  if (isNaN(d.getTime())) return '-'
  const { jy, jm, jd } = toJalali(d)
  const base = opts.short
    ? `${faDigits(jd)} ${FA_MONTHS[jm - 1]}`
    : `${faDigits(jd)} ${FA_MONTHS[jm - 1]} ${faDigits(jy)}`
  return opts.withWeekday ? `${FA_WEEKDAYS[faWeekdayIndex(d)]}، ${base}` : base
}

export const jalaliMonthLength = (jy: number, jm: number) => jml(jy, jm)

/** ISO yyyy-mm-dd of a Date in local time */
export function isoDate(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export const WEEKDAYS_SHORT = FA_WEEKDAYS_SHORT
export const WEEKDAYS = FA_WEEKDAYS
export const jalaliMonthName = (m: number) => FA_MONTHS[m - 1]

/** relative "x minutes ago" in Persian */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return 'چند لحظه پیش'
  if (diff < 3600) return `${faDigits(Math.floor(diff / 60))} دقیقه پیش`
  if (diff < 86400) return `${faDigits(Math.floor(diff / 3600))} ساعت پیش`
  if (diff < 2592000) return `${faDigits(Math.floor(diff / 86400))} روز پیش`
  return formatJalali(d)
}
