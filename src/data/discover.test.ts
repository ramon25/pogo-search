import { describe, expect, it } from 'vitest'
import { MAX_QUERY_LENGTH } from './terms'
import {
  buildCombo,
  COMBO_BLOCKS,
  DISCOVER_CARDS,
  findDiscoverCard,
  rollComboParams,
  rollDiscoverCard,
} from './discover'

describe('DISCOVER_CARDS', () => {
  it('erzeugt für jede Karte in beiden Sprachen einen gültigen String', () => {
    for (const card of DISCOVER_CARDS) {
      const params = card.randomize?.() ?? []
      for (const lang of ['de', 'en'] as const) {
        const result = card.build(lang, params)
        expect(result.length, card.key).toBeGreaterThan(0)
        expect(result.length, card.key).toBeLessThanOrEqual(MAX_QUERY_LENGTH)
        expect(result, card.key).not.toContain('!') // reine Positiv-Suchen
        expect(result, card.key).not.toContain('undefined')
        expect(result, card.key).not.toContain('NaN')
      }
    }
  })

  it('baut bekannte Karten mit den verifizierten Begriffen', () => {
    expect(findDiscoverCard('holyGrail')!.build('de', [])).toBe('Schillernd&4*')
    expect(findDiscoverCard('holyGrail')!.build('en', [])).toBe('shiny&4*')
    expect(findDiscoverCard('legendHall')!.build('de', [])).toBe('legendär,mysteriös')
    expect(findDiscoverCard('sizeExtremes')!.build('de', [])).toBe('XXS,XXL')
    expect(findDiscoverCard('powerhouses')!.build('en', [])).toBe('cp3000-')
  })

  it('Dex-Roulette liefert ein 50er-Fenster im gültigen Bereich', () => {
    const card = findDiscoverCard('dexRoulette')!
    for (let i = 0; i < 50; i++) {
      const [start] = card.randomize!() as [number]
      expect(start).toBeGreaterThanOrEqual(1)
      expect(start + 49).toBeLessThanOrEqual(1025)
      expect(card.build('de', [start])).toBe(`${start}-${start + 49}`)
    }
  })

  it('Jahrgangs-Roulette bleibt zwischen 2016 und heute', () => {
    const card = findDiscoverCard('yearRoulette')!
    for (let i = 0; i < 50; i++) {
      const [year] = card.randomize!() as [number]
      expect(year).toBeGreaterThanOrEqual(2016)
      expect(year).toBeLessThanOrEqual(new Date().getFullYear())
    }
  })

  it('build ist deterministisch bei gleichen Parametern (Sprachwechsel/Share)', () => {
    const card = findDiscoverCard('distanceRoulette')!
    expect(card.build('de', [300])).toBe('Entfernung300-400')
    expect(card.build('en', [300])).toBe('distance300-400')
  })

  it('Kombi-Roulette: buildCombo ist deterministisch und indexstabil', () => {
    // Indizes sind in gespeicherten Configs referenziert – Reihenfolge ist API!
    expect(COMBO_BLOCKS.map((b) => b.key)).toEqual([
      'shiny',
      'lucky',
      'shadow',
      'purified',
      'costume',
      'legendary',
      'mythical',
      'xxs',
      'xxl',
      'special',
      'traded',
      'stars',
      'cpWindow',
      'distWindow',
      'ageWindow',
      'year',
      'dexWindow',
      'hatched',
      'raid',
      'research',
      'rocket',
    ])
    expect(buildCombo('de', [0, 0, 12, 500])).toBe('Schillernd&WP500-1000')
    expect(buildCombo('en', [0, 0, 12, 500])).toBe('shiny&cp500-1000')
    expect(buildCombo('de', [11, 4, 15, 2019])).toBe('4*&Jahr2019')
    expect(buildCombo('de', [999, 0, 1, 0])).toBe('Glücks') // unbekannter Index wird ignoriert
  })

  it('Kombi-Roulette: würfelt nur verträgliche, eindeutige Bausteine', () => {
    const incompatible = [
      ['shadow', 'purified'],
      ['shadow', 'lucky'],
      ['shadow', 'traded'],
      ['xxs', 'xxl'],
      ['legendary', 'mythical'],
      ['year', 'ageWindow'],
    ]
    for (let i = 0; i < 200; i++) {
      const params = rollComboParams()
      expect(params.length % 2).toBe(0)
      expect([4, 6]).toContain(params.length)
      const keys: string[] = []
      for (let j = 0; j < params.length; j += 2) {
        const block = COMBO_BLOCKS[params[j]!]
        expect(block).toBeDefined()
        keys.push(block!.key)
      }
      expect(new Set(keys).size).toBe(keys.length) // keine Duplikate
      for (const [a, b] of incompatible) {
        expect(keys.includes(a!) && keys.includes(b!), keys.join(',')).toBe(false)
      }
      // Ergebnis ist eine gültige UND-Kette
      const result = buildCombo('de', params)
      expect(result.split('&')).toHaveLength(keys.length)
    }
  })

  it('rollDiscoverCard liefert immer eine existierende Karte mit Parametern', () => {
    for (let i = 0; i < 30; i++) {
      const roll = rollDiscoverCard()
      const card = findDiscoverCard(roll.key)
      expect(card).toBeDefined()
      expect(Array.isArray(roll.params)).toBe(true)
      if (card!.randomize) expect(roll.params.length).toBeGreaterThan(0)
    }
  })
})
