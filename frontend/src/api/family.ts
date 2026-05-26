import api from './client'

export interface FamilyMember {
  id: number
  relation_type: string
  relation_label: string
  iin: string
  last_name: string
  first_name: string
  father_name: string
  date_of_birth: string | null
  gender: 'M' | 'F' | ''
  address: string
  created_at: string
  updated_at: string
}

export interface FamilyMemberPayload {
  relation_type: string
  iin?: string
  last_name?: string
  first_name: string
  father_name?: string
  date_of_birth?: string | null
  gender?: string
  address?: string
}

export const RELATION_LABELS: Record<string, string> = {
  mother:          'Мать',
  father:          'Отец',
  son:             'Сын',
  daughter:        'Дочь',
  adoptive_parent: 'Усыновитель',
  grandparent:     'Дедушка/Бабушка',
  adopted_child:   'Усыновлённый ребёнок',
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data } = await api.get<FamilyMember[]>('/family/')
  return data
}

export async function addFamilyMember(payload: FamilyMemberPayload): Promise<FamilyMember> {
  const { data } = await api.post<FamilyMember>('/family/', payload)
  return data
}

export async function updateFamilyMember(id: number, payload: Partial<FamilyMemberPayload>): Promise<FamilyMember> {
  const { data } = await api.patch<FamilyMember>(`/family/${id}/`, payload)
  return data
}

export async function deleteFamilyMember(id: number): Promise<void> {
  await api.delete(`/family/${id}/`)
}
