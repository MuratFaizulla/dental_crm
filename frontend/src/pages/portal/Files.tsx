import { useQuery } from '@tanstack/react-query'
import { getMyFiles, downloadPortalFile, type PortalFile } from '../../api/portal'
import styles from './PortalPage.module.css'

const TYPE_LABELS: Record<string, string> = {
  xray: 'Рентген',
  photo: 'Фото',
  document: 'Құжат',
  other: 'Басқа',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('kk-KZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function guessFilename(file: PortalFile) {
  const ext = file.file.split('?')[0].split('.').pop() ?? 'file'
  return `${TYPE_LABELS[file.file_type] ?? file.file_type}_${file.id}.${ext}`
}

export default function Files() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-files'],
    queryFn: getMyFiles,
  })

  async function handleDownload(file: PortalFile) {
    await downloadPortalFile(file.file, guessFilename(file))
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Менің файлдарым</h1>

      {isLoading ? (
        <div className={styles.empty}>Жүктелуде...</div>
      ) : data.length === 0 ? (
        <div className={styles.empty}>Файлдар жоқ</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Түрі</th>
                <th>Сипаттама</th>
                <th>Тіс №</th>
                <th>Жүктелген күні</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((file) => (
                <tr key={file.id}>
                  <td>{TYPE_LABELS[file.file_type] ?? file.file_type}</td>
                  <td>{file.description || '—'}</td>
                  <td>{file.tooth_number || '—'}</td>
                  <td>{formatDate(file.uploaded_at)}</td>
                  <td>
                    <button
                      className={styles.dlBtn}
                      onClick={() => handleDownload(file)}
                    >
                      Жүктеу
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
