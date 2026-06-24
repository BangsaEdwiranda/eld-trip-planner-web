import type { DutyStatus } from '../api/types'

/**
 * Single source of truth for ELD grid geometry and the status→row mapping.
 * Components must read placement from here — never inline `minute / 1440`.
 */

export const MINUTES_PER_DAY = 1440

/** Row order is fixed by FMCSA convention: OFF / SB / D / ON, top to bottom. */
export const STATUS_ROWS: DutyStatus[] = ['OFF', 'SB', 'D', 'ON']

export const STATUS_LABELS: Record<DutyStatus, string> = {
  OFF: 'Off Duty',
  SB: 'Sleeper Berth',
  D: 'Driving',
  ON: 'On Duty (not driving)',
}

export const STATUS_SHORT: Record<DutyStatus, string> = {
  OFF: '1. OFF',
  SB: '2. SB',
  D: '3. D',
  ON: '4. ON',
}

/** Shared duty-status colors — keep in sync with tailwind `duty.*`. */
export const STATUS_COLORS: Record<DutyStatus, string> = {
  OFF: '#64748b',
  SB: '#7c3aed',
  D: '#059669',
  ON: '#ea580c',
}

/** 0-based row index for a status (OFF=0 … ON=3). */
export function rowIndex(status: DutyStatus): number {
  return STATUS_ROWS.indexOf(status)
}

/**
 * Fraction (0–1) of the day for a given minute. Multiply by the grid's
 * drawable width to get an x-coordinate. No rounding/snapping.
 */
export function minuteFraction(minute: number): number {
  return Math.min(Math.max(minute, 0), MINUTES_PER_DAY) / MINUTES_PER_DAY
}

/** Map a minute to an x pixel within [left, left+width]. */
export function minuteToX(minute: number, left: number, width: number): number {
  return left + minuteFraction(minute) * width
}

/** Sum of the four status totals (should be ~24 on full interior days). */
export function totalsSum(totals: Record<DutyStatus, number>): number {
  return STATUS_ROWS.reduce((acc, s) => acc + (totals[s] ?? 0), 0)
}
