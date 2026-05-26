import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFamilyMembers, addFamilyMember, deleteFamilyMember, RELATION_LABELS, FamilyMemberPayload } from '../../api/family'
import styles from './Family.module.css'

const RELATION_OPTIONS = Object.entries(RELATION_LABELS)

const EMPTY_FORM: FamilyMemberPayload = {
  relation_type: '', first_name: '', last_name: '', father_name: '',
  iin: '', date_of_birth: '', gender: '', address: '',
}

export default function Family() {
  const qc = useQueryClient()
  const { data: members = [], isLoading } = useQuery({ queryKey: ['family'], queryFn: getFamilyMembers })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FamilyMemberPayload>({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')

  const addMutation = useMutation({
    mutationFn: addFamilyMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family'] })
      setShowForm(false)
      setForm({ ...EMPTY_FORM })
    },
    onError: () => setFormError('Қате пайда болды. Қайталап көріңіз.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFamilyMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family'] }),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.relation_type) { setFormError('Туыстық түрін таңдаңыз.'); return }
    if (!form.first_name.trim()) { setFormError('Аты міндетті.'); return }
    addMutation.mutate(form)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Отбасы</h1>
        <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Жабу' : '+ Қосу'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>Жаңа мүше қосу</h2>
          <div className={styles.grid}>
            <div className={styles.row}>
              <label className={styles.label}>Туыстық түрі *</label>
              <select className={styles.input} name="relation_type" value={form.relation_type} onChange={handleChange}>
                <option value="">Таңдаңыз</option>
                {RELATION_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className={styles.row}>
              <label className={styles.label}>ЖСН</label>
              <input className={styles.input} name="iin" value={form.iin || ''} onChange={handleChange} maxLength={12} />
            </div>
            <div className={styles.row}>
              <label className={styles.label}>Тегі</label>
              <input className={styles.input} name="last_name" value={form.last_name || ''} onChange={handleChange} />
            </div>
            <div className={styles.row}>
              <label className={styles.label}>Аты *</label>
              <input className={styles.input} name="first_name" value={form.first_name} onChange={handleChange} required />
            </div>
            <div className={styles.row}>
              <label className={styles.label}>Әкесінің аты</label>
              <input className={styles.input} name="father_name" value={form.father_name || ''} onChange={handleChange} />
            </div>
            <div className={styles.row}>
              <label className={styles.label}>Туған күні</label>
              <input className={styles.input} type="date" name="date_of_birth" value={form.date_of_birth || ''} onChange={handleChange} />
            </div>
            <div className={styles.row}>
              <label className={styles.label}>Жынысы</label>
              <select className={styles.input} name="gender" value={form.gender || ''} onChange={handleChange}>
                <option value="">Таңдаңыз</option>
                <option value="M">Ер</option>
                <option value="F">Әйел</option>
              </select>
            </div>
            <div className={styles.row} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Мекенжай</label>
              <input className={styles.input} name="address" value={form.address || ''} onChange={handleChange} />
            </div>
          </div>
          {formError && <p className={styles.error}>{formError}</p>}
          <button type="submit" className={styles.saveBtn} disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Сақталуда...' : 'Сақтау'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className={styles.empty}>Жүктелуде...</div>
      ) : members.length === 0 ? (
        <div className={styles.empty}>Отбасы мүшелері жоқ</div>
      ) : (
        <div className={styles.list}>
          {members.map(m => (
            <div key={m.id} className={styles.card}>
              <div className={styles.cardInfo}>
                <span className={styles.relation}>{m.relation_label}</span>
                <span className={styles.name}>
                  {[m.last_name, m.first_name, m.father_name].filter(Boolean).join(' ')}
                </span>
                {m.iin && <span className={styles.detail}>ЖСН: {m.iin}</span>}
                {m.date_of_birth && <span className={styles.detail}>Туған күні: {m.date_of_birth}</span>}
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => deleteMutation.mutate(m.id)}
                disabled={deleteMutation.isPending}
              >
                Жою
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
