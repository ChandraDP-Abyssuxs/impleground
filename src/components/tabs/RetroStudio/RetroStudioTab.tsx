import { useEffect, useRef, useState } from 'react'
import { useImageContext } from '@/context/ImageContext'
import { useRegisterExport } from '@/hooks/useRegisterExport'
import { PanelLayout } from '@/components/layout/PanelLayout'
import { CanvasStage } from '@/components/common/CanvasStage'
import { Button } from '@/components/common/Button'
import { Slider } from '@/components/common/Slider'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { canvasToPngBlob } from '@/lib/download'
import { applyPalette, pixelate, resolvePalette } from './dithering'
import type { DitherAlgo, PaletteId } from './dithering'

const DEFAULTS = {
  palette: 'gameboy' as PaletteId,
  monoLevels: 4,
  dither: 'floyd-steinberg' as DitherAlgo,
  pixelSize: 1,
}

export function RetroStudioTab() {
  const { sourceImage, loadFile } = useImageContext()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [paletteId, setPaletteId] = useState<PaletteId>(DEFAULTS.palette)
  const [monoLevels, setMonoLevels] = useState(DEFAULTS.monoLevels)
  const [ditherAlgo, setDitherAlgo] = useState<DitherAlgo>(DEFAULTS.dither)
  const [pixelSize, setPixelSize] = useState(DEFAULTS.pixelSize)

  useEffect(() => {
    if (!sourceImage) return
    const timer = window.setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const w = sourceImage.width
      const h = sourceImage.height
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      pixelate(ctx, sourceImage.bitmap, pixelSize, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)
      const palette = resolvePalette(paletteId, monoLevels)
      ctx.putImageData(applyPalette(imageData, palette, ditherAlgo), 0, 0)
    }, 90)
    return () => window.clearTimeout(timer)
  }, [sourceImage, paletteId, monoLevels, ditherAlgo, pixelSize])

  const getExportBlob = (): Promise<Blob | null> => {
    const canvas = canvasRef.current
    if (!canvas) return Promise.resolve(null)
    return canvasToPngBlob(canvas)
  }
  useRegisterExport('retro', sourceImage ? getExportBlob : null)

  const resetDefaults = () => {
    setPaletteId(DEFAULTS.palette)
    setMonoLevels(DEFAULTS.monoLevels)
    setDitherAlgo(DEFAULTS.dither)
    setPixelSize(DEFAULTS.pixelSize)
  }

  const isDefault =
    paletteId === DEFAULTS.palette &&
    monoLevels === DEFAULTS.monoLevels &&
    ditherAlgo === DEFAULTS.dither &&
    pixelSize === DEFAULTS.pixelSize

  return (
    <PanelLayout
      tab="retro"
      controls={
        sourceImage && (
          <>
            <section>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Palette</h2>
              <SegmentedControl
                options={[
                  { value: 'gameboy', label: 'GameBoy' },
                  { value: 'cga', label: 'CGA' },
                  { value: 'nes', label: 'NES' },
                  { value: 'mono', label: 'Monochrome' },
                ]}
                value={paletteId}
                onChange={setPaletteId}
                columns={2}
              />
            </section>

            <Slider
              label="Palette color count"
              value={monoLevels}
              min={2}
              max={16}
              disabled={paletteId !== 'mono'}
              onChange={setMonoLevels}
              helpText={paletteId !== 'mono' ? 'Fixed for this preset — switch to Monochrome to adjust.' : undefined}
            />

            <section>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Dithering</h2>
              <SegmentedControl
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'floyd-steinberg', label: 'Floyd\u2013Steinberg' },
                  { value: 'bayer4', label: 'Bayer 4\u00d74' },
                  { value: 'bayer8', label: 'Bayer 8\u00d78' },
                ]}
                value={ditherAlgo}
                onChange={setDitherAlgo}
                columns={2}
              />
            </section>

            <Slider
              label="Pixelation"
              value={pixelSize}
              min={1}
              max={32}
              unit="px"
              onChange={setPixelSize}
              helpText={pixelSize === 1 ? 'No pixelation' : `Blocks of ${pixelSize}\u00d7${pixelSize} source pixels`}
            />

            <Button size="sm" variant="ghost" onClick={resetDefaults} disabled={isDefault}>
              Reset to defaults
            </Button>
          </>
        )
      }
    >
      <CanvasStage hasImage={!!sourceImage} onFile={loadFile}>
        <canvas
          ref={canvasRef}
          className="block max-h-[42vh] max-w-full rounded-lg shadow-xl [image-rendering:pixelated] sm:max-h-[65vh]"
        />
      </CanvasStage>
    </PanelLayout>
  )
}
