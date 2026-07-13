import { MAX_QUERY_LENGTH } from '../data/terms'
import { CopyButton } from './CopyButton'

interface OutputPanelProps {
  lines: string[]
  targets: string[]
  exclusions: string[]
  autoSplit: boolean
  safeMode: boolean
  onSafeModeChange: (safeMode: boolean) => void
  onCopied?: (text: string) => void
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

/** Kompakte Vorschau der aktiven Ziele und Ausschlüsse. */
function PreviewChips({ targets, exclusions }: { targets: string[]; exclusions: string[] }) {
  if (targets.length === 0 && exclusions.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {targets.map((t) => (
        <span
          key={t}
          className="rounded-full bg-emerald-100 px-2.5 py-1 font-mono text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {t}
        </span>
      ))}
      {exclusions.map((e) => (
        <span
          key={e}
          className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
        >
          {e}
        </span>
      ))}
    </div>
  )
}

/** Live-Ausgabe des Suchstrings inkl. Zeichenzähler und Kopieren-Button. */
export function OutputPanel({
  lines,
  targets,
  exclusions,
  autoSplit,
  safeMode,
  onSafeModeChange,
  onCopied,
}: OutputPanelProps) {
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

      <PreviewChips targets={targets} exclusions={exclusions} />

      {autoSplit && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          ✂️ Über {MAX_QUERY_LENGTH} Zeichen – automatisch auf {lines.length} Teilsuchen
          aufgeteilt. Jede Teilsuche enthält alle Ausschlüsse; bitte nacheinander
          abarbeiten.
        </p>
      )}

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
              <CopyButton text={line} small={lines.length > 1} onCopied={onCopied} />
            </div>
          </div>
        ))}
      </div>

      {anyOverLimit && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          ⚠️ Über {MAX_QUERY_LENGTH} Zeichen – das Spiel schneidet die Suche ab. Die
          Ausschlüsse lassen sich nicht sicher aufteilen: bitte Kriterien reduzieren
          (z. B. weniger Jahre auswählen oder den Tage-Modus nutzen).
        </p>
      )}
    </section>
  )
}
