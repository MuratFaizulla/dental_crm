import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFiles, uploadFile, deleteFile, fetchFileBlob } from '../../api/files'
import type { PatientFile } from '../../api/files'
import { useAuthedFileUrl } from '../../hooks/useAuthedFileUrl'
import styles from './PatientFiles.module.css'

const FILE_TYPE_LABELS: Record<string, string> = {
  xray: 'Рентген',
  photo: 'Фото',
  document: 'Документ',
  other: 'Другое',
}

const FILE_TYPE_ICONS: Record<string, string> = {
  xray: '🦷',
  photo: '📷',
  document: '📄',
  other: '📎',
}

function isImageType(fileType: string) {
  return fileType === 'xray' || fileType === 'photo'
}

interface FileCardProps {
  f: PatientFile
  onPreview: (blobUrl: string) => void
  onDelete: (id: number) => void
}

function FileCard({ f, onPreview, onDelete }: FileCardProps) {
  const isImg = isImageType(f.file_type)
  const blobUrl = useAuthedFileUrl(isImg ? f.id : null)

  function handleOpen() {
    if (isImg) {
      if (blobUrl) onPreview(blobUrl)
    } else {
      fetchFileBlob(f.id).then(url => {
        if (f.file_type === 'document') {
          window.open(url, '_blank')
        } else {
          const a = document.createElement('a')
          a.href = url
          a.download = `file_${f.id}`
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }
      })
    }
  }

  return (
    <div className={styles.card}>
      {isImg ? (
        blobUrl ? (
          <img
            src={blobUrl}
            alt={f.description}
            className={styles.cardThumbImg}
            onClick={handleOpen}
          />
        ) : (
          <div className={styles.cardThumb} onClick={handleOpen}>
            {FILE_TYPE_ICONS[f.file_type] ?? '📎'}
          </div>
        )
      ) : (
        <div className={styles.cardThumb} onClick={handleOpen}>
          {FILE_TYPE_ICONS[f.file_type] ?? '📎'}
        </div>
      )}
      <div className={styles.cardBody}>
        <p className={styles.cardType}>{FILE_TYPE_LABELS[f.file_type]}</p>
        <p className={styles.cardDesc}>{f.description || '—'}</p>
        <p className={styles.cardMeta}>
          {f.tooth_number ? `Зуб ${f.tooth_number} · ` : ''}
          {new Date(f.uploaded_at).toLocaleDateString('ru-RU')}
        </p>
      </div>
      <div className={styles.cardActions}>
        <button className={styles.delBtn} onClick={() => onDelete(f.id)}>
          Удалить
        </button>
      </div>
    </div>
  )
}

interface Props {
  clientId: number
}

export default function PatientFiles({ clientId }: Props) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string>('photo')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const { data: files = [] } = useQuery({
    queryKey: ['files', clientId],
    queryFn: () => getFiles(clientId),
  })

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', selectedFile!)
      fd.append('file_type', fileType)
      fd.append('description', description)
      return uploadFile(clientId, fd)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files', clientId] })
      setShowModal(false)
      setSelectedFile(null)
      setFileType('photo')
      setDescription('')
    },
  })

  const del = useMutation({
    mutationFn: (fileId: number) => deleteFile(clientId, fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', clientId] }),
  })

  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.uploadBtn} onClick={() => setShowModal(true)}>
          Загрузить файл
        </button>
      </div>

      {files.length === 0 && (
        <p className={styles.empty}>Файлов нет. Загрузите первый.</p>
      )}

      <div className={styles.grid}>
        {files.map(f => (
          <FileCard
            key={f.id}
            f={f}
            onPreview={url => setPreview(url)}
            onDelete={id => del.mutate(id)}
          />
        ))}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>Загрузить файл</p>

            <div
              className={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? selectedFile.name : 'Перетащите файл или кликните для выбора'}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.dcm"
              style={{ display: 'none' }}
              onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            />

            <div>
              <p className={styles.label}>Тип</p>
              <select
                className={styles.select}
                value={fileType}
                onChange={e => setFileType(e.target.value)}
              >
                <option value="xray">Рентген</option>
                <option value="photo">Фото</option>
                <option value="document">Документ</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div>
              <p className={styles.label}>Описание (необязательно)</p>
              <input
                className={styles.input}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Верхняя челюсть, 2026"
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                Отмена
              </button>
              <button
                className={styles.submitBtn}
                disabled={!selectedFile || upload.isPending}
                onClick={() => upload.mutate()}
              >
                {upload.isPending ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className={styles.previewOverlay} onClick={() => setPreview(null)}>
          <button className={styles.previewClose} onClick={() => setPreview(null)}>×</button>
          <img src={preview} alt="Просмотр" className={styles.previewImg} />
        </div>
      )}
    </div>
  )
}
