import { useImageContext } from '@/context/ImageContext'
import { TAB_ORDER } from '@/types'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ToastViewport } from '@/components/common/ToastViewport'
import { TAB_META } from '@/lib/tabs'
import { ImagePlaygroundTab } from '@/components/tabs/ImagePlayground/ImagePlaygroundTab'
import { MagicEraserTab } from '@/components/tabs/MagicEraser/MagicEraserTab'
import { RetroStudioTab } from '@/components/tabs/RetroStudio/RetroStudioTab'
import { VisionOcrTab } from '@/components/tabs/VisionOCR/VisionOcrTab'

const PANELS = {
  playground: ImagePlaygroundTab,
  eraser: MagicEraserTab,
  retro: RetroStudioTab,
  ocr: VisionOcrTab,
} as const

export function AppShell() {
  const { activeTab, setActiveTab } = useImageContext()

  return (
    <div className="flex h-dvh flex-col bg-canvas text-ink">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onSelect={setActiveTab} />
        <main className="relative flex-1 overflow-hidden">
          {TAB_ORDER.map((tab) => {
            const Panel = PANELS[tab]
            const isActive = tab === activeTab
            return (
              <div key={tab} className={isActive ? 'flex h-full flex-col' : 'hidden'} aria-hidden={!isActive}>
                <ErrorBoundary panelName={TAB_META[tab].label}>
                  <Panel />
                </ErrorBoundary>
              </div>
            )
          })}
        </main>
      </div>
      <ToastViewport />
    </div>
  )
}
