import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access, refresh } = await login(username, password)
      setTokens(access, refresh)
      navigate('/admin/schedule')
    } catch {
      setError('Логин немесе құпиясөз қате')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Dental CRM</h1>
        <p className={styles.subtitle}>Жүйеге кіру</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Логин</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Құпиясөз</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Кіру...' : 'Кіру'}
          </button>
        </form>
        <p className={styles.registerLink}>
          Аккаунт жоқ па? <Link to="/register">Тіркелу</Link>
        </p>
      </div>
    </div>
  )
}
