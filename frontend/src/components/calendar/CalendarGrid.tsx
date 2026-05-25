import { useQueryClient, useMutation } from '@tanstack/react-query'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import type { AppointmentRecord } from '../../api/records'
import { checkConflict, updateRecord } from '../../api/records'
import AppointmentCard from './AppointmentCard'
import styles from './CalendarGrid.module.css'

const HOUR_START = 8
const HOUR_END = 20
const SLOT_MINUTES = 30
const SLOTS_PER_DAY = ((HOUR_END - HOUR_START) * 60) / SLOT_MINUTES

function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - HOUR_START) * 60 + m) / SLOT_MINUTES
}

function slotToLabel(slot: number): string {
  const totalMin = HOUR_START * 60 + slot * SLOT_MINUTES
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0')
  const m = (totalMin % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function recordSpan(record: AppointmentRecord): { top: number; height: number } {
  if (!record.record_start) return { top: 0, height: 1 }
  const startSlot = timeToSlot(record.record_start)
  const endSlot = record.record_end ? timeToSlot(record.record_end) : startSlot + 2
  return { top: startSlot, height: Math.max(endSlot - startSlot, 1) }
}

interface Column {
  id: number
  label: string
  load: number
}

function DropSlot({ columnId, slot, date }: { columnId: number; slot: number; date: string }) {
  const id = `${date}__col${columnId}__slot${slot}`
  const { setNodeRef, isOver } = useDroppable({ id })
  return <div ref={setNodeRef} className={`${styles.slot} ${isOver ? styles.slotOver : ''}`} />
}

interface Props {
  records: AppointmentRecord[]
  columns: Column[]
  groupBy: 'doctor' | 'chair'
  date: string
  queryKey: unknown[]
  onSlotClick: (columnId: number, date: string, time: string) => void
}

export default function CalendarGrid({ records, columns, groupBy, date, queryKey, onSlotClick }: Props) {
  const qc = useQueryClient()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const moveMutation = useMutation({
    mutationFn: async (args: {
      id: number; doctor: number; date: string; record_start: string; record_end: string
    }) => {
      const { conflict } = await checkConflict({
        doctor: args.doctor,
        date: args.date,
        record_start: args.record_start,
        record_end: args.record_end,
        exclude_id: args.id,
      })
      if (conflict) throw new Error('Конфликт: врач уже занят в это время')
      return updateRecord(args.id, {
        reception_day: args.date,
        record_start: args.record_start,
        record_end: args.record_end,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (err: Error) => alert(err.message),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const record = (active.data.current as { record: AppointmentRecord }).record
    const parts = (over.id as string).split('__')
    const dropDate = parts[0]
    const slot = parseInt(parts[2].replace('slot', ''), 10)
    const colId = parseInt(parts[1].replace('col', ''), 10)

    const newStart = slotToLabel(slot)
    const duration =
      record.record_start && record.record_end
        ? Math.max(timeToSlot(record.record_end) - timeToSlot(record.record_start), 1)
        : 2
    const newEnd = slotToLabel(slot + duration)
    const doctor = groupBy === 'doctor' ? colId : record.doctor

    moveMutation.mutate({ id: record.id, doctor, date: dropDate, record_start: newStart, record_end: newEnd })
  }

  const SLOT_HEIGHT_PX = 30
  const gridHeight = SLOTS_PER_DAY * SLOT_HEIGHT_PX

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={styles.wrapper}>
        <div className={styles.grid} style={{ '--col-count': columns.length } as React.CSSProperties}>

          {/* Column headers */}
          <div className={styles.cornerCell} />
          {columns.map(col => (
            <div key={col.id} className={styles.colHeader}>
              <span className={styles.colName}>{col.label}</span>
              {col.load > 0 && <span className={styles.colLoad}>{col.load} зап.</span>}
            </div>
          ))}

          {/* Time axis + cells */}
          <div className={styles.timeAxis} style={{ height: gridHeight }}>
            {Array.from({ length: SLOTS_PER_DAY }, (_, i) => (
              <div key={i} className={styles.timeLabel} style={{ height: SLOT_HEIGHT_PX }}>
                {i % 2 === 0 ? slotToLabel(i) : ''}
              </div>
            ))}
          </div>

          {columns.map(col => {
            const colRecords = records.filter(r => {
              const match = groupBy === 'doctor' ? r.doctor === col.id : r.chair === col.id
              return match && r.reception_day === date
            })

            return (
              <div key={col.id} className={styles.column} style={{ height: gridHeight }}>
                {/* Drop slots */}
                {Array.from({ length: SLOTS_PER_DAY }, (_, i) => (
                  <div
                    key={i}
                    className={styles.slotRow}
                    style={{ height: SLOT_HEIGHT_PX, top: i * SLOT_HEIGHT_PX }}
                    onClick={() => onSlotClick(col.id, date, slotToLabel(i))}
                  >
                    <DropSlot columnId={col.id} slot={i} date={date} />
                  </div>
                ))}

                {/* Appointment cards */}
                {colRecords.map(r => {
                  const { top, height } = recordSpan(r)
                  return (
                    <div
                      key={r.id}
                      className={styles.cardWrapper}
                      style={{
                        top: top * SLOT_HEIGHT_PX,
                        height: height * SLOT_HEIGHT_PX,
                      }}
                    >
                      <AppointmentCard record={r} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </DndContext>
  )
}
