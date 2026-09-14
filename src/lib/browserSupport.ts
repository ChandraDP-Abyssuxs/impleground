export interface BrowserCapabilities {
  webAssembly: boolean
  offscreenCanvas: boolean
  canvasFilter: boolean
  clipboard: boolean
}

/** Feature-detect the APIs each panel depends on, once, at startup. */
export function detectCapabilities(): BrowserCapabilities {
  const webAssembly = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function'
  const offscreenCanvas = typeof OffscreenCanvas !== 'undefined'
  const canvasFilter = (() => {
    try {
      const ctx = document.createElement('canvas').getContext('2d')
      return !!ctx && 'filter' in ctx
    } catch {
      return false
    }
  })()
  const clipboard = typeof navigator !== 'undefined' && !!navigator.clipboard

  return { webAssembly, offscreenCanvas, canvasFilter, clipboard }
}
