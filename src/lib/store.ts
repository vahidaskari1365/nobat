'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'PATIENT' | 'DOCTOR' | 'SECRETARY' | 'ADMIN'

export interface AppUser {
  id: string
  name: string
  email: string | null
  role: Role
  avatar: string | null
  profile?: any
}

export type View =
  | { type: 'landing' }
  | { type: 'blog' }
  | { type: 'blog-post'; slug: string }
  | { type: 'booking'; doctorId?: string }
  | { type: 'panel' }
  | { type: 'visit'; code: string }

interface AppState {
  view: View
  user: AppUser | null
  authOpen: boolean
  authMode: 'login' | 'register'
  bookingDoctor: string | undefined
  setView: (v: View) => void
  setUser: (u: AppUser | null) => void
  openAuth: (mode?: 'login' | 'register') => void
  closeAuth: () => void
  goBooking: (doctorId?: string) => void
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      view: { type: 'landing' },
      user: null,
      authOpen: false,
      authMode: 'login',
      bookingDoctor: undefined,
      setView: (view) => set({ view, authOpen: false }),
      setUser: (user) => set({ user }),
      openAuth: (authMode = 'login') => set({ authOpen: true, authMode }),
      closeAuth: () => set({ authOpen: false }),
      goBooking: (doctorId) => set({ view: { type: 'booking' }, bookingDoctor: doctorId, authOpen: false }),
    }),
    { name: 'nobatyar-state', partialize: (s) => ({ user: s.user }) }
  )
)
