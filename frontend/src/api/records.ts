import api from './client'
import type { Paginated } from './patients'

export interface AppointmentRecord {
  id: number
  client: number
  client_first_name: string
  client_last_name: string
  client_father_name: string
  doctor: number
  doctor_name: string
  record_start: string
  record_end: string
  reception_day: string
  status_title: string
  chair_title: string
  total: number
  payment_state_title: string
}

export async function getRecords(params: { reception_day?: string; doctor?: number; client_id?: number } = {}) {
  const { data } = await api.get<Paginated<AppointmentRecord>>('/records/', { params })
  return data
}

export async function createRecord(payload: Record<string, unknown>) {
  const { data } = await api.post('/records/', payload)
  return data
}
