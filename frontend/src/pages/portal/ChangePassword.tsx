import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { changePassword } from '../../api/profile'
import { useAuthStore } from '../../store/authStore'
import styles from './EditProfile.module.css'

export default function ChangePassword() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError('Жаңа құпиясөздер сәйкес келмейді.')
      return
    }
    setLoading(true)
    try {
      await changePassword(form.old_password, form.new_password)
      logout()
      navigate('/login')
    } catch {
      setError('Ескі құпиясөз қате немесе сервер қатесі.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Құпиясөзді өзгерту</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.label}>Ескі құпиясөз</label>
          <input className={styles.input} type="password" name="old_password" value={form.old_password} onChange={handleChange} required />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Жаңа құпиясөз</label>
          <input className={styles.input} type="password" name="new_password" value={form.new_password} onChange={handleChange} required minLength={8} />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Растау</label>
          <input className={styles.input} type="password" name="confirm" value={form.confirm} onChange={handleChange} required />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Сақталуда...' : 'Өзгерту'}
          </button>
          <Link to="/portal/profile" className={styles.btnCancel} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Болдырмау
          </Link>
        </div>
      </form>
    </div>
  )
}
