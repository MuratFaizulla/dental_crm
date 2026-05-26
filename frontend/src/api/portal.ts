import { apiClient } from './client'

export interface Appointment {
  id: number
  reception_day: string
  record_start: string | null
  doctors_name: string
  status: string
  total: number
  notes: string
}

export interface PortalFile {
  id: number
  file: string
  file_type: string
  description: string
  tooth_number: string | null
  uploaded_at: string
}

export interface PlanItem {
  id: number
  tooth_number: string
  diagnosis: string
  treatment: string
  due_date: string | null
  status: string
}

export async function getMyAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get<Appointment[]>('/users/me/appointments/')
  return data
}

export async function getMyFiles(): Promise<PortalFile[]> {
  const { data } = await apiClient.get<PortalFile[]>('/users/me/files/')
  return data
}

export async function getMyPlan(): Promise<PlanItem[]> {
  const { data } = await apiClient.get<PlanItem[]>('/users/me/plan/')
  return data
}

export async function downloadPortalFile(fileUrl: string, filename: string): Promise<void> {
  const response = await apiClient.get(fileUrl, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
