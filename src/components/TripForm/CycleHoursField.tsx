interface Props {
  value: number
  error?: string
  onChange: (value: number) => void
}

/** 0–70 hours used, with a synced slider + number input and live "remaining". */
export function CycleHoursField({ value, error, onChange }: Props) {
  const safe = Number.isFinite(value) ? value : 0
  const remaining = Math.max(0, 70 - safe)
  const pct = Math.min(100, Math.max(0, (safe / 70) * 100))

  function set(n: number) {
    onChange(Math.min(70, Math.max(0, n)))
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="label-base mb-0">Cycle hours already used</label>
        <span className="text-xs font-medium text-slate-500">
          <span className="font-semibold text-brand-700">{remaining.toFixed(1)}h</span> remaining of 70
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={70}
          step={0.5}
          value={safe}
          onChange={(e) => set(parseFloat(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
          style={{
            background: `linear-gradient(to right, #1f57e0 ${pct}%, #e2e8f0 ${pct}%)`,
          }}
          aria-label="Cycle hours used"
        />
        <div className="relative w-24">
          <input
            type="number"
            min={0}
            max={70}
            step={0.5}
            value={Number.isFinite(value) ? value : ''}
            onChange={(e) => set(parseFloat(e.target.value))}
            className="input-base pr-7 text-right tabular-nums"
            aria-invalid={!!error}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            h
          </span>
        </div>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
