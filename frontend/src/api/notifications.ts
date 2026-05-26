import { apiClient } from './client'

export interface SMSLogEntry {
  id: number
  phone: string
  message: string
  sms_type: string
  sms_type_display: string
  status: string
  status_display: string
  record_id: number | null
  sent_at: string | null
  created_at: string
}

export async function sendSMSReminder(recordId: number): Promise<{ detail: string; sms_log_id: number }> {
  const { data } = await apiClient.post(`/notifications/send/${recordId}/`)
  return data
}

export async function getSMSLog(): Promise<SMSLogEntry[]> {
  const { data } = await apiClient.get<SMSLogEntry[]>('/notifications/log/')
  return data
}
