import type { ReactNode } from 'react'
import type { LogSheet, Trip } from '../../api/types'
import type { DerivedSheetMeta } from '../../lib/derive'
import { formatMiles, formatSheetDate } from '../../lib/format'
import { TimezoneNote } from '../ui/TimezoneNote'
import type { LogMeta } from './logMeta'

interface Props {
  sheet: LogSheet
  trip: Trip
  meta: DerivedSheetMeta
  logMeta: LogMeta
  onLogMetaChange: (patch: Partial<LogMeta>) => void
}

/** A ruled field with a caption beneath — the look of the paper FMCSA form. */
function FieldLine({
  caption,
  children,
  className = '',
}: {
  caption: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex min-h-[26px] items-end justify-center border-b border-slate-400 px-1 pb-0.5 text-center text-sm font-semibold text-ink">
        {children}
      </div>
      <div className="mt-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {caption}
      </div>
    </div>
  )
}

/** Editable (UI-only) operator field, styled as a blank ruled line. */
function EditableLine({
  caption,
  value,
  placeholder,
  onChange,
  className = '',
}: {
  caption: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={className}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[26px] w-full border-b border-slate-400 bg-transparent px-1 pb-0.5 text-center text-sm font-semibold text-ink placeholder:font-normal placeholder:text-slate-300 focus:border-brand-500 focus:outline-none"
      />
      <div className="mt-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {caption}
      </div>
    </div>
  )
}

export function EldSheetHeader({ sheet, trip, meta, logMeta, onLogMetaChange }: Props) {
  const [y, m, d] = sheet.date.split('-')

  return (
    <header className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-5 py-4">
      {/* Title row */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          U.S. Department of Transportation
        </p>
        <div className="text-center">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink">Driver's Daily Log</h3>
          <p className="text-[10px] text-slate-400">(one calendar day — 24 hours)</p>
        </div>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-brand-600 px-2.5 text-xs font-bold text-white">
          Day {sheet.day_index + 1}
          <span className="font-medium opacity-80">· {formatSheetDate(sheet.date)}</span>
        </span>
      </div>

      {/* Date + miles + vehicle */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div className="grid grid-cols-3 gap-1.5">
          <FieldLine caption="Month">{m}</FieldLine>
          <FieldLine caption="Day">{d}</FieldLine>
          <FieldLine caption="Year">{y}</FieldLine>
        </div>
        <FieldLine caption="Total miles driving today">
          {formatMiles(meta.milesEstimate)}
          {meta.milesAreEstimated && <span className="ml-1 text-[10px] font-normal text-slate-400">(est.)</span>}
        </FieldLine>
        <EditableLine
          caption="Vehicle numbers (show each unit)"
          value={logMeta.vehicle}
          placeholder="Truck / trailer #"
          onChange={(v) => onLogMetaChange({ vehicle: v })}
        />
        <FieldLine caption="From → To">
          <span className="truncate text-xs">
            {meta.fromLocation} → {meta.toLocation}
          </span>
        </FieldLine>
      </div>

      {/* Carrier + signature / office + co-driver */}
      <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <EditableLine
          caption="Name of carrier or carriers"
          value={logMeta.carrier}
          placeholder="Carrier name"
          onChange={(v) => onLogMetaChange({ carrier: v })}
        />
        <FieldLine caption="Driver's signature in full">
          <span className="text-slate-300">&nbsp;</span>
        </FieldLine>
        <EditableLine
          caption="Main office address"
          value={logMeta.office}
          placeholder="Main office address"
          onChange={(v) => onLogMetaChange({ office: v })}
        />
        <EditableLine
          caption="Name of co-driver"
          value={logMeta.coDriver}
          placeholder="Co-driver (if any)"
          onChange={(v) => onLogMetaChange({ coDriver: v })}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <EditableLine
          caption="Pro or shipping no."
          value={logMeta.shipping}
          placeholder="Shipping #"
          onChange={(v) => onLogMetaChange({ shipping: v })}
          className="w-40"
        />
        <TimezoneNote trip={trip} />
      </div>
    </header>
  )
}
