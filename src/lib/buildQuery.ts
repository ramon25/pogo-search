/**
 * Generierungs-Logik für die Pokémon-GO-Suchstrings.
 *
 * Operator-Präzedenz im Spiel: ODER (`,`) wird IMMER vor UND (`&`) ausgewertet.
 * `0*,1*,2*&!Schillernd` bedeutet also `(0* ODER 1* ODER 2*) UND !Schillernd`.
 * Deshalb: Ziel-Stufen mit `,` verketten, alle Ausschlüsse mit `&` anhängen.
 */

import {
  MAX_QUERY_LENGTH,
  PARAMETRIC_TERMS,
  PROTECTION_KEYS,
  PROTECTIONS,
  type Lang,
  type ProtectionKey,
} from '../data/terms'

export type StarTier = '0*' | '1*' | '2*' | '3*'

export const STAR_TIERS: readonly StarTier[] = ['0*', '1*', '2*', '3*']

export type AgeMode = 'days' | 'years'

export interface QueryConfig {
  /** Sprache der generierten Suchbegriffe (nicht der UI). */
  lang: Lang
  /** Schutz-Kriterien: aktiv = wird per `!Begriff` ausgeschlossen. */
  protections: Record<ProtectionKey, boolean>
  /** „Weit weg gefangen behalten" → !Entfernung{km}- */
  distanceEnabled: boolean
  distanceKm: number
  /** „Besonders alt behalten" (Tage-Modus oder Jahr-Modus). */
  ageEnabled: boolean
  ageMode: AgeMode
  ageDays: number
  /** Zu schützende Fangjahre (Jahr-Modus). */
  keepYears: number[]
  /** „Alle nicht-Geschützten": kein positives Kriterium, nur Ausschlüsse. */
  allMode: boolean
  /** Ziel-Stufen (ODER-Gruppe). */
  stars: StarTier[]
  /** „Low WP" → WP-{n} als zusätzliches Ziel. */
  lowCpEnabled: boolean
  lowCpMax: number
  /** Sicherer Modus: pro Ziel eine eigene reine UND-Zeile. */
  safeMode: boolean
}

export function defaultConfig(): QueryConfig {
  return {
    lang: 'de',
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
    safeMode: false,
  }
}

/** Alle aktiven Ausschlüsse (`!Begriff`) in stabiler Reihenfolge. */
export function buildExclusions(cfg: QueryConfig): string[] {
  const { lang } = cfg
  const exclusions: string[] = []

  for (const key of PROTECTION_KEYS) {
    if (cfg.protections[key]) exclusions.push('!' + PROTECTIONS[key].terms[lang])
  }
  if (cfg.distanceEnabled) {
    exclusions.push('!' + PARAMETRIC_TERMS.distance(lang, cfg.distanceKm))
  }
  if (cfg.ageEnabled) {
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
 * Positive Ziel-Kriterien (werden untereinander mit `,` als ODER verknüpft).
 * Leer im Modus „Alle nicht-Geschützten".
 */
export function buildTargets(cfg: QueryConfig): string[] {
  if (cfg.allMode) return []
  const targets: string[] = STAR_TIERS.filter((t) => cfg.stars.includes(t))
  if (cfg.lowCpEnabled) targets.push(PARAMETRIC_TERMS.maxCp(cfg.lang, cfg.lowCpMax))
  return targets
}

/**
 * Kombinierter String: `ziel,ziel&!ausschluss&!ausschluss…`
 * Dank Präzedenz (ODER vor UND) gilt: (ziel ODER ziel) UND ausschlüsse.
 */
export function buildCombined(cfg: QueryConfig): string {
  const targetPart = buildTargets(cfg).join(',')
  return [targetPart, ...buildExclusions(cfg)].filter(Boolean).join('&')
}

/**
 * Sicherer Modus: pro Ziel ein eigener, reiner UND-String (keine ODER-Gruppe).
 * Im Modus „Alle nicht-Geschützten" gibt es genau eine Zeile (nur Ausschlüsse).
 */
export function buildSafeLines(cfg: QueryConfig): string[] {
  const exclusions = buildExclusions(cfg)
  const targets = buildTargets(cfg)
  if (targets.length === 0) {
    const line = exclusions.join('&')
    return line ? [line] : []
  }
  return targets.map((target) => [target, ...exclusions].join('&'))
}

/**
 * Ziele greedy auf so wenige Zeilen wie möglich verteilen, sodass jede Zeile
 * das 200-Zeichen-Limit einhält. Jede Zeile trägt IMMER alle Ausschlüsse –
 * die dürfen nie aufgeteilt werden, sonst wäre eine Teilsuche unsicher.
 */
export function buildAutoSplitLines(cfg: QueryConfig): string[] {
  const exclusionPart = buildExclusions(cfg).join('&')
  const targets = buildTargets(cfg)
  const makeLine = (group: string[]) =>
    [group.join(','), exclusionPart].filter(Boolean).join('&')

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
  return {
    ...fallback,
    ...s,
    protections: { ...fallback.protections, ...(s.protections ?? {}) },
    stars: Array.isArray(s.stars)
      ? s.stars.filter((t): t is StarTier => STAR_TIERS.includes(t as StarTier))
      : fallback.stars,
    keepYears: Array.isArray(s.keepYears)
      ? s.keepYears.filter((y): y is number => typeof y === 'number')
      : fallback.keepYears,
  }
}
