import { describe, it, expect } from 'vitest'
import { toLatLng, toLatLngPath, formatCoord } from './geo'
import type { Coord } from '../api/types'

describe('geo — the [lon,lat] → [lat,lng] footgun', () => {
  it('swaps a single coordinate to Leaflet order', () => {
    const sf: Coord = [-122.431272, 37.778008] // [lon, lat]
    expect(toLatLng(sf)).toEqual([37.778008, -122.431272]) // [lat, lng]
  })

  it('swaps every point in a path, preserving order', () => {
    const path: Coord[] = [
      [-122.4, 37.7],
      [-121.4, 38.5],
      [-119.8, 39.5],
    ]
    expect(toLatLngPath(path)).toEqual([
      [37.7, -122.4],
      [38.5, -121.4],
      [39.5, -119.8],
    ])
  })

  it('returns an empty array for an empty path', () => {
    expect(toLatLngPath([])).toEqual([])
  })

  it('formats a coord as "lat, lon" with 5 decimals', () => {
    expect(formatCoord([-122.431272, 37.778008])).toBe('37.77801, -122.43127')
  })

  it('formats null/undefined as an em dash', () => {
    expect(formatCoord(null)).toBe('—')
    expect(formatCoord(undefined)).toBe('—')
  })
})
