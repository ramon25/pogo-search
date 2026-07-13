import { useCallback, useState } from 'react'

/**
 * useState-Variante, die den Wert als JSON in localStorage spiegelt.
 * `merge` erlaubt es, gespeicherte Werte mit neuen Default-Feldern
 * zusammenzuführen (Schema-Änderungen überleben so einen Reload).
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  merge?: (stored: unknown, fallback: T) => T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      const parsed: unknown = JSON.parse(raw)
      return merge ? merge(parsed, defaultValue) : (parsed as T)
    } catch {
      return defaultValue
    }
  })

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        try {
          localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // localStorage voll oder blockiert – App funktioniert trotzdem.
        }
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
