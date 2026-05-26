import { apiClient } from './client'

export interface StaffUser {
  id: number
  username: string
  first_name: string
  last_name: string
  father_name: string
  email: string
  mobile_phone: string
  role: 'admin' | 'doctor'
  is_active: boolean
  created_at: string
}

export interface CreateUserPayload {
  username: string
  first_name: string
  last_name: string
  father_name?: string
  email?: string
  mobile_phone?: string
  role: 'admin' | 'doctor'
  password: string
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  const { data } = await apiClient.get<StaffUser[]>('/users/')
  return data
}

export async function createStaffUser(payload: CreateUserPayload): Promise<StaffUser> {
  const { data } = await apiClient.post<StaffUser>('/users/', payload)
  return data
}

export async function updateStaffUser(id: number, payload: Partial<StaffUser>): Promise<StaffUser> {
  const { data } = await apiClient.patch<StaffUser>(`/users/${id}/`, payload)
  return data
}

export async function deactivateStaffUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}/`)
}

export async function setStaffPassword(id: number, newPassword: string): Promise<void> {
  await apiClient.post(`/users/${id}/set-password/`, { new_password: newPassword })
}
