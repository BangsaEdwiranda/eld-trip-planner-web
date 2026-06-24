import type { Coord } from './types'

/**
 * Location autocomplete via the BACKEND's own `GET /api/geocode/?q=…` endpoint.
 * The backend proxies a geocoder (OpenRouteService Pelias → Nominatim fallback),
 * so the frontend needs no key and no second provider, and the `label` we submit
 * is re-geocoded authoritatively by `POST /api/trips/` — the backend stays the
 * single source of truth (api-contract.md §GET /api/geocode/).
 *
 * Letting the user pick a resolved place beats sending an ambiguous free string
 * ("Springfield") — the single biggest input-accuracy lever.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

/** Raw row from the backend. */
interface GeocodeResult {
  label: string
  coords: Coord // [lon, lat]
}

export interface GeoSuggestion {
  /** The string we drop into the field and submit as-is. */
  label: string
  /** Short primary label for the dropdown row. */
  primary: string
  /** Secondary context (region/country). */
  secondary: string
  coord: Coord // [lon, lat]
  /** Stable key for React lists. */
  key: string
}

export async function geocodeSearch(query: string, signal?: AbortSignal): Promise<GeoSuggestion[]> {
  const q = query.trim()
  // Backend returns [] for <2 chars; skip the round trip.
  if (q.length < 2) return []

  const url = new URL(`${BASE_URL}/api/geocode/`)
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '6')

  let res: Response
  try {
    res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } })
  } catch {
    return [] // network/abort — show nothing
  }
  // For a typeahead, a 400 (upstream hiccup) means "no suggestions right now".
  if (!res.ok) return []

  let body: { results?: GeocodeResult[] }
  try {
    body = await res.json()
  } catch {
    return []
  }

  const results = body.results ?? []
  return results.map((r, i) => {
    const parts = r.label.split(',').map((s) => s.trim())
    return {
      label: r.label,
      primary: parts[0] || r.label,
      secondary: parts.slice(1).join(', '),
      coord: r.coords,
      key: `${i}-${r.label}`,
    }
  })
}
