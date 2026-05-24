import axios from 'axios'

export interface TokenPayload {
  role: 'admin' | 'doctor' | 'patient'
  email: string
  full_name: string
  exp: number
}

export function decodeToken(token: string): TokenPayload {
  return JSON.parse(atob(token.split('.')[1]))
}

export async function login(email: string, password: string) {
  const { data } = await axios.post<{ access: string; refresh: string }>(
    '/api/v1/token/', { email, password }
  )
  return data
}
