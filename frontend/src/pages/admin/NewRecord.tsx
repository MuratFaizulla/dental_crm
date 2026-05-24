import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDoctors } from '../../api/doctors'
import { getPatients } from '../../api/patients'
import { createRecord } from '../../api/records'
import styles from './NewRecord.module.css'

export default function NewRecord() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    client: '', doctor: '', reception_day: today,
    record_start: today, record_end: today, notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: doctorsData } = useQuery({ queryKey: ['doctors'], queryFn: getDoctors })
  const { data: patientsData } = useQuery({ queryKey: ['patients', ''], queryFn: () => getPatients() })

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const selectedPatient = patientsData?.results.find((p) => String(p.id) === form.client)
      const selectedDoctor  = doctorsData?.find((d) => String(d.id) === form.doctor)
      await createRecord({
        ...form,
        client: Number(form.client),
        doctor: Number(form.doctor),
        client_first_name:  selectedPatient?.first_name  ?? '',
        client_last_name:   selectedPatient?.last_name   ?? '',
        client_father_name: selectedPatient?.father_name ?? '',
        doctors_name:       selectedDoctor?.full_name    ?? '',
        assistant_name: '',
        specialization: 1,
        tooth: 0,
        specialization_cost: 0,
        count: 1,
        sell: 0,
        total: 0,
        status: 1,
      })
      navigate('/admin/schedule')
    } catch {
      setError('Ошибка при создании записи. Проверьте заполнение полей.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Новая запись</h1>
      <form onSubmit={handleSubmit} className={styles.card}>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Пациент</label>
            <select name="client" value={form.client} onChange={set} required className={styles.select}>
              <option value="">Выберите пациента</option>
              {patientsData?.results.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Врач</label>
            <select name="doctor" value={form.doctor} onChange={set} required className={styles.select}>
              <option value="">Выберите врача</option>
              {doctorsData?.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Дата приёма</label>
            <input type="date" name="reception_day" value={form.reception_day} onChange={set} required className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Время начала</label>
            <input type="date" name="record_start" value={form.record_start} onChange={set} required className={styles.input} />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Примечания</label>
          <textarea name="notes" value={form.notes} onChange={set} rows={3} className={styles.textarea} />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Сохранение...' : 'Создать запись'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className={styles.cancelBtn}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
