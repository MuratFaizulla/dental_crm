import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProfile } from '../../api/profile'
import styles from './Profile.module.css'

const GENDER_LABELS: Record<string, string> = { M: 'Ер', F: 'Әйел' }
const LANG_LABELS: Record<string, string> = { kk: 'Қазақша', ru: 'Русский', en: 'English' }

function Initials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const text = `${lastName.charAt(0)}${firstName.charAt(0)}`.toUpperCase() || '?'
  return <div className={styles.avatar}>{text}</div>
}

export default function Profile() {
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  if (isLoading) return <div className={styles.loading}>Жүктелуде...</div>
  if (!profile) return null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {profile.avatar
          ? <img src={profile.avatar} alt="avatar" className={styles.avatarImg} />
          : <Initials firstName={profile.first_name} lastName={profile.last_name} />
        }
        <div>
          <h1 className={styles.name}>
            {[profile.last_name, profile.first_name, profile.father_name].filter(Boolean).join(' ') || profile.username}
          </h1>
          <p className={styles.username}>@{profile.username}</p>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Жеке деректер</h2>
        <dl className={styles.grid}>
          <dt>ЖСН</dt>         <dd>{profile.iin || '—'}</dd>
          <dt>Туған күні</dt>  <dd>{profile.date_of_birth || '—'}</dd>
          <dt>Жынысы</dt>      <dd>{profile.gender ? GENDER_LABELS[profile.gender] : '—'}</dd>
          <dt>Облыс</dt>       <dd>{profile.oblast || '—'}</dd>
          <dt>Мекенжай</dt>    <dd>{profile.address || '—'}</dd>
          <dt>Тіл</dt>         <dd>{LANG_LABELS[profile.language] || profile.language}</dd>
        </dl>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Контактілер</h2>
        <dl className={styles.grid}>
          <dt>Мобильді телефон</dt> <dd>{profile.mobile_phone || '—'}</dd>
          <dt>Email</dt>            <dd>{profile.email || '—'}</dd>
        </dl>
      </div>

      <div className={styles.actions}>
        <Link to="/portal/profile/edit" className={styles.btn}>Профильді редакциялау</Link>
        <Link to="/portal/profile/password" className={styles.btnSecondary}>Құпиясөзді өзгерту</Link>
      </div>
    </div>
  )
}
