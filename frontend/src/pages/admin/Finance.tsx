import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getPayments,
  getPaymentSummary,
  PAYMENT_TYPE_LABELS,
} from '../../api/payments'
import styles from './Finance.module.css'

function today() {
  return new Date().toISOString().split('T')[0]
}

function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Finance() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth())
  const [dateTo, setDateTo] = useState(today())

  const { data: summary } = useQuery({
    queryKey: ['payment-summary', dateFrom, dateTo],
    queryFn: () => getPaymentSummary({ date_from: dateFrom, date_to: dateTo }),
  })

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', dateFrom, dateTo],
    queryFn: () => getPayments({ date_from: dateFrom, date_to: dateTo }),
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Финансы</h1>
      </div>

      <div className={styles.filters}>
        <label className={styles.filterLabel}>
          С
          <input
            type="date"
            className={styles.dateInput}
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </label>
        <label className={styles.filterLabel}>
          По
          <input
            type="date"
            className={styles.dateInput}
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </label>
      </div>

      {summary && (
        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Итого за период</span>
            <span className={styles.summaryValue}>{Number(summary.total).toLocaleString()} ₸</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Платежей</span>
            <span className={styles.summaryValue}>{summary.count}</span>
          </div>
          {summary.by_type.map(t => (
            <div key={t.payment_type} className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{PAYMENT_TYPE_LABELS[t.payment_type] ?? t.payment_type}</span>
              <span className={styles.summaryValue}>{Number(t.amount).toLocaleString()} ₸</span>
              <span className={styles.summaryCount}>{t.count} платеж.</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}>Загрузка...</div>
        ) : payments.length === 0 ? (
          <div className={styles.empty}>Платежей за выбранный период нет</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Запись №</th>
                <th>Тип</th>
                <th>Сумма</th>
                <th>Принял</th>
                <th>Заметки</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.paid_at).toLocaleDateString('ru-RU')}</td>
                  <td>#{p.record}</td>
                  <td>{PAYMENT_TYPE_LABELS[p.payment_type] ?? p.payment_type}</td>
                  <td className={styles.amount}>{Number(p.amount).toLocaleString()} ₸</td>
                  <td>{p.received_by_name || '—'}</td>
                  <td>{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
