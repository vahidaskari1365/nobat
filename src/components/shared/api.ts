'use client'

/** Tiny typed fetch helper */
export async function api<T = any>(url: string, init?: RequestInit & { body?: any }): Promise<T> {
  const { body, ...rest } = init ?? {}
  const opts: RequestInit = {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(rest?.headers ?? {}) },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  }
  const res = await fetch(url, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'خطای غیرمنتظره‌ای رخ داد')
  return data as T
}
