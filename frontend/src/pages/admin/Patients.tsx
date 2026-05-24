import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPatients } from '../../api/patients'
import styles from './Patients.module.css'

export default function Patients() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', q],
    queryFn: () => getPatients(q || undefined),
  })

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setQ(e.target.value), 400)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Пациенты</h1>
        <span className={styles.count}>{data?.count ?? 0} всего</span>
      </div>
      <input
        className={styles.searchInput}
        value={search}
        onChange={handleSearch}
        placeholder="Поиск по ФИО, телефону, ИИН..."
      />
      {isLoading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>ИИН</th>
                <th>Врач</th>
                <th>Дата рождения</th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((p) => (
                <tr
                  key={p.id}
                  className={styles.row}
                  onClick={() => navigate(`/admin/patients/${p.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.name}>{p.full_name}</td>
                  <td className={styles.secondary}>{p.mobile_phone ?? '—'}</td>
                  <td className={styles.mono}>{p.iin ?? '—'}</td>
                  <td className={styles.secondary}>{p.doctor_name}</td>
                  <td className={styles.secondary}>{p.date_of_birth ?? '—'}</td>
                </tr>
              ))}
              {data?.results.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>Пациенты не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
