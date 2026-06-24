export function EmptyState() {
  return (
    <div className="card flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M5 23 C 11 9, 17 25, 23 12 S 28 9, 28 9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="5" cy="23" r="3.2" fill="currentColor" />
          <circle cx="28" cy="9" r="3.2" fill="#34d399" />
        </svg>
      </span>
      <h2 className="mt-5 text-lg font-semibold text-ink">Plan your first trip</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Enter the driver's current location, pickup, and dropoff. We'll route the trip and draw
        FMCSA-compliant ELD log sheets for every day.
      </p>
      <p className="mt-4 text-xs text-slate-400">
        Tip: use the <span className="font-medium text-slate-500">Load example</span> button to try
        San Francisco → Sacramento → Reno.
      </p>
    </div>
  )
}
