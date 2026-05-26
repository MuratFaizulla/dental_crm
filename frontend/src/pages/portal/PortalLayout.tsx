import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import styles from './PortalLayout.module.css'

const NAV_ITEMS = [
  { to: '/portal/profile',      label: 'Профиль' },
  { to: '/portal/family',       label: 'Отбасы' },
  { to: '/portal/appointments', label: 'Визиттер' },
  { to: '/portal/files',        label: 'Файлдар' },
  { to: '/portal/plan',         label: 'Ем жоспары' },
]

export default function PortalLayout() {
  const navigate = useNavigate()
  const { fullName, username, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Dental CRM</div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.footer}>
          <p className={styles.userInfo}>{fullName || username || 'Пайдаланушы'}</p>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Шығу
          </button>
        </div>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
