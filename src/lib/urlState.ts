/**
 * Konfiguration als URL-Query teilen: ?c=<base64url(JSON)>.
 * UTF-8-sicher (Umlaute in gespeicherten Werten) und ohne Padding,
 * damit der Link ohne URL-Encoding auskommt.
 */

import { defaultConfig, mergeConfig, type QueryConfig } from './buildQuery'

export function encodeConfig(cfg: QueryConfig): string {
  const bytes = new TextEncoder().encode(JSON.stringify(cfg))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Gibt null zurück, wenn der Parameter kein gültiger Config-Payload ist. */
export function decodeConfig(param: string): QueryConfig | null {
  try {
    const base64 = param.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (typeof parsed !== 'object' || parsed === null) return null
    return mergeConfig(parsed, defaultConfig())
  } catch {
    return null
  }
}

export function buildShareUrl(cfg: QueryConfig): string {
  return `${window.location.origin}${window.location.pathname}?c=${encodeConfig(cfg)}`
}
