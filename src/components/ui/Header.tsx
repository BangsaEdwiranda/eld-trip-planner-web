import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export function Header() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.health(),
    staleTime: 60_000,
    retry: 0,
  })

  const status = health.isLoading ? 'checking' : health.isSuccess ? 'online' : 'offline'
  const dot =
    status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-amber-400'
  const label =
    status === 'online' ? 'API online' : status === 'offline' ? 'API unreachable' : 'Checking API…'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path
                d="M5 21 C 10 9, 16 23, 21 12 S 28 9, 28 9"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <circle cx="5" cy="21" r="3" fill="currentColor" />
              <circle cx="27" cy="10" r="3" fill="#34d399" />
            </svg>
          </span>
          <div>
            <h1 className="text-sm font-bold leading-tight text-ink sm:text-base">ELD Trip Planner</h1>
            <p className="text-[11px] leading-tight text-slate-400">Route + Hours-of-Service daily logs</p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"
          title={api.baseUrl}
        >
          <span className={`h-2 w-2 rounded-full ${dot} ${status === 'checking' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium text-slate-600">{label}</span>
        </div>
      </div>
    </header>
  )
}
