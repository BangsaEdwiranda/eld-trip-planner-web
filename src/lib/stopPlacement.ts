import type { Coord, Stop, Trip } from '../api/types'

export interface PlacedStop {
  stop: Stop
  index: number
  coord: Coord // [lon, lat]
}

function isPickup(s: Stop) {
  return /pickup/i.test(s.type)
}
function isDropoff(s: Stop) {
  return /dropoff/i.test(s.type)
}

/**
 * Map markers for the non-waypoint stops (fuel / breaks / rests). The backend
 * now supplies `stops[].coords` directly (rests/fuel projected onto the route),
 * so there's no client-side interpolation — we just read the coords and skip
 * pickup/dropoff (those get their own labeled pins) and any null coords.
 */
export function placeStops(trip: Trip): PlacedStop[] {
  return trip.stops
    .map((stop, index) => ({ stop, index, coord: stop.coords }))
    .filter(
      (p): p is PlacedStop => p.coord != null && !isPickup(p.stop) && !isDropoff(p.stop),
    )
}
