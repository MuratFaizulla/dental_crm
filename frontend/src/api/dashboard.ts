import { apiClient } from './client'

export interface UpcomingRecord {
  id: number
  time: string | null
  client: string
  service: string
  doctor: string
}

export interface DoctorLoad {
  doctors_name: string
  total: number
  done: number
}

export interface AdminSummary {
  records_today: number
  completed_today: number
  revenue_today: number
  revenue_month: number
  new_patients_month: number
  debt_count: number
  debt_amount: number
  upcoming: UpcomingRecord[]
  doctor_load: DoctorLoad[]
}

export interface TodayRecord {
  id: number
  time: string | null
  client: string
  service: string
  status: string
}

export interface DoctorSummary {
  records_today: number
  completed_today: number
  revenue_today: number
  revenue_month: number
  next_patient: { time: string | null; client: string; service: string } | null
  today_list: TodayRecord[]
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const { data } = await apiClient.get<AdminSummary>('/dashboard/summary/')
  return data
}

export async function getDoctorSummary(): Promise<DoctorSummary> {
  const { data } = await apiClient.get<DoctorSummary>('/dashboard/doctor-summary/')
  return data
}
