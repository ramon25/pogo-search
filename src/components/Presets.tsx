import { useRef, useState } from 'react'
import { RECIPES } from '../data/recipes'
import { defaultConfig, mergeConfig, type QueryConfig } from '../lib/buildQuery'
import { Section } from './Section'
import { CopyButton } from './CopyButton'

export interface Preset {
  name: string
  config: QueryConfig
}

interface PresetsProps {
  presets: Preset[]
  shareUrl: string
  onSave: (name: string) => void
  onLoad: (preset: Preset) => void
  onLoadConfig: (config: QueryConfig) => void
  onDelete: (name: string) => void
  onImport: (presets: Preset[]) => void
  onReset: () => void
}

/** Import-Datei validieren: akzeptiert {presets: […]} oder ein blankes Array. */
function parsePresetFile(raw: string): Preset[] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    const list = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { presets?: unknown }).presets)
        ? ((parsed as { presets: unknown[] }).presets)
        : null
    if (!list) return null
    const presets: Preset[] = []
    for (const item of list) {
      if (typeof item !== 'object' || item === null) continue
      const { name, config } = item as { name?: unknown; config?: unknown }
      if (typeof name !== 'string' || !name.trim()) continue
      presets.push({
        name: name.trim().slice(0, 40),
        config: mergeConfig(config, defaultConfig()),
      })
    }
    return presets
  } catch {
    return null
  }
}

/** Vorlagen, benutzerdefinierte Presets (localStorage) und Teilen-Link. */
export function Presets({
  presets,
  shareUrl,
  onSave,
  onLoad,
  onLoadConfig,
  onDelete,
  onImport,
  onReset,
}: PresetsProps) {
  const [name, setName] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setName('')
  }

  function exportPresets() {
    const payload = JSON.stringify({ version: 1, presets }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'pogo-search-presets.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importPresets(file: File) {
    const parsed = parsePresetFile(await file.text())
    if (!parsed || parsed.length === 0) {
      setImportMessage('⚠️ Keine gültigen Presets in der Datei gefunden.')
      return
    }
    onImport(parsed)
    setImportMessage(`✓ ${parsed.length} Preset${parsed.length === 1 ? '' : 's'} importiert.`)
  }

  return (
    <Section
      title="Presets"
      subtitle="Vorlagen laden oder die aktuelle Konfiguration unter eigenem Namen speichern."
    >
      <div className="mb-4 space-y-2">
        {RECIPES.map((recipe) => (
          <button
            key={recipe.name}
            type="button"
            onClick={() => onLoadConfig(recipe.build())}
            className="block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-left hover:border-emerald-600 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-emerald-500"
          >
            <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {recipe.name}
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              {recipe.description}
            </span>
          </button>
        ))}
      </div>

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

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-300"
        >
          Reset auf Standard
        </button>
        <CopyButton text={shareUrl} label="🔗 Link teilen" />
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={exportPresets}
          disabled={presets.length === 0}
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:border-zinc-500 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-300"
        >
          ⬇️ Exportieren
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-300"
        >
          ⬆️ Importieren
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importPresets(file)
            e.target.value = '' // gleiche Datei erneut wählbar
          }}
        />
      </div>
      {importMessage && (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{importMessage}</p>
      )}
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        „Link teilen" kopiert eine URL mit der aktuellen Konfiguration. Export/Import
        sichert die eigenen Presets als JSON-Datei – z. B. für den Handy-Wechsel.
      </p>
    </Section>
  )
}
