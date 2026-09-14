import { cn } from '@/lib/cn'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  disabled?: boolean
  onChange: (value: number) => void
  helpText?: string
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  disabled,
  onChange,
  helpText,
}: SliderProps) {
  return (
    <label className={cn('block', disabled && 'opacity-40')}>
      <span className="flex items-baseline justify-between text-xs font-medium text-ink-muted mb-1.5">
        <span>{label}</span>
        <span className="font-mono text-[11px] text-ink tabular-nums">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {helpText && <span className="block text-[11px] text-ink-muted mt-1">{helpText}</span>}
    </label>
  )
}
