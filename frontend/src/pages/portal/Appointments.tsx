import { useQuery } from '@tanstack/react-query'
import { getMyAppointments } from '../../api/portal'
import styles from './PortalPage.module.css'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('kk-KZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return '—'
  return timeStr.slice(0, 5)
}

const STATUS_LABELS: Record<string, string> = {
  'Завершен': 'Аяқталды',
  'Отменен': 'Бас тартылды',
  'Запись': 'Жазылды',
  'Ожидание': 'Күту',
}

function localizeStatus(status: string) {
  return STATUS_LABELS[status] ?? status
}

export default function Appointments() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: getMyAppointments,
  })

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Визиттер тарихы</h1>

      {isLoading ? (
        <div className={styles.empty}>Жүктелуде...</div>
      ) : data.length === 0 ? (
        <div className={styles.empty}>Визиттер жоқ</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Күні</th>
                <th>Уақыты</th>
                <th>Дәрігер</th>
                <th>Мәртебе</th>
                <th>Сомасы</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.reception_day)}</td>
                  <td>{formatTime(row.record_start)}</td>
                  <td>{row.doctors_name}</td>
                  <td>
                    <span className={styles.badge}>{localizeStatus(row.status)}</span>
                  </td>
                  <td className={styles.amount}>{row.total.toLocaleString()} ₸</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
