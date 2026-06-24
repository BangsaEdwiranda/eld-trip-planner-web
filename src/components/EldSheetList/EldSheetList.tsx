import type { Trip } from '../../api/types'
import { Legend } from '../ui/Legend'
import { EldSheet } from '../EldSheet/EldSheet'
import type { LogMeta } from '../EldSheet/logMeta'

interface Props {
  trip: Trip
  logMeta: LogMeta
  onLogMetaChange: (patch: Partial<LogMeta>) => void
}

export function EldSheetList({ trip, logMeta, onLogMetaChange }: Props) {
  const sheets = [...trip.log_sheets].sort((a, b) => a.day_index - b.day_index)

  return (
    <section aria-label="ELD daily log sheets" className="space-y-5 print-area">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-lg font-semibold text-ink">Daily log sheets</h2>
          <p className="text-sm text-slate-500">
            {sheets.length} {sheets.length === 1 ? 'day' : 'days'} · one FMCSA log sheet per day
          </p>
        </div>
        {sheets.length > 1 && (
          <nav className="hidden gap-1.5 sm:flex" aria-label="Jump to day">
            {sheets.map((s) => (
              <a
                key={s.day_index}
                href={`#sheet-${s.day_index}`}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                Day {s.day_index + 1}
              </a>
            ))}
          </nav>
        )}
      </div>

      {/* Duty-status legend belongs with the grid (it's time, not space) */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 no-print">
        <span className="text-xs font-medium text-slate-400">Duty status</span>
        <Legend />
      </div>

      {sheets.map((sheet) => (
        <div key={sheet.day_index} id={`sheet-${sheet.day_index}`} className="eld-page scroll-mt-24">
          <EldSheet sheet={sheet} trip={trip} logMeta={logMeta} onLogMetaChange={onLogMetaChange} />
        </div>
      ))}
    </section>
  )
}
