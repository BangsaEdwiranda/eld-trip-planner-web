import type { ApiFieldErrors, Trip, TripRequest } from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

/**
 * Structured API error. Distinguishes the two 400 shapes documented in
 * api-contract.md: per-field validation errors vs. a single `detail` string
 * (routing/geocoding failure). The UI renders them differently.
 */
export class ApiError extends Error {
  status: number
  /** Present when the server returned `{ detail: "..." }`. */
  detail?: string
  /** Present when the server returned DRF field errors. */
  fieldErrors?: ApiFieldErrors

  constructor(args: { status: number; message: string; detail?: string; fieldErrors?: ApiFieldErrors }) {
    super(args.message)
    this.name = 'ApiError'
    this.status = args.status
    this.detail = args.detail
    this.fieldErrors = args.fieldErrors
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    return new ApiError({ status: res.status, message: `Request failed (${res.status})` })
  }

  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>
    if (typeof obj.detail === 'string') {
      return new ApiError({ status: res.status, message: obj.detail, detail: obj.detail })
    }
    // Treat remaining string[]-valued keys as DRF field errors.
    const fieldErrors: ApiFieldErrors = {}
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v)) fieldErrors[k] = v.map(String)
      else if (typeof v === 'string') fieldErrors[k] = [v]
    }
    if (Object.keys(fieldErrors).length > 0) {
      return new ApiError({
        status: res.status,
        message: 'Please correct the highlighted fields.',
        fieldErrors,
      })
    }
  }
  return new ApiError({ status: res.status, message: `Request failed (${res.status})` })
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    // Network / CORS failure — no HTTP status available.
    throw new ApiError({
      status: 0,
      message:
        'Could not reach the trip planner API. Check that the backend is running and ' +
        'that VITE_API_BASE_URL is correct.',
    })
  }
  if (!res.ok) throw await parseError(res)
  return (await res.json()) as T
}

export const api = {
  baseUrl: BASE_URL,

  health(): Promise<{ status: string; service: string }> {
    return request('/api/health/')
  },

  planTrip(body: TripRequest): Promise<Trip> {
    return request<Trip>('/api/trips/', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  getTrip(id: number): Promise<Trip> {
    return request<Trip>(`/api/trips/${id}/`)
  },

  listTrips(): Promise<Trip[]> {
    return request<Trip[]>('/api/trips/')
  },
}
