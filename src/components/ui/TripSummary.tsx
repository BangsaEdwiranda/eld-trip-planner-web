import type { Trip } from '../../api/types'
import { formatMiles, hoursToHM } from '../../lib/format'

export function TripSummary({ trip }: { trip: Trip }) {
  const driveHours = trip.log_sheets.reduce((a, s) => a + (s.totals.D ?? 0), 0)
  const onDutyHours = trip.log_sheets.reduce((a, s) => a + (s.totals.ON ?? 0), 0)
  const remaining = Math.max(0, 70 - trip.current_cycle_used_hours - driveHours - onDutyHours)

  const stats: { label: string; value: string; sub?: string }[] = [
    { label: 'Distance', value: formatMiles(trip.total_distance_miles) },
    { label: 'Drive time', value: hoursToHM(trip.total_duration_hours), sub: 'pure driving' },
    { label: 'Days', value: String(trip.log_sheets.length), sub: 'log sheets' },
    { label: 'Stops', value: String(trip.stops.length), sub: 'rests & events' },
    { label: 'Cycle left', value: `${remaining.toFixed(1)}h`, sub: 'of 70 after trip' },
  ]

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="card px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{s.label}</dt>
          <dd className="mt-1 text-xl font-bold text-ink">{s.value}</dd>
          {s.sub && <dd className="text-[11px] text-slate-400">{s.sub}</dd>}
        </div>
      ))}
    </dl>
  )
}
