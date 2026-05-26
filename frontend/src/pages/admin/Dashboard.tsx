import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getAdminSummary, getDoctorSummary } from '../../api/dashboard'
import styles from './Dashboard.module.css'

function fmt(n: number) {
  return n.toLocaleString('ru-RU')
}

export default function Dashboard() {
  const { role } = useAuthStore()
  const isAdmin = role === 'admin'

  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: getAdminSummary,
    enabled: isAdmin,
    refetchInterval: 60_000,
  })

  const { data: doctorData, isLoading: doctorLoading } = useQuery({
    queryKey: ['dashboard-doctor'],
    queryFn: getDoctorSummary,
    enabled: !isAdmin,
    refetchInterval: 60_000,
  })

  if (adminLoading || doctorLoading) {
    return <div className={styles.page}><p className={styles.loading}>Загрузка...</p></div>
  }

  if (isAdmin && adminData) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Дашборд</h1>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Приёмов сегодня</span>
            <span className={styles.kpiValue}>{adminData.records_today}</span>
            <span className={styles.kpiSub}>завершено: {adminData.completed_today}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Выручка сегодня</span>
            <span className={styles.kpiValue}>{fmt(adminData.revenue_today)} ₸</span>
            <span className={styles.kpiSub}>за месяц: {fmt(adminData.revenue_month)} ₸</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Новых пациентов</span>
            <span className={styles.kpiValue}>{adminData.new_patients_month}</span>
            <span className={styles.kpiSub}>за текущий месяц</span>
          </div>
          <div className={`${styles.kpiCard} ${adminData.debt_count > 0 ? styles.kpiDanger : ''}`}>
            <span className={styles.kpiLabel}>Должники</span>
            <span className={styles.kpiValue}>{adminData.debt_count}</span>
            <span className={styles.kpiSub}>{fmt(adminData.debt_amount)} ₸</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Ближайшие приёмы</h2>
            {adminData.upcoming.length === 0 ? (
              <p className={styles.empty}>Записей нет</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr><th>Время</th><th>Пациент</th><th>Услуга</th><th>Врач</th></tr>
                </thead>
                <tbody>
                  {adminData.upcoming.map((r) => (
                    <tr key={r.id}>
                      <td>{r.time ?? '—'}</td>
                      <td>{r.client}</td>
                      <td>{r.service || '—'}</td>
                      <td>{r.doctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Загрузка врачей сегодня</h2>
            {adminData.doctor_load.length === 0 ? (
              <p className={styles.empty}>Нет данных</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr><th>Врач</th><th>Всего</th><th>Завершено</th></tr>
                </thead>
                <tbody>
                  {adminData.doctor_load.map((d) => (
                    <tr key={d.doctors_name}>
                      <td>{d.doctors_name}</td>
                      <td>{d.total}</td>
                      <td>{d.done}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin && doctorData) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Мой день</h1>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Приёмов сегодня</span>
            <span className={styles.kpiValue}>{doctorData.records_today}</span>
            <span className={styles.kpiSub}>завершено: {doctorData.completed_today}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Выручка сегодня</span>
            <span className={styles.kpiValue}>{fmt(doctorData.revenue_today)} ₸</span>
            <span className={styles.kpiSub}>за месяц: {fmt(doctorData.revenue_month)} ₸</span>
          </div>
          {doctorData.next_patient && (
            <div className={`${styles.kpiCard} ${styles.kpiHighlight}`}>
              <span className={styles.kpiLabel}>Следующий пациент</span>
              <span className={styles.kpiValue}>{doctorData.next_patient.time ?? '—'}</span>
              <span className={styles.kpiSub}>{doctorData.next_patient.client}</span>
              <span className={styles.kpiSub}>{doctorData.next_patient.service}</span>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Список приёмов на сегодня</h2>
          {doctorData.today_list.length === 0 ? (
            <p className={styles.empty}>Записей нет</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr><th>Время</th><th>Пациент</th><th>Услуга</th><th>Статус</th></tr>
              </thead>
              <tbody>
                {doctorData.today_list.map((r) => (
                  <tr key={r.id}>
                    <td>{r.time ?? '—'}</td>
                    <td>{r.client}</td>
                    <td>{r.service || '—'}</td>
                    <td>{r.status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

  return null
}
