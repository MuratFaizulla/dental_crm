import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTooth, addPlanItem } from '../../api/medical'
import type { ToothRecord } from '../../api/medical'
import styles from './ToothSidebar.module.css'

const STATUS_OPTIONS = [
  { value: 'healthy', label: 'Здоров' },
  { value: 'treated', label: 'Пролечен' },
  { value: 'urgent', label: 'Срочно' },
  { value: 'observation', label: 'Наблюдение' },
  { value: 'missing', label: 'Отсутствует' },
]

const STATUS_COLORS: Record<string, string> = {
  healthy: '#52c41a',
  treated: '#1677ff',
  urgent: '#ff4d4f',
  observation: '#faad14',
  missing: '#d9d9d9',
}

interface Props {
  clientId: number
  toothNumber: string
  record: ToothRecord | undefined
  onClose: () => void
  onSaved: () => void
}

export default function ToothSidebar({ clientId, toothNumber, record, onSaved }: Props) {
  const [statusVal, setStatusVal] = useState<ToothRecord['status']>(record?.status ?? 'healthy')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')

  const qc = useQueryClient()

  const saveTooth = useMutation({
    mutationFn: () => updateTooth(clientId, toothNumber, {
      status: statusVal as ToothRecord['status'],
      notes,
    }),
    onSuccess: onSaved,
  })

  const addPlan = useMutation({
    mutationFn: () => addPlanItem(clientId, {
      tooth_number: toothNumber,
      diagnosis,
      treatment,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', clientId] })
      setShowPlanForm(false)
      setDiagnosis('')
      setTreatment('')
    },
  })

  return (
    <div className={styles.sidebar}>
      <p className={styles.title}>Зуб №{toothNumber}</p>

      <div>
        <span
          className={styles.badge}
          style={{ background: STATUS_COLORS[statusVal] ?? '#d9d9d9' }}
        >
          {STATUS_OPTIONS.find(o => o.value === statusVal)?.label ?? statusVal}
        </span>
      </div>

      <div>
        <p className={styles.label}>Изменить статус</p>
        <select
          className={styles.select}
          value={statusVal}
          onChange={e => setStatusVal(e.target.value as ToothRecord['status'])}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className={styles.label}>Комментарий</p>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveBtn}
          disabled={saveTooth.isPending}
          onClick={() => saveTooth.mutate()}
        >
          {saveTooth.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          className={styles.planBtn}
          onClick={() => setShowPlanForm(v => !v)}
        >
          Добавить в план лечения
        </button>
      </div>

      {showPlanForm && (
        <div className={styles.planForm}>
          <div>
            <p className={styles.label}>Диагноз</p>
            <input
              className={styles.input}
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
            />
          </div>
          <div>
            <p className={styles.label}>Рекомендуемое лечение</p>
            <input
              className={styles.input}
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
            />
          </div>
          <button
            className={styles.addBtn}
            disabled={!diagnosis || !treatment || addPlan.isPending}
            onClick={() => addPlan.mutate()}
          >
            {addPlan.isPending ? 'Добавление...' : 'Добавить в план'}
          </button>
        </div>
      )}
    </div>
  )
}
