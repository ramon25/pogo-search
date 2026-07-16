/**
 * Generierungs-Logik für die Pokémon-GO-Suchstrings.
 *
 * Operator-Präzedenz im Spiel: ODER (`,`) wird IMMER vor UND (`&`) ausgewertet.
 * `0*,1*,2*&!Schillernd` bedeutet also `(0* ODER 1* ODER 2*) UND !Schillernd`.
 * Deshalb: Ziel-Stufen mit `,` verketten, alle Ausschlüsse mit `&` anhängen.
 */

import {
  buildBuilderQuery,
  findBuilderDef,
  type BuilderTerm,
} from '../data/builder'
import { findDiscoverCard } from '../data/discover'
import {
  MAX_QUERY_LENGTH,
  MODE_TERMS,
  PARAMETRIC_TERMS,
  PROTECTION_KEYS,
  PROTECTIONS,
  type Lang,
  type ProtectionKey,
} from '../data/terms'

export type StarTier = '0*' | '1*' | '2*' | '3*'

export const STAR_TIERS: readonly StarTier[] = ['0*', '1*', '2*', '3*']

export type AgeMode = 'days' | 'years'

/**
 * Werkzeug-Modus:
 * - cleanup: Transfer-Kandidaten finden (Original-Funktion)
 * - evolve: Masseentwicklungs-Futter finden (`entwickeln&…`)
 * - luckyTrade: alte Fänge als Lucky-Trade-Kandidaten finden (`Jahr2016,…`)
 * - travel: Reise-Fänge über einen Distanz-Ring finden (`Entfernung2650-2750&…`)
 * - discover: coole Pokémon entdecken (kuratierte/zufällige Positiv-Suchen)
 * - builder: freier Baukasten (UND-Gruppen aus beliebigen Kriterien)
 */
export type Mode = 'cleanup' | 'evolve' | 'luckyTrade' | 'travel' | 'discover' | 'builder'

export type EvolveVariant = 'all' | 'new'

export interface QueryConfig {
  /** Sprache der generierten Suchbegriffe (nicht der UI). */
  lang: Lang
  mode: Mode
  /** Schutz-Kriterien: aktiv = wird per `!Begriff` ausgeschlossen. */
  protections: Record<ProtectionKey, boolean>
  /** „Weit weg gefangen behalten" → !Entfernung{km}- */
  distanceEnabled: boolean
  distanceKm: number
  /** „Besonders alt behalten" (Tage-Modus oder Jahr-Modus). Nicht im Lucky-Trade-Modus. */
  ageEnabled: boolean
  ageMode: AgeMode
  ageDays: number
  /** Zu schützende Fangjahre (Jahr-Modus). */
  keepYears: number[]
  /** „Alle nicht-Geschützten": kein positives Kriterium, nur Ausschlüsse (Aufräumen). */
  allMode: boolean
  /** Ziel-Stufen (ODER-Gruppe, Aufräumen). */
  stars: StarTier[]
  /** „Low WP" → WP-{n} als zusätzliches Ziel (Aufräumen). */
  lowCpEnabled: boolean
  lowCpMax: number
  /** Entwickeln-Modus: alle entwickelbaren oder nur solche mit neuem Dex-Eintrag. */
  evolveVariant: EvolveVariant
  /** Entwickeln-Modus: optionaler IV-Filter (leer = alle). */
  evolveStars: StarTier[]
  /** Lucky-Trade-Modus: gesuchte Fangjahre (ODER-Gruppe). */
  tradeYears: number[]
  /**
   * Reise-Fänge-Modus: fertig berechneter Distanz-Ring [min, max] in km
   * (Luftlinie Heimat→Ziel ± Toleranz). null, solange Heimat/Ziel fehlen.
   * Der Heimatort selbst bleibt bewusst AUSSERHALB der Konfiguration
   * (eigener localStorage-Schlüssel), damit er nie in geteilten Links landet.
   */
  travelRing: [number, number] | null
  /** Entdecken-Modus: gewählte Karte und deren gewürfelte Parameter. */
  discoverKey: string | null
  discoverParams: number[]
  /** Baukasten: UND-Gruppen; innerhalb einer Gruppe gilt ODER. */
  builderGroups: BuilderTerm[][]
  /** Sicherer Modus: pro Ziel eine eigene reine UND-Zeile. */
  safeMode: boolean
}

export function defaultConfig(): QueryConfig {
  return {
    lang: 'de',
    mode: 'cleanup',
    protections: Object.fromEntries(PROTECTION_KEYS.map((k) => [k, true])) as Record<
      ProtectionKey,
      boolean
    >,
    distanceEnabled: false,
    distanceKm: 100,
    ageEnabled: false,
    ageMode: 'days',
    ageDays: 730,
    keepYears: [],
    allMode: false,
    stars: ['0*', '1*', '2*'],
    lowCpEnabled: false,
    lowCpMax: 500,
    evolveVariant: 'all',
    evolveStars: [],
    tradeYears: [2016, 2017],
    travelRing: null,
    discoverKey: null,
    discoverParams: [],
    builderGroups: [],
    safeMode: false,
  }
}

/** Alle aktiven Ausschlüsse (`!Begriff`) in stabiler Reihenfolge. */
export function buildExclusions(cfg: QueryConfig): string[] {
  const { lang } = cfg
  // Entdecken/Baukasten definieren ihre Suche vollständig selbst –
  // die Schutz-Ausschlüsse sind hier irrelevant.
  if (cfg.mode === 'discover' || cfg.mode === 'builder') return []
  const exclusions: string[] = []

  for (const key of PROTECTION_KEYS) {
    if (cfg.protections[key]) exclusions.push('!' + PROTECTIONS[key].terms[lang])
  }
  if (cfg.mode === 'luckyTrade') {
    // Bereits getauschte Pokémon können nicht erneut getauscht werden.
    exclusions.push('!' + MODE_TERMS.traded[lang])
  }
  // Im Reise-Modus ist die Entfernung das ZIEL (Ring) – der Distanz-Schutz
  // würde ihm widersprechen und wird unterdrückt.
  if (cfg.distanceEnabled && cfg.mode !== 'travel') {
    exclusions.push('!' + PARAMETRIC_TERMS.distance(lang, cfg.distanceKm))
  }
  // Im Lucky-Trade-Modus ist das Fangjahr das ZIEL – der Alters-Schutz
  // würde ihm widersprechen (Jahr2016&!Jahr2016 wäre immer leer).
  if (cfg.ageEnabled && cfg.mode !== 'luckyTrade') {
    if (cfg.ageMode === 'days') {
      exclusions.push('!' + PARAMETRIC_TERMS.age(lang, cfg.ageDays))
    } else {
      for (const year of [...cfg.keepYears].sort((a, b) => a - b)) {
        exclusions.push('!' + PARAMETRIC_TERMS.year(lang, year))
      }
    }
  }
  return exclusions
}

/**
 * Feste UND-Klauseln, die im jeweiligen Modus vor der Ziel-Gruppe stehen
 * (z. B. `entwickeln` im Entwickeln-Modus). Stehen in JEDER Teilzeile.
 */
export function buildPrefix(cfg: QueryConfig): string[] {
  if (cfg.mode !== 'evolve') return []
  const prefix: string[] = [MODE_TERMS.evolve[cfg.lang]]
  if (cfg.evolveVariant === 'new') prefix.push(MODE_TERMS.evolveNew[cfg.lang])
  return prefix
}

/**
 * Positive Ziel-Kriterien (werden untereinander mit `,` als ODER verknüpft).
 * Aufräumen: Stufen + Low WP (leer bei „Alle nicht-Geschützten").
 * Entwickeln: optionaler IV-Filter. Lucky Trades: Fangjahre.
 */
export function buildTargets(cfg: QueryConfig): string[] {
  switch (cfg.mode) {
    case 'evolve':
      return STAR_TIERS.filter((t) => cfg.evolveStars.includes(t))
    case 'luckyTrade':
      return [...cfg.tradeYears]
        .sort((a, b) => a - b)
        .map((year) => PARAMETRIC_TERMS.year(cfg.lang, year))
    case 'travel':
      return cfg.travelRing
        ? [PARAMETRIC_TERMS.distanceRange(cfg.lang, cfg.travelRing[0], cfg.travelRing[1])]
        : []
    default: {
      if (cfg.allMode) return []
      const targets: string[] = STAR_TIERS.filter((t) => cfg.stars.includes(t))
      if (cfg.lowCpEnabled) targets.push(PARAMETRIC_TERMS.maxCp(cfg.lang, cfg.lowCpMax))
      return targets
    }
  }
}

/** Prefix-Klauseln, ODER-Zielgruppe und Ausschlüsse zu einer Zeile verbinden. */
function joinLine(prefix: string[], targetGroup: string, exclusions: string[]): string {
  return [...prefix, targetGroup, ...exclusions].filter(Boolean).join('&')
}

/**
 * Kombinierter String: `[prefix&]ziel,ziel&!ausschluss&!ausschluss…`
 * Dank Präzedenz (ODER vor UND) gilt: prefix UND (ziel ODER ziel) UND ausschlüsse.
 */
export function buildCombined(cfg: QueryConfig): string {
  return joinLine(buildPrefix(cfg), buildTargets(cfg).join(','), buildExclusions(cfg))
}

/**
 * Sicherer Modus: pro Ziel ein eigener, reiner UND-String (keine ODER-Gruppe).
 * Ohne Ziele gibt es genau eine Zeile (Prefix + Ausschlüsse).
 */
export function buildSafeLines(cfg: QueryConfig): string[] {
  const prefix = buildPrefix(cfg)
  const exclusions = buildExclusions(cfg)
  const targets = buildTargets(cfg)
  if (targets.length === 0) {
    const line = joinLine(prefix, '', exclusions)
    return line ? [line] : []
  }
  return targets.map((target) => joinLine(prefix, target, exclusions))
}

/**
 * Ziele greedy auf so wenige Zeilen wie möglich verteilen, sodass jede Zeile
 * das 200-Zeichen-Limit einhält. Jede Zeile trägt IMMER den Prefix und alle
 * Ausschlüsse – die dürfen nie aufgeteilt werden, sonst wäre eine Teilsuche
 * unsicher.
 */
export function buildAutoSplitLines(cfg: QueryConfig): string[] {
  const prefix = buildPrefix(cfg)
  const exclusions = buildExclusions(cfg)
  const targets = buildTargets(cfg)
  const makeLine = (group: string[]) => joinLine(prefix, group.join(','), exclusions)

  const lines: string[] = []
  let group: string[] = []
  for (const target of targets) {
    if (group.length > 0 && makeLine([...group, target]).length > MAX_QUERY_LENGTH) {
      lines.push(makeLine(group))
      group = []
    }
    group.push(target)
  }
  if (group.length > 0) lines.push(makeLine(group))
  return lines
}

/**
 * Umkehr-Check: ODER-Suche über alle aktiven Schutz-Kriterien
 * (`Schillernd,Glücks,…`). Zeigt im Spiel alles, was die Transfer-Suche
 * verschont – zur Kontrolle vor dem Aufräumen. Wird bei Überlänge greedy
 * auf mehrere Zeilen verteilt; bei einer reinen ODER-Suche ist das
 * verlustfrei (Vereinigung der Teilergebnisse).
 */
export function buildProtectedLines(cfg: QueryConfig): string[] {
  const terms = buildExclusions(cfg).map((e) => e.slice(1))
  const lines: string[] = []
  let group: string[] = []
  for (const term of terms) {
    if (group.length > 0 && [...group, term].join(',').length > MAX_QUERY_LENGTH) {
      lines.push(group.join(','))
      group = []
    }
    group.push(term)
  }
  if (group.length > 0) lines.push(group.join(','))
  return lines
}

export interface QueryResult {
  /** Alle auszugebenden Zeilen (1 im Normalmodus, n im sicheren/Split-Modus). */
  lines: string[]
  exclusions: string[]
  targets: string[]
  /** true, wenn der kombinierte String das Limit überschritt und automatisch aufgeteilt wurde. */
  autoSplit: boolean
}

export function buildQuery(cfg: QueryConfig): QueryResult {
  const exclusions = buildExclusions(cfg)
  const targets = buildTargets(cfg)

  // Ohne Distanz-Ring hat der Reise-Modus kein Ziel – eine reine
  // Ausschluss-Suche wäre hier irreführend, also nichts ausgeben.
  if (cfg.mode === 'travel' && !cfg.travelRing) {
    return { lines: [], exclusions, targets: [], autoSplit: false }
  }

  // Entdecken: Die gewählte Karte liefert eine fertige Positiv-Suche
  // (kann selbst & und , enthalten) – ohne Karte keine Ausgabe.
  if (cfg.mode === 'discover') {
    const card = cfg.discoverKey ? findDiscoverCard(cfg.discoverKey) : undefined
    const line = card ? card.build(cfg.lang, cfg.discoverParams) : ''
    return { lines: line ? [line] : [], exclusions: [], targets: [], autoSplit: false }
  }

  // Baukasten: Gruppen = UND, innerhalb ODER – der String ist die
  // wörtliche Übersetzung der zusammengeklickten Kriterien.
  if (cfg.mode === 'builder') {
    const line = buildBuilderQuery(cfg.lang, cfg.builderGroups)
    return { lines: line ? [line] : [], exclusions: [], targets: [], autoSplit: false }
  }

  let lines: string[]
  let autoSplit = false
  if (cfg.safeMode) {
    lines = buildSafeLines(cfg)
  } else {
    const combined = buildCombined(cfg)
    if (!combined) {
      lines = []
    } else if (combined.length <= MAX_QUERY_LENGTH) {
      lines = [combined]
    } else {
      const split = buildAutoSplitLines(cfg)
      autoSplit = split.length > 1
      lines = autoSplit ? split : [combined]
    }
  }

  return { lines, exclusions, targets, autoSplit }
}

/**
 * Gespeicherte/geteilte Konfiguration mit den aktuellen Defaults zusammenführen –
 * neue Felder (z. B. später ergänzte Schutz-Kriterien) erhalten so ihre Defaults.
 */
export function mergeConfig(stored: unknown, fallback: QueryConfig): QueryConfig {
  if (typeof stored !== 'object' || stored === null) return fallback
  const s = stored as Partial<QueryConfig>
  const starList = (value: unknown, fallbackList: StarTier[]): StarTier[] =>
    Array.isArray(value)
      ? value.filter((t): t is StarTier => STAR_TIERS.includes(t as StarTier))
      : fallbackList
  const yearList = (value: unknown, fallbackList: number[]): number[] =>
    Array.isArray(value)
      ? value.filter((y): y is number => typeof y === 'number')
      : fallbackList
  return {
    ...fallback,
    ...s,
    mode:
      s.mode === 'evolve' ||
      s.mode === 'luckyTrade' ||
      s.mode === 'travel' ||
      s.mode === 'discover' ||
      s.mode === 'builder'
        ? s.mode
        : 'cleanup',
    builderGroups: Array.isArray(s.builderGroups)
      ? (s.builderGroups as unknown[])
          .filter((g): g is unknown[] => Array.isArray(g))
          .map((g) =>
            g
              .filter(
                (t): t is Record<string, unknown> => typeof t === 'object' && t !== null,
              )
              .filter((t) => typeof t.def === 'string' && findBuilderDef(t.def))
              .map(
                (t): BuilderTerm => ({
                  def: t.def as string,
                  neg: t.neg === true,
                  min: typeof t.min === 'number' ? t.min : null,
                  max: typeof t.max === 'number' ? t.max : null,
                  value: typeof t.value === 'number' ? t.value : null,
                  text: typeof t.text === 'string' ? t.text.slice(0, 30) : undefined,
                }),
              ),
          )
          .filter((g) => g.length > 0)
      : fallback.builderGroups,
    discoverKey:
      typeof s.discoverKey === 'string' && findDiscoverCard(s.discoverKey)
        ? s.discoverKey
        : null,
    discoverParams: Array.isArray(s.discoverParams)
      ? s.discoverParams.filter((n): n is number => typeof n === 'number')
      : fallback.discoverParams,
    travelRing:
      Array.isArray(s.travelRing) &&
      s.travelRing.length === 2 &&
      s.travelRing.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
      s.travelRing[0]! <= s.travelRing[1]!
        ? [s.travelRing[0]!, s.travelRing[1]!]
        : null,
    evolveVariant: s.evolveVariant === 'new' ? 'new' : 'all',
    // Nur bekannte Schutz-Schlüssel übernehmen – entfernte Kriterien
    // (z. B. der frühere Mega-Schutz) verschwinden so aus alten Configs.
    protections: Object.fromEntries(
      PROTECTION_KEYS.map((k) => [
        k,
        typeof (s.protections as Record<string, unknown> | undefined)?.[k] === 'boolean'
          ? ((s.protections as Record<string, boolean>)[k] as boolean)
          : fallback.protections[k],
      ]),
    ) as Record<ProtectionKey, boolean>,
    stars: starList(s.stars, fallback.stars),
    evolveStars: starList(s.evolveStars, fallback.evolveStars),
    keepYears: yearList(s.keepYears, fallback.keepYears),
    tradeYears: yearList(s.tradeYears, fallback.tradeYears),
  }
}
