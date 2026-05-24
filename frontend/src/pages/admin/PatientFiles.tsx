import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFiles, uploadFile, deleteFile, PatientFile } from '../../api/files'
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

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function isImage(url: string) {
  const ext = url.split('.').pop()?.toLowerCase() ?? ''
  return IMAGE_EXTS.has(ext)
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

  function openFile(file: PatientFile) {
    if (isImage(file.file)) {
      setPreview(file.file)
    } else if (file.file.endsWith('.pdf')) {
      window.open(file.file, '_blank')
    } else {
      const a = document.createElement('a')
      a.href = file.file
      a.download = file.file.split('/').pop() ?? 'file'
      a.click()
    }
  }

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
          <div key={f.id} className={styles.card}>
            {isImage(f.file) ? (
              <img
                src={f.file}
                alt={f.description}
                className={styles.cardThumbImg}
                onClick={() => openFile(f)}
              />
            ) : (
              <div className={styles.cardThumb} onClick={() => openFile(f)}>
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
              <button className={styles.delBtn} onClick={() => del.mutate(f.id)}>
                Удалить
              </button>
            </div>
          </div>
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
