import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import styles from './Login.module.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    iin: '',
    username: '',
    mobile_phone: '',
    password: '',
    password_confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirm) {
      setError('Құпиясөздер сәйкес келмейді')
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/login')
    } catch (err: unknown) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Dental CRM</h1>
        <p className={styles.subtitle}>Тіркелу</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>ЖСН</label>
            <input
              className={styles.input}
              type="text"
              name="iin"
              value={form.iin}
              onChange={handleChange}
              placeholder="123456789012"
              maxLength={12}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Логин</label>
            <input
              className={styles.input}
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="username"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Мобильді телефон</label>
            <input
              className={styles.input}
              type="tel"
              name="mobile_phone"
              value={form.mobile_phone}
              onChange={handleChange}
              placeholder="+77001234567"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Құпиясөз</label>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Құпиясөзді растау</label>
            <input
              className={styles.input}
              type="password"
              name="password_confirm"
              value={form.password_confirm}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Тіркелу...' : 'Тіркелу'}
          </button>
        </form>
        <p className={styles.registerLink}>
          Аккаунт бар ма? <Link to="/login">Кіру</Link>
        </p>
      </div>
    </div>
  )
}

function extractError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: unknown } }).response
    if (res?.data && typeof res.data === 'object') {
      const data = res.data as Record<string, unknown>
      const first = Object.values(data)[0]
      if (Array.isArray(first)) return first[0] as string
      if (typeof first === 'string') return first
    }
  }
  return 'Тіркелу кезінде қате орын алды'
}
