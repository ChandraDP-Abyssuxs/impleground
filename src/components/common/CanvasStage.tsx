import type { ReactNode } from 'react'
import { Dropzone } from '@/components/common/Dropzone'
import { ProgressBar } from '@/components/common/ProgressBar'
import { Spinner } from '@/components/common/Spinner'
import { cn } from '@/lib/cn'

interface CanvasStageProps {
  hasImage: boolean
  onFile: (file: File) => void
  isProcessing?: boolean
  progressPercent?: number
  progressLabel?: string
  children: ReactNode
  className?: string
}

export function CanvasStage({
  hasImage,
  onFile,
  isProcessing,
  progressPercent,
  progressLabel,
  children,
  className,
}: CanvasStageProps) {
  if (!hasImage) {
    return (
      <div
        className={cn(
          'checker-bg flex h-full min-h-[240px] items-center justify-center rounded-xl p-4 sm:min-h-[420px]',
          className,
        )}
      >
        <div className="w-full max-w-sm rounded-xl bg-panel/95 p-1 backdrop-blur-sm">
          <Dropzone onFile={onFile} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'checker-bg relative flex h-full min-h-[240px] items-center justify-center overflow-auto rounded-xl p-4 sm:min-h-[420px]',
        className,
      )}
    >
      {children}

      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-canvas/80 backdrop-blur-sm">
          <Spinner size={26} />
          <div className="w-64">
            <ProgressBar percent={progressPercent} label={progressLabel ?? 'Processing'} />
          </div>
        </div>
      )}
    </div>
  )
}
