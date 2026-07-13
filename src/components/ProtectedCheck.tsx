import { MAX_QUERY_LENGTH } from '../data/terms'
import { CopyButton } from './CopyButton'

interface ProtectedCheckProps {
  lines: string[]
  onCopied?: (text: string) => void
}

/**
 * Umkehr-Check: die ODER-Suche über alle aktiven Schutz-Kriterien,
 * um vor dem Transferieren zu sehen, was verschont bleibt.
 */
export function ProtectedCheck({ lines, onCopied }: ProtectedCheckProps) {
  if (lines.length === 0) return null
  return (
    <details className="group rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Kontrolle: Das wird geschützt
        <span className="text-zinc-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Diese Suche zeigt im Spiel alle Pokémon, die von der Transfer-Suche verschont
        bleiben (ODER-Verknüpfung aller Schutz-Kriterien). Ideal als Kontrollblick,
        bevor du transferierst.
        {lines.length > 1 &&
          ' Wegen des 200-Zeichen-Limits auf mehrere Suchen aufgeteilt – zusammen decken sie alles ab.'}
      </p>
      <div className="mt-3 space-y-3">
        {lines.map((line, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <code className="block font-mono text-sm break-all text-zinc-900 select-all dark:text-zinc-100">
              {line}
            </code>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {line.length} / {MAX_QUERY_LENGTH}
              </span>
              <CopyButton text={line} small onCopied={onCopied} />
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
