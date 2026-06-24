import { useEffect, useId, useRef, useState } from 'react'
import { geocodeSearch, type GeoSuggestion } from '../../api/geocode'

interface Props {
  label: string
  value: string
  placeholder?: string
  error?: string
  /** Decorative dot color (matches the map marker for this field). */
  dotColor?: string
  onChange: (value: string) => void
  /** Fired when the user picks a resolved suggestion. */
  onResolve?: (s: GeoSuggestion | null) => void
}

export function LocationAutocomplete({
  label,
  value,
  placeholder,
  error,
  dotColor,
  onChange,
  onResolve,
}: Props) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const [touched, setTouched] = useState(false)
  const [searched, setSearched] = useState(false)
  const justSelected = useRef(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  // Debounced geocode lookup.
  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false
      return
    }
    if (!touched) return
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      setLoading(false)
      setSearched(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await geocodeSearch(q, ctrl.signal)
        setSuggestions(res)
        setSearched(true)
        setOpen(true)
        setActive(-1)
      } catch {
        /* ignore (abort or network) */
      } finally {
        setLoading(false)
      }
    }, 320)
    return () => {
      ctrl.abort()
      clearTimeout(t)
    }
  }, [value, touched])

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function select(s: GeoSuggestion) {
    justSelected.current = true
    onChange(s.label)
    onResolve?.(s)
    setSuggestions([])
    setSearched(false)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      select(suggestions[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="label-base flex items-center gap-2">
        {dotColor && (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
            style={{ backgroundColor: dotColor }}
          />
        )}
        {label}
      </label>
      <div className="relative">
        <input
          className="input-base pr-9"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={!!error}
          onChange={(e) => {
            setTouched(true)
            onChange(e.target.value)
            onResolve?.(null)
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
          </span>
        )}
      </div>

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.key} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition ${
                  i === active ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setActive(i)}
                onClick={() => select(s)}
              >
                <span className="text-sm font-medium text-ink">{s.primary}</span>
                <span className="line-clamp-1 text-xs text-slate-500">{s.secondary}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && searched && !loading && suggestions.length === 0 && value.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-lg">
          <p className="text-sm font-medium text-slate-600">No matching US places</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Suggestions are limited to the US. You can still type a full address and submit it.
          </p>
        </div>
      )}
    </div>
  )
}
