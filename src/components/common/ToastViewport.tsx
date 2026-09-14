import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import type { Toast, ToastVariant } from '@/types'
import { cn } from '@/lib/cn'

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const ACCENTS: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-accent',
}

function ToastRow({ toast }: { toast: Toast }) {
  const { dismissToast } = useToast()
  const Icon = ICONS[toast.variant]
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2.5 rounded-lg border border-border bg-panel px-3.5 py-3 shadow-lg',
        'animate-[toast-in_220ms_ease-out]',
      )}
    >
      <Icon size={17} className={cn('mt-0.5 shrink-0', ACCENTS[toast.variant])} />
      <p className="flex-1 text-sm leading-snug text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-ink-muted hover:text-ink"
      >
        <X size={14} />
      </button>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

export function ToastViewport() {
  const { toasts } = useToast()
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
          <ToastRow toast={toast} />
        </div>
      ))}
    </div>
  )
}
