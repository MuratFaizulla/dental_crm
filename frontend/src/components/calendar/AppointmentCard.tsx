import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import type { AppointmentRecord } from '../../api/records'
import styles from './AppointmentCard.module.css'

interface Props {
  record: AppointmentRecord
}

export default function AppointmentCard({ record }: Props) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
    data: { record },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 100 }
    : undefined

  function handleClick(e: React.MouseEvent) {
    if (isDragging) return
    e.stopPropagation()
    navigate(`/admin/patients/${record.client}`)
  }

  const timeLabel = record.record_start
    ? `${record.record_start.slice(0, 5)}${record.record_end ? '–' + record.record_end.slice(0, 5) : ''}`
    : ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${styles.card} ${statusClass(record.status_title)} ${isDragging ? styles.dragging : ''}`}
      onClick={handleClick}
    >
      {timeLabel && <span className={styles.time}>{timeLabel}</span>}
      <span className={styles.name}>
        {record.client_last_name} {record.client_first_name}
      </span>
      <span className={styles.doctor}>{record.doctor_name}</span>
    </div>
  )
}

function statusClass(title: string): string {
  switch (title) {
    case 'Ожидает':   return styles.waiting
    case 'На приёме': return styles.active
    case 'Завершён':  return styles.done
    case 'Отменён':   return styles.canceled
    default:          return ''
  }
}
