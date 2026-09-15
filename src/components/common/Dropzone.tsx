import { useCallback, useId, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { ImagePlus, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/cn'

const ACCEPT = 'image/png,image/jpeg,image/webp'

interface DropzoneProps {
  onFile: (file: File) => void
  /** Compact renders as a small inline control instead of the full empty-state hero. */
  compact?: boolean
  className?: string
}

export function Dropzone({ onFile, compact, className }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  if (compact) {
    return (
      <label
        htmlFor={inputId}
        title="Replace image"
        className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-panel-raised px-2.5 py-2 text-xs font-medium text-ink-muted hover:text-ink hover:border-accent/60 transition-colors sm:px-3',
          className,
        )}
      >
        <UploadCloud size={14} />
        {/* Icon-only on phones — the label comes back once there's room. */}
        <span className="hidden sm:inline">Replace image</span>
        <span className="sr-only sm:hidden">Replace image</span>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ''
          }}
        />
      </label>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-150 sm:min-h-[280px] sm:p-8',
        isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-panel-raised">
        <ImagePlus size={22} className="text-accent" />
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-ink">Drop an image here</p>
        <p className="mt-1 text-xs text-ink-muted">PNG, JPEG, or WebP · stays on this device</p>
      </div>
      <label
        htmlFor={inputId}
        className="mt-1 cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white hover:bg-accent-strong transition-colors"
      >
        Browse files
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
