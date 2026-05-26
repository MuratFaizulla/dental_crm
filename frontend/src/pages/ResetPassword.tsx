import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../api/profile'
import styles from './Login.module.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ code: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const username = params.get('username') || ''

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError('Құпиясөздер сәйкес келмейді.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(username, form.code, form.new_password)
      navigate('/login')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      setError(msg || 'Код қате немесе мерзімі өтті.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Жаңа құпиясөз</h1>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>SMS код</label>
            <input
              className={styles.input}
              name="code"
              value={form.code}
              onChange={handleChange}
              maxLength={6}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Жаңа құпиясөз</label>
            <input
              className={styles.input}
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Растау</label>
            <input
              className={styles.input}
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Сақталуда...' : 'Сақтау'}
          </button>
        </form>
        <p className={styles.registerLink}>
          <Link to="/login">← Кіру</Link>
        </p>
      </div>
    </div>
  )
}
