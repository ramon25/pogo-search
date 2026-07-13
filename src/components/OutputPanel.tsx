import { MAX_QUERY_LENGTH } from '../data/terms'
import { CopyButton } from './CopyButton'

interface OutputPanelProps {
  lines: string[]
  safeMode: boolean
  onSafeModeChange: (safeMode: boolean) => void
}

function CharCounter({ length }: { length: number }) {
  const over = length > MAX_QUERY_LENGTH
  return (
    <span
      className={`text-xs tabular-nums ${
        over
          ? 'font-semibold text-red-600 dark:text-red-400'
          : 'text-zinc-500 dark:text-zinc-400'
      }`}
    >
      {length} / {MAX_QUERY_LENGTH}
    </span>
  )
}

/** Live-Ausgabe des Suchstrings inkl. Zeichenzähler und Kopieren-Button. */
export function OutputPanel({ lines, safeMode, onSafeModeChange }: OutputPanelProps) {
  const anyOverLimit = lines.some((l) => l.length > MAX_QUERY_LENGTH)

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Suchstring
        </h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={safeMode}
            onChange={(e) => onSafeModeChange(e.target.checked)}
            className="h-5 w-5 accent-emerald-600"
          />
          Sicherer Modus
        </label>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {safeMode
          ? 'Pro Ziel-Stufe ein eigener reiner UND-String – nacheinander abarbeiten.'
          : 'Eine kombinierte Suche: Ziele als ODER-Gruppe, Ausschlüsse per UND.'}
      </p>

      <div className="mt-3 space-y-3">
        {lines.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nichts ausgewählt – mindestens eine Ziel-Stufe oder ein Schutz-Kriterium
            aktivieren.
          </p>
        )}
        {lines.map((line, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <code className="block font-mono text-sm break-all text-zinc-900 select-all dark:text-zinc-100">
              {line}
            </code>
            <div className="mt-2 flex items-center justify-between gap-2">
              <CharCounter length={line.length} />
              <CopyButton text={line} small={lines.length > 1} />
            </div>
          </div>
        ))}
      </div>

      {anyOverLimit && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          ⚠️ Über {MAX_QUERY_LENGTH} Zeichen – das Spiel schneidet die Suche ab. Kriterien
          reduzieren oder auf mehrere Suchen aufteilen (z. B. „Sicherer Modus" nutzen).
        </p>
      )}
    </section>
  )
}
