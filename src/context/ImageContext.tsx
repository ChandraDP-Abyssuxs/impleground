import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ExportHandler, SourceImage, TabId } from '@/types'
import { downloadBlob, timestampedFilename } from '@/lib/download'
import { useToast } from '@/context/ToastContext'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

interface ImageContextValue {
  sourceImage: SourceImage | null
  loadFile: (file: File) => Promise<void>
  clearImage: () => void
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  /** Called by the active panel to expose "give me my current canvas as a PNG". */
  registerExportHandler: (tab: TabId, handler: ExportHandler | null) => void
  exportActiveTab: () => Promise<void>
  isValidImageFile: (file: File) => boolean
}

const ImageContext = createContext<ImageContextValue | null>(null)

export function ImageProvider({ children }: { children: ReactNode }) {
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('playground')
  const handlers = useRef<Partial<Record<TabId, ExportHandler>>>({})
  const { pushToast } = useToast()

  const isValidImageFile = useCallback((file: File) => ACCEPTED_TYPES.includes(file.type), [])

  const loadFile = useCallback(
    async (file: File) => {
      if (!isValidImageFile(file)) {
        pushToast('error', `Unsupported file type: ${file.type || 'unknown'}. Use PNG, JPEG, or WebP.`)
        return
      }
      try {
        const bitmap = await createImageBitmap(file)
        const url = URL.createObjectURL(file)
        setSourceImage((prev) => {
          if (prev) URL.revokeObjectURL(prev.url)
          return {
            id: `${file.name}-${file.size}-${Date.now()}`,
            file,
            url,
            bitmap,
            width: bitmap.width,
            height: bitmap.height,
          }
        })
        pushToast('success', `Loaded ${file.name} (${bitmap.width}×${bitmap.height})`)
      } catch {
        pushToast('error', 'Could not read that image — it may be corrupt or unsupported.')
      }
    },
    [isValidImageFile, pushToast],
  )

  const clearImage = useCallback(() => {
    setSourceImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  const registerExportHandler = useCallback((tab: TabId, handler: ExportHandler | null) => {
    if (handler) handlers.current[tab] = handler
    else delete handlers.current[tab]
  }, [])

  const exportActiveTab = useCallback(async () => {
    const handler = handlers.current[activeTab]
    if (!handler) {
      pushToast('error', 'Nothing to export yet — load an image first.')
      return
    }
    try {
      const blob = await handler()
      if (!blob) {
        pushToast('error', 'Export failed — the canvas came back empty.')
        return
      }
      downloadBlob(blob, timestampedFilename(`impleground-${activeTab}`))
      pushToast('success', 'Exported PNG.')
    } catch {
      pushToast('error', 'Export failed unexpectedly.')
    }
  }, [activeTab, pushToast])

  const value = useMemo(
    () => ({
      sourceImage,
      loadFile,
      clearImage,
      activeTab,
      setActiveTab,
      registerExportHandler,
      exportActiveTab,
      isValidImageFile,
    }),
    [sourceImage, loadFile, clearImage, activeTab, registerExportHandler, exportActiveTab, isValidImageFile],
  )

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
}

export function useImageContext(): ImageContextValue {
  const ctx = useContext(ImageContext)
  if (!ctx) throw new Error('useImageContext must be used within an ImageProvider')
  return ctx
}
