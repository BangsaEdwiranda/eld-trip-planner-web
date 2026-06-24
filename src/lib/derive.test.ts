import { describe, it, expect } from 'vitest'
import { deriveSheetMeta } from './derive'
import type { LogSheet, Trip } from '../api/types'

function makeTrip(): Trip {
  const day0 = {
    date: '2026-06-23',
    day_index: 0,
    from_location: '',
    to_location: '',
    total_miles_driving: 0,
    totals: { OFF: 12, SB: 0, D: 5, ON: 7 },
    segments: [
      { status: 'D', start_minute: 0, end_minute: 300, location: 'En route to pickup', note: 'Driving' },
      { status: 'ON', start_minute: 300, end_minute: 360, location: 'Sacramento, CA', note: 'Pickup (loading)' },
    ],
  }
  const day1 = {
    date: '2026-06-24',
    day_index: 1,
    from_location: '',
    to_location: '',
    total_miles_driving: 0,
    totals: { OFF: 14, SB: 0, D: 10, ON: 0 },
    segments: [
      { status: 'ON', start_minute: 400, end_minute: 460, location: 'Reno, NV', note: 'Dropoff (unloading)' },
    ],
  }
  return {
    current_location: 'San Francisco, CA',
    dropoff_location: 'Reno, NV',
    total_distance_miles: 300,
    log_sheets: [day0, day1] as LogSheet[],
  } as unknown as Trip
}

describe('deriveSheetMeta — fills the API gaps as labeled estimates', () => {
  const trip = makeTrip()

  it('uses trip endpoints for the first/last day From/To', () => {
    const first = deriveSheetMeta(trip.log_sheets[0], trip)
    expect(first.fromLocation).toBe('San Francisco, CA') // first day → current_location
    expect(first.toLocation).toBe('Sacramento, CA') // last active segment of the day

    const last = deriveSheetMeta(trip.log_sheets[1], trip)
    expect(last.toLocation).toBe('Reno, NV') // last day → dropoff_location
  })

  it('apportions total miles across days by driving hours and flags as estimated', () => {
    const first = deriveSheetMeta(trip.log_sheets[0], trip)
    // day0 drives 5h of 15h total → 5/15 * 300 = 100
    expect(first.milesEstimate).toBeCloseTo(100, 5)
    expect(first.milesAreEstimated).toBe(true)

    const last = deriveSheetMeta(trip.log_sheets[1], trip)
    expect(last.milesEstimate).toBeCloseTo(200, 5) // 10/15 * 300
  })

  it('uses the API value (not an estimate) when total_miles_driving is populated', () => {
    const trip2 = makeTrip()
    trip2.log_sheets[0].total_miles_driving = 123.4
    const meta = deriveSheetMeta(trip2.log_sheets[0], trip2)
    expect(meta.milesEstimate).toBe(123.4)
    expect(meta.milesAreEstimated).toBe(false)
  })
})
