import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  getReport,
  downloadReportXlsx,
  type ReportType,
} from '../../api/reports'
import styles from './Analytics.module.css'

function today() {
  return new Date().toISOString().split('T')[0]
}
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

interface ReportMeta {
  label: string
  hasDates: boolean
  chartKey: 'revenue' | 'records'
  columns: { key: 'name' | 'revenue' | 'records'; label: string }[]
}

const REPORTS: Record<ReportType, ReportMeta> = {
  revenue_by_doctor: {
    label: 'Выручка по врачу',
    hasDates: true,
    chartKey: 'revenue',
    columns: [
      { key: 'name', label: 'Врач' },
      { key: 'revenue', label: 'Выручка (₸)' },
      { key: 'records', label: 'Платежей' },
    ],
  },
  revenue_by_service: {
    label: 'Выручка по услуге',
    hasDates: true,
    chartKey: 'revenue',
    columns: [
      { key: 'name', label: 'Услуга' },
      { key: 'revenue', label: 'Выручка (₸)' },
      { key: 'records', label: 'Платежей' },
    ],
  },
  chair_load: {
    label: 'Загрузка кабинетов',
    hasDates: true,
    chartKey: 'records',
    columns: [
      { key: 'name', label: 'Кабинет' },
      { key: 'records', label: 'Записей' },
    ],
  },
  new_vs_returning: {
    label: 'Новые vs повторные',
    hasDates: true,
    chartKey: 'records',
    columns: [
      { key: 'name', label: 'Тип' },
      { key: 'records', label: 'Количество' },
    ],
  },
  top_ltv: {
    label: 'Топ-20 LTV',
    hasDates: false,
    chartKey: 'revenue',
    columns: [
      { key: 'name', label: 'Пациент' },
      { key: 'revenue', label: 'LTV (₸)' },
      { key: 'records', label: 'Визитов' },
    ],
  },
  debts: {
    label: 'Долги',
    hasDates: false,
    chartKey: 'revenue',
    columns: [
      { key: 'name', label: 'Пациент' },
      { key: 'revenue', label: 'Долг (₸)' },
      { key: 'records', label: 'Запись №' },
    ],
  },
  campaigns: {
    label: 'SMS-кампании',
    hasDates: true,
    chartKey: 'revenue',
    columns: [
      { key: 'name', label: 'Тип' },
      { key: 'revenue', label: 'Отправлено' },
      { key: 'records', label: 'Всего' },
    ],
  },
}

const CHART_COLORS = ['#4f7fff', '#43c6ac', '#f7971e', '#f953c6', '#b91d73', '#a8e063', '#56ccf2']

export default function Analytics() {
  const [reportType, setReportType] = useState<ReportType>('revenue_by_doctor')
  const [dateFrom, setDateFrom] = useState(firstOfMonth())
  const [dateTo, setDateTo] = useState(today())
  const [downloading, setDownloading] = useState(false)

  const meta = REPORTS[reportType]
  const params = meta.hasDates ? { date_from: dateFrom, date_to: dateTo } : {}

  const { data = [], isLoading } = useQuery({
    queryKey: ['report', reportType, dateFrom, dateTo],
    queryFn: () => getReport(reportType, params),
  })

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadReportXlsx(reportType, params)
    } catch {
      alert('Ошибка при скачивании файла')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Аналитика</h1>
        <button
          className={styles.xlsxBtn}
          onClick={handleDownload}
          disabled={downloading || isLoading}
        >
          {downloading ? 'Экспорт...' : 'Скачать XLSX'}
        </button>
      </div>

      <div className={styles.controls}>
        <select
          className={styles.select}
          value={reportType}
          onChange={e => setReportType(e.target.value as ReportType)}
        >
          {(Object.entries(REPORTS) as [ReportType, ReportMeta][]).map(([key, m]) => (
            <option key={key} value={key}>{m.label}</option>
          ))}
        </select>

        {meta.hasDates && (
          <>
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
          </>
        )}
      </div>

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : data.length === 0 ? (
        <div className={styles.empty}>Нет данных за выбранный период</div>
      ) : (
        <>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} width={70} />
                <Tooltip
                  formatter={(value: number) =>
                    meta.chartKey === 'revenue'
                      ? `${value.toLocaleString()} ₸`
                      : value.toString()
                  }
                />
                <Bar dataKey={meta.chartKey} radius={[4, 4, 0, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {meta.columns.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {meta.columns.map(col => (
                      <td key={col.key} className={col.key === 'revenue' ? styles.amount : undefined}>
                        {col.key === 'revenue'
                          ? `${Number(row[col.key]).toLocaleString()} ₸`
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
