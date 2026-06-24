import type { TripRequest } from '../../api/types'

/** Skeleton shown during the slow POST — echoes the submitted inputs. */
export function LoadingState({ request }: { request?: TripRequest | null }) {
  return (
    <div className="space-y-5">
      {request && (
        <div className="card flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 text-sm">
          <span className="font-medium text-ink">{request.current_location}</span>
          <Arrow />
          <span className="font-medium text-ink">{request.pickup_location}</span>
          <Arrow />
          <span className="font-medium text-ink">{request.dropoff_location}</span>
          <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
            Routing & simulating Hours-of-Service…
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card shimmer h-20 bg-slate-100" />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="card shimmer h-[380px] bg-slate-100" />
        <div className="card shimmer h-[380px] bg-slate-100" />
      </div>

      <div className="card shimmer h-64 bg-slate-100" />
    </div>
  )
}

function Arrow() {
  return (
    <svg className="h-4 w-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}
