import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Crop, FlipHorizontal2, FlipVertical2, Redo2, RotateCcw, RotateCw, Undo2 } from 'lucide-react'
import { useImageContext } from '@/context/ImageContext'
import { useRegisterExport } from '@/hooks/useRegisterExport'
import { PanelLayout } from '@/components/layout/PanelLayout'
import { CanvasStage } from '@/components/common/CanvasStage'
import { Button } from '@/components/common/Button'
import { Slider } from '@/components/common/Slider'
import { DEFAULT_ADJUSTMENTS, useImagePlayground } from './useImagePlayground'
import type { CropRectPx } from './useImagePlayground'

function RailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex-1">
      <span className="mb-1 block text-[11px] text-ink-muted">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="w-full rounded-lg border border-border bg-canvas px-2.5 py-1.5 font-mono text-xs text-ink outline-none focus:border-accent"
      />
    </label>
  )
}

export function ImagePlaygroundTab() {
  const { sourceImage, loadFile } = useImageContext()
  const playground = useImagePlayground(sourceImage)
  const {
    displayCanvasRef,
    dims,
    adjustments,
    setAdjustment,
    resetAdjustments,
    flip,
    rotate,
    isCropping,
    dragRect,
    setDragRect,
    startCropping,
    cancelCropping,
    applyCrop,
    resizeWidth,
    resizeHeight,
    updateResizeWidth,
    updateResizeHeight,
    maintainAspect,
    setMaintainAspect,
    applyResize,
    canUndo,
    canReset,
    undo,
    resetToOriginal,
    getExportBlob,
  } = playground

  useRegisterExport('playground', sourceImage ? getExportBlob : null)

  const dragStart = useRef<{ x: number; y: number } | null>(null)

  const toCanvasCoords = useCallback((e: ReactPointerEvent<HTMLDivElement>): { x: number; y: number } => {
    const canvas = displayCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: Math.min(Math.max((e.clientX - rect.left) * scaleX, 0), canvas.width),
      y: Math.min(Math.max((e.clientY - rect.top) * scaleY, 0), canvas.height),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isCropping) return
      const p = toCanvasCoords(e)
      dragStart.current = p
      setDragRect({ x: p.x, y: p.y, width: 0, height: 0 })
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [isCropping, toCanvasCoords, setDragRect],
  )

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isCropping || !dragStart.current) return
      const p = toCanvasCoords(e)
      const start = dragStart.current
      const rect: CropRectPx = {
        x: Math.min(start.x, p.x),
        y: Math.min(start.y, p.y),
        width: Math.abs(p.x - start.x),
        height: Math.abs(p.y - start.y),
      }
      setDragRect(rect)
    },
    [isCropping, toCanvasCoords, setDragRect],
  )

  const handlePointerUp = useCallback(() => {
    dragStart.current = null
  }, [])

  return (
    <PanelLayout
      tab="playground"
      controls={
        sourceImage && (
          <>
            <RailSection title="Crop">
              {!isCropping ? (
                <Button icon={<Crop size={14} />} onClick={startCropping} fullWidth>
                  Draw crop area
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={applyCrop} fullWidth>
                    Apply
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelCropping} fullWidth>
                    Cancel
                  </Button>
                </div>
              )}
              {isCropping && <p className="text-[11px] text-ink-muted">Drag on the image to select an area.</p>}
            </RailSection>

            <RailSection title="Transform">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" icon={<FlipHorizontal2 size={14} />} onClick={() => flip('horizontal')}>
                  Flip H
                </Button>
                <Button size="sm" icon={<FlipVertical2 size={14} />} onClick={() => flip('vertical')}>
                  Flip V
                </Button>
                <Button size="sm" icon={<RotateCcw size={14} />} onClick={() => rotate('left')}>
                  Rotate L
                </Button>
                <Button size="sm" icon={<RotateCw size={14} />} onClick={() => rotate('right')}>
                  Rotate R
                </Button>
              </div>
            </RailSection>

            <RailSection title="Resize">
              <div className="flex items-end gap-2">
                <NumberField label="Width" value={resizeWidth} onChange={updateResizeWidth} />
                <NumberField label="Height" value={resizeHeight} onChange={updateResizeHeight} />
              </div>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={maintainAspect}
                  onChange={(e) => setMaintainAspect(e.target.checked)}
                  className="accent-accent"
                />
                Maintain aspect ratio
              </label>
              <Button size="sm" onClick={applyResize} fullWidth>
                Apply resize
              </Button>
            </RailSection>

            <RailSection title="Adjustments">
              <Slider
                label="Brightness"
                value={adjustments.brightness}
                min={0}
                max={200}
                unit="%"
                onChange={(v) => setAdjustment('brightness', v)}
              />
              <Slider
                label="Contrast"
                value={adjustments.contrast}
                min={0}
                max={200}
                unit="%"
                onChange={(v) => setAdjustment('contrast', v)}
              />
              <Slider
                label="Saturation"
                value={adjustments.saturation}
                min={0}
                max={200}
                unit="%"
                onChange={(v) => setAdjustment('saturation', v)}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={resetAdjustments}
                disabled={
                  adjustments.brightness === DEFAULT_ADJUSTMENTS.brightness &&
                  adjustments.contrast === DEFAULT_ADJUSTMENTS.contrast &&
                  adjustments.saturation === DEFAULT_ADJUSTMENTS.saturation
                }
              >
                Reset adjustments
              </Button>
            </RailSection>

            <RailSection title="History">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" icon={<Undo2 size={14} />} onClick={undo} disabled={!canUndo}>
                  Undo
                </Button>
                <Button size="sm" icon={<Redo2 size={14} />} onClick={resetToOriginal} disabled={!canReset}>
                  Reset all
                </Button>
              </div>
            </RailSection>
          </>
        )
      }
    >
      <CanvasStage hasImage={!!sourceImage} onFile={loadFile}>
        <div
          className="relative inline-block touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <canvas ref={displayCanvasRef} className="block max-h-[65vh] max-w-full rounded-lg shadow-xl" />
          {isCropping && (
            <div className="absolute inset-0 cursor-crosshair rounded-lg bg-black/15">
              {dragRect && dragRect.width > 0 && dims.width > 0 && (
                <div
                  className="absolute border-2 border-signal bg-signal/10"
                  style={{
                    left: `${(dragRect.x / dims.width) * 100}%`,
                    top: `${(dragRect.y / dims.height) * 100}%`,
                    width: `${(dragRect.width / dims.width) * 100}%`,
                    height: `${(dragRect.height / dims.height) * 100}%`,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </CanvasStage>
    </PanelLayout>
  )
}
