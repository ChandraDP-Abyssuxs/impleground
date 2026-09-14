import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-strong disabled:hover:bg-accent shadow-[0_1px_0_0_rgba(0,0,0,0.15)]',
  secondary: 'bg-panel-raised text-ink border border-border hover:border-accent/60',
  ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-panel-raised',
  danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-md',
  md: 'text-sm px-3.5 py-2 gap-2 rounded-lg',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
