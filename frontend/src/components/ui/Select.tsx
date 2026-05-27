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
  icon?: React.ReactNode
  className?: string
}

const PersonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Выбрать...',
  label,
  disabled,
  id,
  size = 'md',
  icon,
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

  const wrapperCls = [styles.wrapper, size !== 'md' ? styles[size] : '', className].filter(Boolean).join(' ')
  const triggerCls = [styles.trigger, open ? styles.triggerOpen : ''].filter(Boolean).join(' ')
  const arrowCls   = [styles.arrow,   open ? styles.arrowOpen  : ''].filter(Boolean).join(' ')
  const dropdownCls = [styles.dropdown, open ? styles.dropdownOpen : ''].filter(Boolean).join(' ')

  const showIcon = icon !== undefined ? icon : <PersonIcon />

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
        <span className={styles.icon}>{showIcon}</span>

        <span className={[styles.triggerValue, !selected ? styles.placeholder : ''].filter(Boolean).join(' ')}>
          {selected ? selected.label : placeholder}
        </span>

        <span className={arrowCls} aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 4.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <div className={dropdownCls} role="listbox">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value)
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSel}
                className={[styles.option, isSel ? styles.optionSelected : ''].filter(Boolean).join(' ')}
                onMouseDown={() => handleSelect(opt)}
              >
                {opt.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
