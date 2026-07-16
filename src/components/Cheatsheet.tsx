import { useState } from 'react'
import {
  MODE_TERMS,
  PROTECTION_KEYS,
  PROTECTIONS,
  SOURCE_TERMS,
  TYPE_TERMS,
} from '../data/terms'

interface Row {
  label: string
  de: string
  en: string
}

/** Alle verifizierten Begriffe als durchsuchbare Referenz. */
const ROWS: Row[] = [
  ...PROTECTION_KEYS.map((key) => ({
    label: PROTECTIONS[key].label,
    de: PROTECTIONS[key].terms.de,
    en: PROTECTIONS[key].terms.en,
  })),
  { label: 'Getauscht', de: MODE_TERMS.traded.de, en: MODE_TERMS.traded.en },
  { label: 'Entwickelbar', de: MODE_TERMS.evolve.de, en: MODE_TERMS.evolve.en },
  {
    label: 'Neuer Dex-Eintrag',
    de: MODE_TERMS.evolveNew.de,
    en: MODE_TERMS.evolveNew.en,
  },
  ...Object.entries(SOURCE_TERMS).map(([, t]) => ({
    label: `Herkunft: ${t.de}`,
    de: t.de,
    en: t.en,
  })),
  ...Object.entries(TYPE_TERMS).map(([, t]) => ({
    label: `Typ: ${t.de}`,
    de: t.de,
    en: t.en,
  })),
  { label: 'IV-Stufen', de: '0* … 4*', en: '0* … 4*' },
  { label: 'WP (Bereich)', de: 'WP100-500', en: 'cp100-500' },
  { label: 'Alter in Tagen', de: 'Alter730-', en: 'age730-' },
  { label: 'Entfernung (km)', de: 'Entfernung100-', en: 'distance100-' },
  { label: 'Fangjahr', de: 'Jahr2016', en: 'year2016' },
  { label: 'Pokédex-Nummern', de: '1-151', en: '1-151' },
  { label: 'Eigener Tag', de: '#mein-tag', en: '#my-tag' },
]

const OPERATORS = [
  ['&', 'UND (wird NACH dem ODER ausgewertet)'],
  [', ; :', 'ODER (bindet stärker als &)'],
  ['!', 'NICHT (vor den Begriff stellen)'],
  ['X / X-Y / X- / -Y', 'exakt / Bereich / „und höher" / „und niedriger"'],
] as const

export function Cheatsheet() {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase().trim()
  const rows = q
    ? ROWS.filter((r) =>
        [r.label, r.de, r.en].some((s) => s.toLowerCase().includes(q)),
      )
    : ROWS

  return (
    <details className="group rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Spickzettel: Alle Suchbegriffe
        <span className="text-zinc-400 transition-transform group-open:rotate-180">▾</span>
      </summary>

      <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {OPERATORS.map(([op, desc]) => (
          <p key={op}>
            <code className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {op}
            </code>{' '}
            {desc}
          </p>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Begriff suchen …"
        className="mt-3 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      />

      <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-700">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 py-1.5">
            <span className="w-2/5 min-w-0 truncate text-sm text-zinc-700 dark:text-zinc-300">
              {row.label}
            </span>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(row.de)}
              title="DE-Begriff kopieren"
              className="min-w-0 flex-1 truncate rounded bg-zinc-100 px-2 py-1 text-left font-mono text-xs text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
            >
              {row.de}
            </button>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(row.en)}
              title="EN-Begriff kopieren"
              className="min-w-0 flex-1 truncate rounded bg-zinc-100 px-2 py-1 text-left font-mono text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
            >
              {row.en}
            </button>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="py-2 text-sm text-zinc-500 dark:text-zinc-400">Kein Treffer.</li>
        )}
      </ul>
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        Antippen kopiert den Begriff. DE links, EN rechts – gültig je nach Spielsprache.
      </p>
    </details>
  )
}
