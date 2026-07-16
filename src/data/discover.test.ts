import { describe, expect, it } from 'vitest'
import { MAX_QUERY_LENGTH } from './terms'
import { DISCOVER_CARDS, findDiscoverCard, rollDiscoverCard } from './discover'

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
