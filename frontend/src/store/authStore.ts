import { create } from 'zustand'
import { decodeToken } from '../api/auth'

interface AuthState {
  role: 'admin' | 'doctor' | 'patient' | null
  username: string | null
  email: string | null
  fullName: string | null
  firstName: string | null
  lastName: string | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  logout: () => void
}

function loadFromToken() {
  const t = localStorage.getItem('access_token')
  if (!t) return { role: null, username: null, email: null, fullName: null, firstName: null, lastName: null }
  try {
    const p = decodeToken(t)
    return {
      role: p.role, username: p.username, email: p.email,
      fullName: p.full_name, firstName: p.first_name ?? null, lastName: p.last_name ?? null,
    }
  } catch {
    return { role: null, username: null, email: null, fullName: null, firstName: null, lastName: null }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromToken(),
  isAuthenticated: !!localStorage.getItem('access_token'),

  setTokens(access, refresh) {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    const p = decodeToken(access)
    set({
      role: p.role, username: p.username, email: p.email,
      fullName: p.full_name, firstName: p.first_name ?? null, lastName: p.last_name ?? null,
      isAuthenticated: true,
    })
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ role: null, username: null, email: null, fullName: null, firstName: null, lastName: null, isAuthenticated: false })
  },
}))
