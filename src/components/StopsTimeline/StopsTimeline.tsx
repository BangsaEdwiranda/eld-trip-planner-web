import type { Stop, Trip } from '../../api/types'
import { isoToTripTime } from '../../lib/format'
import { MARKER_COLORS } from '../../lib/mapStyle'

interface Props {
  trip: Trip
  activeStopKey?: number | null
  onHoverStop?: (key: number | null) => void
}

// Use the MAP marker palette (these are the same events as the map markers),
// not the ELD duty-status colors.
function stopColor(stop: Stop): string {
  if (/pickup/i.test(stop.type)) return MARKER_COLORS.pickup
  if (/dropoff/i.test(stop.type)) return MARKER_COLORS.dropoff
  return MARKER_COLORS.stop
}

function durationLabel(stop: Stop): string {
  const ms = new Date(stop.end).getTime() - new Date(stop.start).getTime()
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function StopsTimeline({ trip, activeStopKey, onHoverStop }: Props) {
  if (trip.stops.length === 0) {
    return <p className="text-sm text-slate-500">No scheduled stops on this trip.</p>
  }

  return (
    <ol className="relative space-y-1">
      {/* Start node (current location) */}
      <Anchor color={MARKER_COLORS.start} title="Start" subtitle={trip.current_location} />

      {trip.stops.map((stop, i) => {
        const color = stopColor(stop)
        const active = activeStopKey === i
        return (
          <li
            key={i}
            className={`relative flex gap-3 rounded-lg px-2 py-2 transition ${
              active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'
            }`}
            onMouseEnter={() => onHoverStop?.(i)}
            onMouseLeave={() => onHoverStop?.(null)}
          >
            <div className="flex flex-col items-center">
              <span className="h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: color }} />
              {i < trip.stops.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-sm font-semibold text-ink">{stop.type}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {durationLabel(stop)}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">{stop.location}</p>
              <p className="font-mono text-[11px] text-slate-400">
                {isoToTripTime(stop.start)} – {isoToTripTime(stop.end)}
              </p>
            </div>
          </li>
        )
      })}

      {/* End node (dropoff) */}
      <Anchor color={MARKER_COLORS.dropoff} title="Arrive" subtitle={trip.dropoff_location} />
    </ol>
  )
}

function Anchor({ color, title, subtitle }: { color: string; title: string; subtitle: string }) {
  return (
    <li className="flex items-center gap-3 px-2 py-1">
      <span
        className="grid h-4 w-4 place-items-center rounded-full ring-2 ring-white"
        style={{ backgroundColor: color }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        <p className="text-sm font-medium text-ink">{subtitle}</p>
      </div>
    </li>
  )
}
