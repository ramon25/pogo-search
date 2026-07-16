import { useEffect } from 'react'
import { Chip } from './components/Chip'
import { Explainer } from './components/Explainer'
import { History, type HistoryEntry } from './components/History'
import { LocationPicker } from './components/LocationPicker'
import { NumberField } from './components/NumberField'
import { OutputPanel } from './components/OutputPanel'
import { Presets, type Preset } from './components/Presets'
import { ProtectedCheck } from './components/ProtectedCheck'
import { Section } from './components/Section'
import { Toggle } from './components/Toggle'
import { FIRST_YEAR, PROTECTION_KEYS, PROTECTIONS, type Lang } from './data/terms'
import { useLocalStorage } from './hooks/useLocalStorage'
import {
  buildProtectedLines,
  buildQuery,
  defaultConfig,
  mergeConfig,
  STAR_TIERS,
  type QueryConfig,
} from './lib/buildQuery'
import { DISCOVER_CARDS, findDiscoverCard, rollDiscoverCard } from './data/discover'
import { distanceKm, distanceRing, type GeoPoint } from './lib/geo'
import { buildShareUrl, decodeConfig } from './lib/urlState'

/** Maximale Anzahl gemerkter Kopiervorgänge. */
const HISTORY_LIMIT = 8

/**
 * Orte für den Reise-Modus. Bewusst getrennt von der Query-Konfiguration:
 * Der Heimatort ist privat und darf nie in geteilten Links oder Presets landen.
 */
interface TravelState {
  home: GeoPoint | null
  dest: GeoPoint | null
  toleranceKm: number
}

type Theme = 'system' | 'light' | 'dark'

const CONFIG_KEY = 'pogo-search:config'

/**
 * Konfiguration aus einem geteilten Link (?c=…) übernehmen: in localStorage
 * persistieren und den Parameter aus der URL entfernen. Läuft einmal beim
 * Laden des Moduls, bevor React rendert.
 */
function consumeUrlConfig(): void {
  const param = new URLSearchParams(window.location.search).get('c')
  if (param === null) return
  const shared = decodeConfig(param)
  if (shared) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(shared))
    } catch {
      // localStorage blockiert – Konfiguration gilt dann nur bis zum Reload.
    }
  }
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
}
consumeUrlConfig()

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)

export default function App() {
  const [config, setConfig] = useLocalStorage<QueryConfig>(
    CONFIG_KEY,
    defaultConfig(),
    mergeConfig,
  )
  const [presets, setPresets] = useLocalStorage<Preset[]>('pogo-search:presets', [])
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('pogo-search:history', [])
  const [travel, setTravel] = useLocalStorage<TravelState>('pogo-search:travel', {
    home: null,
    dest: null,
    toleranceKm: 50,
  })
  const [theme, setTheme] = useLocalStorage<Theme>('pogo-search:theme', 'system')

  // Distanz-Ring aus Heimat/Ziel ableiten und in die Konfiguration spiegeln
  // (nur der Ring wandert in Suchstring, Presets und Share-Links).
  useEffect(() => {
    const ring =
      travel.home && travel.dest
        ? distanceRing(travel.home, travel.dest, travel.toleranceKm)
        : null
    setConfig((prev) =>
      prev.travelRing?.[0] === ring?.[0] && prev.travelRing?.[1] === ring?.[1] &&
      (prev.travelRing === null) === (ring === null)
        ? prev
        : { ...prev, travelRing: ring },
    )
  }, [travel, setConfig])

  /** Kopierten String in die Historie aufnehmen (dedupliziert, begrenzt). */
  const recordCopy = (text: string) =>
    setHistory((prev) =>
      [{ text, ts: Date.now() }, ...prev.filter((e) => e.text !== text)].slice(
        0,
        HISTORY_LIMIT,
      ),
    )

  // Dark Mode: System-Präferenz respektieren, manueller Toggle überschreibt.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const patch = (partial: Partial<QueryConfig>) =>
    setConfig((prev) => ({ ...prev, ...partial }))

  const result = buildQuery(config)
  const anyProtectionOn = PROTECTION_KEYS.some((k) => config.protections[k])

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-16">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            PoGO Box-Cleanup
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Suchstring-Generator: findet Transfer-Kandidaten, schützt alles Wertvolle.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')
          }
          title={`Design: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dunkel' : 'Hell'} (tippen zum Wechseln)`}
          className="min-h-11 min-w-11 shrink-0 rounded-lg border border-zinc-300 text-lg dark:border-zinc-600"
        >
          {theme === 'system' ? '🌓' : theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </header>

      <div className="space-y-4">
        <Section
          title="Modus"
          subtitle="Was willst du mit der Suche erreichen?"
        >
          <div className="flex flex-wrap gap-2">
            <Chip
              label="📦 Aufräumen"
              active={config.mode === 'cleanup'}
              onToggle={() => patch({ mode: 'cleanup' })}
            />
            <Chip
              label="✨ Entwickeln"
              active={config.mode === 'evolve'}
              onToggle={() => patch({ mode: 'evolve' })}
            />
            <Chip
              label="🍀 Lucky Trades"
              active={config.mode === 'luckyTrade'}
              onToggle={() => patch({ mode: 'luckyTrade' })}
            />
            <Chip
              label="🌍 Reise-Fänge"
              active={config.mode === 'travel'}
              onToggle={() => patch({ mode: 'travel' })}
            />
            <Chip
              label="🔎 Entdecken"
              active={config.mode === 'discover'}
              onToggle={() => patch({ mode: 'discover' })}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {config.mode === 'cleanup' &&
              'Transfer-Kandidaten finden, ohne Wertvolles zu verlieren.'}
            {config.mode === 'evolve' &&
              'Entwicklungs-Futter für Masseentwicklungen (XP/Glücks-Ei) finden – Wertvolles bleibt aussen vor.'}
            {config.mode === 'luckyTrade' &&
              'Alte Fänge als Tausch-Kandidaten finden – je älter, desto höher die Glücks-Pokémon-Chance.'}
            {config.mode === 'travel' &&
              'Fänge von einer Reise wiederfinden – über die Distanz zwischen Heimat und Reiseziel.'}
            {config.mode === 'discover' &&
              'Coole Pokémon in der eigenen Box wiederentdecken – kuratiert oder per Zufall.'}
          </p>
        </Section>

        <Section
          title="Spielsprache"
          subtitle="Suchbegriffe sind im Spiel lokalisiert – die Sprache muss zur Spieleinstellung passen."
        >
          <div className="flex gap-2">
            {(['de', 'en'] as Lang[]).map((lang) => (
              <Chip
                key={lang}
                label={lang === 'de' ? 'Deutsch' : 'English'}
                active={config.lang === lang}
                onToggle={() => patch({ lang })}
              />
            ))}
          </div>
        </Section>

        {config.mode === 'cleanup' && (
          <Section
            title="Ziel: Was soll gefunden werden?"
            subtitle="Stufen werden als ODER-Gruppe kombiniert (0*,1*,2*) – die Ausschlüsse gelten dank Präzedenz für alle."
          >
            <div className="flex flex-wrap gap-2">
              {STAR_TIERS.map((tier) => (
                <Chip
                  key={tier}
                  label={tier.replace('*', '★')}
                  active={config.stars.includes(tier)}
                  disabled={config.allMode}
                  onToggle={() =>
                    patch({
                      stars: config.stars.includes(tier)
                        ? config.stars.filter((t) => t !== tier)
                        : [...config.stars, tier],
                    })
                  }
                />
              ))}
            </div>
            <div className="mt-3 space-y-1">
              <Toggle
                label="Low WP"
                info="Zusätzlich Pokémon mit niedrigen Kampfpunkten einschliessen."
                checked={config.lowCpEnabled && !config.allMode}
                onChange={(v) => patch({ lowCpEnabled: v })}
              />
              {config.lowCpEnabled && !config.allMode && (
                <NumberField
                  label="WP bis"
                  value={config.lowCpMax}
                  min={10}
                  max={9999}
                  onChange={(v) => patch({ lowCpMax: v })}
                />
              )}
              <Toggle
                label="Alle nicht-Geschützten"
                info="Kein positives Kriterium – zeigt alles, was kein Schutz-Kriterium erfüllt."
                checked={config.allMode}
                onChange={(v) => patch({ allMode: v })}
              />
            </div>
          </Section>
        )}

        {config.mode === 'evolve' && (
          <Section
            title="Ziel: Was soll entwickelt werden?"
            subtitle="Findet Pokémon, für die genug Bonbons vorhanden sind – abzüglich der Schutz-Kriterien."
          >
            <div className="flex flex-wrap gap-2">
              <Chip
                label="Alle entwickelbaren"
                active={config.evolveVariant === 'all'}
                onToggle={() => patch({ evolveVariant: 'all' })}
              />
              <Chip
                label="Nur neue Dex-Einträge"
                active={config.evolveVariant === 'new'}
                onToggle={() => patch({ evolveVariant: 'new' })}
              />
            </div>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Optional nur bestimmte IV-Stufen (leer = alle):
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STAR_TIERS.map((tier) => (
                <Chip
                  key={tier}
                  label={tier.replace('*', '★')}
                  active={config.evolveStars.includes(tier)}
                  onToggle={() =>
                    patch({
                      evolveStars: config.evolveStars.includes(tier)
                        ? config.evolveStars.filter((t) => t !== tier)
                        : [...config.evolveStars, tier],
                    })
                  }
                />
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              💡 Tipp: Vor der Masseentwicklung ein Glücks-Ei aktivieren – doppelte XP
              pro Entwicklung. „Nur neue Dex-Einträge" priorisiert Entwicklungen, die
              den Pokédex füllen.
            </p>
          </Section>
        )}

        {config.mode === 'travel' && (
          <Section
            title="Ziel: Wo warst du unterwegs?"
            subtitle="Das Spiel kennt keine Ort-Suche – aber einen Distanz-Ring: Entfernung{min}-{max} ab deinem aktuellen Standort."
          >
            <div className="space-y-2">
              <LocationPicker
                title="Heimatort"
                value={travel.home}
                allowGps
                onChange={(home) => setTravel((prev) => ({ ...prev, home }))}
              />
              <LocationPicker
                title="Reiseziel"
                value={travel.dest}
                onChange={(dest) => setTravel((prev) => ({ ...prev, dest }))}
              />
              <NumberField
                label="Toleranz ±"
                value={travel.toleranceKm}
                min={5}
                max={1000}
                unit="km"
                onChange={(toleranceKm) => setTravel((prev) => ({ ...prev, toleranceKm }))}
              />
            </div>

            {travel.home && travel.dest && config.travelRing && (
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                {travel.home.label} → {travel.dest.label}: Luftlinie ≈{' '}
                <strong>{distanceKm(travel.home, travel.dest).toLocaleString('de-CH')} km</strong>{' '}
                ⇒ Ring {config.travelRing[0].toLocaleString('de-CH')}–
                {config.travelRing[1].toLocaleString('de-CH')} km
              </p>
            )}

            <div className="mt-3 space-y-2">
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                📍 Die Suche <strong>zuhause ausführen</strong> – das Spiel misst die
                Distanz ab deinem aktuellen Standort, der Ring ist ab dem Heimatort
                berechnet.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ein Ring ist ein Kreis: Fänge aus anderen Orten in gleicher Entfernung
                erscheinen mit. Der Heimatort bleibt auf diesem Gerät und landet nie in
                geteilten Links. Tipp für künftige Reisen: Fänge vor Ort mit einem Tag
                wie <code className="font-mono">#tromsø</code> markieren – danach sind
                sie jederzeit exakt per Tag-Suche auffindbar.
              </p>
            </div>
          </Section>
        )}

        {config.mode === 'discover' && (
          <Section
            title="Was willst du entdecken?"
            subtitle="Positiv-Suchen zum Stöbern – hier wird nichts verschickt, nur bestaunt."
            action={
              <button
                type="button"
                onClick={() => {
                  const roll = rollDiscoverCard()
                  patch({ discoverKey: roll.key, discoverParams: roll.params })
                }}
                className="min-h-9 shrink-0 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-900"
              >
                🎲 Überrasch mich!
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DISCOVER_CARDS.map((card) => {
                const active = config.discoverKey === card.key
                return (
                  <button
                    key={card.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      patch({
                        discoverKey: card.key,
                        discoverParams: card.randomize?.() ?? [],
                      })
                    }
                    className={`min-h-11 rounded-lg border px-3 py-2 text-left transition-colors ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950'
                        : 'border-zinc-200 bg-white hover:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-emerald-500'
                    }`}
                  >
                    <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {card.emoji} {card.title}
                      {card.randomize && (
                        <span className="ml-1 text-xs text-zinc-400">🎲</span>
                      )}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {card.description}
                    </span>
                  </button>
                )
              })}
            </div>
            {config.discoverKey &&
              findDiscoverCard(config.discoverKey)?.randomize && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  🎲-Karten würfeln bei jedem Antippen neu. Eine Kombi kann auch mal
                  leer ausgehen – einfach nochmal würfeln.
                </p>
              )}
          </Section>
        )}

        {config.mode === 'luckyTrade' && (
          <Section
            title="Ziel: Fangjahre für den Tausch"
            subtitle="Alte Fänge haben beim Tausch deutlich erhöhte Glücks-Chancen – 2016/2017 die höchsten."
          >
            <div className="flex flex-wrap gap-2">
              {YEARS.map((year) => (
                <Chip
                  key={year}
                  label={String(year)}
                  active={config.tradeYears.includes(year)}
                  onToggle={() =>
                    patch({
                      tradeYears: config.tradeYears.includes(year)
                        ? config.tradeYears.filter((y) => y !== year)
                        : [...config.tradeYears, year],
                    })
                  }
                />
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              🍀 Bereits getauschte Pokémon werden automatisch ausgeschlossen
              (!getauscht) – sie können nicht erneut getauscht werden. Mit
              Glücksfreunden ist der nächste Tausch garantiert ein Glücks-Pokémon.
            </p>
          </Section>
        )}

        {config.mode !== 'discover' && (
        <Section
          title="Schutz-Kriterien"
          subtitle="Jeder aktive Schalter schliesst die Kategorie per !Begriff aus – sie kann nicht im Ergebnis landen."
          action={
            <button
              type="button"
              onClick={() =>
                patch({
                  protections: Object.fromEntries(
                    PROTECTION_KEYS.map((k) => [k, !anyProtectionOn]),
                  ) as QueryConfig['protections'],
                })
              }
              className="min-h-9 shrink-0 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-300"
            >
              {anyProtectionOn ? 'Alle aus' : 'Alle an'}
            </button>
          }
        >
          {!anyProtectionOn && (
            <p className="mb-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              ⚠️ Kein Schutz-Kriterium aktiv – die Suche schützt gerade nichts.
              {config.mode === 'cleanup' &&
                ' Beim Aufräumen ist das riskant: Ergebnis vor dem Transferieren genau prüfen!'}
            </p>
          )}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {PROTECTION_KEYS.map((key) => (
              <Toggle
                key={key}
                label={PROTECTIONS[key].label}
                info={PROTECTIONS[key].info}
                checked={config.protections[key]}
                onChange={(v) =>
                  patch({ protections: { ...config.protections, [key]: v } })
                }
              />
            ))}
          </div>
        </Section>
        )}

        {config.mode !== 'discover' && (
        <Section title="Parametrische Schutz-Kriterien">
          {config.mode === 'travel' && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Der Distanz-Schutz ist im Reise-Modus deaktiviert – die Entfernung ist
              hier das Ziel der Suche.
            </p>
          )}
          {config.mode !== 'travel' && (
            <Toggle
              label="Weit weg gefangen behalten"
              info="Schliesst Pokémon aus, die weiter als N km entfernt gefangen wurden."
              checked={config.distanceEnabled}
              onChange={(v) => patch({ distanceEnabled: v })}
            />
          )}
          {config.mode !== 'travel' && config.distanceEnabled && (
            <div className="mb-2 space-y-2">
              <NumberField
                label="Ab"
                value={config.distanceKm}
                min={1}
                max={100000}
                unit="km"
                onChange={(v) => patch({ distanceKm: v })}
              />
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                📍 Die Distanz misst ab dem <strong>aktuellen Standort</strong>. Suche
                zuhause ausführen, sonst verschiebt sich der Bezugspunkt.
              </p>
            </div>
          )}

          {config.mode === 'luckyTrade' && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Der Alters-Schutz ist im Lucky-Trade-Modus deaktiviert – das Fangjahr ist
              hier das Ziel der Suche.
            </p>
          )}
          {config.mode !== 'luckyTrade' && (
            <Toggle
              label="Besonders alt behalten"
              info="Schliesst alte Fänge aus – nach Alter in Tagen oder nach Fangjahr."
              checked={config.ageEnabled}
              onChange={(v) => patch({ ageEnabled: v })}
            />
          )}
          {config.mode !== 'luckyTrade' && config.ageEnabled && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Chip
                  label="Nach Tagen"
                  active={config.ageMode === 'days'}
                  onToggle={() => patch({ ageMode: 'days' })}
                />
                <Chip
                  label="Nach Jahr"
                  active={config.ageMode === 'years'}
                  onToggle={() => patch({ ageMode: 'years' })}
                />
              </div>
              {config.ageMode === 'days' ? (
                <NumberField
                  label="Älter als"
                  value={config.ageDays}
                  min={1}
                  max={100000}
                  unit="Tage"
                  onChange={(v) => patch({ ageDays: v })}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {YEARS.map((year) => (
                    <Chip
                      key={year}
                      label={String(year)}
                      active={config.keepYears.includes(year)}
                      onToggle={() =>
                        patch({
                          keepYears: config.keepYears.includes(year)
                            ? config.keepYears.filter((y) => y !== year)
                            : [...config.keepYears, year],
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>
        )}

        <OutputPanel
          lines={result.lines}
          targets={result.targets}
          exclusions={result.exclusions}
          autoSplit={result.autoSplit}
          safeMode={config.safeMode}
          onSafeModeChange={(v) => patch({ safeMode: v })}
          onCopied={recordCopy}
        />

        <ProtectedCheck lines={buildProtectedLines(config)} onCopied={recordCopy} />

        <History
          entries={history}
          onCopied={recordCopy}
          onClear={() => setHistory([])}
        />

        <Explainer />

        <Presets
          presets={presets}
          shareUrl={buildShareUrl(config)}
          onSave={(name) =>
            setPresets((prev) => [
              ...prev.filter((p) => p.name !== name),
              { name, config },
            ])
          }
          onLoad={(preset) => setConfig(mergeConfig(preset.config, defaultConfig()))}
          onLoadConfig={(cfg) => setConfig(cfg)}
          onDelete={(name) => setPresets((prev) => prev.filter((p) => p.name !== name))}
          onImport={(imported) =>
            setPresets((prev) => [
              ...prev.filter((p) => !imported.some((i) => i.name === p.name)),
              ...imported,
            ])
          }
          onReset={() => setConfig(defaultConfig())}
        />

        <footer className="pt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Statisch, ohne Backend – alle Daten bleiben im Browser (localStorage).
        </footer>
      </div>
    </div>
  )
}
