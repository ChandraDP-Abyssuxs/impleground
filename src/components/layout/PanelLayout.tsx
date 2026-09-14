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
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        <Icon size={17} className="text-accent" />
        <div>
          <h1 className="font-display text-sm font-semibold leading-tight text-ink">{meta.label}</h1>
          <p className="text-xs text-ink-muted">{meta.description}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="min-h-[320px] flex-1 overflow-hidden p-4">{children}</div>
        <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-border p-4 lg:w-80 lg:border-l lg:border-t-0">
          {controls}
        </aside>
      </div>
    </div>
  )
}
