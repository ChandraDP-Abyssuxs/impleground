import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ClipboardCopy, ScanText as ScanIcon } from 'lucide-react'
import { useImageContext } from '@/context/ImageContext'
import { useToast } from '@/context/ToastContext'
import { useRegisterExport } from '@/hooks/useRegisterExport'
import { PanelLayout } from '@/components/layout/PanelLayout'
import { CanvasStage } from '@/components/common/CanvasStage'
import { Button } from '@/components/common/Button'
import { canvasToPngBlob } from '@/lib/download'
import type { ProcessingState } from '@/types'
import { IDLE_PROCESSING } from '@/types'

const LANGUAGES = [
  { value: 'eng', label: 'English' },
  { value: 'ind', label: 'Indonesian' },
  { value: 'spa', label: 'Spanish' },
  { value: 'fra', label: 'French' },
  { value: 'deu', label: 'German' },
  { value: 'chi_sim', label: 'Chinese (Simplified)' },
]

export function VisionOcrTab() {
  const { sourceImage, loadFile } = useImageContext()
  const { pushToast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawnForRef = useRef<string | null>(null)

  const [lang, setLang] = useState('eng')
  const [state, setState] = useState<ProcessingState>(IDLE_PROCESSING)
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sourceImage || drawnForRef.current === sourceImage.id) return
    drawnForRef.current = sourceImage.id
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = sourceImage.width
      canvas.height = sourceImage.height
      canvas.getContext('2d')?.drawImage(sourceImage.bitmap, 0, 0)
    }
    setText('')
    setState(IDLE_PROCESSING)
  }, [sourceImage])

  const runOcr = useCallback(async () => {
    const canvas = canvasRef.current
    if (!sourceImage || !canvas) return
    setState({ status: 'loading', progress: 0, stage: 'Loading OCR engine' })
    setText('')
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setState({ status: 'loading', progress: Math.round(m.progress * 100), stage: 'Recognizing text' })
          } else {
            setState({ status: 'loading', progress: 0, stage: m.status })
          }
        },
      })
      const { data } = await worker.recognize(canvas)
      await worker.terminate()
      setText(data.text.trim())
      setState({ status: 'success', progress: 100 })
      pushToast('success', 'Text extracted.')
    } catch (err) {
      console.error('[ImPleGround] OCR failed:', err)
      const message = err instanceof Error ? err.message : 'OCR failed.'
      setState({ status: 'error', progress: 0, error: message })
      pushToast('error', `Couldn't extract text: ${message}`)
    }
  }, [sourceImage, lang, pushToast])

  const copyText = useCallback(async () => {
    if (!text) return
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      setCopied(true)
      pushToast('success', 'Copied to clipboard.')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      pushToast('error', 'Could not copy automatically — select the text and copy it manually.')
    }
  }, [text, pushToast])

  const getExportBlob = useCallback((): Promise<Blob | null> => {
    const canvas = canvasRef.current
    if (!canvas) return Promise.resolve(null)
    return canvasToPngBlob(canvas)
  }, [])
  useRegisterExport('ocr', sourceImage ? getExportBlob : null)

  const isLoading = state.status === 'loading'

  return (
    <PanelLayout
      tab="ocr"
      controls={
        sourceImage && (
          <>
            <section>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Language</h2>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-border bg-canvas px-2.5 py-2 text-xs text-ink outline-none focus:border-accent disabled:opacity-50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </section>

            <Button
              variant="primary"
              icon={<ScanIcon size={15} />}
              onClick={() => void runOcr()}
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? 'Extracting…' : 'Extract text'}
            </Button>

            {state.status === 'error' && <p className="text-[11px] leading-relaxed text-danger">{state.error}</p>}

            {text && (
              <section className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Extracted text</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
                    onClick={() => void copyText()}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <textarea
                  readOnly
                  value={text}
                  rows={10}
                  className="w-full flex-1 resize-none rounded-lg border border-border bg-canvas p-2.5 font-mono text-xs leading-relaxed text-ink outline-none focus:border-accent"
                />
              </section>
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
        progressLabel={state.stage ?? 'Processing'}
      >
        <canvas ref={canvasRef} className="block max-h-[65vh] max-w-full rounded-lg shadow-xl" />
      </CanvasStage>
    </PanelLayout>
  )
}
