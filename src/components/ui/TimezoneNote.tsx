import type { Trip } from '../../api/types'
import { tzAbbreviation } from '../../lib/format'

/**
 * Surfaces the trip's local zone so users know all times are the DRIVER'S local
 * time (the current location's zone), not the viewer's — required by the API
 * contract since the grid/stop times are held in that fixed zone.
 */
export function TimezoneNote({ trip, className = '' }: { trip: Trip; className?: string }) {
  if (!trip.timezone) return null
  const ref = trip.stops[0]?.start ?? trip.created_at
  const abbr = tzAbbreviation(trip.timezone, ref)

  return (
    <p className={`flex items-center gap-1.5 text-xs text-slate-400 ${className}`}>
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12a.75.75 0 00-1.5 0v4c0 .27.144.518.378.651l2.75 1.572a.75.75 0 10.744-1.302L10.75 9.566V6z"
          clipRule="evenodd"
        />
      </svg>
      Times shown in the driver's local time — {trip.timezone}
      {abbr ? ` (${abbr})` : ''}
    </p>
  )
}
