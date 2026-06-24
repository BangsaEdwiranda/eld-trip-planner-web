import type { LogSheet } from '../../api/types'
import { minutesToHHMM, hoursToHM } from '../../lib/format'
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/grid'

/**
 * Numbered per-segment breakdown, keyed to the on-grid markers. This is a
 * SCREEN-ONLY reading aid — it is NOT part of the official daily log (the
 * official remarks are the under-grid callouts), so it's hidden on print and
 * intentionally not titled "Remarks".
 */
export function RemarksList({ sheet }: { sheet: LogSheet }) {
  const segs = [...sheet.segments].sort((a, b) => a.start_minute - b.start_minute)
  if (segs.length === 0) return null

  return (
    <div className="duty-breakdown border-t border-slate-200 px-5 py-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Duty status detail
      </p>
      <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {segs.map((seg, i) => {
          const dur = (seg.end_minute - seg.start_minute) / 60
          return (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: STATUS_COLORS[seg.status] }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-xs font-semibold tabular-nums text-ink">
                    {minutesToHHMM(seg.start_minute)}–{minutesToHHMM(seg.end_minute)}
                  </span>
                  <span className="text-xs text-slate-400">({hoursToHM(dur)})</span>
                  <span className="text-xs font-medium" style={{ color: STATUS_COLORS[seg.status] }}>
                    {STATUS_LABELS[seg.status]}
                  </span>
                </div>
                <p className="truncate text-sm text-slate-600">
                  {seg.note}
                  {seg.location ? <span className="text-slate-400"> · {seg.location}</span> : null}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
