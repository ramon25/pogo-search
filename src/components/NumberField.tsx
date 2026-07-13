interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  disabled?: boolean
  onChange: (value: number) => void
}

/** Zahleneingabe mit Grenzen; ungültige Eingaben werden auf min geklemmt. */
export function NumberField({
  label,
  value,
  min,
  max,
  unit,
  disabled,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const n = Math.floor(Number(e.target.value))
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min)
        }}
        className="h-11 w-24 rounded-lg border border-zinc-300 bg-white px-2 text-center text-base text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {unit && <span className="text-zinc-500 dark:text-zinc-400">{unit}</span>}
    </label>
  )
}
