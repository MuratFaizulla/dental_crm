import axios from 'axios'

export interface TokenPayload {
  role: 'admin' | 'doctor' | 'patient'
  username: string
  email: string
  full_name: string
  exp: number
}

export interface RegisterPayload {
  iin: string
  username: string
  mobile_phone: string
  password: string
  password_confirm: string
}

export function decodeToken(token: string): TokenPayload {
  return JSON.parse(atob(token.split('.')[1]))
}

export async function login(username: string, password: string) {
  const { data } = await axios.post<{ access: string; refresh: string }>(
    '/api/v1/token/', { username, password }
  )
  return data
}

export async function register(payload: RegisterPayload) {
  const { data } = await axios.post('/api/v1/auth/register/', payload)
  return data
}
