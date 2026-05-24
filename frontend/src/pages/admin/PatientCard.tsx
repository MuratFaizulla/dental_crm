import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPatient } from '../../api/patients'
import { getRecords } from '../../api/records'
import ToothFormula from '../../components/ToothFormula/ToothFormula'
import TreatmentPlan from '../../components/TreatmentPlan/TreatmentPlan'
import PatientFiles from './PatientFiles'
import styles from './PatientCard.module.css'

type Tab = 'info' | 'medical' | 'files'

export default function PatientCard() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('info')

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', clientId],
    queryFn: () => getPatient(clientId),
  })

  const { data: recordsPage } = useQuery({
    queryKey: ['records', { client_id: clientId }],
    queryFn: () => getRecords({ client_id: clientId }),
    enabled: tab === 'info',
  })

  const records = recordsPage?.results ?? []

  if (isLoading || !patient) {
    return <div className={styles.loading}>Загрузка...</div>
  }

  const fullName = `${patient.last_name} ${patient.first_name} ${patient.father_name}`

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/admin/patients')}>←</button>
        <h1 className={styles.name}>{fullName}</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={tab === 'info' ? styles.tabActive : styles.tab}
          onClick={() => setTab('info')}
        >
          Информация
        </button>
        <button
          className={tab === 'medical' ? styles.tabActive : styles.tab}
          onClick={() => setTab('medical')}
        >
          Медкарта
        </button>
        <button
          className={tab === 'files' ? styles.tabActive : styles.tab}
          onClick={() => setTab('files')}
        >
          Файлы
        </button>
      </div>

      {tab === 'info' && (
        <div>
          <div className={styles.infoGrid}>
            <p className={styles.infoLabel}>Телефон</p>
            <p className={styles.infoValue}>{patient.mobile_phone ?? '—'}</p>
            <p className={styles.infoLabel}>ИИН</p>
            <p className={styles.infoValue}>{patient.iin ?? '—'}</p>
            <p className={styles.infoLabel}>Дата рождения</p>
            <p className={styles.infoValue}>{patient.date_of_birth ?? '—'}</p>
            <p className={styles.infoLabel}>Пол</p>
            <p className={styles.infoValue}>{patient.gender_name ?? '—'}</p>
            <p className={styles.infoLabel}>Как узнал</p>
            <p className={styles.infoValue}>{patient.find_out_name ?? '—'}</p>
            <p className={styles.infoLabel}>Врач</p>
            <p className={styles.infoValue}>{patient.doctor_name ?? '—'}</p>
          </div>

          <p className={styles.sectionTitle}>История визитов</p>
          <table className={styles.visitsTable}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Врач</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>{r.reception_day}</td>
                  <td>{r.doctor_name}</td>
                  <td>{r.status_title}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: '#8c8c8c' }}>Визитов нет</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'medical' && (
        <div>
          <ToothFormula clientId={clientId} />
          <TreatmentPlan clientId={clientId} />
        </div>
      )}

      {tab === 'files' && <PatientFiles clientId={clientId} />}
    </div>
  )
}
