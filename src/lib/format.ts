/** Display formatters. Pure presentation — no HOS logic lives here. */

/** Minutes-from-midnight (0–1440) → `HH:MM` (24h). 1440 renders as `24:00`. */
export function minutesToHHMM(minute: number): string {
  const m = Math.round(minute)
  const hh = Math.floor(m / 60)
  const mm = m % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** A decimal hours value → compact human string, e.g. 5.67 → "5h 40m". */
export function hoursToHM(hours: number): string {
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Round hours for tidy right-edge display (2 decimals, trailing zeros trimmed). */
export function roundHours(hours: number): string {
  return parseFloat(hours.toFixed(2)).toString()
}

/**
 * ISO datetime → time-of-day like "10:30 AM", read from the timestamp's OWN
 * wall clock (the offset baked into the string), NOT the viewer's browser
 * timezone. This is deliberate: the ELD grid's `start_minute` is the trip's
 * day-local time, so the stops/timeline must show the same wall clock or they'd
 * disagree with the grid when the viewer sits in a different timezone.
 */
export function isoToTripTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/)
  if (!m) return ''
  let h = parseInt(m[1], 10)
  const min = m[2]
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${min} ${ampm}`
}

/**
 * Short zone abbreviation (e.g. "MDT", "PST") for the trip's IANA zone, computed
 * at a reference instant so DST is correct. Falls back to the raw zone name.
 */
export function tzAbbreviation(timeZone: string, referenceIso?: string): string {
  if (!timeZone) return ''
  try {
    const date = referenceIso ? new Date(referenceIso) : new Date()
    const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')
    return part?.value ?? ''
  } catch {
    return ''
  }
}

/** Minutes-from-midnight read from an ISO timestamp's own wall clock (its offset). */
export function isoLocalMinutes(iso: string): number | null {
  const m = iso.match(/T(\d{2}):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Local calendar date (`YYYY-MM-DD`) from an ISO timestamp, as written. */
export function isoLocalDate(iso: string): string {
  return iso.slice(0, 10)
}

/** `YYYY-MM-DD` → "Tue, Jun 23 2026". Parsed as local date (no tz shift). */
export function formatSheetDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMiles(miles: number): string {
  return `${miles.toLocaleString(undefined, { maximumFractionDigits: 1 })} mi`
}
