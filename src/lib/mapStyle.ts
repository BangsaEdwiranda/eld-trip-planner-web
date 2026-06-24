/**
 * Map styling lives in its OWN palette, deliberately distinct from the ELD
 * duty-status colors (lib/grid STATUS_COLORS). The map is *space*; the grid is
 * *time*. Reusing duty colors for markers would make e.g. green mean both
 * "Pickup" (a place) and "Driving" (a duty state) — ambiguous. Keep them apart.
 */

export const ROUTE_COLOR = '#1f57e0' // single color for the whole polyline

export const MARKER_COLORS = {
  start: '#0891b2', // cyan-600
  pickup: '#2563eb', // blue-600
  dropoff: '#e11d48', // rose-600
  stop: '#334155', // slate-700 — neutral, for fuel/break/rest stops
} as const

export type MarkerKind = keyof typeof MARKER_COLORS

export const MARKER_LABELS: Record<MarkerKind, string> = {
  start: 'Start',
  pickup: 'Pickup',
  dropoff: 'Dropoff',
  stop: 'Rest / fuel stop',
}
