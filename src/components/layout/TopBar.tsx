import { Download, Moon, Sun } from 'lucide-react'
import { useImageContext } from '@/context/ImageContext'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/common/Button'
import { Dropzone } from '@/components/common/Dropzone'

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" className="shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-panel-raised" />
      <rect x="6" y="6" width="8" height="8" className="fill-accent" />
      <rect x="18" y="6" width="8" height="8" className="fill-border" />
      <rect x="6" y="18" width="8" height="8" className="fill-border" />
      <rect x="18" y="18" width="8" height="8" className="fill-signal" />
    </svg>
  )
}

export function TopBar() {
  const { sourceImage, loadFile, exportActiveTab } = useImageContext()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-panel px-3 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <BrandMark />
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink">ImPleGround</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        {sourceImage && (
          <span className="hidden font-mono text-[11px] text-ink-muted md:inline">
            {sourceImage.width}×{sourceImage.height}
          </span>
        )}
        {sourceImage && <Dropzone compact onFile={loadFile} />}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-panel-raised hover:text-ink transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <Button
          variant="primary"
          size="sm"
          icon={<Download size={14} />}
          disabled={!sourceImage}
          onClick={() => void exportActiveTab()}
          aria-label="Export PNG"
        >
          <span className="hidden xs:inline">Export PNG</span>
        </Button>
      </div>
    </header>
  )
}
