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
  chair: number | null
  chair_title: string
  record_start: string | null
  record_end: string | null
  reception_day: string
  status: number
  status_title: string
  total: number
  payment_state_title: string
}

export interface CalendarParams {
  date_from: string
  date_to: string
  doctor?: number
  chair?: number
}

export interface ConflictPayload {
  doctor: number
  date: string
  record_start: string
  record_end: string
  exclude_id?: number
}

export async function getRecords(params: { reception_day?: string; doctor?: number; client_id?: number } = {}) {
  const { data } = await api.get<Paginated<AppointmentRecord>>('/records/', { params })
  return data
}

export async function getCalendarRecords(params: CalendarParams) {
  const { data } = await api.get<AppointmentRecord[]>('/records/calendar/', { params })
  return data
}

export async function getSlots(doctor: number, date: string) {
  const { data } = await api.get<{ id: number; record_start: string | null; record_end: string | null }[]>(
    '/records/slots/',
    { params: { doctor, date } },
  )
  return data
}

export async function checkConflict(payload: ConflictPayload) {
  const { data } = await api.post<{ conflict: boolean }>('/records/check-conflict/', payload)
  return data
}

export async function createRecord(payload: Record<string, unknown>) {
  const { data } = await api.post('/records/', payload)
  return data
}

export async function updateRecord(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/records/${id}/`, payload)
  return data
}
