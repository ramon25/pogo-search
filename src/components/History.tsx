import { CopyButton } from './CopyButton'

export interface HistoryEntry {
  text: string
  /** Unix-Millisekunden des Kopierzeitpunkts. */
  ts: number
}

interface HistoryProps {
  entries: HistoryEntry[]
  onCopied: (text: string) => void
  onClear: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

/** Die zuletzt kopierten Suchstrings – praktisch beim Abarbeiten mehrerer Teilsuchen. */
export function History({ entries, onCopied, onClear }: HistoryProps) {
  if (entries.length === 0) return null
  return (
    <details className="group rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Zuletzt kopiert ({entries.length})
        <span className="text-zinc-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ul className="mt-2 space-y-2">
        {entries.map((entry) => (
          <li
            key={`${entry.ts}-${entry.text.slice(0, 20)}`}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <span className="w-12 shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
              {formatTime(entry.ts)}
            </span>
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
              {entry.text}
            </code>
            <CopyButton text={entry.text} small onCopied={onCopied} />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 min-h-9 w-full rounded-lg border border-zinc-300 text-xs font-medium text-zinc-600 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
      >
        Historie leeren
      </button>
    </details>
  )
}
