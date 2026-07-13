/**
 * Generierungs-Logik für die Pokémon-GO-Suchstrings.
 *
 * Operator-Präzedenz im Spiel: ODER (`,`) wird IMMER vor UND (`&`) ausgewertet.
 * `0*,1*,2*&!Schillernd` bedeutet also `(0* ODER 1* ODER 2*) UND !Schillernd`.
 * Deshalb: Ziel-Stufen mit `,` verketten, alle Ausschlüsse mit `&` anhängen.
 */

import {
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

export interface QueryResult {
  /** Alle auszugebenden Zeilen (1 im Normalmodus, n im sicheren Modus). */
  lines: string[]
  exclusions: string[]
  targets: string[]
}

export function buildQuery(cfg: QueryConfig): QueryResult {
  return {
    lines: cfg.safeMode ? buildSafeLines(cfg) : [buildCombined(cfg)].filter(Boolean),
    exclusions: buildExclusions(cfg),
    targets: buildTargets(cfg),
  }
}
