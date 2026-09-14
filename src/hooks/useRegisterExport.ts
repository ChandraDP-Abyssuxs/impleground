import { useEffect } from 'react'
import { useImageContext } from '@/context/ImageContext'
import type { ExportHandler, TabId } from '@/types'

/**
 * Lets a panel expose "here's how to rasterize what I'm showing right now"
 * to the shared top-bar Export button. Each tab has its own slot, so this
 * is safe to call from every panel regardless of which one is active —
 * pass `null` while there's nothing exportable (e.g. no image loaded yet).
 */
export function useRegisterExport(tab: TabId, handler: ExportHandler | null): void {
  const { registerExportHandler } = useImageContext()
  useEffect(() => {
    registerExportHandler(tab, handler)
    return () => registerExportHandler(tab, null)
  }, [tab, handler, registerExportHandler])
}
