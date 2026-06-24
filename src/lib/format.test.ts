import { describe, it, expect } from 'vitest'
import {
  minutesToHHMM,
  hoursToHM,
  roundHours,
  isoToTripTime,
  isoLocalMinutes,
  isoLocalDate,
  formatSheetDate,
  formatMiles,
  tzAbbreviation,
} from './format'

describe('minutesToHHMM', () => {
  it('formats minutes-from-midnight as 24h HH:MM', () => {
    expect(minutesToHHMM(0)).toBe('00:00')
    expect(minutesToHHMM(630)).toBe('10:30')
    expect(minutesToHHMM(1440)).toBe('24:00')
  })
})

describe('hoursToHM', () => {
  it('formats decimal hours compactly', () => {
    expect(hoursToHM(5.67)).toBe('5h 40m')
    expect(hoursToHM(2)).toBe('2h')
    expect(hoursToHM(0.5)).toBe('30m')
    expect(hoursToHM(0)).toBe('0m')
  })
})

describe('roundHours', () => {
  it('trims trailing zeros', () => {
    expect(roundHours(24)).toBe('24')
    expect(roundHours(5.666)).toBe('5.67')
    expect(roundHours(2.0)).toBe('2')
  })
})

describe('isoToTripTime — reads the wall clock from the ISO offset, not the viewer tz', () => {
  it('renders the time as written in the timestamp, regardless of offset', () => {
    expect(isoToTripTime('2026-06-23T10:30:26.900000+00:00')).toBe('10:30 AM')
    expect(isoToTripTime('2026-06-23T14:40:58.600000-07:00')).toBe('2:40 PM')
  })

  it('handles midnight and noon', () => {
    expect(isoToTripTime('2026-06-23T00:15:00-07:00')).toBe('12:15 AM')
    expect(isoToTripTime('2026-06-23T12:00:00-07:00')).toBe('12:00 PM')
    expect(isoToTripTime('2026-06-23T23:05:00-07:00')).toBe('11:05 PM')
  })

  it('returns empty string for an unparseable value', () => {
    expect(isoToTripTime('not-a-date')).toBe('')
  })
})

describe('isoLocalMinutes / isoLocalDate', () => {
  it('extracts day-local minutes from the ISO wall clock', () => {
    expect(isoLocalMinutes('2026-06-23T10:30:00-07:00')).toBe(630)
    expect(isoLocalMinutes('2026-06-23T00:00:00-07:00')).toBe(0)
    expect(isoLocalMinutes('bad')).toBeNull()
  })

  it('extracts the local calendar date', () => {
    expect(isoLocalDate('2026-06-23T10:30:00-07:00')).toBe('2026-06-23')
  })
})

describe('formatSheetDate / formatMiles', () => {
  it('formats a YYYY-MM-DD as a readable date (no tz shift)', () => {
    const s = formatSheetDate('2026-06-23')
    expect(s).toMatch(/Jun/)
    expect(s).toMatch(/23/)
    expect(s).toMatch(/2026/)
  })

  it('formats miles', () => {
    expect(formatMiles(222.3)).toBe('222.3 mi')
  })
})

describe('tzAbbreviation', () => {
  it('derives the short zone abbreviation at a reference instant (DST-aware)', () => {
    // Late June in Los Angeles is PDT; January is PST.
    expect(tzAbbreviation('America/Los_Angeles', '2026-06-23T12:00:00-07:00')).toBe('PDT')
    expect(tzAbbreviation('America/Los_Angeles', '2026-01-15T12:00:00-08:00')).toBe('PST')
  })

  it('returns empty string for a missing zone', () => {
    expect(tzAbbreviation('')).toBe('')
  })
})
