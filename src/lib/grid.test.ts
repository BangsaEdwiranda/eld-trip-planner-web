import { describe, it, expect } from 'vitest'
import {
  MINUTES_PER_DAY,
  STATUS_ROWS,
  rowIndex,
  minuteFraction,
  minuteToX,
  totalsSum,
} from './grid'

describe('grid — minute→x and status→row math', () => {
  it('fixes the FMCSA row order OFF/SB/D/ON', () => {
    expect(STATUS_ROWS).toEqual(['OFF', 'SB', 'D', 'ON'])
    expect(rowIndex('OFF')).toBe(0)
    expect(rowIndex('SB')).toBe(1)
    expect(rowIndex('D')).toBe(2)
    expect(rowIndex('ON')).toBe(3)
  })

  it('maps a minute to a 0–1 fraction of the day', () => {
    expect(minuteFraction(0)).toBe(0)
    expect(minuteFraction(720)).toBe(0.5)
    expect(minuteFraction(MINUTES_PER_DAY)).toBe(1)
  })

  it('clamps out-of-range minutes', () => {
    expect(minuteFraction(-100)).toBe(0)
    expect(minuteFraction(9999)).toBe(1)
  })

  it('places a minute at the right x within [left, left+width]', () => {
    // 6:00 (360 min) is a quarter of the day → left + 0.25 * width
    expect(minuteToX(360, 100, 800)).toBe(100 + 0.25 * 800)
    expect(minuteToX(0, 100, 800)).toBe(100)
    expect(minuteToX(MINUTES_PER_DAY, 100, 800)).toBe(900)
  })

  it('sums the four duty totals', () => {
    expect(totalsSum({ OFF: 10, SB: 1.75, D: 7.75, ON: 4.5 })).toBeCloseTo(24, 5)
    expect(totalsSum({ OFF: 0, SB: 0, D: 0, ON: 0 })).toBe(0)
  })
})
