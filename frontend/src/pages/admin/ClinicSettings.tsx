import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClinicSettings, updateClinicSettings,
  getChairs, createChair, deleteChair,
} from '../../api/clinicSettings'
import styles from './ClinicSettings.module.css'

export default function ClinicSettings() {
  const qc = useQueryClient()
  const [newChair, setNewChair] = useState('')
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: getClinicSettings,
  })

  const { data: chairs = [] } = useQuery({
    queryKey: ['chairs'],
    queryFn: getChairs,
  })

  useEffect(() => {
    if (settings) {
      setForm({ name: settings.name, address: settings.address, phone: settings.phone, email: settings.email })
    }
  }, [settings])

  const updateMut = useMutation({
    mutationFn: updateClinicSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const addChairMut = useMutation({
    mutationFn: createChair,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chairs'] }); setNewChair('') },
  })

  const deleteChairMut = useMutation({
    mutationFn: deleteChair,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chairs'] }),
  })

  if (isLoading) return <div className={styles.page}><p>Загрузка...</p></div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Настройки клиники</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Основная информация</h2>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <label>Название клиники</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <label>Адрес</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <label>Телефон</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnPrimary} disabled={updateMut.isPending} onClick={() => updateMut.mutate(form)}>
              {updateMut.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            {saved && <span className={styles.savedMsg}>Сохранено ✓</span>}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Кабинеты</h2>
        <div className={styles.chairRow}>
          <input
            value={newChair}
            onChange={(e) => setNewChair(e.target.value)}
            placeholder="Название кабинета"
            className={styles.chairInput}
            onKeyDown={(e) => { if (e.key === 'Enter' && newChair.trim()) addChairMut.mutate(newChair.trim()) }}
          />
          <button
            className={styles.btnPrimary}
            disabled={!newChair.trim() || addChairMut.isPending}
            onClick={() => addChairMut.mutate(newChair.trim())}
          >
            Добавить
          </button>
        </div>
        <ul className={styles.chairList}>
          {chairs.map((c) => (
            <li key={c.id} className={styles.chairItem}>
              <span>{c.title}</span>
              <button
                className={styles.btnDanger}
                onClick={() => { if (confirm(`Удалить «${c.title}»?`)) deleteChairMut.mutate(c.id) }}
              >
                Удалить
              </button>
            </li>
          ))}
          {chairs.length === 0 && <li className={styles.empty}>Кабинеты не добавлены</li>}
        </ul>
      </div>
    </div>
  )
}
