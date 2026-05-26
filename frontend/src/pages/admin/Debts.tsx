import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDebts } from '../../api/payments'
import styles from './Debts.module.css'

export default function Debts() {
  const navigate = useNavigate()
  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: getDebts,
  })

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.debt), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Должники</h1>
        {debts.length > 0 && (
          <span className={styles.totalBadge}>
            Общий долг: {totalDebt.toLocaleString()} ₸
          </span>
        )}
      </div>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}>Загрузка...</div>
        ) : debts.length === 0 ? (
          <div className={styles.empty}>Должников нет</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Пациент</th>
                <th>Врач</th>
                <th>Дата приёма</th>
                <th>Итого</th>
                <th>Оплачено</th>
                <th>Долг</th>
              </tr>
            </thead>
            <tbody>
              {debts.map(d => (
                <tr
                  key={d.id}
                  className={styles.row}
                  onClick={() => navigate(`/admin/patients/${d.client}`)}
                >
                  <td>{d.client_full_name}</td>
                  <td>{d.doctor_name || '—'}</td>
                  <td>{new Date(d.reception_day).toLocaleDateString('ru-RU')}</td>
                  <td>{Number(d.total).toLocaleString()} ₸</td>
                  <td>{Number(d.paid).toLocaleString()} ₸</td>
                  <td className={styles.debt}>{Number(d.debt).toLocaleString()} ₸</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
