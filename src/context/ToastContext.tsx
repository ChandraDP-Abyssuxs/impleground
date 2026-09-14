import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Toast, ToastVariant } from '@/types'

interface ToastContextValue {
  toasts: Toast[]
  pushToast: (variant: ToastVariant, message: string) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 4200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (variant: ToastVariant, message: string) => {
      counter.current += 1
      const id = `toast-${Date.now()}-${counter.current}`
      setToasts((prev) => [...prev, { id, variant, message }])
      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ toasts, pushToast, dismissToast }), [toasts, pushToast, dismissToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
