import { describe, expect, it } from 'vitest'
import { defaultConfig } from './buildQuery'
import { decodeConfig, encodeConfig } from './urlState'

describe('urlState', () => {
  it('übersteht einen Encode/Decode-Roundtrip verlustfrei', () => {
    const cfg = {
      ...defaultConfig(),
      lang: 'en' as const,
      distanceEnabled: true,
      distanceKm: 42,
      keepYears: [2016, 2020],
    }
    expect(decodeConfig(encodeConfig(cfg))).toEqual(cfg)
  })

  it('ist URL-sicher (kein +, / oder =)', () => {
    const encoded = encodeConfig(defaultConfig())
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('gibt bei Müll-Eingaben null zurück', () => {
    expect(decodeConfig('%%%nicht-base64%%%')).toBeNull()
    expect(decodeConfig('bnVsbA')).toBeNull() // base64 für "null"
  })

  it('führt geteilte Alt-Configs mit den aktuellen Defaults zusammen', () => {
    // Simuliert einen Link aus einer älteren Version ohne specialMoves-Feld
    const old = { lang: 'de', protections: { shiny: false } }
    const bytes = new TextEncoder().encode(JSON.stringify(old))
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    const param = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const decoded = decodeConfig(param)
    expect(decoded?.protections.shiny).toBe(false)
    expect(decoded?.protections.specialMoves).toBe(true)
  })
})
