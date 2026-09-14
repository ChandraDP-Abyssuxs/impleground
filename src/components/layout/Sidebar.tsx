import { TAB_ICONS, TAB_META } from '@/lib/tabs'
import { TAB_ORDER } from '@/types'
import type { TabId } from '@/types'
import { cn } from '@/lib/cn'

interface SidebarProps {
  activeTab: TabId
  onSelect: (tab: TabId) => void
}

function NavButton({
  tab,
  active,
  onSelect,
  orientation,
}: {
  tab: TabId
  active: boolean
  onSelect: (tab: TabId) => void
  orientation: 'vertical' | 'horizontal'
}) {
  const Icon = TAB_ICONS[tab]
  const meta = TAB_META[tab]
  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      title={meta.description}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
        orientation === 'vertical' ? 'w-full px-3 py-2.5' : 'shrink-0 px-3.5 py-2',
        active ? 'bg-panel-raised text-ink' : 'text-ink-muted hover:text-ink hover:bg-panel-raised/60',
      )}
    >
      {active && orientation === 'vertical' && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-signal" />
      )}
      <Icon size={17} className={cn(active ? 'text-accent' : 'text-ink-muted group-hover:text-ink')} />
      <span className={orientation === 'horizontal' ? 'whitespace-nowrap' : undefined}>{meta.shortLabel}</span>
    </button>
  )
}

export function Sidebar({ activeTab, onSelect }: SidebarProps) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-panel p-3 sm:flex">
        <div className="mb-2 px-1 pt-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Workspace</p>
        </div>
        {TAB_ORDER.map((tab) => (
          <NavButton key={tab} tab={tab} active={tab === activeTab} onSelect={onSelect} orientation="vertical" />
        ))}
        <div className="mt-auto rounded-lg border border-border bg-canvas p-3">
          <p className="font-mono text-[11px] leading-relaxed text-ink-muted">
            Every pixel stays on this device. Nothing here touches a server.
          </p>
        </div>
      </aside>

      {/* Mobile strip */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-panel px-2 py-2 sm:hidden">
        {TAB_ORDER.map((tab) => (
          <NavButton key={tab} tab={tab} active={tab === activeTab} onSelect={onSelect} orientation="horizontal" />
        ))}
      </nav>
    </>
  )
}
