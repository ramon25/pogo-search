import { describe, expect, it } from 'vitest'
import {
  BUILDER_DEFS,
  buildBuilderQuery,
  builderTermToString,
  LEAGUE_PRESETS,
} from './builder'
import { buildQuery, defaultConfig, mergeConfig, type QueryConfig } from '../lib/buildQuery'

describe('builderTermToString', () => {
  it('übersetzt statische Kriterien inkl. Negation', () => {
    expect(builderTermToString('de', { def: 'shiny' })).toBe('Schillernd')
    expect(builderTermToString('en', { def: 'shiny', neg: true })).toBe('!shiny')
    expect(builderTermToString('de', { def: 'type:electric' })).toBe('Elektro')
    expect(builderTermToString('de', { def: 'src:rocket' })).toBe('Rocket')
    expect(builderTermToString('en', { def: 'src:hatched' })).toBe('hatched')
  })

  it('beherrscht alle Bereichs-Varianten', () => {
    expect(builderTermToString('de', { def: 'cp', min: 100, max: 500 })).toBe('WP100-500')
    expect(builderTermToString('de', { def: 'cp', min: 1500 })).toBe('WP1500-')
    expect(builderTermToString('en', { def: 'cp', max: 1500 })).toBe('cp-1500')
    expect(builderTermToString('de', { def: 'cp', min: 100, max: 100 })).toBe('WP100')
    expect(builderTermToString('de', { def: 'dex', min: 1, max: 151 })).toBe('1-151')
    expect(builderTermToString('de', { def: 'cp' })).toBe('') // unvollständig
  })

  it('beherrscht Jahr, IV-Stufe und Tags', () => {
    expect(builderTermToString('de', { def: 'year', value: 2019 })).toBe('Jahr2019')
    expect(builderTermToString('en', { def: 'year', value: 2019 })).toBe('year2019')
    expect(builderTermToString('de', { def: 'stars', value: 4 })).toBe('4*')
    expect(builderTermToString('de', { def: 'stars', value: 7 })).toBe('') // ungültig
    expect(builderTermToString('de', { def: 'tag', text: 'urlaub' })).toBe('#urlaub')
    expect(builderTermToString('de', { def: 'tag', text: '#urlaub' })).toBe('#urlaub')
    expect(builderTermToString('de', { def: 'tag', text: '  ' })).toBe('')
    expect(builderTermToString('de', { def: 'gibtsNicht' })).toBe('')
  })
})

describe('buildBuilderQuery', () => {
  it('verknüpft Gruppen mit UND und Kriterien mit ODER', () => {
    const query = buildBuilderQuery('de', [
      [{ def: 'type:fire' }, { def: 'type:dragon' }],
      [{ def: 'cp', min: 2500 }],
      [{ def: 'shiny', neg: true }],
    ])
    expect(query).toBe('Feuer,Drache&WP2500-&!Schillernd')
  })

  it('überspringt unvollständige Kriterien und leere Gruppen', () => {
    const query = buildBuilderQuery('de', [
      [{ def: 'cp' }], // unvollständig → Gruppe fällt weg
      [{ def: 'shiny' }, { def: 'gibtsNicht' }],
    ])
    expect(query).toBe('Schillernd')
  })
})

describe('LEAGUE_PRESETS', () => {
  it('erzeugt die dokumentierten Liga-Strings', () => {
    const build = (i: number, lang: 'de' | 'en') =>
      buildBuilderQuery(lang, LEAGUE_PRESETS[i]!.groups)
    expect(build(0, 'de')).toBe('WP-1500&3*,4*')
    expect(build(0, 'en')).toBe('cp-1500&3*,4*')
    expect(build(1, 'de')).toBe('WP1500-2500&3*,4*')
    expect(build(2, 'de')).toBe('WP2500-')
  })
})

describe('Baukasten in buildQuery/mergeConfig', () => {
  it('liefert den Baukasten-String ohne Ausschlüsse', () => {
    const cfg: QueryConfig = {
      ...defaultConfig(),
      mode: 'builder',
      builderGroups: [[{ def: 'type:water' }], [{ def: 'stars', value: 4 }]],
    }
    const result = buildQuery(cfg)
    expect(result.lines).toEqual(['Wasser&4*'])
    expect(result.exclusions).toHaveLength(0)
  })

  it('gibt ohne Gruppen nichts aus', () => {
    expect(buildQuery({ ...defaultConfig(), mode: 'builder' }).lines).toHaveLength(0)
  })

  it('mergeConfig bereinigt kaputte Gruppen', () => {
    const merged = mergeConfig(
      {
        mode: 'builder',
        builderGroups: [
          [{ def: 'shiny', neg: 'ja' }, { def: 'kaputt' }, 'müll'],
          'keineGruppe',
          [],
          [{ def: 'cp', min: '100', max: 500 }],
        ],
      },
      defaultConfig(),
    )
    expect(merged.mode).toBe('builder')
    expect(merged.builderGroups).toEqual([
      [{ def: 'shiny', neg: false, min: null, max: null, value: null, text: undefined }],
      [{ def: 'cp', neg: false, min: null, max: 500, value: null, text: undefined }],
    ])
  })

  it('alle Katalog-Einträge erzeugen in beiden Sprachen etwas Sinnvolles', () => {
    for (const def of BUILDER_DEFS) {
      const term = {
        def: def.key,
        min: def.kind === 'range' ? 10 : null,
        max: def.kind === 'range' ? 20 : null,
        value: def.kind === 'stars' ? 3 : def.kind === 'number' ? 2020 : null,
        text: def.kind === 'tag' ? 'test' : undefined,
      }
      for (const lang of ['de', 'en'] as const) {
        const s = builderTermToString(lang, term)
        expect(s.length, `${def.key} (${lang})`).toBeGreaterThan(0)
        expect(s).not.toContain('undefined')
      }
    }
  })
})
