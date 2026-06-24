import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { GeoSuggestion } from '../../api/geocode'
import type { ApiFieldErrors, Coord, TripRequest } from '../../api/types'
import { MARKER_COLORS } from '../../lib/mapStyle'
import { LocationAutocomplete } from './LocationAutocomplete'
import { CycleHoursField } from './CycleHoursField'
import { DEFAULT_VALUES, EXAMPLE_VALUES, tripFormSchema, type TripFormValues } from './schema'

export interface ResolvedCoords {
  current?: Coord
  pickup?: Coord
  dropoff?: Coord
}

interface Props {
  onSubmit: (body: TripRequest) => void
  isSubmitting: boolean
  /** Server-side field errors (from a 400) to surface inline. */
  serverFieldErrors?: ApiFieldErrors
  /** Re-seed the form from a planned/restored trip (`key` = trip id). Lets a
   *  `?trip=<id>` refresh repopulate the inputs, not just the results. */
  seed?: { key: number; values: TripFormValues } | null
}

// Field dots match the MAP markers for current/pickup/dropoff (same places),
// not the ELD duty-status colors.
const FIELD_DOTS = {
  current_location: MARKER_COLORS.start,
  pickup_location: MARKER_COLORS.pickup,
  dropoff_location: MARKER_COLORS.dropoff,
}

export function TripForm({ onSubmit, isSubmitting, serverFieldErrors, seed }: Props) {
  const [resolved, setResolved] = useState<ResolvedCoords>({})

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  // Re-seed inputs when a new trip is planned or restored from the URL.
  const seededKey = useRef<number | null>(null)
  useEffect(() => {
    if (seed && seed.key !== seededKey.current) {
      seededKey.current = seed.key
      reset(seed.values)
      setResolved({})
    }
  }, [seed, reset])

  const fieldError = (name: keyof TripFormValues) =>
    errors[name]?.message || serverFieldErrors?.[name]?.[0]

  function submit(values: TripFormValues) {
    onSubmit({
      current_location: values.current_location.trim(),
      pickup_location: values.pickup_location.trim(),
      dropoff_location: values.dropoff_location.trim(),
      current_cycle_used_hours: values.current_cycle_used_hours,
    })
  }

  function loadExample() {
    reset(EXAMPLE_VALUES)
    setResolved({})
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Plan a trip</h2>
        <button type="button" className="text-xs font-medium text-brand-600 hover:text-brand-700" onClick={loadExample}>
          Load example
        </button>
      </div>

      <p className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12a.75.75 0 00-1.5 0v4c0 .27.144.518.378.651l2.75 1.572a.75.75 0 10.744-1.302L10.75 9.566V6z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          The trip <span className="font-medium text-slate-600">starts now and drives straight to the
          pickup</span>, in the current location's local time zone — all log times use that zone.
        </span>
      </p>

      <Controller
        control={control}
        name="current_location"
        render={({ field }) => (
          <LocationAutocomplete
            label="Current location"
            placeholder="Where is the driver now?"
            dotColor={FIELD_DOTS.current_location}
            value={field.value}
            error={fieldError('current_location')}
            onChange={field.onChange}
            onResolve={(s: GeoSuggestion | null) =>
              setResolved((r) => ({ ...r, current: s?.coord }))
            }
          />
        )}
      />

      <Controller
        control={control}
        name="pickup_location"
        render={({ field }) => (
          <LocationAutocomplete
            label="Pickup location"
            placeholder="Where is the load picked up?"
            dotColor={FIELD_DOTS.pickup_location}
            value={field.value}
            error={fieldError('pickup_location')}
            onChange={field.onChange}
            onResolve={(s) => setResolved((r) => ({ ...r, pickup: s?.coord }))}
          />
        )}
      />

      <Controller
        control={control}
        name="dropoff_location"
        render={({ field }) => (
          <LocationAutocomplete
            label="Dropoff location"
            placeholder="Where is the load delivered?"
            dotColor={FIELD_DOTS.dropoff_location}
            value={field.value}
            error={fieldError('dropoff_location')}
            onChange={field.onChange}
            onResolve={(s) => setResolved((r) => ({ ...r, dropoff: s?.coord }))}
          />
        )}
      />

      <Controller
        control={control}
        name="current_cycle_used_hours"
        render={({ field }) => (
          <CycleHoursField
            value={field.value}
            error={fieldError('current_cycle_used_hours')}
            onChange={field.onChange}
          />
        )}
      />

      <ResolvedHint resolved={resolved} />

      <button type="submit" className="btn-primary w-full" disabled={isSubmitting || !isValid}>
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Planning route…
          </>
        ) : (
          <>Plan trip & generate logs</>
        )}
      </button>
      <p className="text-center text-xs text-slate-400">
        Planning the route and Hours-of-Service logs can take a few seconds.
      </p>
    </form>
  )
}

function ResolvedHint({ resolved }: { resolved: ResolvedCoords }) {
  const count = [resolved.current, resolved.pickup, resolved.dropoff].filter(Boolean).length
  if (count === 0) return null
  return (
    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
      {count} of 3 locations resolved to a precise place — this improves routing accuracy. You can
      still submit any geocodable text.
    </p>
  )
}
