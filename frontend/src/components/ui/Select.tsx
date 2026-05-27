import { useState, useRef, useEffect } from 'react'
import styles from './Select.module.css'

export interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string | number
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  id?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Выбрать...',
  label,
  disabled,
  id,
  size = 'md',
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => String(o.value) === String(value))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (opt: SelectOption) => {
    onChange?.(String(opt.value))
    setOpen(false)
  }

  const wrapperCls = [styles.wrapper, styles[size], className].filter(Boolean).join(' ')
  const triggerCls = [styles.trigger, open ? styles.triggerOpen : ''].filter(Boolean).join(' ')
  const arrowCls = [styles.arrow, open ? styles.arrowOpen : ''].filter(Boolean).join(' ')

  return (
    <div ref={ref} className={wrapperCls} id={id}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        type="button"
        className={triggerCls}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={[styles.triggerValue, !selected ? styles.placeholder : ''].filter(Boolean).join(' ')}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={arrowCls} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          {options.map((opt, i) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <div key={opt.value}>
                {i > 0 && <div className={styles.divider} />}
                <div
                  role="option"
                  aria-selected={isSelected}
                  className={[styles.option, isSelected ? styles.optionSelected : ''].filter(Boolean).join(' ')}
                  onMouseDown={() => handleSelect(opt)}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className={styles.checkIcon} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
