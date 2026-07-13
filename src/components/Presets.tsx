import { useState } from 'react'
import type { QueryConfig } from '../lib/buildQuery'
import { Section } from './Section'

export interface Preset {
  name: string
  config: QueryConfig
}

interface PresetsProps {
  presets: Preset[]
  onSave: (name: string) => void
  onLoad: (preset: Preset) => void
  onDelete: (name: string) => void
  onReset: () => void
}

/** Benutzerdefinierte Presets speichern/laden/löschen (localStorage). */
export function Presets({ presets, onSave, onLoad, onDelete, onReset }: PresetsProps) {
  const [name, setName] = useState('')

  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setName('')
  }

  return (
    <Section
      title="Presets"
      subtitle="Aktuelle Konfiguration unter eigenem Namen speichern."
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Preset-Name"
          maxLength={40}
          className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={save}
          disabled={!name.trim()}
          className="min-h-11 shrink-0 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Speichern
        </button>
      </div>

      {presets.length > 0 && (
        <ul className="mt-3 space-y-2">
          {presets.map((preset) => (
            <li key={preset.name} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onLoad(preset)}
                className="min-h-11 min-w-0 flex-1 truncate rounded-lg border border-zinc-300 bg-white px-3 text-left text-sm text-zinc-900 hover:border-emerald-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-500"
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(preset.name)}
                aria-label={`Preset „${preset.name}" löschen`}
                className="min-h-11 shrink-0 rounded-lg border border-zinc-300 px-3 text-sm text-red-600 hover:border-red-600 dark:border-zinc-600 dark:text-red-400"
              >
                Löschen
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-3 min-h-11 w-full rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-300"
      >
        Reset auf Standard
      </button>
    </Section>
  )
}
