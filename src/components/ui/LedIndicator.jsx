/**
 * LedIndicator - Status Diode
 * Accepts either `color` (green|emerald|orange|red|blue|slate) or semantic `status`
 * (active|success|warning|error|inactive) so existing page mappings work.
 */
export default function LedIndicator({
  color,
  status,
  label,
  sublabel,
  pulse = true,
  size = 'md',
  className = '',
}) {
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  }

  const colorStyles = {
    green: {
      bg: 'bg-emerald-500',
      glow: 'shadow-[0_0_8px_2px_rgba(34,197,94,0.7)]',
      border: 'border-emerald-300/60',
    },
    emerald: {
      bg: 'bg-emerald-500',
      glow: 'shadow-[0_0_8px_2px_rgba(34,197,94,0.7)]',
      border: 'border-emerald-300/60',
    },
    orange: {
      bg: 'bg-accent',
      glow: 'shadow-[0_0_8px_2px_rgba(255,71,87,0.7)]',
      border: 'border-rose-300/60',
    },
    red: {
      bg: 'bg-rose-600',
      glow: 'shadow-[0_0_8px_2px_rgba(225,29,72,0.8)]',
      border: 'border-rose-400/60',
    },
    blue: {
      bg: 'bg-sky-500',
      glow: 'shadow-[0_0_8px_2px_rgba(14,165,233,0.7)]',
      border: 'border-sky-300/60',
    },
    slate: {
      bg: 'bg-slate-400',
      glow: 'shadow-[0_0_6px_1px_rgba(148,163,184,0.5)]',
      border: 'border-slate-300/60',
    },
  }

  const statusToColor = {
    active: 'green',
    success: 'green',
    warning: 'orange',
    error: 'red',
    inactive: 'slate',
  }

  const resolved = color || statusToColor[status] || 'green'
  const selected = colorStyles[resolved] || colorStyles.green
  const shouldPulse = pulse && status !== 'inactive'

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span className="relative flex items-center justify-center">
        {shouldPulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${selected.bg}`}
          />
        )}
        <span
          className={`relative inline-block rounded-full border ${selected.bg} ${selected.glow} ${selected.border} ${sizeMap[size] || sizeMap.md}`}
        />
      </span>

      {label && (
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5 leading-none">
          {label}
          {sublabel && <span className="text-ink-muted text-[10px] font-normal">({sublabel})</span>}
        </span>
      )}
    </div>
  )
}
