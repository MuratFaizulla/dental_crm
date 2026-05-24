import api from './client'

export interface Patient {
  id: number
  full_name: string
  first_name: string
  last_name: string
  father_name: string
  mobile_phone: string | null
  iin: string | null
  date_of_birth: string | null
  gender_name: string
  find_out_name: string
  doctor_name: string
  created_at: string
}

export interface Paginated<T> { count: number; results: T[]; next: string | null; previous: string | null }

export async function getPatients(search?: string): Promise<Paginated<Patient>> {
  const { data } = await api.get<Paginated<Patient>>('/clients/', { params: search ? { search } : {} })
  return data
}
