/**
 * Operator metadata that appears on a real FMCSA daily log header but is NOT in
 * the API (carrier, office, truck #s, etc.). UI-only: the user can optionally
 * fill it, it's shared across all of a trip's sheets, and it never goes to the
 * backend. Empty fields render as blank ruled lines, like the paper form.
 */
export interface LogMeta {
  carrier: string
  office: string
  vehicle: string
  coDriver: string
  shipping: string
}

export const EMPTY_LOG_META: LogMeta = {
  carrier: '',
  office: '',
  vehicle: '',
  coDriver: '',
  shipping: '',
}
