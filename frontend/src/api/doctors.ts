import api from './client'

export interface Doctor {
  id: number
  first_name: string
  last_name: string
  father_name: string
  full_name: string
  services_id: number
}

export async function getDoctors(): Promise<Doctor[]> {
  const { data } = await api.get<{ results: Doctor[] }>('/doctors/')
  return data.results
}
