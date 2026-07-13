/**
 * Verifizierte Pokémon-GO-Suchbegriffe (DE/EN).
 *
 * Die Begriffe sind im Spiel lokalisiert: Im deutsch eingestellten Spiel
 * funktionieren nur die deutschen Begriffe, im englischen nur die englischen.
 * Stern-Notation (0*–4*) und Operatoren (&, ,, !) sind sprachunabhängig.
 */

export type Lang = 'de' | 'en'

/** Reihenfolge = Reihenfolge der Ausschlüsse im generierten String. */
export const PROTECTION_KEYS = [
  'shiny',
  'lucky',
  'shadow',
  'purified',
  'costume',
  'fourStar',
  'legendary',
  'mythical',
  'favorite',
  'xxl',
  'xxs',
  'dynamax',
  'gigantamax',
  'specialMoves',
  'mega',
  'bestBuddy',
  'defender',
] as const

export type ProtectionKey = (typeof PROTECTION_KEYS)[number]

export interface ProtectionMeta {
  terms: Record<Lang, string>
  /** UI-Label (deutschsprachige Oberfläche). */
  label: string
  /** Kurzer Tooltip/Info-Text. */
  info: string
}

export const PROTECTIONS: Record<ProtectionKey, ProtectionMeta> = {
  shiny: {
    terms: { de: 'Schillernd', en: 'shiny' },
    label: 'Schillernd (Shiny)',
    info: 'Schillernde Pokémon behalten.',
  },
  lucky: {
    terms: { de: 'Glücks', en: 'lucky' },
    label: 'Glücks-Pokémon',
    info: 'Glücks-Pokémon aus Tauschen behalten (reduzierte Sternenstaub-Kosten).',
  },
  shadow: {
    terms: { de: 'Crypto', en: 'shadow' },
    label: 'Crypto',
    info: 'Crypto = Shadow-Pokémon von Team GO Rocket.',
  },
  purified: {
    terms: { de: 'erlöst', en: 'purified' },
    label: 'Erlöst',
    info: 'Erlöste (purified) Ex-Crypto-Pokémon behalten.',
  },
  costume: {
    terms: { de: 'kostümiert', en: 'costume' },
    label: 'Kostümiert',
    info: 'Event-/Kostüm-Pokémon behalten (oft nicht mehr erhältlich).',
  },
  fourStar: {
    terms: { de: '4*', en: '4*' },
    label: '4★ (100 % IV)',
    info: 'Perfekte Pokémon mit 100 % IV behalten.',
  },
  legendary: {
    terms: { de: 'legendär', en: 'legendary' },
    label: 'Legendär',
    info: 'Legendäre Pokémon behalten.',
  },
  mythical: {
    terms: { de: 'mysteriös', en: 'mythical' },
    label: 'Mysteriös',
    info: 'Mysteriöse Pokémon behalten (z. B. Mew, Celebi).',
  },
  favorite: {
    terms: { de: 'Favorit', en: 'favorite' },
    label: 'Favorit',
    info: 'Als Favorit markierte Pokémon behalten.',
  },
  xxl: {
    terms: { de: 'XXL', en: 'XXL' },
    label: 'Grösse XXL',
    info: 'Besonders grosse Pokémon behalten (z. B. für Sammler-Medaillen).',
  },
  xxs: {
    terms: { de: 'XXS', en: 'XXS' },
    label: 'Grösse XXS',
    info: 'Besonders kleine Pokémon behalten.',
  },
  dynamax: {
    terms: { de: 'Dynamax', en: 'dynamax' },
    label: 'Dynamax',
    info: 'Dynamax-Pokémon aus Max-Kämpfen behalten.',
  },
  gigantamax: {
    terms: { de: 'Gigadynamax', en: 'gigantamax' },
    label: 'Gigadynamax',
    info: 'Gigadynamax-Pokémon behalten (deutlich seltener als Dynamax).',
  },
  specialMoves: {
    terms: { de: '@spezial', en: '@special' },
    label: 'Spezialattacken',
    info: 'Pokémon mit Event-, Legacy- oder Elite-TM-Attacken behalten.',
  },
  mega: {
    terms: { de: 'Mega1-', en: 'mega1-' },
    label: 'Mega-entwickelt',
    info: 'Pokémon mit investierter Mega-Energie behalten (Mega-Level 1 oder höher).',
  },
  bestBuddy: {
    terms: { de: 'Kumpel4-', en: 'buddy4-' },
    label: 'Hyper-/Bester Kumpel',
    info: 'Pokémon ab Kumpel-Level 4 (Hyper-Kumpel und Bester Kumpel) behalten.',
  },
  defender: {
    terms: { de: 'Verteidiger', en: 'defender' },
    label: 'Arena-Verteidiger',
    info: 'Pokémon, die gerade eine Arena verteidigen – hält die Liste sauber.',
  },
}

/**
 * Parametrische Begriffe.
 * Bereichs-Syntax: `X` exakt, `X-Y` Bereich, `X-` „X und höher", `-X` „X und niedriger".
 */
export const PARAMETRIC_TERMS = {
  /** Distanz ab aktuellem Standort in km, „N und mehr": Entfernung100- */
  distance: (lang: Lang, km: number): string =>
    `${lang === 'de' ? 'Entfernung' : 'distance'}${km}-`,
  /** Distanz-Bereich (Ring) in km: Entfernung2650-2750 */
  distanceRange: (lang: Lang, minKm: number, maxKm: number): string =>
    `${lang === 'de' ? 'Entfernung' : 'distance'}${minKm}-${maxKm}`,
  /** Fangalter in Tagen, „N und mehr": Alter730- */
  age: (lang: Lang, days: number): string => `${lang === 'de' ? 'Alter' : 'age'}${days}-`,
  /** Fangjahr, exakt: Jahr2016 */
  year: (lang: Lang, year: number): string => `${lang === 'de' ? 'Jahr' : 'year'}${year}`,
  /** WP „N und niedriger": WP-500 */
  maxCp: (lang: Lang, cp: number): string => `${lang === 'de' ? 'WP' : 'cp'}-${cp}`,
} as const

/**
 * Modus-spezifische Begriffe (Entwickeln-/Lucky-Trade-Modus).
 * `evolveNew` (Neueentwicklung) zeigt allein auch Pokémon, denen noch Bonbons
 * fehlen – deshalb wird es im Tool immer mit `evolve` kombiniert.
 */
export const MODE_TERMS = {
  evolve: { de: 'entwickeln', en: 'evolve' },
  evolveNew: { de: 'Neueentwicklung', en: 'evolvenew' },
  traded: { de: 'getauscht', en: 'traded' },
} as const satisfies Record<string, Record<Lang, string>>

/** Erstes Jahr, in dem Pokémon GO verfügbar war. */
export const FIRST_YEAR = 2016

/** Maximale Länge der Suchleiste im Spiel. */
export const MAX_QUERY_LENGTH = 200
