import { MARKER_COLORS, MARKER_LABELS, ROUTE_COLOR } from '../../lib/mapStyle'

/**
 * The MAP's own legend — keyed to what's actually drawn (route line + markers),
 * NOT the duty-status legend (which lives on the ELD grid).
 */
export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
      <span className="flex items-center gap-1.5 text-xs text-slate-600">
        <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: ROUTE_COLOR }} />
        Route
      </span>
      {(['start', 'pickup', 'dropoff', 'stop'] as const).map((k) => (
        <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span
            className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
            style={{ backgroundColor: MARKER_COLORS[k] }}
          />
          {MARKER_LABELS[k]}
        </span>
      ))}
    </div>
  )
}
