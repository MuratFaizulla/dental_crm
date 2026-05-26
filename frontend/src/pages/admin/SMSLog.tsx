import { useQuery } from '@tanstack/react-query'
import { getSMSLog, type SMSLogEntry } from '../../api/notifications'
import styles from './SMSLog.module.css'

const STATUS_CLASS: Record<string, string> = {
  sent: styles.statusSent,
  delivered: styles.statusDelivered,
  error: styles.statusError,
  pending: styles.statusPending,
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function SMSLog() {
  const { data: logs = [], isLoading } = useQuery<SMSLogEntry[]>({
    queryKey: ['sms-log'],
    queryFn: getSMSLog,
    refetchInterval: 30_000,
  })

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>SMS-уведомления</h1>
      <p className={styles.hint}>
        Автоматические напоминания отправляются за 24 ч и за 2 ч до приёма.
      </p>

      {isLoading ? (
        <p className={styles.loading}>Загрузка...</p>
      ) : logs.length === 0 ? (
        <p className={styles.empty}>Отправок пока нет.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Телефон</th>
              <th>Тип</th>
              <th>Статус</th>
              <th>Отправлено</th>
              <th>Создано</th>
              <th>Сообщение</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.phone}</td>
                <td>{log.sms_type_display}</td>
                <td>
                  <span className={`${styles.badge} ${STATUS_CLASS[log.status] ?? ''}`}>
                    {log.status_display}
                  </span>
                </td>
                <td>{fmt(log.sent_at)}</td>
                <td>{fmt(log.created_at)}</td>
                <td className={styles.msgCell}>{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
