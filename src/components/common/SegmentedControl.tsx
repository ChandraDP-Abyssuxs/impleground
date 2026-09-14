import { cn } from '@/lib/cn'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  label?: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  columns?: 2 | 3 | 4
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  columns = options.length as 2 | 3 | 4,
}: SegmentedControlProps<T>) {
  return (
    <div className={disabled ? 'opacity-40' : undefined}>
      {label && <span className="block text-xs font-medium text-ink-muted mb-1.5">{label}</span>}
      <div
        className="grid gap-1 rounded-lg border border-border bg-canvas p-1"
        style={{ gridTemplateColumns: `repeat(${Math.min(columns, options.length)}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150 truncate',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
              value === opt.value
                ? 'bg-accent text-white shadow-[0_1px_0_0_rgba(0,0,0,0.15)]'
                : 'text-ink-muted hover:text-ink hover:bg-panel-raised',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
