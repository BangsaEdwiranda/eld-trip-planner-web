import type { LogSheet, Trip } from '../api/types'

/**
 * Fills the API's "known gaps" (api-contract.md §Known gaps) on the client:
 *  - `from_location` / `to_location` come back as "".
 *  - `total_miles_driving` comes back as 0.0.
 * Everything here is clearly an *estimate* and never touches HOS math.
 */

export interface DerivedSheetMeta {
  fromLocation: string
  toLocation: string
  /** Estimated miles driven on this day (apportioned by driving hours). */
  milesEstimate: number
  /** True when we approximated miles (so the UI can label it). */
  milesAreEstimated: boolean
}

/**
 * Per-day from/to: prefer the day's own first/last non-OFF segment location;
 * fall back to the trip endpoints for the first and last sheets.
 */
function deriveFromTo(sheet: LogSheet, trip: Trip, isFirst: boolean, isLast: boolean) {
  const active = sheet.segments.filter((s) => s.status !== 'OFF' && s.location)
  const first = active[0]?.location
  const last = active[active.length - 1]?.location

  const fromLocation = isFirst ? trip.current_location : first || trip.current_location
  const toLocation = isLast ? trip.dropoff_location : last || trip.dropoff_location
  return { fromLocation, toLocation }
}

export function deriveSheetMeta(sheet: LogSheet, trip: Trip): DerivedSheetMeta {
  const sheets = trip.log_sheets
  const isFirst = sheet.day_index === sheets[0]?.day_index
  const isLast = sheet.day_index === sheets[sheets.length - 1]?.day_index

  const { fromLocation, toLocation } = deriveFromTo(sheet, trip, isFirst, isLast)

  // Apportion total distance across days by each day's driving hours.
  const totalDrivingHours = sheets.reduce((acc, s) => acc + (s.totals.D ?? 0), 0)
  const apiMiles = sheet.total_miles_driving
  let milesEstimate = apiMiles
  let milesAreEstimated = false
  if ((!apiMiles || apiMiles === 0) && totalDrivingHours > 0) {
    milesEstimate = (sheet.totals.D / totalDrivingHours) * trip.total_distance_miles
    milesAreEstimated = true
  }

  return { fromLocation, toLocation, milesEstimate, milesAreEstimated }
}
