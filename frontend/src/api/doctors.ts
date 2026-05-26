import api from './client'

export interface Doctor {
  id: number
  first_name: string
  last_name: string
  father_name: string
  full_name: string
  services_id: number
}

export interface Specialization {
  id: number
  title: string
  cost: number
}

// DoctorViewSet has pagination_class = None — returns a plain array
export async function getDoctors(): Promise<Doctor[]> {
  const { data } = await api.get<Doctor[]>('/doctors/')
  return data
}

export async function getSpecializations(): Promise<Specialization[]> {
  const { data } = await api.get<{ results: Specialization[] }>('/specializations/')
  return data.results
}
