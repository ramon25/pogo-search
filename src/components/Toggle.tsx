interface ToggleProps {
  label: string
  info?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Grosser, mobil-freundlicher Schalter mit Label und Info-Text. */
export function Toggle({ label, info, checked, onChange }: ToggleProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-1.5">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
        {info && (
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">{info}</span>
        )}
      </span>
      <span className="relative shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className="block h-7 w-12 rounded-full bg-zinc-300 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600 dark:bg-zinc-600 dark:peer-checked:bg-emerald-500"
        />
        <span
          aria-hidden
          className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  )
}
