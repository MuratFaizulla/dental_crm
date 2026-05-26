import { useQuery } from '@tanstack/react-query'
import { getMyPlan } from '../../api/portal'
import styles from './PortalPage.module.css'

const STATUS_LABELS: Record<string, string> = {
  planned: 'Жоспарланған',
  in_progress: 'Орындалуда',
  done: 'Аяқталды',
  postponed: 'Кейінге қалдырылды',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('kk-KZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function TreatmentPlan() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-plan'],
    queryFn: getMyPlan,
  })

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Емдеу жоспары</h1>

      {isLoading ? (
        <div className={styles.empty}>Жүктелуде...</div>
      ) : data.length === 0 ? (
        <div className={styles.empty}>Емдеу жоспары жоқ</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Тіс №</th>
                <th>Диагноз</th>
                <th>Емдеу</th>
                <th>Мерзімі</th>
                <th>Мәртебе</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.tooth_number}</td>
                  <td>{item.diagnosis}</td>
                  <td>{item.treatment}</td>
                  <td>{formatDate(item.due_date)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`status_${item.status}`]}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
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
