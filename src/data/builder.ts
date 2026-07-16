/**
 * Baukasten-Modus: frei kombinierbare Kriterien.
 *
 * Modell = exakt die Ausdruckskraft der Spiel-Syntax: UND-Gruppen, innerhalb
 * einer Gruppe ODER (Komma), jedes Kriterium optional negiert (!). Dank
 * Präzedenz (ODER vor UND) entspricht `gruppe1&gruppe2` genau
 * (a ODER b) UND (c ODER d).
 */

import {
  MODE_TERMS,
  PROTECTIONS,
  SOURCE_TERMS,
  TYPE_TERMS,
  type Lang,
} from './terms'

export type BuilderKind = 'static' | 'range' | 'number' | 'stars' | 'tag'

export type BuilderCategory =
  | 'Eigenschaften'
  | 'Typen'
  | 'Herkunft'
  | 'Bereiche'
  | 'Sonstiges'

export interface BuilderDef {
  key: string
  kind: BuilderKind
  label: string
  category: BuilderCategory
  /** Lokalisierte Begriffe (kind: static). */
  terms?: Record<Lang, string>
  /** Wortstamm für Bereiche/Zahlen (kind: range/number); null = nackte Zahlen (Dex). */
  rangeWord?: Record<Lang, string> | null
}

/** Ein konfiguriertes Kriterium im Baukasten (Teil der QueryConfig). */
export interface BuilderTerm {
  def: string
  neg?: boolean
  min?: number | null
  max?: number | null
  value?: number | null
  text?: string
}

const staticDef = (
  key: string,
  label: string,
  category: BuilderCategory,
  terms: Record<Lang, string>,
): BuilderDef => ({ key, kind: 'static', label, category, terms })

export const BUILDER_DEFS: BuilderDef[] = [
  // Eigenschaften (verifizierte Begriffe aus der Term-Map)
  staticDef('shiny', 'Schillernd', 'Eigenschaften', PROTECTIONS.shiny.terms),
  staticDef('lucky', 'Glücks', 'Eigenschaften', PROTECTIONS.lucky.terms),
  staticDef('shadow', 'Crypto', 'Eigenschaften', PROTECTIONS.shadow.terms),
  staticDef('purified', 'Erlöst', 'Eigenschaften', PROTECTIONS.purified.terms),
  staticDef('costume', 'Kostümiert', 'Eigenschaften', PROTECTIONS.costume.terms),
  staticDef('legendary', 'Legendär', 'Eigenschaften', PROTECTIONS.legendary.terms),
  staticDef('mythical', 'Mysteriös', 'Eigenschaften', PROTECTIONS.mythical.terms),
  staticDef('favorite', 'Favorit', 'Eigenschaften', PROTECTIONS.favorite.terms),
  staticDef('xxl', 'Grösse XXL', 'Eigenschaften', PROTECTIONS.xxl.terms),
  staticDef('xxs', 'Grösse XXS', 'Eigenschaften', PROTECTIONS.xxs.terms),
  staticDef('dynamax', 'Dynamax', 'Eigenschaften', PROTECTIONS.dynamax.terms),
  staticDef('gigantamax', 'Gigadynamax', 'Eigenschaften', PROTECTIONS.gigantamax.terms),
  staticDef('specialMoves', 'Spezialattacken', 'Eigenschaften', PROTECTIONS.specialMoves.terms),
  staticDef('defender', 'Arena-Verteidiger', 'Eigenschaften', PROTECTIONS.defender.terms),
  staticDef('traded', 'Getauscht', 'Eigenschaften', MODE_TERMS.traded),

  // Typen
  ...(
    [
      ['normal', 'Normal'],
      ['fire', 'Feuer'],
      ['water', 'Wasser'],
      ['grass', 'Pflanze'],
      ['electric', 'Elektro'],
      ['ice', 'Eis'],
      ['fighting', 'Kampf'],
      ['poison', 'Gift'],
      ['ground', 'Boden'],
      ['flying', 'Flug'],
      ['psychic', 'Psycho'],
      ['bug', 'Käfer'],
      ['rock', 'Gestein'],
      ['ghost', 'Geist'],
      ['dragon', 'Drache'],
      ['dark', 'Unlicht'],
      ['steel', 'Stahl'],
      ['fairy', 'Fee'],
    ] as const
  ).map(([key, label]) => staticDef(`type:${key}`, label, 'Typen', TYPE_TERMS[key])),

  // Herkunft
  staticDef('src:hatched', 'Geschlüpft (Ei)', 'Herkunft', SOURCE_TERMS.hatched),
  staticDef('src:raid', 'Aus Raids', 'Herkunft', SOURCE_TERMS.raid),
  staticDef('src:research', 'Aus Forschung', 'Herkunft', SOURCE_TERMS.research),
  staticDef('src:rocket', 'Von Team GO Rocket', 'Herkunft', SOURCE_TERMS.rocket),

  // Bereiche & Zahlen
  {
    key: 'cp',
    kind: 'range',
    label: 'WP-Bereich',
    category: 'Bereiche',
    rangeWord: { de: 'WP', en: 'cp' },
  },
  {
    key: 'age',
    kind: 'range',
    label: 'Alter (Tage)',
    category: 'Bereiche',
    rangeWord: { de: 'Alter', en: 'age' },
  },
  {
    key: 'distance',
    kind: 'range',
    label: 'Entfernung (km)',
    category: 'Bereiche',
    rangeWord: { de: 'Entfernung', en: 'distance' },
  },
  {
    key: 'dex',
    kind: 'range',
    label: 'Pokédex-Nummern',
    category: 'Bereiche',
    rangeWord: null,
  },
  {
    key: 'year',
    kind: 'number',
    label: 'Fangjahr',
    category: 'Bereiche',
    rangeWord: { de: 'Jahr', en: 'year' },
  },
  { key: 'stars', kind: 'stars', label: 'IV-Stufe (0★–4★)', category: 'Bereiche' },

  // Sonstiges
  staticDef('evolve', 'Entwickelbar', 'Sonstiges', MODE_TERMS.evolve),
  staticDef('evolveNew', 'Neuer Dex-Eintrag möglich', 'Sonstiges', MODE_TERMS.evolveNew),
  { key: 'tag', kind: 'tag', label: 'Eigener Tag (#…)', category: 'Sonstiges' },
]

export function findBuilderDef(key: string): BuilderDef | undefined {
  return BUILDER_DEFS.find((d) => d.key === key)
}

/** Bereichs-Syntax: X exakt, X-Y Bereich, X- „und höher", -Y „und niedriger". */
function rangeString(min: number | null | undefined, max: number | null | undefined): string {
  if (min != null && max != null) return min === max ? `${min}` : `${min}-${max}`
  if (min != null) return `${min}-`
  if (max != null) return `-${max}`
  return ''
}

/** Ein Kriterium in den Spiel-Suchbegriff übersetzen ('' = unvollständig, überspringen). */
export function builderTermToString(lang: Lang, term: BuilderTerm): string {
  const def = findBuilderDef(term.def)
  if (!def) return ''
  let base = ''
  switch (def.kind) {
    case 'static':
      base = def.terms?.[lang] ?? ''
      break
    case 'range': {
      const range = rangeString(term.min, term.max)
      if (!range) return ''
      base = (def.rangeWord?.[lang] ?? '') + range
      break
    }
    case 'number':
      if (term.value == null) return ''
      base = (def.rangeWord?.[lang] ?? '') + term.value
      break
    case 'stars':
      if (term.value == null || term.value < 0 || term.value > 4) return ''
      base = `${term.value}*`
      break
    case 'tag': {
      const text = term.text?.trim().replace(/^#/, '')
      if (!text) return ''
      base = '#' + text
      break
    }
  }
  return base ? (term.neg ? '!' : '') + base : ''
}

/** Alle Gruppen zu einem Suchstring verbinden (Gruppen = UND, innerhalb = ODER). */
export function buildBuilderQuery(lang: Lang, groups: BuilderTerm[][]): string {
  return groups
    .map((group) => group.map((t) => builderTermToString(lang, t)).filter(Boolean))
    .filter((g) => g.length > 0)
    .map((g) => g.join(','))
    .join('&')
}

/** PvP-Liga-Vorlagen für den Baukasten. */
export const LEAGUE_PRESETS: { name: string; description: string; groups: BuilderTerm[][] }[] = [
  {
    name: 'Superliga',
    description: 'Bis 1500 WP, gute IV (3★/4★).',
    groups: [
      [{ def: 'cp', max: 1500 }],
      [{ def: 'stars', value: 3 }, { def: 'stars', value: 4 }],
    ],
  },
  {
    name: 'Hyperliga',
    description: '1500–2500 WP, gute IV (3★/4★).',
    groups: [
      [{ def: 'cp', min: 1500, max: 2500 }],
      [{ def: 'stars', value: 3 }, { def: 'stars', value: 4 }],
    ],
  },
  {
    name: 'Meisterliga',
    description: 'Ab 2500 WP – die stärksten zuerst.',
    groups: [[{ def: 'cp', min: 2500 }]],
  },
]
