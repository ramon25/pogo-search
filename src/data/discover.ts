/**
 * Entdecken-Modus: kuratierte „Schatzsuche"-Karten, um coole Pokémon in der
 * eigenen Box wiederzufinden. Alle Karten nutzen ausschliesslich verifizierte
 * Suchbegriffe bzw. sprachneutrale Syntax (Zahlen, Bereiche, Operatoren).
 *
 * `params` macht Karten deterministisch: Zufalls-Karten würfeln ihre Parameter
 * beim Auswählen (randomize) – build() ist danach eine reine Funktion, damit
 * Sprachwechsel, Presets und geteilte Links stabil bleiben.
 */

import { FIRST_YEAR, SOURCE_TERMS, type Lang } from './terms'

export interface DiscoverCard {
  key: string
  emoji: string
  title: string
  description: string
  /** Erzeugt die Parameter neu (nur bei Zufalls-Karten nötig). */
  randomize?: () => number[]
  build: (lang: Lang, params: number[]) => string
}

/** Höchste Pokédex-Nummer, die das Dex-Roulette anfahren kann. */
const MAX_DEX = 1025
/** Breite des Dex-Roulette-Fensters. */
const DEX_WINDOW = 50

/**
 * Bausteine für das Kombi-Roulette. Jeder Baustein hat höchstens einen
 * numerischen Parameter; die gewürfelte Kombination wird als flache
 * [blockIndex, param]-Paarliste in discoverParams gespeichert, damit
 * build() deterministisch bleibt (Sprachwechsel, Presets, Share-Links).
 *
 * WICHTIG: Reihenfolge nicht ändern – die Indizes stecken in gespeicherten
 * Configs und geteilten Links. Neue Bausteine nur ANHÄNGEN.
 */
interface ComboBlock {
  key: string
  randomize?: () => number
  build: (lang: Lang, param: number) => string
}

const randomStep = (maxStart: number, step: number) =>
  step * Math.floor(Math.random() * (maxStart / step + 1))

export const COMBO_BLOCKS: ComboBlock[] = [
  { key: 'shiny', build: (lang) => (lang === 'de' ? 'Schillernd' : 'shiny') },
  { key: 'lucky', build: (lang) => (lang === 'de' ? 'Glücks' : 'lucky') },
  { key: 'shadow', build: (lang) => (lang === 'de' ? 'Crypto' : 'shadow') },
  { key: 'purified', build: (lang) => (lang === 'de' ? 'erlöst' : 'purified') },
  { key: 'costume', build: (lang) => (lang === 'de' ? 'kostümiert' : 'costume') },
  { key: 'legendary', build: (lang) => (lang === 'de' ? 'legendär' : 'legendary') },
  { key: 'mythical', build: (lang) => (lang === 'de' ? 'mysteriös' : 'mythical') },
  { key: 'xxs', build: () => 'XXS' },
  { key: 'xxl', build: () => 'XXL' },
  { key: 'special', build: (lang) => (lang === 'de' ? '@spezial' : '@special') },
  { key: 'traded', build: (lang) => (lang === 'de' ? 'getauscht' : 'traded') },
  {
    key: 'stars',
    randomize: () => Math.floor(Math.random() * 5),
    build: (_lang, tier) => `${Math.min(4, Math.max(0, tier))}*`,
  },
  {
    key: 'cpWindow',
    randomize: () => randomStep(3500, 100),
    build: (lang, start) => `${lang === 'de' ? 'WP' : 'cp'}${start}-${start + 500}`,
  },
  {
    key: 'distWindow',
    randomize: () => randomStep(7900, 100),
    build: (lang, start) =>
      `${lang === 'de' ? 'Entfernung' : 'distance'}${start}-${start + 300}`,
  },
  {
    key: 'ageWindow',
    randomize: () => randomStep(2800, 100),
    build: (lang, start) => `${lang === 'de' ? 'Alter' : 'age'}${start}-${start + 365}`,
  },
  {
    key: 'year',
    randomize: () =>
      FIRST_YEAR + Math.floor(Math.random() * (new Date().getFullYear() - FIRST_YEAR + 1)),
    build: (lang, year) => `${lang === 'de' ? 'Jahr' : 'year'}${year}`,
  },
  {
    key: 'dexWindow',
    randomize: () => 1 + randomStep(MAX_DEX - 100, 25),
    build: (_lang, start) => `${start}-${start + 99}`,
  },
  // Herkunft – NUR ANHÄNGEN (Index-Stabilität, siehe oben)
  { key: 'hatched', build: (lang) => SOURCE_TERMS.hatched[lang] },
  { key: 'raid', build: (lang) => SOURCE_TERMS.raid[lang] },
  { key: 'research', build: (lang) => SOURCE_TERMS.research[lang] },
  { key: 'rocket', build: (lang) => SOURCE_TERMS.rocket[lang] },
]

/**
 * Paare, die auf einem einzelnen Pokémon unmöglich sind – ihre UND-Kombination
 * wäre garantiert leer und wird deshalb nie gewürfelt.
 */
const COMBO_INCOMPATIBLE: ReadonlyArray<readonly [string, string]> = [
  ['shadow', 'purified'],
  ['shadow', 'lucky'], // Crypto können nicht getauscht werden
  ['shadow', 'traded'],
  ['xxs', 'xxl'],
  ['legendary', 'mythical'],
  ['year', 'ageWindow'], // beide beschreiben das Fangalter – Widerspruchsgefahr
  // Herkunft: ein Pokémon hat genau eine Quelle
  ['hatched', 'raid'],
  ['hatched', 'research'],
  ['hatched', 'rocket'],
  ['raid', 'research'],
  ['raid', 'rocket'],
  ['research', 'rocket'],
  // Crypto kommen ausschliesslich von Team GO Rocket
  ['shadow', 'hatched'],
  ['shadow', 'raid'],
  ['shadow', 'research'],
]

function comboCompatible(a: string, b: string): boolean {
  return !COMBO_INCOMPATIBLE.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  )
}

/** Würfelt 2–3 verträgliche Bausteine als [blockIndex, param]-Paare. */
export function rollComboParams(): number[] {
  const count = Math.random() < 0.6 ? 2 : 3
  const chosen: number[] = []
  for (let guard = 0; chosen.length < count && guard < 100; guard++) {
    const idx = Math.floor(Math.random() * COMBO_BLOCKS.length)
    if (chosen.includes(idx)) continue
    const key = COMBO_BLOCKS[idx]!.key
    if (!chosen.every((c) => comboCompatible(COMBO_BLOCKS[c]!.key, key))) continue
    chosen.push(idx)
  }
  return chosen.flatMap((idx) => [idx, COMBO_BLOCKS[idx]!.randomize?.() ?? 0])
}

/** Baut die UND-Kette aus gespeicherten [blockIndex, param]-Paaren. */
export function buildCombo(lang: Lang, params: number[]): string {
  const parts: string[] = []
  for (let i = 0; i + 1 < params.length; i += 2) {
    const block = COMBO_BLOCKS[params[i]!]
    if (block) parts.push(block.build(lang, params[i + 1]!))
  }
  return [...new Set(parts)].join('&')
}

export const DISCOVER_CARDS: DiscoverCard[] = [
  {
    key: 'shinyShowcase',
    emoji: '✨',
    title: 'Shiny-Vitrine',
    description: 'Alle schillernden Pokémon auf einen Blick.',
    build: (lang) => (lang === 'de' ? 'Schillernd' : 'shiny'),
  },
  {
    key: 'perfectCollection',
    emoji: '💯',
    title: 'Perfekte Sammlung',
    description: 'Deine 100-%-IV-Pokémon (4★).',
    build: () => '4*',
  },
  {
    key: 'holyGrail',
    emoji: '🏆',
    title: 'Heiliger Gral',
    description: 'Shiny UND perfekt – die absolute Rarität.',
    build: (lang) => (lang === 'de' ? 'Schillernd&4*' : 'shiny&4*'),
  },
  {
    key: 'sizeExtremes',
    emoji: '🐣',
    title: 'Winzlinge & Riesen',
    description: 'Extreme Grössen: XXS oder XXL.',
    build: () => 'XXS,XXL',
  },
  {
    key: 'veterans',
    emoji: '🕰️',
    title: 'Veteranen',
    description: 'Fänge aus den Anfangsjahren 2016/2017.',
    build: (lang) => (lang === 'de' ? 'Jahr2016,Jahr2017' : 'year2016,year2017'),
  },
  {
    key: 'travellers',
    emoji: '✈️',
    title: 'Weitgereiste',
    description: 'Über 1000 km vom aktuellen Standort entfernt gefangen.',
    build: (lang) => (lang === 'de' ? 'Entfernung1000-' : 'distance1000-'),
  },
  {
    key: 'legendHall',
    emoji: '👑',
    title: 'Legenden-Saal',
    description: 'Alle legendären und mysteriösen Pokémon.',
    build: (lang) => (lang === 'de' ? 'legendär,mysteriös' : 'legendary,mythical'),
  },
  {
    key: 'luckyOnes',
    emoji: '🍀',
    title: 'Glückspilze',
    description: 'Deine Glücks-Pokémon aus Tauschen.',
    build: (lang) => (lang === 'de' ? 'Glücks' : 'lucky'),
  },
  {
    key: 'costumeParade',
    emoji: '🎭',
    title: 'Kostümschau',
    description: 'Event- und Kostüm-Pokémon – viele gibt es nie wieder.',
    build: (lang) => (lang === 'de' ? 'kostümiert' : 'costume'),
  },
  {
    key: 'rareMoves',
    emoji: '⚔️',
    title: 'Attacken-Raritäten',
    description: 'Pokémon mit Event-, Legacy- oder Elite-TM-Attacken.',
    build: (lang) => (lang === 'de' ? '@spezial' : '@special'),
  },
  {
    key: 'powerhouses',
    emoji: '💪',
    title: 'Kraftpakete',
    description: 'Alles ab 3000 WP.',
    build: (lang) => (lang === 'de' ? 'WP3000-' : 'cp3000-'),
  },
  {
    key: 'companions',
    emoji: '❤️',
    title: 'Weggefährten',
    description: 'Hyper- und Beste Kumpel – eure gemeinsame Geschichte.',
    build: (lang) => (lang === 'de' ? 'Kumpel4-' : 'buddy4-'),
  },
  {
    key: 'dexRoulette',
    emoji: '🎯',
    title: 'Dex-Roulette',
    description: `Ein zufälliges Pokédex-Fenster (${DEX_WINDOW} Nummern).`,
    randomize: () => [1 + Math.floor(Math.random() * (MAX_DEX - DEX_WINDOW + 1))],
    build: (_lang, [start = 1]) => `${start}-${start + DEX_WINDOW - 1}`,
  },
  {
    key: 'yearRoulette',
    emoji: '📅',
    title: 'Jahrgangs-Roulette',
    description: 'Ein zufälliges Fangjahr – Zeitreise durch deine Box.',
    randomize: () => [
      FIRST_YEAR + Math.floor(Math.random() * (new Date().getFullYear() - FIRST_YEAR + 1)),
    ],
    build: (lang, [year = FIRST_YEAR]) =>
      `${lang === 'de' ? 'Jahr' : 'year'}${year}`,
  },
  {
    key: 'distanceRoulette',
    emoji: '🌍',
    title: 'Distanz-Roulette',
    description: 'Ein zufälliger 100-km-Ring irgendwo auf deiner Fang-Landkarte.',
    randomize: () => [100 * Math.floor(Math.random() * 100)], // 0…9900 km
    build: (lang, [start = 0]) =>
      `${lang === 'de' ? 'Entfernung' : 'distance'}${start}-${start + 100}`,
  },
  {
    key: 'raidTrophies',
    emoji: '🏟️',
    title: 'Raid-Trophäen',
    description: 'Alles, was du aus Raids mitgenommen hast.',
    build: (lang) => SOURCE_TERMS.raid[lang],
  },
  {
    key: 'hatchery',
    emoji: '🥚',
    title: 'Brutstation',
    description: 'Alle aus Eiern geschlüpften Pokémon.',
    build: (lang) => SOURCE_TERMS.hatched[lang],
  },
  {
    key: 'comboRoulette',
    emoji: '🎰',
    title: 'Kombi-Roulette',
    description:
      'Würfelt 2–3 Kriterien zusammen: Eigenschaften, IV, WP-, Distanz-, Alters-Fenster …',
    randomize: rollComboParams,
    build: (lang, params) => buildCombo(lang, params),
  },
]

export function findDiscoverCard(key: string): DiscoverCard | undefined {
  return DISCOVER_CARDS.find((c) => c.key === key)
}

/** Zufällige Karte inkl. frisch gewürfelter Parameter. */
export function rollDiscoverCard(): { key: string; params: number[] } {
  const card = DISCOVER_CARDS[Math.floor(Math.random() * DISCOVER_CARDS.length)]!
  return { key: card.key, params: card.randomize?.() ?? [] }
}
