import { useCallback, useEffect, useRef, useState } from 'react'
import type { SourceImage } from '@/types'
import { canvasToPngBlob } from '@/lib/download'

export interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
}

export const DEFAULT_ADJUSTMENTS: Adjustments = { brightness: 100, contrast: 100, saturation: 100 }
const MAX_HISTORY = 12

export interface CropRectPx {
  x: number
  y: number
  width: number
  height: number
}

/** Owns two canvases per image: a hidden "working" buffer that holds
 *  committed structural edits (crop/resize/rotate/flip), and the visible
 *  display canvas, which is the working buffer redrawn through a live
 *  CSS filter for brightness/contrast/saturation. Only the working buffer
 *  is ever snapshotted into history — slider drags never touch it. */
export function useImagePlayground(sourceImage: SourceImage | null) {
  const workingCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const historyRef = useRef<ImageBitmap[]>([])
  const historyIndexRef = useRef(-1)

  const [dims, setDims] = useState({ width: 0, height: 0 })
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS)
  const [isCropping, setIsCropping] = useState(false)
  const [dragRect, setDragRect] = useState<CropRectPx | null>(null)
  const [resizeWidth, setResizeWidth] = useState(0)
  const [resizeHeight, setResizeHeight] = useState(0)
  const [maintainAspect, setMaintainAspect] = useState(true)
  const [historyTick, setHistoryTick] = useState(0)
  const [version, setVersion] = useState(0)

  const redraw = useCallback(() => {
    const display = displayCanvasRef.current
    const working = workingCanvasRef.current
    if (!display || working.width === 0) return
    display.width = working.width
    display.height = working.height
    const ctx = display.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, display.width, display.height)
    ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`
    ctx.drawImage(working, 0, 0)
    ctx.filter = 'none'
  }, [adjustments])

  useEffect(() => {
    redraw()
  }, [redraw, version])

  const pushHistory = useCallback(async () => {
    const working = workingCanvasRef.current
    const snapshot = await createImageBitmap(working)
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(snapshot)
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    historyIndexRef.current = historyRef.current.length - 1
    setHistoryTick((t) => t + 1)
  }, [])

  const applyToWorking = useCallback(
    (draw: (ctx: CanvasRenderingContext2D, working: HTMLCanvasElement) => void, newW: number, newH: number) => {
      const next = document.createElement('canvas')
      next.width = Math.max(1, Math.round(newW))
      next.height = Math.max(1, Math.round(newH))
      const ctx = next.getContext('2d')
      if (!ctx) return
      draw(ctx, workingCanvasRef.current)
      workingCanvasRef.current = next
      setDims({ width: next.width, height: next.height })
      setResizeWidth(next.width)
      setResizeHeight(next.height)
      setVersion((v) => v + 1)
      void pushHistory()
    },
    [pushHistory],
  )

  const loadIntoCanvas = useCallback((bitmap: ImageBitmap) => {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
    return canvas
  }, [])

  // (Re)initialize whenever a new image is uploaded.
  useEffect(() => {
    if (!sourceImage) return
    const canvas = loadIntoCanvas(sourceImage.bitmap)
    workingCanvasRef.current = canvas
    historyRef.current = []
    historyIndexRef.current = -1
    setAdjustments(DEFAULT_ADJUSTMENTS)
    setDims({ width: canvas.width, height: canvas.height })
    setResizeWidth(canvas.width)
    setResizeHeight(canvas.height)
    setIsCropping(false)
    setDragRect(null)
    setVersion((v) => v + 1)
    void pushHistory()
    // sourceImage.id uniquely identifies a new upload; bitmap/loadIntoCanvas/pushHistory are stable enough for our purposes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceImage?.id])

  const setAdjustment = useCallback((key: keyof Adjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }))
  }, [])
  const resetAdjustments = useCallback(() => setAdjustments(DEFAULT_ADJUSTMENTS), [])

  const flip = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      const working = workingCanvasRef.current
      applyToWorking(
        (ctx) => {
          ctx.save()
          if (axis === 'horizontal') {
            ctx.translate(working.width, 0)
            ctx.scale(-1, 1)
          } else {
            ctx.translate(0, working.height)
            ctx.scale(1, -1)
          }
          ctx.drawImage(working, 0, 0)
          ctx.restore()
        },
        working.width,
        working.height,
      )
    },
    [applyToWorking],
  )

  const rotate = useCallback(
    (direction: 'left' | 'right') => {
      const working = workingCanvasRef.current
      const newW = working.height
      const newH = working.width
      applyToWorking(
        (ctx) => {
          ctx.save()
          if (direction === 'right') {
            ctx.translate(newW, 0)
            ctx.rotate(Math.PI / 2)
          } else {
            ctx.translate(0, newH)
            ctx.rotate(-Math.PI / 2)
          }
          ctx.drawImage(working, 0, 0)
          ctx.restore()
        },
        newW,
        newH,
      )
    },
    [applyToWorking],
  )

  const startCropping = useCallback(() => {
    setIsCropping(true)
    setDragRect(null)
  }, [])
  const cancelCropping = useCallback(() => {
    setIsCropping(false)
    setDragRect(null)
  }, [])
  const applyCrop = useCallback(() => {
    if (!dragRect || dragRect.width < 2 || dragRect.height < 2) {
      setIsCropping(false)
      setDragRect(null)
      return
    }
    const working = workingCanvasRef.current
    const rect = dragRect
    applyToWorking(
      (ctx) => {
        ctx.drawImage(working, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
      },
      rect.width,
      rect.height,
    )
    setIsCropping(false)
    setDragRect(null)
  }, [dragRect, applyToWorking])

  const updateResizeWidth = useCallback(
    (w: number) => {
      setResizeWidth(w)
      if (maintainAspect) {
        const working = workingCanvasRef.current
        setResizeHeight(Math.round(w * (working.height / working.width)))
      }
    },
    [maintainAspect],
  )
  const updateResizeHeight = useCallback(
    (h: number) => {
      setResizeHeight(h)
      if (maintainAspect) {
        const working = workingCanvasRef.current
        setResizeWidth(Math.round(h * (working.width / working.height)))
      }
    },
    [maintainAspect],
  )
  const applyResize = useCallback(() => {
    const working = workingCanvasRef.current
    const w = Math.max(1, Math.round(resizeWidth))
    const h = Math.max(1, Math.round(resizeHeight))
    if (w === working.width && h === working.height) return
    applyToWorking(
      (ctx) => {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(working, 0, 0, working.width, working.height, 0, 0, w, h)
      },
      w,
      h,
    )
  }, [resizeWidth, resizeHeight, applyToWorking])

  const restoreSnapshot = useCallback((bitmap: ImageBitmap) => {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
    workingCanvasRef.current = canvas
    setDims({ width: canvas.width, height: canvas.height })
    setResizeWidth(canvas.width)
    setResizeHeight(canvas.height)
    setVersion((v) => v + 1)
  }, [])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    restoreSnapshot(historyRef.current[historyIndexRef.current])
    setHistoryTick((t) => t + 1)
  }, [restoreSnapshot])

  const resetToOriginal = useCallback(() => {
    if (historyRef.current.length === 0) return
    const original = historyRef.current[0]
    historyIndexRef.current = 0
    historyRef.current = [original]
    restoreSnapshot(original)
    setAdjustments(DEFAULT_ADJUSTMENTS)
    setHistoryTick((t) => t + 1)
  }, [restoreSnapshot])

  const getExportBlob = useCallback((): Promise<Blob | null> => {
    const display = displayCanvasRef.current
    if (!display) return Promise.resolve(null)
    return canvasToPngBlob(display)
  }, [])

  return {
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
    canUndo: historyTick >= 0 && historyIndexRef.current > 0,
    canReset: historyTick >= 0 && historyIndexRef.current > 0,
    undo,
    resetToOriginal,
    getExportBlob,
  }
}
