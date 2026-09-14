export type PaletteId = 'gameboy' | 'cga' | 'nes' | 'mono'
export type DitherAlgo = 'none' | 'floyd-steinberg' | 'bayer4' | 'bayer8'

export type RGB = readonly [number, number, number]

/** A handful of well-known retro palettes. GameBoy and CGA are the
 *  canonical 4-color sets; NES is a representative 16-swatch subset of
 *  the console's much larger master palette, picked for a recognisable
 *  look rather than ROM-exact accuracy. */
export const FIXED_PALETTES: Record<Exclude<PaletteId, 'mono'>, RGB[]> = {
  gameboy: [
    [15, 56, 15],
    [48, 98, 48],
    [139, 172, 15],
    [155, 188, 15],
  ],
  cga: [
    [0, 0, 0],
    [85, 255, 255],
    [255, 85, 255],
    [255, 255, 255],
  ],
  nes: [
    [124, 124, 124],
    [0, 0, 252],
    [0, 0, 188],
    [68, 40, 188],
    [148, 0, 132],
    [168, 0, 32],
    [168, 16, 0],
    [136, 20, 0],
    [80, 48, 0],
    [0, 120, 0],
    [0, 104, 0],
    [0, 88, 0],
    [0, 64, 88],
    [248, 248, 248],
    [60, 188, 252],
    [216, 120, 248],
  ],
}

export function grayscalePalette(levels: number): RGB[] {
  const n = Math.max(2, Math.round(levels))
  const palette: RGB[] = []
  for (let i = 0; i < n; i++) {
    const v = Math.round((i / (n - 1)) * 255)
    palette.push([v, v, v])
  }
  return palette
}

export function resolvePalette(id: PaletteId, monoLevels: number): RGB[] {
  return id === 'mono' ? grayscalePalette(monoLevels) : FIXED_PALETTES[id]
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function nearestColorIndex(r: number, g: number, b: number, palette: RGB[]): number {
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i]
    const dr = r - pr
    const dg = g - pg
    const db = b - pb
    const dist = dr * dr + dg * dg + db * db
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  }
  return bestIdx
}

/** Recursively-constructed Bayer threshold matrix (the standard
 *  "doubling" construction), so the 4x4 and 8x8 tables are provably
 *  correct rather than hand-transcribed. */
function buildBayerMatrix(size: 4 | 8): number[][] {
  let matrix: number[][] = [[0]]
  let current = 1
  while (current < size) {
    const m = matrix.length
    const result: number[][] = Array.from({ length: m * 2 }, () => new Array(m * 2).fill(0))
    for (let y = 0; y < m; y++) {
      for (let x = 0; x < m; x++) {
        const v = matrix[y][x]
        result[y][x] = 4 * v
        result[y][x + m] = 4 * v + 2
        result[y + m][x] = 4 * v + 3
        result[y + m][x + m] = 4 * v + 1
      }
    }
    matrix = result
    current *= 2
  }
  return matrix
}

const BAYER_4 = buildBayerMatrix(4)
const BAYER_8 = buildBayerMatrix(8)

function distributeError(
  buf: Float32Array,
  x: number,
  y: number,
  w: number,
  h: number,
  er: number,
  eg: number,
  eb: number,
): void {
  const add = (xx: number, yy: number, factor: number) => {
    if (xx < 0 || xx >= w || yy < 0 || yy >= h) return
    const idx = (yy * w + xx) * 4
    buf[idx] += er * factor
    buf[idx + 1] += eg * factor
    buf[idx + 2] += eb * factor
  }
  add(x + 1, y, 7 / 16)
  add(x - 1, y + 1, 3 / 16)
  add(x, y + 1, 5 / 16)
  add(x + 1, y + 1, 1 / 16)
}

/** Downscale-then-upscale-with-nearest-neighbor pixelation. Writes into
 *  `destCtx`, which may be the same canvas the pixels came from. */
export function pixelate(destCtx: CanvasRenderingContext2D, source: HTMLCanvasElement | ImageBitmap, blockSize: number, w: number, h: number): void {
  if (blockSize <= 1) {
    destCtx.imageSmoothingEnabled = true
    destCtx.clearRect(0, 0, w, h)
    destCtx.drawImage(source, 0, 0, w, h)
    return
  }
  const smallW = Math.max(1, Math.round(w / blockSize))
  const smallH = Math.max(1, Math.round(h / blockSize))
  const temp = document.createElement('canvas')
  temp.width = smallW
  temp.height = smallH
  const tctx = temp.getContext('2d')
  if (!tctx) return
  tctx.imageSmoothingEnabled = true
  tctx.drawImage(source, 0, 0, w, h, 0, 0, smallW, smallH)

  destCtx.imageSmoothingEnabled = false
  destCtx.clearRect(0, 0, w, h)
  destCtx.drawImage(temp, 0, 0, smallW, smallH, 0, 0, w, h)
}

/** Quantize `imageData` to `palette`, optionally dithering. Returns a new
 *  ImageData — the input is never mutated. */
export function applyPalette(imageData: ImageData, palette: RGB[], algo: DitherAlgo): ImageData {
  const { width, height, data } = imageData
  const out = new Uint8ClampedArray(data.length)

  if (algo === 'floyd-steinberg') {
    const buf = new Float32Array(data.length)
    buf.set(data)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = buf[idx]
        const g = buf[idx + 1]
        const b = buf[idx + 2]
        const pi = nearestColorIndex(clamp255(r), clamp255(g), clamp255(b), palette)
        const [pr, pg, pb] = palette[pi]
        out[idx] = pr
        out[idx + 1] = pg
        out[idx + 2] = pb
        out[idx + 3] = data[idx + 3]
        distributeError(buf, x, y, width, height, r - pr, g - pg, b - pb)
      }
    }
    return new ImageData(out, width, height)
  }

  if (algo === 'bayer4' || algo === 'bayer8') {
    const matrix = algo === 'bayer4' ? BAYER_4 : BAYER_8
    const n = matrix.length
    const denom = n * n
    // Scale the threshold spread to the palette's coarseness — a 4-color
    // palette needs a much bigger nudge to visibly break up banding than
    // a 16-color one does.
    const strength = 260 / palette.length
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const threshold = (matrix[y % n][x % n] / denom - 0.5) * strength
        const pi = nearestColorIndex(
          clamp255(data[idx] + threshold),
          clamp255(data[idx + 1] + threshold),
          clamp255(data[idx + 2] + threshold),
          palette,
        )
        const [pr, pg, pb] = palette[pi]
        out[idx] = pr
        out[idx + 1] = pg
        out[idx + 2] = pb
        out[idx + 3] = data[idx + 3]
      }
    }
    return new ImageData(out, width, height)
  }

  // 'none' — direct nearest-color quantization, no dithering.
  for (let i = 0; i < data.length; i += 4) {
    const pi = nearestColorIndex(data[i], data[i + 1], data[i + 2], palette)
    const [pr, pg, pb] = palette[pi]
    out[i] = pr
    out[i + 1] = pg
    out[i + 2] = pb
    out[i + 3] = data[i + 3]
  }
  return new ImageData(out, width, height)
}
