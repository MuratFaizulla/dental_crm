import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { forgotPassword } from '../api/profile'
import styles from './Login.module.css'

type Step = 'username' | 'sent'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(username)
      setStep('sent')
    } catch {
      setError('Мұндай логин табылмады.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'sent') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>SMS жіберілді</h1>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>
            {username} логинімен тіркелген нөмірге код жіберілді.
          </p>
          <button
            className={styles.btn}
            onClick={() => navigate(`/reset-password?username=${encodeURIComponent(username)}`)}
          >
            Кодты енгізу
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Құпиясөзді ұмыттыңыз ба?</h1>
        <p style={{ fontSize: 13, color: '#777', marginBottom: 20 }}>
          Логиніңізді енгізіңіз — SMS код жіберіледі.
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Логин</label>
            <input
              className={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Жіберілуде...' : 'Код жіберу'}
          </button>
        </form>
        <p className={styles.registerLink}>
          <Link to="/login">← Кіру</Link>
        </p>
      </div>
    </div>
  )
}
