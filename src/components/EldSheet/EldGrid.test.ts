import { describe, it, expect } from 'vitest'
import { hourLabel, isPlaceCallout } from './EldGrid'

describe('hourLabel — FMCSA reference hour scale', () => {
  it('labels midnight and noon as words', () => {
    expect(hourLabel(0)).toBe('Midnight')
    expect(hourLabel(24)).toBe('Midnight')
    expect(hourLabel(12)).toBe('Noon')
  })

  it('leaves hour 1 blank (Midnight word occupies the space)', () => {
    expect(hourLabel(1)).toBe('')
  })

  it('uses 24h numbers for the rest', () => {
    expect(hourLabel(2)).toBe('2')
    expect(hourLabel(11)).toBe('11')
    expect(hourLabel(13)).toBe('13')
    expect(hourLabel(23)).toBe('23')
  })
})

describe('isPlaceCallout — which duty changes get an under-grid city/state callout', () => {
  it('includes real stop events with a place', () => {
    expect(isPlaceCallout('Pickup (loading)', 'Sacramento, CA', 'ON')).toBe(true)
    expect(isPlaceCallout('30-min break', 'Truckee, CA', 'OFF')).toBe(true)
    expect(isPlaceCallout('10-hour reset', 'Lodi, CA', 'SB')).toBe(true)
  })

  it('excludes driving "en route" spans (not a place)', () => {
    expect(isPlaceCallout('Driving', 'En route to pickup', 'D')).toBe(false)
    expect(isPlaceCallout('Driving', 'en-route to dropoff', 'D')).toBe(false)
  })

  it('excludes the overnight off-duty padding', () => {
    expect(isPlaceCallout('Off duty', 'Reno, NV', 'OFF')).toBe(false)
  })

  it('excludes anything with no location', () => {
    expect(isPlaceCallout('Pickup (loading)', '', 'ON')).toBe(false)
  })
})
