import { create } from 'zustand'
import { decodeToken } from '../api/auth'

interface AuthState {
  role: 'admin' | 'doctor' | 'patient' | null
  email: string | null
  fullName: string | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  logout: () => void
}

function loadFromToken() {
  const t = localStorage.getItem('access_token')
  if (!t) return { role: null, email: null, fullName: null }
  try {
    const p = decodeToken(t)
    return { role: p.role, email: p.email, fullName: p.full_name }
  } catch {
    return { role: null, email: null, fullName: null }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromToken(),
  isAuthenticated: !!localStorage.getItem('access_token'),

  setTokens(access, refresh) {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    const p = decodeToken(access)
    set({ role: p.role, email: p.email, fullName: p.full_name, isAuthenticated: true })
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ role: null, email: null, fullName: null, isAuthenticated: false })
  },
}))
