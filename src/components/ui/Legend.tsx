import { STATUS_COLORS, STATUS_LABELS, STATUS_ROWS } from '../../lib/grid'

/** Shared duty-status legend — same colors used on the map, timeline, and grid. */
export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {STATUS_ROWS.map((s) => (
        <span key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />
          {STATUS_LABELS[s]}
        </span>
      ))}
    </div>
  )
}
