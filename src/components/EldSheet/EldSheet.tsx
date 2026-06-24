import { useMemo } from 'react'
import type { LogSheet, Trip } from '../../api/types'
import { deriveSheetMeta } from '../../lib/derive'
import { totalsSum } from '../../lib/grid'
import { EldGrid } from './EldGrid'
import { EldSheetHeader } from './EldSheetHeader'
import { RemarksList } from './RemarksList'
import type { LogMeta } from './logMeta'

interface Props {
  sheet: LogSheet
  trip: Trip
  logMeta: LogMeta
  onLogMetaChange: (patch: Partial<LogMeta>) => void
}

export function EldSheet({ sheet, trip, logMeta, onLogMetaChange }: Props) {
  const meta = useMemo(() => deriveSheetMeta(sheet, trip), [sheet, trip])
  const sum = totalsSum(sheet.totals)
  // Every sheet is an off-duty-padded full 24h day, so any sheet not totaling 24h
  // is a data issue to surface, not hide.
  const sumOff = Math.abs(sum - 24) > 0.02

  return (
    <article className="sheet-page card overflow-hidden">
      <EldSheetHeader
        sheet={sheet}
        trip={trip}
        meta={meta}
        logMeta={logMeta}
        onLogMetaChange={onLogMetaChange}
      />

      {/* Grid (with right-edge totals + under-grid remarks callouts) */}
      <div className="overflow-x-auto px-3 py-4">
        <EldGrid sheet={sheet} stops={trip.stops} />
      </div>

      {/* 24-hour integrity check */}
      <div className="px-5 pb-3 no-print">
        {sumOff ? (
          <p className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600">
            ⚠ This day totals {sum.toFixed(2)}h, not 24h — every sheet should. Flagging it rather than hiding it.
          </p>
        ) : (
          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            ✓ Accounts for a full 24 hours
          </p>
        )}
      </div>

      {/* Complementary, accessible duty-change list */}
      <RemarksList sheet={sheet} />
    </article>
  )
}
