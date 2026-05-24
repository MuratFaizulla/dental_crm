import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTeeth, ToothRecord } from '../../api/medical'
import ToothSidebar from './ToothSidebar'
import styles from './ToothFormula.module.css'

type TeethType = 'permanent' | 'primary'

const ADULT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const ADULT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const PRIMARY_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const PRIMARY_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

const STATUS_COLORS: Record<string, string> = {
  healthy: '#52c41a',
  treated: '#1677ff',
  urgent: '#ff4d4f',
  observation: '#faad14',
  missing: '#d9d9d9',
}

const STATUS_LABELS: Record<string, string> = {
  healthy: 'Здоров',
  treated: 'Пролечен',
  urgent: 'Срочно',
  observation: 'Наблюдение',
  missing: 'Отсутствует',
}

const TW = 32
const TH = 40
const GAP = 4
const MID_GAP = 14
const ROW_GAP = 20
const LABEL_H = 18

function buildRow(
  teeth: number[],
  y: number,
  statusMap: Map<string, string>,
  onClick: (n: string) => void,
) {
  const mid = teeth.length / 2
  return teeth.map((num, i) => {
    const x = i < mid ? i * (TW + GAP) : i * (TW + GAP) + MID_GAP
    const tooth = String(num)
    const color = STATUS_COLORS[statusMap.get(tooth) ?? 'healthy']
    return (
      <g key={num} transform={`translate(${x},${y})`} onClick={() => onClick(tooth)} style={{ cursor: 'pointer' }}>
        <rect width={TW} height={TH} rx={5} fill={color} stroke="#fff" strokeWidth={1.5} />
        <text
          x={TW / 2} y={TH / 2 + 4}
          textAnchor="middle" fontSize={10} fill="#fff" fontWeight="600"
          style={{ userSelect: 'none' }}
        >
          {num}
        </text>
      </g>
    )
  })
}

interface Props {
  clientId: number
}

export default function ToothFormula({ clientId }: Props) {
  const qc = useQueryClient()
  const [teethType, setTeethType] = useState<TeethType>('permanent')
  const [selected, setSelected] = useState<string | null>(null)

  const { data: teeth = [] } = useQuery({
    queryKey: ['teeth', clientId],
    queryFn: () => getTeeth(clientId),
  })

  const statusMap = new Map<string, string>(teeth.map(t => [t.tooth_number, t.status]))
  const recordMap = new Map<string, ToothRecord>(teeth.map(t => [t.tooth_number, t]))

  const upper = teethType === 'permanent' ? ADULT_UPPER : PRIMARY_UPPER
  const lower = teethType === 'permanent' ? ADULT_LOWER : PRIMARY_LOWER
  const halfCount = upper.length / 2
  const svgWidth = upper.length * (TW + GAP) + MID_GAP + TW
  const upperY = LABEL_H
  const lowerY = LABEL_H + TH + ROW_GAP

  return (
    <div className={styles.wrapper}>
      <div className={styles.switcher}>
        <button
          className={teethType === 'permanent' ? styles.switchBtnActive : styles.switchBtn}
          onClick={() => setTeethType('permanent')}
        >
          Взрослые зубы
        </button>
        <button
          className={teethType === 'primary' ? styles.switchBtnActive : styles.switchBtn}
          onClick={() => setTeethType('primary')}
        >
          Молочные зубы
        </button>
      </div>

      <div className={styles.svgWrap}>
        <svg width={svgWidth} height={lowerY + TH + LABEL_H} style={{ display: 'block' }}>
          <text
            x={halfCount * (TW + GAP) - 2} y={LABEL_H - 4}
            textAnchor="end" fontSize={10} fill="#aaa"
          >
            ↑ Верхняя
          </text>
          {buildRow(upper, upperY, statusMap, setSelected)}
          {buildRow(lower, lowerY, statusMap, setSelected)}
          <text
            x={halfCount * (TW + GAP) - 2} y={lowerY + TH + LABEL_H - 2}
            textAnchor="end" fontSize={10} fill="#aaa"
          >
            ↓ Нижняя
          </text>
        </svg>
      </div>

      <div className={styles.legend}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: STATUS_COLORS[key] }} />
            {label}
          </div>
        ))}
      </div>

      {selected && (
        <>
          <div className={styles.overlay} onClick={() => setSelected(null)} />
          <ToothSidebar
            clientId={clientId}
            toothNumber={selected}
            record={recordMap.get(selected)}
            onClose={() => setSelected(null)}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['teeth', clientId] })
              setSelected(null)
            }}
          />
        </>
      )}
    </div>
  )
}
