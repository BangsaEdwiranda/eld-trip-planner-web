/**
 * TypeScript types mirroring docs/api-contract.md EXACTLY.
 * Field names, `[lon, lat]` coordinate order, and integer minutes all match
 * the live serializer output. Do not "fix" the order here — swap in lib/geo.ts.
 */

/** GeoJSON order: `[longitude, latitude]`. */
export type Coord = [number, number]

export type DutyStatus = 'OFF' | 'SB' | 'D' | 'ON'

/** Request body for POST /api/trips/. */
export interface TripRequest {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used_hours: number
}

/** A non-driving event (pickup, fuel, break, rest, restart, dropoff). */
export interface Stop {
  type: string
  status: Exclude<DutyStatus, 'D'> // stops are never Driving
  start: string // ISO datetime, tz-aware
  end: string // ISO datetime, tz-aware
  location: string
  /** Map position [lon, lat]. Pickup/dropoff exact; rests/fuel/breaks projected
   *  onto the route by the backend. `null` only if geometry was unavailable. */
  coords: Coord | null
}

/** One duty-status span on a day's grid. Minutes are day-local (0–1440). */
export interface LogSegment {
  status: DutyStatus
  start_minute: number
  end_minute: number
  location: string
  note: string
}

export interface LogTotals {
  OFF: number
  SB: number
  D: number
  ON: number
}

/** One ELD daily log sheet. */
export interface LogSheet {
  date: string // YYYY-MM-DD
  day_index: number
  from_location: string // currently "" — see known gaps
  to_location: string // currently "" — see known gaps
  total_miles_driving: number // currently 0.0 — see known gaps
  totals: LogTotals
  segments: LogSegment[]
}

/** Full planned trip — the 201 response from POST /api/trips/. */
export interface Trip {
  id: number
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used_hours: number

  current_coords: Coord
  pickup_coords: Coord
  dropoff_coords: Coord

  total_distance_miles: number
  total_duration_hours: number
  route_geometry: Coord[]

  stops: Stop[]
  /** IANA zone of the trip (current location's zone, e.g. "America/Denver").
   *  All log/stop times are in it; surface it in the UI. */
  timezone: string
  log_sheets: LogSheet[]
  created_at: string
}

/** DRF field-error shape (keyed by field name) OR a `{ detail }` routing error. */
export type ApiFieldErrors = Record<string, string[]>
export interface ApiDetailError {
  detail: string
}
