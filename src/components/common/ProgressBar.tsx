interface ProgressBarProps {
  /** 0–100. Pass undefined for an indeterminate sweep. */
  percent?: number
  label?: string
}

export function ProgressBar({ percent, label }: ProgressBarProps) {
  const clamped = percent === undefined ? undefined : Math.max(0, Math.min(100, percent))
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-baseline justify-between mb-1.5 text-xs">
          <span className="text-ink-muted">{label}</span>
          {clamped !== undefined && (
            <span className="font-mono text-[11px] text-ink tabular-nums">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-raised">
        {clamped === undefined ? (
          <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] rounded-full bg-signal" />
        ) : (
          <div
            className="h-full rounded-full bg-signal transition-[width] duration-300 ease-out"
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  )
}
