import type { LatLngExpression, LatLngTuple } from 'leaflet'
import type { Coord } from '../api/types'

/**
 * The #1 footgun in this app: the API returns GeoJSON-order `[lon, lat]`,
 * but Leaflet expects `[lat, lng]`. Always swap through here — never inline
 * `[p[1], p[0]]` in a component.
 */
export function toLatLng(coord: Coord): LatLngTuple {
  return [coord[1], coord[0]]
}

/** Swap a whole polyline of `[lon, lat]` points to Leaflet `[lat, lng]`. */
export function toLatLngPath(coords: Coord[]): LatLngTuple[] {
  return coords.map(toLatLng)
}

/** Bounds (as Leaflet tuples) covering every supplied `[lon, lat]` point. */
export function boundsOf(coords: Coord[]): LatLngExpression[] {
  return coords.map(toLatLng)
}

/** Pretty-print a `[lon, lat]` coordinate for confirmation UI. */
export function formatCoord(coord: Coord | null | undefined): string {
  if (!coord) return '—'
  const [lon, lat] = coord
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}
