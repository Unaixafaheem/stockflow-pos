import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveTokens, clearTokens, getAccessToken, getRefreshToken } from '../services/api'

describe('api token storage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('saves and clears tokens with remember-me', () => {
    saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' }, true)
    expect(getAccessToken()).toBe('access-1')
    expect(getRefreshToken()).toBe('refresh-1')
    expect(localStorage.getItem('stockflow_auth_remember')).toBe('true')
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('uses sessionStorage when remember is false', () => {
    saveTokens({ accessToken: 'a2', refreshToken: 'r2' }, false)
    expect(sessionStorage.getItem('stockflow_access_token')).toBe('a2')
    expect(localStorage.getItem('stockflow_access_token')).toBeNull()
  })
})
