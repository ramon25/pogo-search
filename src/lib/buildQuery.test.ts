import { describe, expect, it } from 'vitest'
import { MAX_QUERY_LENGTH } from '../data/terms'
import {
  buildAutoSplitLines,
  buildCombined,
  buildExclusions,
  buildProtectedLines,
  buildQuery,
  buildSafeLines,
  defaultConfig,
  mergeConfig,
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
  it('erzeugt das dokumentierte DE-Beispiel exakt (inkl. Dynamax)', () => {
    expect(buildCombined(fullConfig())).toBe(
      '0*,1*,2*&!Schillernd&!Glücks&!Crypto&!erlöst&!kostümiert&!4*&!legendär&!mysteriös&!Favorit&!XXL&!XXS&!Dynamax&!Gigadynamax&!@spezial&!Mega1-&!Kumpel4-&!Verteidiger&!Entfernung100-&!Alter730-',
    )
  })

  it('wechselt mit lang=en alle lokalisierten Begriffe', () => {
    expect(buildCombined({ ...fullConfig(), lang: 'en' })).toBe(
      '0*,1*,2*&!shiny&!lucky&!shadow&!purified&!costume&!4*&!legendary&!mythical&!favorite&!XXL&!XXS&!dynamax&!gigantamax&!@special&!mega1-&!buddy4-&!defender&!distance100-&!age730-',
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
      '0*&!Schillernd&!Glücks&!Crypto&!erlöst&!kostümiert&!4*&!legendär&!mysteriös&!Favorit&!XXL&!XXS&!Dynamax&!Gigadynamax&!@spezial&!Mega1-&!Kumpel4-&!Verteidiger&!Entfernung100-&!Alter730-',
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

/** Konfiguration, deren kombinierter String das Limit überschreitet (viele Jahre). */
function oversizedConfig(): QueryConfig {
  return {
    ...defaultConfig(),
    stars: ['0*', '1*', '2*', '3*'],
    lowCpEnabled: true,
    ageEnabled: true,
    ageMode: 'years',
    keepYears: [2016, 2017, 2018],
  }
}

describe('Auto-Split bei Überlänge', () => {
  it('teilt die Ziele auf mehrere Zeilen ≤ Limit auf', () => {
    const cfg = oversizedConfig()
    expect(buildCombined(cfg).length).toBeGreaterThan(MAX_QUERY_LENGTH)

    const result = buildQuery(cfg)
    expect(result.autoSplit).toBe(true)
    expect(result.lines.length).toBeGreaterThan(1)
    for (const line of result.lines) {
      expect(line.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH)
    }
  })

  it('behält in jeder Teilzeile ALLE Ausschlüsse (Sicherheit)', () => {
    const cfg = oversizedConfig()
    const exclusions = buildExclusions(cfg)
    for (const line of buildAutoSplitLines(cfg)) {
      for (const exclusion of exclusions) {
        expect(line).toContain(exclusion)
      }
    }
  })

  it('deckt zusammen alle Ziele genau einmal ab', () => {
    const cfg = oversizedConfig()
    const targets = buildAutoSplitLines(cfg).flatMap((l) => l.split('&')[0]!.split(','))
    expect(targets.sort()).toEqual(['0*', '1*', '2*', '3*', 'WP-500'].sort())
  })

  it('splittet nicht, wenn das Limit eingehalten wird', () => {
    const result = buildQuery(defaultConfig())
    expect(result.autoSplit).toBe(false)
    expect(result.lines).toHaveLength(1)
  })
})

describe('Entwickeln-Modus', () => {
  const evolveConfig = (): QueryConfig => ({ ...defaultConfig(), mode: 'evolve' })

  it('stellt entwickeln als UND-Klausel voran', () => {
    expect(buildCombined(evolveConfig()).startsWith('entwickeln&!Schillernd&')).toBe(true)
    expect(buildCombined({ ...evolveConfig(), lang: 'en' }).startsWith('evolve&!shiny&')).toBe(
      true,
    )
  })

  it('kombiniert die Neue-Dex-Variante immer mit entwickeln', () => {
    const cfg: QueryConfig = { ...evolveConfig(), evolveVariant: 'new' }
    expect(buildCombined(cfg).startsWith('entwickeln&Neueentwicklung&')).toBe(true)
    expect(buildCombined({ ...cfg, lang: 'en' }).startsWith('evolve&evolvenew&')).toBe(true)
  })

  it('hängt den optionalen IV-Filter als ODER-Gruppe hinter den Prefix', () => {
    const cfg: QueryConfig = { ...evolveConfig(), evolveStars: ['0*', '1*'] }
    expect(buildCombined(cfg).startsWith('entwickeln&0*,1*&!')).toBe(true)
  })

  it('behält den Prefix in jeder Zeile des sicheren Modus', () => {
    const cfg: QueryConfig = { ...evolveConfig(), evolveStars: ['0*', '1*'], safeMode: true }
    const lines = buildQuery(cfg).lines
    expect(lines).toHaveLength(2)
    for (const line of lines) {
      expect(line.startsWith('entwickeln&')).toBe(true)
      expect(line).not.toContain(',')
    }
  })

  it('respektiert Distanz- und Alters-Schutz weiterhin', () => {
    const cfg: QueryConfig = {
      ...evolveConfig(),
      distanceEnabled: true,
      ageEnabled: true,
    }
    expect(buildCombined(cfg)).toContain('!Entfernung100-')
    expect(buildCombined(cfg)).toContain('!Alter730-')
  })
})

describe('Lucky-Trade-Modus', () => {
  const tradeConfig = (): QueryConfig => ({ ...defaultConfig(), mode: 'luckyTrade' })

  it('nutzt die Fangjahre als ODER-Ziel und schliesst Getauschte aus', () => {
    const result = buildCombined(tradeConfig())
    expect(result.startsWith('Jahr2016,Jahr2017&!Schillernd&')).toBe(true)
    expect(result).toContain('&!getauscht')
    expect(buildCombined({ ...tradeConfig(), lang: 'en' }).startsWith('year2016,year2017&')).toBe(
      true,
    )
    expect(buildCombined({ ...tradeConfig(), lang: 'en' })).toContain('&!traded')
  })

  it('sortiert die Jahre aufsteigend', () => {
    const cfg: QueryConfig = { ...tradeConfig(), tradeYears: [2019, 2016] }
    expect(buildCombined(cfg).startsWith('Jahr2016,Jahr2019&')).toBe(true)
  })

  it('ignoriert den Alters-Schutz (Widerspruch zum Jahr-Ziel)', () => {
    const cfg: QueryConfig = {
      ...tradeConfig(),
      ageEnabled: true,
      ageMode: 'years',
      keepYears: [2016],
    }
    const result = buildCombined(cfg)
    expect(result).not.toContain('!Jahr')
    expect(result).not.toContain('!Alter')
  })

  it('behält den Distanz-Schutz bei', () => {
    const cfg: QueryConfig = { ...tradeConfig(), distanceEnabled: true }
    expect(buildCombined(cfg)).toContain('!Entfernung100-')
  })

  it('behält im Auto-Split alle Ausschlüsse inkl. !getauscht pro Zeile', () => {
    const cfg: QueryConfig = {
      ...tradeConfig(),
      tradeYears: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    }
    const lines = buildAutoSplitLines(cfg)
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(line).toContain('!getauscht')
      expect(line.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH)
    }
    // Alle Jahre genau einmal abgedeckt
    const years = lines.flatMap((l) => l.split('&').filter((c) => !c.startsWith('!'))[0]!.split(','))
    expect(years).toHaveLength(8)
  })
})

describe('Reise-Fänge-Modus', () => {
  const travelConfig = (): QueryConfig => ({
    ...defaultConfig(),
    mode: 'travel',
    travelRing: [2662, 2762],
  })

  it('nutzt den Distanz-Ring als Ziel', () => {
    expect(buildCombined(travelConfig()).startsWith('Entfernung2662-2762&!Schillernd&')).toBe(
      true,
    )
    expect(
      buildCombined({ ...travelConfig(), lang: 'en' }).startsWith('distance2662-2762&'),
    ).toBe(true)
  })

  it('unterdrückt den Distanz-Schutz (Widerspruch zum Ring)', () => {
    const cfg: QueryConfig = { ...travelConfig(), distanceEnabled: true }
    expect(buildCombined(cfg)).not.toContain('!Entfernung')
  })

  it('behält den Alters-Schutz bei', () => {
    const cfg: QueryConfig = { ...travelConfig(), ageEnabled: true }
    expect(buildCombined(cfg)).toContain('!Alter730-')
  })

  it('gibt ohne Ring keine Zeilen aus (Heimat/Ziel fehlen)', () => {
    const cfg: QueryConfig = { ...travelConfig(), travelRing: null }
    expect(buildQuery(cfg).lines).toHaveLength(0)
    expect(buildQuery({ ...cfg, safeMode: true }).lines).toHaveLength(0)
  })
})

describe('mergeConfig Modus-Validierung', () => {
  it('fällt bei unbekanntem Modus auf cleanup zurück', () => {
    expect(mergeConfig({ mode: 'kaputt' }, defaultConfig()).mode).toBe('cleanup')
    expect(mergeConfig({ mode: 'luckyTrade' }, defaultConfig()).mode).toBe('luckyTrade')
    expect(mergeConfig({ mode: 'travel' }, defaultConfig()).mode).toBe('travel')
    expect(mergeConfig({ evolveVariant: 'xyz' }, defaultConfig()).evolveVariant).toBe('all')
  })

  it('validiert den Distanz-Ring', () => {
    expect(mergeConfig({ travelRing: [100, 200] }, defaultConfig()).travelRing).toEqual([
      100, 200,
    ])
    expect(mergeConfig({ travelRing: [200, 100] }, defaultConfig()).travelRing).toBeNull()
    expect(mergeConfig({ travelRing: ['a', 'b'] }, defaultConfig()).travelRing).toBeNull()
    expect(mergeConfig({ travelRing: [1] }, defaultConfig()).travelRing).toBeNull()
    expect(mergeConfig({}, defaultConfig()).travelRing).toBeNull()
  })
})

describe('buildProtectedLines (Umkehr-Check)', () => {
  it('erzeugt eine reine ODER-Suche über alle Schutz-Kriterien', () => {
    const lines = buildProtectedLines(fullConfig())
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe(
      'Schillernd,Glücks,Crypto,erlöst,kostümiert,4*,legendär,mysteriös,Favorit,XXL,XXS,Dynamax,Gigadynamax,@spezial,Mega1-,Kumpel4-,Verteidiger,Entfernung100-,Alter730-',
    )
    expect(lines[0]).not.toContain('!')
    expect(lines[0]).not.toContain('&')
  })

  it('teilt bei Überlänge auf mehrere ODER-Zeilen auf, die alles abdecken', () => {
    const cfg: QueryConfig = {
      ...fullConfig(),
      ageMode: 'years',
      keepYears: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    }
    const lines = buildProtectedLines(cfg)
    const allTerms = buildExclusions(cfg).map((e) => e.slice(1))
    expect(lines.flatMap((l) => l.split(','))).toEqual(allTerms)
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH)
    }
  })

  it('ist leer, wenn kein Schutz-Kriterium aktiv ist', () => {
    const cfg: QueryConfig = {
      ...defaultConfig(),
      protections: Object.fromEntries(
        Object.keys(defaultConfig().protections).map((k) => [k, false]),
      ) as QueryConfig['protections'],
    }
    expect(buildProtectedLines(cfg)).toHaveLength(0)
  })
})

describe('mergeConfig', () => {
  it('ergänzt fehlende neue Felder mit Defaults', () => {
    const merged = mergeConfig({ lang: 'en', protections: { shiny: false } }, defaultConfig())
    expect(merged.lang).toBe('en')
    expect(merged.protections.shiny).toBe(false)
    expect(merged.protections.specialMoves).toBe(true) // neues Kriterium → Default
    expect(merged.stars).toEqual(defaultConfig().stars)
  })

  it('verwirft ungültige Stern-Stufen und Jahre', () => {
    const merged = mergeConfig(
      { stars: ['0*', '9*', 42], keepYears: [2016, 'x'] },
      defaultConfig(),
    )
    expect(merged.stars).toEqual(['0*'])
    expect(merged.keepYears).toEqual([2016])
  })

  it('fällt bei Nicht-Objekten auf die Defaults zurück', () => {
    expect(mergeConfig('kaputt', defaultConfig())).toEqual(defaultConfig())
    expect(mergeConfig(null, defaultConfig())).toEqual(defaultConfig())
  })
})
