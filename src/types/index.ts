/** The four workspace panels, in sidebar order. */
export type TabId = 'playground' | 'eraser' | 'retro' | 'ocr'

export const TAB_ORDER: TabId[] = ['playground', 'eraser', 'retro', 'ocr']

export interface TabMeta {
  id: TabId
  label: string
  shortLabel: string
  description: string
}

/** The single image every panel works from, decoded once and shared. */
export interface SourceImage {
  /** Bumped on every new upload so effects can key off it cleanly. */
  id: string
  file: File
  /** Object URL for the raw file — revoked when replaced. */
  url: string
  bitmap: ImageBitmap
  width: number
  height: number
}

/** Generic lifecycle for any async, potentially-long-running operation
 *  (background removal, OCR) that needs a spinner/progress UI. */
export type ProcessingStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ProcessingState {
  status: ProcessingStatus
  /** 0–100. Indeterminate operations can leave this at 0 and rely on status alone. */
  progress: number
  /** Short human-readable stage label, e.g. "Downloading model". */
  stage?: string
  error?: string
}

export const IDLE_PROCESSING: ProcessingState = { status: 'idle', progress: 0 }

/** A panel registers one of these so the top bar's Export button always
 *  knows how to rasterize whatever is currently on screen. */
export type ExportHandler = () => Promise<Blob | null>

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  message: string
}

export type Theme = 'dark' | 'light'
