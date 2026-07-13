import { useState } from 'react'
import { cityToPoint, searchCities, type GeoPoint } from '../lib/geo'

interface LocationPickerProps {
  /** z. B. „Heimatort" oder „Reiseziel". */
  title: string
  value: GeoPoint | null
  /** GPS-Button anbieten (sinnvoll für den Heimatort). */
  allowGps?: boolean
  onChange: (point: GeoPoint | null) => void
}

/** Ort wählen: Städte-Suche (offline), optional GPS, manuelle Koordinaten. */
export function LocationPicker({ title, value, allowGps, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [gpsError, setGpsError] = useState('')
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')

  const suggestions = searchCities(query)

  function useGps() {
    setGpsError('')
    if (!navigator.geolocation) {
      setGpsError('GPS wird von diesem Browser nicht unterstützt.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
          label: 'Eigener Standort',
        })
      },
      () => setGpsError('Standort nicht verfügbar – Berechtigung verweigert?'),
    )
  }

  function applyManual() {
    const lat = Number(manualLat.replace(',', '.'))
    const lon = Number(manualLon.replace(',', '.'))
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
      return
    onChange({ lat, lon, label: `${lat.toFixed(2)}, ${lon.toFixed(2)}` })
    setManualLat('')
    setManualLon('')
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        {value && (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm text-emerald-700 dark:text-emerald-400">
              📍 {value.label}
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`${title} entfernen`}
              className="shrink-0 text-xs text-zinc-500 underline dark:text-zinc-400"
            >
              ändern
            </button>
          </span>
        )}
      </div>

      {!value && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Stadt suchen (z. B. Tromsø)"
              className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
            {allowGps && (
              <button
                type="button"
                onClick={useGps}
                title="Aktuellen Standort verwenden (bleibt auf dem Gerät)"
                className="min-h-11 shrink-0 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-600"
              >
                📡 GPS
              </button>
            )}
          </div>
          {gpsError && <p className="text-xs text-red-600 dark:text-red-400">{gpsError}</p>}
          {suggestions.length > 0 && (
            <ul className="space-y-1">
              {suggestions.map((city) => (
                <li key={`${city[0]}-${city[1]}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(cityToPoint(city))
                      setQuery('')
                    }}
                    className="min-h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-left text-sm text-zinc-800 hover:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-500"
                  >
                    {city[0]} <span className="text-zinc-400">({city[1]})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <details>
            <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400">
              Koordinaten manuell eingeben
            </summary>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="Breite (47.37)"
                className="h-11 w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                inputMode="decimal"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                placeholder="Länge (8.54)"
                className="h-11 w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={applyManual}
                className="min-h-11 shrink-0 rounded-lg bg-zinc-900 px-3 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                OK
              </button>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
