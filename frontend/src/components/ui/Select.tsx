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
  className?: string
}

export default function Select({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled,
  id,
  className = '',
}: SelectProps) {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <div className={styles.wrap}>
        <select
          id={id}
          className={styles.select}
          value={value ?? ''}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className={styles.arrow} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </div>
  )
}
