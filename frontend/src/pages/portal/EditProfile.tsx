import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile } from '../../api/profile'
import type { UpdateProfilePayload } from '../../api/profile'
import styles from './EditProfile.module.css'

const LANGUAGE_OPTIONS = [
  { value: 'kk', label: 'Қазақша' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

export default function EditProfile() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  const [form, setForm] = useState<UpdateProfilePayload>({
    first_name: '', last_name: '', father_name: '',
    email: '', mobile_phone: '', date_of_birth: '',
    gender: '', oblast: '', address: '', language: 'ru',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        father_name: profile.father_name,
        email: profile.email || '',
        mobile_phone: profile.mobile_phone || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender,
        oblast: profile.oblast,
        address: profile.address,
        language: profile.language,
      })
    }
  }, [profile])

  const mutation = useMutation({
    mutationFn: (data: UpdateProfilePayload) => updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      navigate('/portal/profile')
    },
    onError: () => setError('Сақтау кезінде қате пайда болды.'),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  if (isLoading) return <div className={styles.loading}>Жүктелуде...</div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Профильді редакциялау</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.label}>Тегі</label>
          <input className={styles.input} name="last_name" value={form.last_name || ''} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Аты</label>
          <input className={styles.input} name="first_name" value={form.first_name || ''} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Әкесінің аты</label>
          <input className={styles.input} name="father_name" value={form.father_name || ''} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" name="email" value={form.email || ''} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Мобильді телефон</label>
          <input className={styles.input} name="mobile_phone" value={form.mobile_phone || ''} onChange={handleChange} />
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
        <div className={styles.row}>
          <label className={styles.label}>Облыс</label>
          <input className={styles.input} name="oblast" value={form.oblast || ''} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Мекенжай</label>
          <textarea className={styles.textarea} name="address" value={form.address || ''} onChange={handleChange} rows={3} />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Тіл</label>
          <select className={styles.input} name="language" value={form.language || 'ru'} onChange={handleChange}>
            {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={mutation.isPending}>
            {mutation.isPending ? 'Сақталуда...' : 'Сақтау'}
          </button>
          <button type="button" className={styles.btnCancel} onClick={() => navigate('/portal/profile')}>
            Болдырмау
          </button>
        </div>
      </form>
    </div>
  )
}
