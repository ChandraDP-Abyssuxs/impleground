/** Trigger a browser download for a Blob without navigating away from the app. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a tick to pick up the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Read the current pixels of a canvas out as a high-quality PNG Blob. */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1)
  })
}

export function timestampedFilename(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${prefix}-${stamp}.png`
}
