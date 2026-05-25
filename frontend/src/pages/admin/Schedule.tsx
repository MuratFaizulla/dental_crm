import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCalendarRecords } from '../../api/records'
import CalendarGrid from '../../components/calendar/CalendarGrid'
import styles from './Schedule.module.css'

type ViewMode = 'day' | 'week'
type GroupBy = 'doctor' | 'chair'

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

function weekDates(anchor: string): string[] {
  const d = new Date(anchor)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const copy = new Date(d)
    copy.setDate(d.getDate() + i)
    return toISO(copy)
  })
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function Schedule() {
  const navigate = useNavigate()
  const today = toISO(new Date())

  const [date, setDate] = useState(today)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [groupBy, setGroupBy] = useState<GroupBy>('doctor')
  const [doctorFilter, setDoctorFilter] = useState<number | undefined>()

  const dates = viewMode === 'week' ? weekDates(date) : [date]
  const dateFrom = dates[0]
  const dateTo = dates[dates.length - 1]

  const queryKey = ['calendar', dateFrom, dateTo, doctorFilter, groupBy]

  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getCalendarRecords({ date_from: dateFrom, date_to: dateTo, doctor: doctorFilter }),
  })

  const columns = useMemo(() => {
    if (groupBy === 'doctor') {
      const map = new Map<number, string>()
      records.forEach(r => {
        if (!map.has(r.doctor)) map.set(r.doctor, r.doctor_name)
      })
      return Array.from(map.entries()).map(([id, label]) => ({
        id,
        label,
        load: records.filter(r => r.doctor === id && r.reception_day === date).length,
      }))
    }
    const map = new Map<number, string>()
    records.forEach(r => {
      if (r.chair != null && !map.has(r.chair)) map.set(r.chair, r.chair_title)
    })
    return Array.from(map.entries()).map(([id, label]) => ({
      id,
      label,
      load: records.filter(r => r.chair === id && r.reception_day === date).length,
    }))
  }, [records, groupBy, date])

  const doctorOptions = useMemo(() => {
    const map = new Map<number, string>()
    records.forEach(r => map.set(r.doctor, r.doctor_name))
    return Array.from(map.entries())
  }, [records])

  function shift(n: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + (viewMode === 'week' ? n * 7 : n))
    setDate(toISO(d))
  }

  function handleSlotClick(columnId: number, slotDate: string, time: string) {
    const params = new URLSearchParams({ reception_day: slotDate, record_start: time })
    if (groupBy === 'doctor') params.set('doctor', String(columnId))
    else params.set('chair', String(columnId))
    navigate(`/admin/records/new?${params.toString()}`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Расписание</h1>
        <Link to="/admin/records/new" className={styles.newBtn}>+ Новая запись</Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.dateNav}>
          <button className={styles.navBtn} onClick={() => shift(-1)}>←</button>
          <input
            className={styles.dateInput}
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button className={styles.navBtn} onClick={() => shift(1)}>→</button>
          <button className={styles.todayBtn} onClick={() => setDate(today)}>Сегодня</button>
        </div>

        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'day' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('day')}
          >День</button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('week')}
          >Неделя</button>
        </div>

        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleBtn} ${groupBy === 'doctor' ? styles.toggleActive : ''}`}
            onClick={() => setGroupBy('doctor')}
          >По врачам</button>
          <button
            className={`${styles.toggleBtn} ${groupBy === 'chair' ? styles.toggleActive : ''}`}
            onClick={() => setGroupBy('chair')}
          >По кабинетам</button>
        </div>

        <select
          className={styles.filterSelect}
          value={doctorFilter ?? ''}
          onChange={e => setDoctorFilter(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Все врачи</option>
          {doctorOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className={styles.loading}>Загрузка...</div>}

      {!isLoading && viewMode === 'day' && (
        columns.length === 0
          ? <div className={styles.empty}>Записей на {date} нет</div>
          : <CalendarGrid
              records={records}
              columns={columns}
              groupBy={groupBy}
              date={date}
              queryKey={queryKey}
              onSlotClick={handleSlotClick}
            />
      )}

      {!isLoading && viewMode === 'week' && (
        <div className={styles.weekGrid}>
          {dates.map((d, i) => {
            const count = records.filter(r => r.reception_day === d).length
            return (
              <div
                key={d}
                className={`${styles.weekDay} ${d === today ? styles.weekDayToday : ''}`}
                onClick={() => { setDate(d); setViewMode('day') }}
              >
                <div className={styles.weekDayLabel}>{DAY_NAMES[i]}</div>
                <div className={styles.weekDayDate}>{d.slice(8)}.{d.slice(5, 7)}</div>
                <div className={styles.weekDayCount}>{count} зап.</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
