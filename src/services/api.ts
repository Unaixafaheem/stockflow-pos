import type { ApiError, AuthTokens } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEY = 'stockflow_access_token'
const REFRESH_KEY = 'stockflow_refresh_token'
const REMEMBER_KEY = 'stockflow_auth_remember'

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
}

export function saveTokens(
  { accessToken, refreshToken }: Pick<AuthTokens, 'accessToken' | 'refreshToken'>,
  remember = true,
): void {
  const storage = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  storage.setItem(TOKEN_KEY, accessToken)
  storage.setItem(REFRESH_KEY, refreshToken)
  other.removeItem(TOKEN_KEY)
  other.removeItem(REFRESH_KEY)
  localStorage.setItem(REMEMBER_KEY, String(!!remember))
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) {
    clearTokens()
    return null
  }

  const data = (await res.json()) as AuthTokens
  const remember = localStorage.getItem(REMEMBER_KEY) !== 'false'
  saveTokens(data, remember)
  return data.accessToken
}

type RequestOptions = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`
      res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    }
  }

  const text = await res.text()
  let data: Record<string, unknown> | null = null
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : null
  } catch {
    data = { message: text }
  }

  if (!res.ok) {
    const error = new Error((data?.message as string) || 'Request failed') as ApiError
    error.status = res.status
    error.code = data?.code as string | undefined
    error.data = data
    throw error
  }

  return data as T
}

export const api = {
  get: <T = unknown>(path: string) => apiRequest<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = unknown>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = unknown>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
}
