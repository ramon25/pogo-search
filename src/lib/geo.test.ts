import { describe, expect, it } from 'vitest'
import { cityToPoint, distanceKm, distanceRing, searchCities, type GeoPoint } from './geo'

const ZURICH: GeoPoint = { lat: 47.37, lon: 8.54, label: 'Zürich (CH)' }
const TROMSO: GeoPoint = { lat: 69.65, lon: 18.96, label: 'Tromsø (NO)' }
const NYC: GeoPoint = { lat: 40.71, lon: -74.01, label: 'New York City (US)' }

describe('distanceKm', () => {
  it('berechnet bekannte Luftlinien plausibel', () => {
    const zrhTromso = distanceKm(ZURICH, TROMSO)
    expect(zrhTromso).toBeGreaterThan(2400)
    expect(zrhTromso).toBeLessThan(2700)

    const zrhNyc = distanceKm(ZURICH, NYC)
    expect(zrhNyc).toBeGreaterThan(6200)
    expect(zrhNyc).toBeLessThan(6500)
  })

  it('ist symmetrisch und null bei identischen Punkten', () => {
    expect(distanceKm(ZURICH, TROMSO)).toBe(distanceKm(TROMSO, ZURICH))
    expect(distanceKm(ZURICH, ZURICH)).toBe(0)
  })
})

describe('distanceRing', () => {
  it('legt die Toleranz symmetrisch um die Distanz', () => {
    const d = distanceKm(ZURICH, TROMSO)
    expect(distanceRing(ZURICH, TROMSO, 50)).toEqual([d - 50, d + 50])
  })

  it('geht nie unter 0 km', () => {
    const nearby: GeoPoint = { lat: 47.39, lon: 8.52, label: 'Nachbarort' }
    const [min] = distanceRing(ZURICH, nearby, 100)
    expect(min).toBe(0)
  })
})

describe('searchCities', () => {
  it('findet Städte diakritik-unabhängig', () => {
    expect(searchCities('tromso')[0]?.[0]).toBe('Tromsø')
    expect(searchCities('zurich')[0]?.[0]).toBe('Zürich')
    expect(searchCities('Zürich')[0]?.[0]).toBe('Zürich')
  })

  it('findet grosse Weltstädte', () => {
    expect(searchCities('new york')[0]?.[0]).toBe('New York City')
    expect(searchCities('san franc')[0]?.[0]).toBe('San Francisco')
    expect(searchCities('tokyo')[0]?.[0]).toBe('Tokyo')
  })

  it('liefert nichts bei zu kurzer Eingabe', () => {
    expect(searchCities('z')).toHaveLength(0)
  })

  it('cityToPoint erzeugt Label mit Ländercode', () => {
    const city = searchCities('tromso')[0]!
    expect(cityToPoint(city)).toEqual({ lat: 69.65, lon: 18.96, label: 'Tromsø (NO)' })
  })
})
