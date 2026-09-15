import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, RotateCcw, Wand2 } from 'lucide-react'
import { useImageContext } from '@/context/ImageContext'
import { useToast } from '@/context/ToastContext'
import { useRegisterExport } from '@/hooks/useRegisterExport'
import { PanelLayout } from '@/components/layout/PanelLayout'
import { CanvasStage } from '@/components/common/CanvasStage'
import { Button } from '@/components/common/Button'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { canvasToPngBlob } from '@/lib/download'
import { detectCapabilities } from '@/lib/browserSupport'
import type { ProcessingState } from '@/types'
import { IDLE_PROCESSING } from '@/types'

type Mode = 'background' | 'foreground'
type Quality = 'fast' | 'balanced' | 'best'

const MODEL_BY_QUALITY: Record<Quality, 'isnet_quint8' | 'isnet_fp16' | 'isnet'> = {
  fast: 'isnet_quint8',
  balanced: 'isnet_fp16',
  best: 'isnet',
}

export function MagicEraserTab() {
  const { sourceImage, loadFile } = useImageContext()
  const { pushToast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawnForRef = useRef<string | null>(null)
  const progressRef = useRef<Map<string, { current: number; total: number }>>(new Map())

  const [mode, setMode] = useState<Mode>('background')
  const [quality, setQuality] = useState<Quality>('balanced')
  const [state, setState] = useState<ProcessingState>(IDLE_PROCESSING)
  const [hasResult, setHasResult] = useState(false)

  const capabilities = useMemo(() => detectCapabilities(), [])

  const drawBitmapToCanvas = useCallback((bitmap: ImageBitmap) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    ctx?.drawImage(bitmap, 0, 0)
  }, [])

  useEffect(() => {
    if (!sourceImage || drawnForRef.current === sourceImage.id) return
    drawnForRef.current = sourceImage.id
    drawBitmapToCanvas(sourceImage.bitmap)
    setHasResult(false)
    setState(IDLE_PROCESSING)
    progressRef.current = new Map()
  }, [sourceImage, drawBitmapToCanvas])

  const runProcess = useCallback(async () => {
    if (!sourceImage) return
    progressRef.current = new Map()
    setState({ status: 'loading', progress: 0, stage: 'Starting up' })
    try {
      const { removeBackground, removeForeground } = await import('@imgly/background-removal')
      const run = mode === 'background' ? removeBackground : removeForeground
      const blob = await run(sourceImage.file, {
        model: MODEL_BY_QUALITY[quality],
        progress: (key, current, total) => {
          progressRef.current.set(key, { current, total })
          let sumCurrent = 0
          let sumTotal = 0
          progressRef.current.forEach(({ current: c, total: t }) => {
            sumCurrent += c
            sumTotal += t
          })
          const percent = sumTotal > 0 ? (sumCurrent / sumTotal) * 100 : 0
          setState({ status: 'loading', progress: percent, stage: key })
        },
      })
      const bitmap = await createImageBitmap(blob)
      drawBitmapToCanvas(bitmap)
      setHasResult(true)
      setState({ status: 'success', progress: 100 })
      pushToast('success', mode === 'background' ? 'Background removed.' : 'Subject removed.')
    } catch (err) {
      console.error('[ImPleGround] background removal failed:', err)
      const message = err instanceof Error ? err.message : 'Processing failed.'
      setState({ status: 'error', progress: 0, error: message })
      pushToast('error', `Couldn't process that image: ${message}`)
    }
  }, [sourceImage, mode, quality, drawBitmapToCanvas, pushToast])

  const restoreOriginal = useCallback(() => {
    if (!sourceImage) return
    drawBitmapToCanvas(sourceImage.bitmap)
    setHasResult(false)
    setState(IDLE_PROCESSING)
  }, [sourceImage, drawBitmapToCanvas])

  const getExportBlob = useCallback((): Promise<Blob | null> => {
    const canvas = canvasRef.current
    if (!canvas) return Promise.resolve(null)
    return canvasToPngBlob(canvas)
  }, [])

  useRegisterExport('eraser', sourceImage ? getExportBlob : null)

  const isLoading = state.status === 'loading'

  return (
    <PanelLayout
      tab="eraser"
      controls={
        sourceImage && (
          <>
            {!capabilities.webAssembly ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-danger/40 bg-danger/10 p-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
                <p className="text-xs leading-relaxed text-ink">
                  This browser doesn't support WebAssembly, so background removal can't run here. Image Playground
                  and Retro Studio will still work.
                </p>
              </div>
            ) : (
              <>
                <section>
                  <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Mode</h2>
                  <SegmentedControl
                    options={[
                      { value: 'background', label: 'Erase background' },
                      { value: 'foreground', label: 'Erase subject' },
                    ]}
                    value={mode}
                    onChange={setMode}
                    disabled={isLoading}
                    columns={2}
                  />
                </section>

                <section>
                  <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Model quality
                  </h2>
                  <SegmentedControl
                    options={[
                      { value: 'fast', label: 'Fast' },
                      { value: 'balanced', label: 'Balanced' },
                      { value: 'best', label: 'Best' },
                    ]}
                    value={quality}
                    onChange={setQuality}
                    disabled={isLoading}
                    columns={3}
                  />
                  <p className="mt-1.5 text-[11px] text-ink-muted">
                    Higher quality downloads a larger model on first run (cached after that).
                  </p>
                </section>

                <Button
                  variant="primary"
                  icon={<Wand2 size={15} />}
                  onClick={() => void runProcess()}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Processing…' : mode === 'background' ? 'Remove background' : 'Remove subject'}
                </Button>

                {hasResult && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RotateCcw size={13} />}
                    onClick={restoreOriginal}
                    disabled={isLoading}
                  >
                    Restore original
                  </Button>
                )}

                {state.status === 'error' && (
                  <p className="text-[11px] leading-relaxed text-danger">{state.error}</p>
                )}
              </>
            )}
          </>
        )
      }
    >
      <CanvasStage
        hasImage={!!sourceImage}
        onFile={loadFile}
        isProcessing={isLoading}
        progressPercent={state.progress}
        progressLabel={state.stage ? `Loading model — ${state.stage}` : 'Processing'}
      >
        <canvas ref={canvasRef} className="block max-h-[42vh] max-w-full rounded-lg shadow-xl sm:max-h-[65vh]" />
      </CanvasStage>
    </PanelLayout>
  )
}
