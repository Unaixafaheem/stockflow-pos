const API_BASE = import.meta.env.VITE_API_URL || '/api'

export type RuntimeMode = 'api' | 'demo' | 'unknown'

let mode: RuntimeMode = 'unknown'
let probePromise: Promise<RuntimeMode> | null = null

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim().toLowerCase()
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')
}

export function getRuntimeMode(): RuntimeMode {
  return mode
}

export function isDemoMode(): boolean {
  return mode === 'demo'
}

export function forceDemoMode(): void {
  mode = 'demo'
}

export function forceApiMode(): void {
  mode = 'api'
}

/** Probe whether the StockFlow API is reachable (Vercel static hosts need demo mode). */
export async function ensureRuntimeMode(): Promise<RuntimeMode> {
  if (mode === 'api' || mode === 'demo') return mode
  if (probePromise) return probePromise

  probePromise = (async () => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 2500)
      const res = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timer)
      const text = await res.text()
      if (!res.ok || looksLikeHtml(text)) {
        mode = 'demo'
        return mode
      }
      const data = JSON.parse(text) as { status?: string }
      mode = data?.status === 'ok' ? 'api' : 'demo'
    } catch {
      mode = 'demo'
    }
    return mode
  })()

  return probePromise
}

export function isUnreachableApiError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message || ''
  return (
    msg === 'Failed to fetch' ||
    msg === 'NetworkError when attempting to fetch resource.' ||
    msg === 'Load failed' ||
    msg.includes('Unexpected token') ||
    msg.includes('<!DOCTYPE') ||
    msg.includes('API unavailable')
  )
}
