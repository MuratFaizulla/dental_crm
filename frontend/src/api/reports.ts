import { apiClient } from './client'

export interface ReportRow {
  name: string
  revenue: number
  records: number
}

export type ReportType =
  | 'revenue_by_doctor'
  | 'revenue_by_service'
  | 'chair_load'
  | 'new_vs_returning'
  | 'top_ltv'
  | 'debts'
  | 'campaigns'

export interface ReportParams {
  date_from?: string
  date_to?: string
}

export async function getReport(
  reportType: ReportType,
  params: ReportParams,
): Promise<ReportRow[]> {
  const { data } = await apiClient.get<ReportRow[]>(`/reports/${reportType}/`, { params })
  return data
}

export async function downloadReportXlsx(
  reportType: ReportType,
  params: ReportParams,
): Promise<void> {
  const token = localStorage.getItem('access_token')
  const query = new URLSearchParams({ ...params, format: 'xlsx' } as Record<string, string>)
  const response = await fetch(`/api/v1/reports/${reportType}/?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Ошибка экспорта')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${reportType}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
