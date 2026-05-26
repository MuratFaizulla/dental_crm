import api from './client'

export interface Payment {
  id: number
  record: number
  amount: string
  payment_type: 'cash' | 'card' | 'transfer'
  paid_at: string
  received_by: number | null
  received_by_name: string
  notes: string
}

export interface CreatePaymentPayload {
  record: number
  amount: string
  payment_type: 'cash' | 'card' | 'transfer'
  notes?: string
}

export interface DebtRecord {
  id: number
  client: number
  client_full_name: string
  doctor: number
  doctor_name: string
  reception_day: string
  total: number
  paid: string
  debt: string
}

export interface PaymentSummary {
  total: string
  count: number
  by_type: { payment_type: string; amount: string; count: number }[]
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
}

export async function getPayments(params: {
  date_from?: string
  date_to?: string
  doctor?: number
  record?: number
} = {}): Promise<Payment[]> {
  const { data } = await api.get<{ results: Payment[] }>('/payments/', { params })
  return data.results
}

export async function createPayment(payload: CreatePaymentPayload): Promise<Payment> {
  const { data } = await api.post<Payment>('/payments/', payload)
  return data
}

export async function getDebts(): Promise<DebtRecord[]> {
  const { data } = await api.get<DebtRecord[]>('/payments/debts/')
  return data
}

export async function getPaymentSummary(params: {
  date_from?: string
  date_to?: string
} = {}): Promise<PaymentSummary> {
  const { data } = await api.get<PaymentSummary>('/payments/summary/', { params })
  return data
}
