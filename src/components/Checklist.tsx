import { useLocalStorage } from '../hooks/useLocalStorage'

interface Step {
  key: string
  title: string
  detail: string
}

const STEPS: Step[] = [
  {
    key: 'favorites',
    title: 'Favoriten pflegen',
    detail:
      'Alles persönlich Wichtige als Favorit (Herz) markieren – auch mega-entwickelte Pokémon (der !mega-Filter ist im Spiel kaputt).',
  },
  {
    key: 'protections',
    title: 'Schutz-Kriterien prüfen',
    detail: 'Im Aufräumen-Modus alle Schalter durchgehen – passt die Auswahl zu dir?',
  },
  {
    key: 'inverse',
    title: 'Umkehr-Check ansehen',
    detail:
      '„Das wird geschützt" im Spiel ausführen und kurz prüfen, ob alles Wertvolle dabei ist.',
  },
  {
    key: 'search',
    title: 'Suchstring einfügen',
    detail: 'Kopieren, im Spiel in die Suchleiste der Box einfügen (zuhause, falls Distanz aktiv).',
  },
  {
    key: 'sort',
    title: 'Nach Nummer sortieren',
    detail: 'So stehen Dubletten nebeneinander und sind leicht zu erkennen.',
  },
  {
    key: 'transfer',
    title: 'Prüfen & transferieren',
    detail:
      'Lange auf ein Pokémon tippen (Mehrfachauswahl), Ergebnis kurz überfliegen, dann gesammelt verschicken.',
  },
  {
    key: 'repeat',
    title: 'Teilsuchen abarbeiten',
    detail:
      'Bei sicherem Modus oder Auto-Aufteilung: nächste Zeile kopieren und wiederholen.',
  },
]

/** Geführter Frühjahrsputz: abhakbare Schritte, überleben einen Reload. */
export function Checklist() {
  const [done, setDone] = useLocalStorage<string[]>('pogo-search:checklist', [])
  const doneCount = STEPS.filter((s) => done.includes(s.key)).length

  return (
    <details className="group rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-zinc-900 dark:text-zinc-100">
        <span>
          Frühjahrsputz-Checkliste{' '}
          <span
            className={`text-sm tabular-nums ${
              doneCount === STEPS.length
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-400'
            }`}
          >
            {doneCount}/{STEPS.length}
          </span>
        </span>
        <span className="text-zinc-400 transition-transform group-open:rotate-180">▾</span>
      </summary>

      <ol className="mt-2 space-y-1">
        {STEPS.map((step, i) => {
          const checked = done.includes(step.key)
          return (
            <li key={step.key}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setDone((prev) =>
                      e.target.checked
                        ? [...prev, step.key]
                        : prev.filter((k) => k !== step.key),
                    )
                  }
                  className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
                />
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-medium ${
                      checked
                        ? 'text-zinc-400 line-through dark:text-zinc-500'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {i + 1}. {step.title}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {step.detail}
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ol>

      {doneCount === STEPS.length && (
        <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          🎉 Box aufgeräumt! Bis zum nächsten Mal.
        </p>
      )}
      <button
        type="button"
        onClick={() => setDone([])}
        disabled={doneCount === 0}
        className="mt-2 min-h-9 w-full rounded-lg border border-zinc-300 text-xs font-medium text-zinc-600 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-400"
      >
        Checkliste zurücksetzen
      </button>
    </details>
  )
}
