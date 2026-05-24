import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRecords, type AppointmentRecord } from '../../api/records'
import styles from './Schedule.module.css'

function toISO(d: Date) { return d.toISOString().split('T')[0] }

function cardClass(status: string) {
  if (status === 'Ожидает') return `${styles.card} ${styles.waiting}`
  if (status === 'На приёме') return `${styles.card} ${styles.active}`
  if (status === 'Завершён') return `${styles.card} ${styles.done}`
  if (status === 'Отменён') return `${styles.card} ${styles.canceled}`
  return styles.card
}

export default function Schedule() {
  const today = toISO(new Date())
  const [date, setDate] = useState(today)

  const { data, isLoading } = useQuery({
    queryKey: ['records', date],
    queryFn: () => getRecords({ reception_day: date }),
  })

  function shift(n: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + n)
    setDate(toISO(d))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Расписание</h1>
        <Link to="/admin/records/new" className={styles.newBtn}>+ Новая запись</Link>
      </div>

      <div className={styles.dateNav}>
        <button className={styles.navBtn} onClick={() => shift(-1)}>←</button>
        <input
          className={styles.dateInput}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className={styles.navBtn} onClick={() => shift(1)}>→</button>
        <button className={styles.todayBtn} onClick={() => setDate(today)}>Сегодня</button>
        <span className={styles.recordCount}>{data?.count ?? 0} записей</span>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <div className={styles.list}>
          {data?.results.map((r: AppointmentRecord) => (
            <div key={r.id} className={cardClass(r.status_title)}>
              <div className={styles.time}>{r.record_start}</div>
              <div className={styles.info}>
                <div className={styles.patientName}>
                  {r.client_last_name} {r.client_first_name} {r.client_father_name}
                </div>
                <div className={styles.doctorChair}>
                  {r.doctor_name}{r.chair_title ? ` · ${r.chair_title}` : ''}
                </div>
              </div>
              <div className={styles.amount}>
                <div className={styles.total}>{r.total.toLocaleString()} ₸</div>
                <div className={styles.payState}>{r.payment_state_title}</div>
              </div>
              <div className={styles.statusBadge}>{r.status_title}</div>
            </div>
          ))}
          {data?.results.length === 0 && (
            <div className={styles.empty}>Записей на {date} нет</div>
          )}
        </div>
      )}
    </div>
  )
}
