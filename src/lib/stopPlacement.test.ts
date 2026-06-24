import { describe, it, expect } from 'vitest'
import { placeStops } from './stopPlacement'
import type { Trip } from '../api/types'

function tripWithStops(): Trip {
  return {
    pickup_coords: [-121.46, 38.57],
    dropoff_coords: [-119.8, 39.5],
    stops: [
      { type: 'Pickup (loading)', status: 'ON', start: '', end: '', location: 'Sacramento, CA', coords: [-121.46, 38.57] },
      { type: 'Fueling', status: 'ON', start: '', end: '', location: 'Lodi, CA', coords: [-120.0, 39.0] },
      { type: '30-min break', status: 'OFF', start: '', end: '', location: 'Rest area', coords: null },
      { type: '10-hour reset', status: 'SB', start: '', end: '', location: 'Truckee, CA', coords: [-119.9, 39.4] },
      { type: 'Dropoff (unloading)', status: 'ON', start: '', end: '', location: 'Reno, NV', coords: [-119.8, 39.5] },
    ],
  } as unknown as Trip
}

describe('placeStops — markers for rest/fuel stops from backend coords', () => {
  const placed = placeStops(tripWithStops())

  it('excludes pickup, dropoff, and null-coord stops', () => {
    expect(placed).toHaveLength(2) // Fueling + 10-hour reset only
    expect(placed.map((p) => p.stop.type)).toEqual(['Fueling', '10-hour reset'])
  })

  it('preserves the original stop index and uses the backend coords (no interpolation)', () => {
    expect(placed[0].index).toBe(1)
    expect(placed[0].coord).toEqual([-120.0, 39.0])
    expect(placed[1].index).toBe(3)
    expect(placed[1].coord).toEqual([-119.9, 39.4])
  })

  it('returns nothing when there are no stops', () => {
    expect(placeStops({ stops: [] } as unknown as Trip)).toEqual([])
  })
})
