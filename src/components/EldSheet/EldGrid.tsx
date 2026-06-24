import type { DutyStatus, LogSheet, Stop } from '../../api/types'
import { isoLocalDate, isoLocalMinutes, minutesToHHMM, roundHours } from '../../lib/format'
import { STATUS_COLORS, STATUS_ROWS, minuteToX, rowIndex, totalsSum } from '../../lib/grid'

/** SVG geometry — single source for drawing. 24h wide × 4 rows tall. */
const GRID_LEFT = 96
const HOUR_W = 34
const GRID_W = HOUR_W * 24 // 816
const GRID_TOP = 36
const ROW_H = 34
const GRID_H = ROW_H * 4 // 136
const TOTAL_COL_W = 58
const WIDTH = GRID_LEFT + GRID_W + TOTAL_COL_W // 970
const BOTTOM_AXIS = GRID_TOP + GRID_H
const REMARKS_TOP = BOTTOM_AXIS + 26
const HEIGHT = REMARKS_TOP + 138

const TOTAL_COL_X = GRID_LEFT + GRID_W
const TOTAL_COL_CX = TOTAL_COL_X + TOTAL_COL_W / 2

/** Two-line row labels, matching the FMCSA paper form. */
const ROW_LABEL_LINES: Record<DutyStatus, string[]> = {
  OFF: ['Off', 'Duty'],
  SB: ['Sleeper', 'Berth'],
  D: ['Driving'],
  ON: ['On Duty', '(Not Driving)'],
}

function rowCenterY(rowIdx: number): number {
  return GRID_TOP + rowIdx * ROW_H + ROW_H / 2
}

/** Reference labels: Midnight / 2…11 / Noon / 13…23 / Midnight (hour 1 blank). */
export function hourLabel(h: number): string {
  if (h === 0 || h === 24) return 'Midnight'
  if (h === 12) return 'Noon'
  if (h === 1) return ''
  return String(h)
}

/** A duty change gets a city/state callout under the grid (signature of a real log). */
export function isPlaceCallout(note: string, location: string, status: DutyStatus): boolean {
  const loc = location?.trim()
  if (!loc) return false
  if (/^en[ -]?route/i.test(loc)) return false // driving spans aren't a place
  if (status === 'OFF' && /^off duty$/i.test(note.trim())) return false // overnight padding
  return true
}

export function EldGrid({ sheet, stops = [] }: { sheet: LogSheet; stops?: Stop[] }) {
  const segs = [...sheet.segments].sort((a, b) => a.start_minute - b.start_minute)
  const x = (m: number) => minuteToX(m, GRID_LEFT, GRID_W)
  const sum = totalsSum(sheet.totals)
  const callouts = segs.filter((s) => isPlaceCallout(s.note, s.location, s.status))

  // Stops carry the real reverse-geocoded "City, ST"; segments may be generic
  // ("Rest area"). Match a stop to a segment by this day's local start minute and
  // prefer the stop's city for the official under-grid remarks.
  const stopCityByMinute = new Map<number, string>()
  for (const s of stops) {
    if (isoLocalDate(s.start) !== sheet.date) continue
    const min = isoLocalMinutes(s.start)
    if (min != null && s.location) stopCityByMinute.set(min, s.location)
  }
  const calloutLabel = (startMinute: number, fallback: string) =>
    stopCityByMinute.get(startMinute) ?? fallback

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full min-w-[760px]"
      role="img"
      aria-label={`ELD duty status grid for ${sheet.date}`}
    >
      {/* Row background bands */}
      {STATUS_ROWS.map((s, i) => (
        <rect
          key={`band-${s}`}
          x={GRID_LEFT}
          y={GRID_TOP + i * ROW_H}
          width={GRID_W}
          height={ROW_H}
          fill={STATUS_COLORS[s]}
          opacity={0.05}
        />
      ))}

      {/* Minor quarter-hour vertical lines (full grid height) */}
      {Array.from({ length: 24 }, (_, h) =>
        [15, 30, 45].map((q) => {
          const tx = GRID_LEFT + h * HOUR_W + (q / 60) * HOUR_W
          return (
            <line
              key={`q-${h}-${q}`}
              x1={tx}
              y1={GRID_TOP}
              x2={tx}
              y2={GRID_TOP + GRID_H}
              stroke={q === 30 ? '#d7dee8' : '#eaeef3'}
              strokeWidth={0.8}
            />
          )
        }),
      )}

      {/* Hour vertical lines + top/bottom labels */}
      {Array.from({ length: 25 }, (_, h) => {
        const hx = GRID_LEFT + h * HOUR_W
        const major = h === 0 || h === 12 || h === 24
        const anchor = h === 0 ? 'start' : h === 24 ? 'end' : 'middle'
        return (
          <g key={`hour-${h}`}>
            <line
              x1={hx}
              y1={GRID_TOP}
              x2={hx}
              y2={GRID_TOP + GRID_H}
              stroke={major ? '#64748b' : '#9aa7b8'}
              strokeWidth={major ? 1.2 : 0.9}
            />
            <text
              x={hx}
              y={GRID_TOP - 7}
              textAnchor={anchor}
              fontSize={9}
              fontWeight={major ? 700 : 500}
              fill={major ? '#1c2433' : '#64748b'}
            >
              {hourLabel(h)}
            </text>
            <text
              x={hx}
              y={BOTTOM_AXIS + 12}
              textAnchor={anchor}
              fontSize={9}
              fontWeight={major ? 700 : 500}
              fill={major ? '#1c2433' : '#94a3b8'}
            >
              {hourLabel(h)}
            </text>
          </g>
        )
      })}

      {/* Outer frame + row separators */}
      <rect x={GRID_LEFT} y={GRID_TOP} width={GRID_W} height={GRID_H} fill="none" stroke="#64748b" strokeWidth={1.3} />
      {[1, 2, 3].map((i) => (
        <line
          key={`hsep-${i}`}
          x1={GRID_LEFT}
          y1={GRID_TOP + i * ROW_H}
          x2={GRID_LEFT + GRID_W}
          y2={GRID_TOP + i * ROW_H}
          stroke="#94a3b8"
          strokeWidth={1}
        />
      ))}

      {/* Row labels (full names, two lines) */}
      {STATUS_ROWS.map((s, i) => {
        const lines = ROW_LABEL_LINES[s]
        const cy = rowCenterY(i)
        const startY = cy - ((lines.length - 1) * 11) / 2
        return (
          <g key={`label-${s}`}>
            {lines.map((ln, li) => (
              <text
                key={li}
                x={GRID_LEFT - 8}
                y={startY + li * 11}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={600}
                fill="#334155"
              >
                {ln}
              </text>
            ))}
          </g>
        )
      })}

      {/* TOTAL HOURS column */}
      <text x={TOTAL_COL_CX} y={GRID_TOP - 18} textAnchor="middle" fontSize={9} fontWeight={700} fill="#1c2433">
        TOTAL
      </text>
      <text x={TOTAL_COL_CX} y={GRID_TOP - 7} textAnchor="middle" fontSize={9} fontWeight={700} fill="#1c2433">
        HOURS
      </text>
      {STATUS_ROWS.map((s, i) => (
        <text
          key={`tot-${s}`}
          x={TOTAL_COL_CX}
          y={rowCenterY(i)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontWeight={700}
          fill="#1c2433"
        >
          {roundHours(sheet.totals[s] ?? 0)}
        </text>
      ))}

      {/* Duty-status line: colored horizontals + connectors at each change */}
      {segs.map((seg, i) => {
        const y = rowCenterY(rowIndex(seg.status))
        const x1 = x(seg.start_minute)
        const x2 = x(seg.end_minute)
        return (
          <g key={`seg-${i}`}>
            {i > 0 && (
              <line
                x1={x1}
                y1={rowCenterY(rowIndex(segs[i - 1].status))}
                x2={x1}
                y2={y}
                stroke="#334155"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            )}
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={STATUS_COLORS[seg.status]} strokeWidth={3.4} strokeLinecap="round">
              <title>
                {minutesToHHMM(seg.start_minute)}–{minutesToHHMM(seg.end_minute)} · {seg.note}
                {seg.location ? ` @ ${seg.location}` : ''}
              </title>
            </line>
          </g>
        )
      })}

      {/* Numbered change markers (keyed to the remarks list) */}
      {segs.map((seg, i) => {
        const cx = x(seg.start_minute)
        const cy = rowCenterY(rowIndex(seg.status))
        return (
          <g key={`mk-${i}`}>
            <circle cx={cx} cy={cy} r={6.5} fill="#fff" stroke={STATUS_COLORS[seg.status]} strokeWidth={1.6} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={700} fill="#1c2433">
              {i + 1}
            </text>
          </g>
        )
      })}

      {/* REMARKS lane — city/state callouts under the grid with bracket connectors */}
      <text x={GRID_LEFT - 8} y={REMARKS_TOP} textAnchor="end" dominantBaseline="central" fontSize={10} fontWeight={700} fill="#334155">
        REMARKS
      </text>
      <line x1={GRID_LEFT} y1={REMARKS_TOP} x2={GRID_LEFT + GRID_W} y2={REMARKS_TOP} stroke="#cbd5e1" strokeWidth={1} />
      <text x={TOTAL_COL_CX} y={REMARKS_TOP} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={800} fill={Math.abs(sum - 24) > 0.02 ? '#dc2626' : '#1c2433'}>
        ={roundHours(sum)}
      </text>

      {callouts.map((seg, i) => {
        const x1 = x(seg.start_minute)
        const x2 = x(seg.end_minute)
        const cx = (x1 + x2) / 2
        const legUp = 7
        return (
          <g key={`rmk-${i}`} stroke={STATUS_COLORS[seg.status]}>
            {/* bracket: bottom bar + legs up toward the grid */}
            <line x1={x1} y1={REMARKS_TOP + legUp} x2={x2} y2={REMARKS_TOP + legUp} strokeWidth={1.3} />
            <line x1={x1} y1={REMARKS_TOP} x2={x1} y2={REMARKS_TOP + legUp} strokeWidth={1.3} />
            <line x1={x2} y1={REMARKS_TOP} x2={x2} y2={REMARKS_TOP + legUp} strokeWidth={1.3} />
            {/* rotated city/state label */}
            <text
              transform={`translate(${cx}, ${REMARKS_TOP + legUp + 4}) rotate(-55)`}
              textAnchor="end"
              fontSize={9.5}
              fontWeight={600}
              fill="#334155"
              stroke="none"
            >
              {calloutLabel(seg.start_minute, seg.location)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
