import api from './client'

export interface MedicalNote {
  anamnesis: string
  allergies: string
  notes: string
  updated_at: string
  updated_by: number | null
}

export interface ToothRecord {
  tooth_number: string
  tooth_type: 'permanent' | 'primary'
  status: 'healthy' | 'treated' | 'urgent' | 'observation' | 'missing'
  notes: string
  updated_at: string
  updated_by: number | null
}

export interface TreatmentPlanItem {
  id: number
  tooth_number: string
  diagnosis: string
  treatment: string
  service: number | null
  due_date: string | null
  status: 'planned' | 'in_progress' | 'done' | 'postponed'
  postpone_reason: string
  linked_record: number | null
  doctor: number
  created_at: string
}

export type NewPlanItem = Pick<TreatmentPlanItem, 'tooth_number' | 'diagnosis' | 'treatment'> &
  Partial<Pick<TreatmentPlanItem, 'service' | 'due_date'>>

export const getNote = (clientId: number) =>
  api.get<MedicalNote>(`/medical/${clientId}/note/`).then(r => r.data)

export const saveNote = (clientId: number, data: Partial<MedicalNote>) =>
  api.put<MedicalNote>(`/medical/${clientId}/note/`, data).then(r => r.data)

export const getTeeth = (clientId: number) =>
  api.get<ToothRecord[]>(`/medical/${clientId}/teeth/`).then(r => r.data)

export const updateTooth = (clientId: number, toothNumber: string, data: Partial<ToothRecord>) =>
  api.put<ToothRecord>(`/medical/${clientId}/teeth/${toothNumber}/`, data).then(r => r.data)

export const getPlan = (clientId: number) =>
  api.get<TreatmentPlanItem[]>(`/medical/${clientId}/plan/`).then(r => r.data)

export const addPlanItem = (clientId: number, data: NewPlanItem) =>
  api.post<TreatmentPlanItem>(`/medical/${clientId}/plan/`, data).then(r => r.data)

export const updatePlanItem = (clientId: number, itemId: number, data: Partial<TreatmentPlanItem>) =>
  api.patch<TreatmentPlanItem>(`/medical/${clientId}/plan/${itemId}/`, data).then(r => r.data)

export const deletePlanItem = (clientId: number, itemId: number) =>
  api.delete(`/medical/${clientId}/plan/${itemId}/`)

export const getOdontogram = (clientId: number) =>
  api.get<{ odontogram_json: unknown }>(`/medical/${clientId}/odontogram/`).then(r => r.data)

export const saveOdontogram = (clientId: number, odontogram_json: unknown) =>
  api.put<{ odontogram_json: unknown }>(`/medical/${clientId}/odontogram/`, { odontogram_json }).then(r => r.data)
