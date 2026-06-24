interface Props {
  message: string
  onDismiss?: () => void
}

/** Top-level banner for routing/geocoding (`detail`) errors and network failures. */
export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm"
    >
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-5a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 4z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <p className="font-semibold">Couldn't plan this trip</p>
        <p className="mt-0.5 text-red-700">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  )
}
