import api from './client'

export interface UserProfile {
  id: number
  username: string
  email: string | null
  first_name: string
  last_name: string
  father_name: string
  iin: string | null
  date_of_birth: string | null
  gender: 'M' | 'F' | ''
  mobile_phone: string | null
  oblast: string
  address: string
  language: string
  avatar: string | null
  role: string
}

export interface UpdateProfilePayload {
  email?: string
  first_name?: string
  last_name?: string
  father_name?: string
  date_of_birth?: string | null
  gender?: string
  mobile_phone?: string
  oblast?: string
  address?: string
  language?: string
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/users/me/')
  return data
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/users/me/', payload)
  return data
}

export async function changePassword(old_password: string, new_password: string): Promise<void> {
  await api.post('/users/me/change-password/', { old_password, new_password })
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/users/me/')
}

export async function forgotPassword(username: string): Promise<void> {
  await api.post('/auth/forgot-password/', { username })
}

export async function resetPassword(username: string, code: string, new_password: string): Promise<void> {
  await api.post('/auth/reset-password/', { username, code, new_password })
}
