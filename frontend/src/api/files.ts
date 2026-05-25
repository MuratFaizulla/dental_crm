import api from './client'

export interface PatientFile {
  id: number
  file: string
  file_type: 'xray' | 'photo' | 'document' | 'other'
  description: string
  tooth_number: string | null
  linked_record: number | null
  uploaded_by: number | null
  uploaded_at: string
}

export const getFiles = (clientId: number) =>
  api.get<PatientFile[]>(`/medical/${clientId}/files/`).then(r => r.data)

export const uploadFile = (clientId: number, formData: FormData) =>
  api.post<PatientFile>(`/medical/${clientId}/files/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

export const deleteFile = (clientId: number, fileId: number) =>
  api.delete(`/medical/${clientId}/files/${fileId}/`)

export const fetchFileBlob = (fileId: number): Promise<string> =>
  api.get<Blob>(`/medical/files/${fileId}/download/`, { responseType: 'blob' })
    .then(r => URL.createObjectURL(r.data))
