import type { ReactNode } from 'react'
import { TAB_ICONS, TAB_META } from '@/lib/tabs'
import type { TabId } from '@/types'

interface PanelLayoutProps {
  tab: TabId
  /** The canvas stage / preview area. */
  children: ReactNode
  /** The right-hand control rail contents. */
  controls: ReactNode
}

export function PanelLayout({ tab, children, controls }: PanelLayoutProps) {
  const meta = TAB_META[tab]
  const Icon = TAB_ICONS[tab]

  return (
    // Below lg, this whole panel is one natural scrolling column — the
    // canvas and the control rail both get their real height instead of
    // being squeezed into a fixed-height split, which is what breaks on
    // short phone viewports. At lg+ it becomes the fixed two-pane split
    // with its own internal scroll regions.
    <div className="flex h-full flex-1 flex-col overflow-y-auto lg:overflow-hidden">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-4 py-3 sm:px-5 sm:py-3.5">
        <Icon size={17} className="shrink-0 text-accent" />
        <div className="min-w-0">
          <h1 className="font-display text-sm font-semibold leading-tight text-ink">{meta.label}</h1>
          <p className="truncate text-xs text-ink-muted">{meta.description}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <div className="min-h-[260px] p-3 sm:p-4 lg:min-h-[320px] lg:flex-1 lg:overflow-hidden">{children}</div>
        {controls && (
          <aside className="flex w-full shrink-0 flex-col gap-5 border-t border-border p-3 sm:p-4 lg:w-80 lg:border-l lg:border-t-0 lg:overflow-y-auto">
            {controls}
          </aside>
        )}
      </div>
    </div>
  )
}
