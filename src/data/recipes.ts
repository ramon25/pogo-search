/**
 * Eingebaute Preset-Vorlagen ("Rezepte") – nicht löschbar,
 * dienen als Startpunkte neben den benutzerdefinierten Presets.
 */

import { defaultConfig, type QueryConfig } from '../lib/buildQuery'

export interface Recipe {
  name: string
  description: string
  build: () => QueryConfig
}

export const RECIPES: Recipe[] = [
  {
    name: 'Standard',
    description: '0★–2★ suchen, alle Schutz-Kriterien aktiv.',
    build: defaultConfig,
  },
  {
    name: 'Konservativ',
    description: 'Nur 0★, zusätzlich weit weg Gefangenes und alte Fänge behalten.',
    build: () => ({
      ...defaultConfig(),
      stars: ['0*'],
      distanceEnabled: true,
      ageEnabled: true,
    }),
  },
  {
    name: 'Aggressiv',
    description: '0★–3★ plus Low WP – räumt maximal auf, Schutz bleibt aktiv.',
    build: () => ({
      ...defaultConfig(),
      stars: ['0*', '1*', '2*', '3*'],
      lowCpEnabled: true,
    }),
  },
  {
    name: 'Alles Ungeschützte',
    description: 'Kein positives Kriterium – zeigt alles ohne Schutz-Merkmal.',
    build: () => ({
      ...defaultConfig(),
      allMode: true,
    }),
  },
]
