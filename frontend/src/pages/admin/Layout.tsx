import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Дашборд' },
  { to: '/admin/schedule', label: 'Расписание' },
  { to: '/admin/patients', label: 'Пациенты' },
  { to: '/admin/finance', label: 'Финансы' },
  { to: '/admin/debts', label: 'Должники' },
]

const ADMIN_ONLY_ITEMS = [
  { to: '/admin/users', label: 'Сотрудники' },
  { to: '/admin/analytics', label: 'Аналитика' },
  { to: '/admin/sms-log', label: 'SMS' },
  { to: '/admin/settings', label: 'Настройки' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { fullName, email, logout, role } = useAuthStore()
  const isAdmin = role === 'admin'

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
          {isAdmin && (
            <>
              <div className={styles.navDivider} />
              {ADMIN_ONLY_ITEMS.map((item) => (
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
            </>
          )}
        </nav>
        <div className={styles.footer}>
          <p className={styles.userInfo}>{fullName || email || 'Пользователь'}</p>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
