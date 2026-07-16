/**
 * Entdecken-Modus: kuratierte „Schatzsuche"-Karten, um coole Pokémon in der
 * eigenen Box wiederzufinden. Alle Karten nutzen ausschliesslich verifizierte
 * Suchbegriffe bzw. sprachneutrale Syntax (Zahlen, Bereiche, Operatoren).
 *
 * `params` macht Karten deterministisch: Zufalls-Karten würfeln ihre Parameter
 * beim Auswählen (randomize) – build() ist danach eine reine Funktion, damit
 * Sprachwechsel, Presets und geteilte Links stabil bleiben.
 */

import { FIRST_YEAR, type Lang } from './terms'

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
]

export function findDiscoverCard(key: string): DiscoverCard | undefined {
  return DISCOVER_CARDS.find((c) => c.key === key)
}

/** Zufällige Karte inkl. frisch gewürfelter Parameter. */
export function rollDiscoverCard(): { key: string; params: number[] } {
  const card = DISCOVER_CARDS[Math.floor(Math.random() * DISCOVER_CARDS.length)]!
  return { key: card.key, params: card.randomize?.() ?? [] }
}
