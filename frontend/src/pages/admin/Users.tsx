import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStaffUsers, createStaffUser, deactivateStaffUser, setStaffPassword,
  type StaffUser, type CreateUserPayload,
} from '../../api/adminUsers'
import styles from './Users.module.css'

const ROLE_LABELS: Record<string, string> = { admin: 'Администратор', doctor: 'Врач' }

const EMPTY_FORM: CreateUserPayload = {
  username: '', first_name: '', last_name: '', father_name: '',
  email: '', mobile_phone: '', role: 'doctor', password: '',
}

export default function Users() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateUserPayload>(EMPTY_FORM)
  const [pwdUserId, setPwdUserId] = useState<number | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [error, setError] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: getStaffUsers,
  })

  const createMut = useMutation({
    mutationFn: createStaffUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-users'] })
      setShowForm(false)
      setForm(EMPTY_FORM)
      setError('')
    },
    onError: (e: unknown) => setError(String(e)),
  })

  const deactivateMut = useMutation({
    mutationFn: deactivateStaffUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-users'] }),
  })

  const pwdMut = useMutation({
    mutationFn: ({ id, pwd }: { id: number; pwd: string }) => setStaffPassword(id, pwd),
    onSuccess: () => { setPwdUserId(null); setNewPwd('') },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    createMut.mutate(form)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Сотрудники</h1>
        <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>+ Добавить</button>
      </div>

      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>Новый сотрудник</h2>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.formRow}>
                <label>Логин *</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div className={styles.formRow}>
                <label>Фамилия</label>
                <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div className={styles.formRow}>
                <label>Имя</label>
                <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className={styles.formRow}>
                <label>Отчество</label>
                <input value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
              </div>
              <div className={styles.formRow}>
                <label>Телефон</label>
                <input value={form.mobile_phone} onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })} />
              </div>
              <div className={styles.formRow}>
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className={styles.formRow}>
                <label>Роль</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'doctor' })}>
                  <option value="doctor">Врач</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label>Пароль *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary} disabled={createMut.isPending}>
                  {createMut.isPending ? 'Создание...' : 'Создать'}
                </button>
                <button type="button" className={styles.btnSecondary} onClick={() => { setShowForm(false); setError('') }}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pwdUserId !== null && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>Сменить пароль</h2>
            <div className={styles.formRow}>
              <label>Новый пароль (мин. 8 символов)</label>
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} minLength={8} />
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.btnPrimary}
                disabled={newPwd.length < 8 || pwdMut.isPending}
                onClick={() => pwdMut.mutate({ id: pwdUserId, pwd: newPwd })}
              >
                {pwdMut.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button className={styles.btnSecondary} onClick={() => { setPwdUserId(null); setNewPwd('') }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className={styles.loading}>Загрузка...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ФИО</th><th>Логин</th><th>Телефон</th><th>Роль</th><th>Статус</th><th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: StaffUser) => (
              <tr key={u.id} className={!u.is_active ? styles.inactive : ''}>
                <td>{[u.last_name, u.first_name, u.father_name].filter(Boolean).join(' ') || '—'}</td>
                <td>{u.username}</td>
                <td>{u.mobile_phone || '—'}</td>
                <td>{ROLE_LABELS[u.role] ?? u.role}</td>
                <td>{u.is_active ? 'Активен' : 'Деактивирован'}</td>
                <td className={styles.actions}>
                  <button className={styles.btnLink} onClick={() => { setPwdUserId(u.id); setNewPwd('') }}>
                    Пароль
                  </button>
                  {u.is_active && (
                    <button
                      className={`${styles.btnLink} ${styles.danger}`}
                      onClick={() => { if (confirm(`Деактивировать ${u.username}?`)) deactivateMut.mutate(u.id) }}
                    >
                      Деактивировать
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
