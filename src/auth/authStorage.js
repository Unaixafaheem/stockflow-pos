import { AUTH_STORAGE_KEYS } from './constants'

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const getStorage = (remember) => (remember ? localStorage : sessionStorage)

export function loadUsers() {
  return safeParse(localStorage.getItem(AUTH_STORAGE_KEYS.users), [])
}

export function saveUsers(users) {
  localStorage.setItem(AUTH_STORAGE_KEYS.users, JSON.stringify(users))
}

export function loadSession() {
  const remember = localStorage.getItem(AUTH_STORAGE_KEYS.remember) === 'true'
  const storage = getStorage(remember)
  const session = safeParse(storage.getItem(AUTH_STORAGE_KEYS.session), null)
  if (!session) {
    // Fallback: check the other storage in case remember flag changed
    const alt = safeParse(
      (remember ? sessionStorage : localStorage).getItem(AUTH_STORAGE_KEYS.session),
      null
    )
    return { session: alt, remember: alt ? !remember : remember }
  }
  return { session, remember }
}

export function saveSession(session, remember) {
  localStorage.setItem(AUTH_STORAGE_KEYS.remember, String(!!remember))
  const storage = getStorage(remember)
  storage.setItem(AUTH_STORAGE_KEYS.session, JSON.stringify(session))
  // Clear the other storage to avoid stale sessions
  getStorage(!remember).removeItem(AUTH_STORAGE_KEYS.session)
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.session)
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.session)
  localStorage.removeItem(AUTH_STORAGE_KEYS.remember)
}

export function loadResetTokens() {
  return safeParse(localStorage.getItem(AUTH_STORAGE_KEYS.resetTokens), {})
}

export function saveResetTokens(tokens) {
  localStorage.setItem(AUTH_STORAGE_KEYS.resetTokens, JSON.stringify(tokens))
}
