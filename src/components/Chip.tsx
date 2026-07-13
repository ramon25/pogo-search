interface ChipProps {
  label: string
  active: boolean
  disabled?: boolean
  onToggle: () => void
}

/** An-/abwählbarer Chip (Multi-Select), gross genug für Daumen. */
export function Chip({ label, active, disabled, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onToggle}
      className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-40 ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-900'
          : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300'
      }`}
    >
      {label}
    </button>
  )
}
