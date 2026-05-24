import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlan, updatePlanItem, deletePlanItem } from '../../api/medical'
import type { TreatmentPlanItem } from '../../api/medical'
import styles from './TreatmentPlan.module.css'

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'done', label: 'Завершено' },
  { value: 'postponed', label: 'Отложено' },
]

interface Props {
  clientId: number
}

export default function TreatmentPlan({ clientId }: Props) {
  const qc = useQueryClient()

  const { data: plan = [] } = useQuery({
    queryKey: ['plan', clientId],
    queryFn: () => getPlan(clientId),
  })

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TreatmentPlanItem> }) =>
      updatePlanItem(clientId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', clientId] })
      qc.invalidateQueries({ queryKey: ['teeth', clientId] })
    },
  })

  const deleteItem = useMutation({
    mutationFn: (id: number) => deletePlanItem(clientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', clientId] }),
  })

  return (
    <div className={styles.section}>
      <p className={styles.title}>План лечения</p>

      {plan.length === 0 && (
        <p className={styles.empty}>
          Пункты плана отсутствуют. Кликните на зуб, чтобы добавить.
        </p>
      )}

      <div className={styles.list}>
        {plan.map(item => (
          <div key={item.id} className={styles.item}>
            <span className={styles.tooth}>Зуб {item.tooth_number}</span>

            <div className={styles.info}>
              <p className={styles.diagnosis}>{item.diagnosis}</p>
              <p className={styles.treatment}>{item.treatment}</p>
            </div>

            {item.due_date && (
              <span className={styles.due}>до {item.due_date}</span>
            )}

            <select
              className={styles.statusSelect}
              value={item.status}
              onChange={e =>
                updateItem.mutate({
                  id: item.id,
                  data: { status: e.target.value as TreatmentPlanItem['status'] },
                })
              }
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {item.status === 'postponed' && (
              <input
                className={styles.postponeInput}
                placeholder="Причина"
                defaultValue={item.postpone_reason}
                onBlur={e =>
                  updateItem.mutate({
                    id: item.id,
                    data: { postpone_reason: e.target.value },
                  })
                }
              />
            )}

            <button
              className={styles.deleteBtn}
              onClick={() => deleteItem.mutate(item.id)}
              title="Удалить"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
