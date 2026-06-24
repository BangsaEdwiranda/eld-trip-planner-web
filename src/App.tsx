import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiError, api } from './api/client'
import type { Trip, TripRequest } from './api/types'
import { TripForm } from './components/TripForm/TripForm'
import { RouteMap } from './components/RouteMap/RouteMap'
import { StopsTimeline } from './components/StopsTimeline/StopsTimeline'
import { EldSheetList } from './components/EldSheetList/EldSheetList'
import { Header } from './components/ui/Header'
import { ErrorBanner } from './components/ui/ErrorBanner'
import { TripSummary } from './components/ui/TripSummary'
import { MapLegend } from './components/RouteMap/MapLegend'
import { LoadingState } from './components/ui/LoadingState'
import { EmptyState } from './components/ui/EmptyState'
import { TimezoneNote } from './components/ui/TimezoneNote'
import { EMPTY_LOG_META, type LogMeta } from './components/EldSheet/logMeta'

function readTripIdFromUrl(): number | null {
  const id = new URLSearchParams(window.location.search).get('trip')
  const n = id ? Number(id) : NaN
  return Number.isFinite(n) ? n : null
}

function setTripIdInUrl(id: number | null) {
  const url = new URL(window.location.href)
  if (id == null) url.searchParams.delete('trip')
  else url.searchParams.set('trip', String(id))
  window.history.replaceState(null, '', url.toString())
}

export default function App() {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [lastRequest, setLastRequest] = useState<TripRequest | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [hoveredStop, setHoveredStop] = useState<number | null>(null)
  const [logMeta, setLogMeta] = useState<LogMeta>(EMPTY_LOG_META)
  const [restoreId] = useState<number | null>(() => readTripIdFromUrl())

  // Restore a previously planned trip on refresh (?trip=<id>).
  const restore = useQuery({
    queryKey: ['trip', restoreId],
    queryFn: () => api.getTrip(restoreId as number),
    enabled: restoreId != null && trip == null,
    retry: 0,
  })
  useEffect(() => {
    if (restore.data) setTrip(restore.data)
  }, [restore.data])
  // A stale/invalid ?trip=<id> can't be restored — clear it from the URL so it
  // doesn't promise a shareable trip it can't deliver, and tell the user once.
  useEffect(() => {
    if (restore.isError) {
      setTripIdInUrl(null)
      setBannerError("That saved trip couldn't be loaded — it may have expired. Plan a new one below.")
    }
  }, [restore.isError])

  const mutation = useMutation({
    mutationFn: (body: TripRequest) => api.planTrip(body),
    onMutate: (body) => {
      setLastRequest(body)
      setBannerError(null)
    },
    onSuccess: (data) => {
      setTrip(data)
      setTripIdInUrl(data.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (err) => {
      // Field errors render inline in the form; surface detail/network as a banner.
      if (err instanceof ApiError && !err.fieldErrors) setBannerError(err.message)
      else if (!(err instanceof ApiError)) setBannerError('Unexpected error. Please try again.')
    },
  })

  const serverFieldErrors =
    mutation.error instanceof ApiError ? mutation.error.fieldErrors : undefined

  const isLoading = mutation.isPending
  const showResults = trip && !isLoading

  // Seed the form from the active trip so a `?trip=<id>` refresh repopulates the
  // inputs (the API echoes them back), not just the results.
  const formSeed = trip
    ? {
        key: trip.id,
        values: {
          current_location: trip.current_location,
          pickup_location: trip.pickup_location,
          dropoff_location: trip.dropoff_location,
          current_cycle_used_hours: trip.current_cycle_used_hours,
        },
      }
    : null

  return (
    <div className="min-h-full">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Sidebar form */}
          <aside className="lg:sticky lg:top-20 lg:self-start no-print">
            <div className="card p-5">
              <TripForm
                onSubmit={(body) => mutation.mutate(body)}
                isSubmitting={isLoading}
                serverFieldErrors={serverFieldErrors}
                seed={formSeed}
              />
            </div>
          </aside>

          {/* Results column */}
          <section className="min-w-0 space-y-5">
            {bannerError && (
              <ErrorBanner message={bannerError} onDismiss={() => setBannerError(null)} />
            )}

            {restore.isLoading && restoreId != null && !trip && (
              <LoadingState request={null} />
            )}

            {isLoading && <LoadingState request={lastRequest} />}

            {!isLoading && !trip && !restore.isLoading && <EmptyState />}

            {showResults && (
              <>
                <ResultsHeader trip={trip} />

                <div className="space-y-5 no-print">
                <TripSummary trip={trip} />

                <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                  <div className="card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                      <h2 className="text-sm font-semibold text-ink">Route</h2>
                      <MapLegend />
                    </div>
                    <div className="h-[420px]">
                      <RouteMap
                        trip={trip}
                        activeStopKey={hoveredStop}
                        onHoverStop={setHoveredStop}
                      />
                    </div>
                  </div>

                  <div className="card flex flex-col overflow-hidden">
                    <div className="border-b border-slate-200 px-4 py-2.5">
                      <h2 className="text-sm font-semibold text-ink">Stops & rests</h2>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto p-3">
                      <StopsTimeline
                        trip={trip}
                        activeStopKey={hoveredStop}
                        onHoverStop={setHoveredStop}
                      />
                    </div>
                  </div>
                </div>
                </div>

                <EldSheetList
                  trip={trip}
                  logMeta={logMeta}
                  onLogMetaChange={(patch) => setLogMeta((m) => ({ ...m, ...patch }))}
                />
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-slate-400 sm:px-6 no-print">
        ELD Trip Planner · FMCSA Hours-of-Service route &amp; daily logs · map ©
        OpenStreetMap contributors
      </footer>
    </div>
  )
}

function ResultsHeader({ trip }: { trip: Trip }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 no-print">
      <div>
        <h2 className="text-xl font-bold text-ink">Trip plan</h2>
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <span className="font-medium text-slate-700">{trip.current_location}</span>
          <span className="text-slate-300">→</span>
          <span className="font-medium text-slate-700">{trip.pickup_location}</span>
          <span className="text-slate-300">→</span>
          <span className="font-medium text-slate-700">{trip.dropoff_location}</span>
        </p>
        <TimezoneNote trip={trip} className="mt-1" />
      </div>
      <div className="flex flex-col items-end gap-1">
        <button onClick={() => window.print()} className="btn-ghost">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5 2.75A.75.75 0 015.75 2h8.5a.75.75 0 01.75.75V6h.25A2.75 2.75 0 0118 8.75v3.5A2.75 2.75 0 0115.25 15H15v2.25a.75.75 0 01-.75.75h-8.5a.75.75 0 01-.75-.75V15h-.25A2.75 2.75 0 011 12.25v-3.5A2.75 2.75 0 013.75 6H4V2.75zm1.5.75V6h7V3.5h-7zm7 9h-7v3.75h7V12.5z"
              clipRule="evenodd"
            />
          </svg>
          Print / Export PDF
        </button>
        <p className="max-w-[16rem] text-right text-[11px] text-slate-400">
          Header/footer are hidden automatically. If your browser still shows them, uncheck{' '}
          <span className="font-medium text-slate-500">"Headers and footers"</span> in the print dialog.
        </p>
      </div>
    </div>
  )
}
