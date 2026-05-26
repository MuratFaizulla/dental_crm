import { apiClient } from './client'

export interface ClinicSettings {
  id: number
  name: string
  address: string
  phone: string
  email: string
  working_hours: Record<string, { open: string; close: string; closed?: boolean }>
  updated_at: string
}

export interface Chair {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export async function getClinicSettings(): Promise<ClinicSettings> {
  const { data } = await apiClient.get<ClinicSettings>('/settings/clinic/')
  return data
}

export async function updateClinicSettings(payload: Partial<ClinicSettings>): Promise<ClinicSettings> {
  const { data } = await apiClient.put<ClinicSettings>('/settings/clinic/', payload)
  return data
}

export async function getChairs(): Promise<Chair[]> {
  const { data } = await apiClient.get<Chair[]>('/settings/chairs/')
  return data
}

export async function createChair(title: string): Promise<Chair> {
  const { data } = await apiClient.post<Chair>('/settings/chairs/', { title })
  return data
}

export async function deleteChair(id: number): Promise<void> {
  await apiClient.delete(`/settings/chairs/${id}/`)
}
