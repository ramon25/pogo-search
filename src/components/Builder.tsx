import { useState } from 'react'
import {
  BUILDER_DEFS,
  builderTermToString,
  findBuilderDef,
  LEAGUE_PRESETS,
  type BuilderCategory,
  type BuilderTerm,
} from '../data/builder'
import type { Lang } from '../data/terms'
import { Section } from './Section'

interface BuilderProps {
  lang: Lang
  groups: BuilderTerm[][]
  onChange: (groups: BuilderTerm[][]) => void
}

const CATEGORIES: BuilderCategory[] = [
  'Eigenschaften',
  'Typen',
  'Herkunft',
  'Bereiche',
  'Sonstiges',
]

/** Formular zum Hinzufügen eines Kriteriums in eine bestimmte Gruppe. */
function AddTermForm({
  lang,
  onAdd,
  onCancel,
}: {
  lang: Lang
  onAdd: (term: BuilderTerm) => void
  onCancel: () => void
}) {
  const [defKey, setDefKey] = useState(BUILDER_DEFS[0]!.key)
  const [neg, setNeg] = useState(false)
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [value, setValue] = useState('')
  const [text, setText] = useState('')

  const def = findBuilderDef(defKey)!
  const toNumber = (s: string): number | null => {
    const n = Math.floor(Number(s.trim()))
    return s.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null
  }
  const term: BuilderTerm = {
    def: defKey,
    neg,
    min: toNumber(min),
    max: toNumber(max),
    value: def.kind === 'stars' || def.kind === 'number' ? toNumber(value) : null,
    text: text || undefined,
  }
  const preview = builderTermToString(lang, term)

  const numberInput = (
    val: string,
    set: (s: string) => void,
    placeholder: string,
  ) => (
    <input
      type="number"
      inputMode="numeric"
      value={val}
      onChange={(e) => set(e.target.value)}
      placeholder={placeholder}
      className="h-11 w-24 rounded-lg border border-zinc-300 bg-white px-2 text-center text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
    />
  )

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600">
      <select
        value={defKey}
        onChange={(e) => setDefKey(e.target.value)}
        className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {CATEGORIES.map((cat) => (
          <optgroup key={cat} label={cat}>
            {BUILDER_DEFS.filter((d) => d.category === cat).map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="flex flex-wrap items-center gap-2">
        {def.kind === 'range' && (
          <>
            {numberInput(min, setMin, 'von')}
            <span className="text-zinc-400">–</span>
            {numberInput(max, setMax, 'bis')}
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              (eins leer = offen)
            </span>
          </>
        )}
        {def.kind === 'number' && numberInput(value, setValue, 'z. B. 2019')}
        {def.kind === 'stars' && (
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setValue(String(tier))}
                className={`min-h-10 rounded-lg border px-3 text-sm ${
                  value === String(tier)
                    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-900'
                    : 'border-zinc-300 dark:border-zinc-600'
                }`}
              >
                {tier}★
              </button>
            ))}
          </div>
        )}
        {def.kind === 'tag' && (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tag-Name (ohne #)"
            maxLength={30}
            className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        )}
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={neg}
            onChange={(e) => setNeg(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          ausschliessen (!)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!preview}
          onClick={() => onAdd(term)}
          className="min-h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Hinzufügen
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
        >
          Abbrechen
        </button>
        {preview && (
          <code className="ml-auto font-mono text-xs text-emerald-700 dark:text-emerald-400">
            {preview}
          </code>
        )}
      </div>
    </div>
  )
}

/** Freier Baukasten: UND-Gruppen aus beliebigen Kriterien zusammenklicken. */
export function Builder({ lang, groups, onChange }: BuilderProps) {
  /** Index der Gruppe, für die das Hinzufügen-Formular offen ist (-1 = neue Gruppe, null = zu). */
  const [addTarget, setAddTarget] = useState<number | null>(groups.length === 0 ? -1 : null)

  function addTerm(term: BuilderTerm) {
    if (addTarget === null) return
    const next = groups.map((g) => [...g])
    if (addTarget === -1) next.push([term])
    else next[addTarget]!.push(term)
    onChange(next)
    setAddTarget(null)
  }

  function removeTerm(groupIdx: number, termIdx: number) {
    const next = groups
      .map((g, gi) => (gi === groupIdx ? g.filter((_, ti) => ti !== termIdx) : g))
      .filter((g) => g.length > 0)
    onChange(next)
  }

  function toggleNeg(groupIdx: number, termIdx: number) {
    onChange(
      groups.map((g, gi) =>
        gi === groupIdx
          ? g.map((t, ti) => (ti === termIdx ? { ...t, neg: !t.neg } : t))
          : g,
      ),
    )
  }

  return (
    <Section
      title="Baukasten"
      subtitle="Gruppen sind mit UND verknüpft, Kriterien innerhalb einer Gruppe mit ODER. ! kehrt ein Kriterium um."
      action={
        groups.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              onChange([])
              setAddTarget(-1)
            }}
            className="min-h-9 shrink-0 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-300"
          >
            Leeren
          </button>
        ) : undefined
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {LEAGUE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            title={preset.description}
            onClick={() => {
              onChange(preset.groups.map((g) => g.map((t) => ({ ...t }))))
              setAddTarget(null)
            }}
            className="min-h-10 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:border-emerald-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500"
          >
            ⚔️ {preset.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && (
              <p className="py-1 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                UND
              </p>
            )}
            <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
              <div className="flex flex-wrap items-center gap-1.5">
                {group.map((term, ti) => (
                  <span
                    key={ti}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1 pl-2.5 dark:bg-zinc-700"
                  >
                    {ti > 0 && (
                      <span className="text-[10px] font-semibold text-zinc-400">ODER</span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleNeg(gi, ti)}
                      title="! umschalten (ausschliessen/einschliessen)"
                      className={`font-mono text-xs ${
                        term.neg
                          ? 'font-bold text-red-600 dark:text-red-400'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {builderTermToString(lang, term) || '…'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTerm(gi, ti)}
                      aria-label="Kriterium entfernen"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setAddTarget(addTarget === gi ? null : gi)}
                  className="min-h-8 rounded-full border border-dashed border-zinc-300 px-3 text-xs text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
                >
                  + ODER
                </button>
              </div>
              {addTarget === gi && (
                <AddTermForm lang={lang} onAdd={addTerm} onCancel={() => setAddTarget(null)} />
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setAddTarget(addTarget === -1 ? null : -1)}
          className="min-h-11 w-full rounded-lg border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
        >
          + UND-Gruppe
        </button>
        {addTarget === -1 && (
          <AddTermForm lang={lang} onAdd={addTerm} onCancel={() => setAddTarget(null)} />
        )}
      </div>
    </Section>
  )
}
