import { describe, expect, it } from 'vitest'
import {
  buildCombined,
  buildExclusions,
  buildQuery,
  buildSafeLines,
  defaultConfig,
  type QueryConfig,
} from './buildQuery'

/** Beispiel-Konfiguration aus dem Auftrag: alle Schutz an, 100 km, 730 Tage. */
function fullConfig(): QueryConfig {
  return {
    ...defaultConfig(),
    distanceEnabled: true,
    distanceKm: 100,
    ageEnabled: true,
    ageMode: 'days',
    ageDays: 730,
  }
}

describe('buildCombined', () => {
  it('erzeugt das dokumentierte DE-Beispiel exakt', () => {
    expect(buildCombined(fullConfig())).toBe(
      '0*,1*,2*&!Schillernd&!Glücks&!Crypto&!erlöst&!kostümiert&!4*&!legendär&!mysteriös&!Favorit&!XXL&!XXS&!Entfernung100-&!Alter730-',
    )
  })

  it('wechselt mit lang=en alle lokalisierten Begriffe', () => {
    expect(buildCombined({ ...fullConfig(), lang: 'en' })).toBe(
      '0*,1*,2*&!shiny&!lucky&!shadow&!purified&!costume&!4*&!legendary&!mythical&!favorite&!XXL&!XXS&!distance100-&!age730-',
    )
  })

  it('verknüpft Ziel-Stufen mit , (ODER) und Ausschlüsse mit & (UND)', () => {
    const cfg: QueryConfig = {
      ...defaultConfig(),
      protections: { ...defaultConfig().protections },
      stars: ['0*', '1*'],
    }
    const result = buildCombined(cfg)
    expect(result.startsWith('0*,1*&!')).toBe(true)
    expect(result).not.toContain(',!') // Ausschlüsse nie in der ODER-Gruppe
  })

  it('lässt deaktivierte Schutz-Kriterien weg', () => {
    const cfg = defaultConfig()
    cfg.protections.shiny = false
    expect(buildCombined(cfg)).not.toContain('!Schillernd')
  })

  it('erzeugt im Jahr-Modus einen !Jahr-Ausschluss pro Jahr (sortiert)', () => {
    const cfg: QueryConfig = {
      ...defaultConfig(),
      ageEnabled: true,
      ageMode: 'years',
      keepYears: [2017, 2016],
    }
    expect(buildCombined(cfg)).toContain('!Jahr2016&!Jahr2017')
    expect(buildCombined(cfg)).not.toContain('Alter')
  })

  it('hängt Low WP als zusätzliches ODER-Ziel an', () => {
    const cfg: QueryConfig = { ...defaultConfig(), lowCpEnabled: true, lowCpMax: 500 }
    expect(buildCombined(cfg).startsWith('0*,1*,2*,WP-500&')).toBe(true)
    expect(buildCombined({ ...cfg, lang: 'en' }).startsWith('0*,1*,2*,cp-500&')).toBe(true)
  })

  it('lässt im Modus „Alle nicht-Geschützten" das positive Kriterium weg', () => {
    const cfg: QueryConfig = { ...defaultConfig(), allMode: true }
    expect(buildCombined(cfg).startsWith('!Schillernd&')).toBe(true)
  })
})

describe('buildSafeLines', () => {
  it('erzeugt pro Ziel-Stufe eine eigene reine UND-Zeile', () => {
    const lines = buildSafeLines(fullConfig())
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe(
      '0*&!Schillernd&!Glücks&!Crypto&!erlöst&!kostümiert&!4*&!legendär&!mysteriös&!Favorit&!XXL&!XXS&!Entfernung100-&!Alter730-',
    )
    for (const line of lines) {
      expect(line).not.toContain(',') // rein UND, keine ODER-Gruppe
    }
    expect(lines[1]?.startsWith('1*&')).toBe(true)
    expect(lines[2]?.startsWith('2*&')).toBe(true)
  })

  it('gibt im Modus „Alle nicht-Geschützten" genau eine Ausschluss-Zeile aus', () => {
    const lines = buildSafeLines({ ...defaultConfig(), allMode: true })
    expect(lines).toHaveLength(1)
    expect(lines[0]?.startsWith('!Schillernd&')).toBe(true)
  })

  it('gibt für Low WP eine eigene Zeile aus', () => {
    const cfg: QueryConfig = { ...defaultConfig(), stars: ['0*'], lowCpEnabled: true }
    const lines = buildSafeLines(cfg)
    expect(lines).toHaveLength(2)
    expect(lines[1]?.startsWith('WP-500&')).toBe(true)
  })
})

describe('buildQuery', () => {
  it('liefert im Normalmodus genau eine Zeile', () => {
    expect(buildQuery(fullConfig()).lines).toHaveLength(1)
  })

  it('liefert im sicheren Modus eine Zeile pro Ziel', () => {
    expect(buildQuery({ ...fullConfig(), safeMode: true }).lines).toHaveLength(3)
  })

  it('liefert keine leeren Zeilen, wenn nichts ausgewählt ist', () => {
    const cfg: QueryConfig = {
      ...defaultConfig(),
      protections: Object.fromEntries(
        Object.keys(defaultConfig().protections).map((k) => [k, false]),
      ) as QueryConfig['protections'],
      stars: [],
    }
    expect(buildQuery(cfg).lines).toHaveLength(0)
    expect(buildExclusions(cfg)).toHaveLength(0)
  })
})
