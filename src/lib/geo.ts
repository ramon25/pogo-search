/** Geo-Helfer für den Reise-Fänge-Modus (Distanz-Ringe). */

import { CITIES, type CityRow } from '../data/cities'

export interface GeoPoint {
  lat: number
  lon: number
  /** Anzeigename, z. B. „Zürich (CH)" oder „Eigener Standort". */
  label: string
}

const EARTH_RADIUS_KM = 6371

/** Grosskreis-Distanz (Haversine) in Kilometern, gerundet. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)))
}

/** Distanz-Ring [min, max] um die Luftlinie Heimat→Ziel, nie negativ. */
export function distanceRing(
  home: GeoPoint,
  dest: GeoPoint,
  toleranceKm: number,
): [number, number] {
  const d = distanceKm(home, dest)
  return [Math.max(0, d - toleranceKm), d + toleranceKm]
}

/** Diakritik-unabhängig normalisieren („Zürich" ↔ „zurich"). */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ø/gi, 'o')
    .replace(/æ/gi, 'ae')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .trim()
}

export function cityToPoint(city: CityRow): GeoPoint {
  return { lat: city[2], lon: city[3], label: `${city[0]} (${city[1]})` }
}

/**
 * Städte-Suche: Präfix-Treffer zuerst, dann Substring-Treffer,
 * innerhalb der Gruppen nach Datenreihenfolge (= Bevölkerung).
 */
export function searchCities(query: string, limit = 6): CityRow[] {
  const q = normalize(query)
  if (q.length < 2) return []
  const prefix: CityRow[] = []
  const substring: CityRow[] = []
  for (const city of CITIES) {
    const name = normalize(city[0])
    if (name.startsWith(q)) prefix.push(city)
    else if (name.includes(q)) substring.push(city)
    if (prefix.length >= limit) break
  }
  return [...prefix, ...substring].slice(0, limit)
}
