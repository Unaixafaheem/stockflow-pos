import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { authApi } from '../services/endpoints'
import { clearTokens, getAccessToken } from '../services/api'
import { hasPermission } from './constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let mounted = true
    const restore = async () => {
      try {
        if (!getAccessToken()) {
          if (mounted) {
            setUser(null)
            setSession(null)
          }
          return
        }
        const result = await authApi.me()
        if (!mounted) return
        if (result?.user) {
          setUser(result.user)
          setSession({
            role: result.user.role,
            remember: localStorage.getItem('stockflow_auth_remember') !== 'false',
          })
          setSessionExpired(false)
        } else {
          setUser(null)
          setSession(null)
        }
      } catch (err) {
        if (!mounted) return
        clearTokens()
        if (err?.code === 'TOKEN_EXPIRED') setSessionExpired(true)
        setUser(null)
        setSession(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    restore()
    return () => { mounted = false }
  }, [])

  const login = useCallback(async ({ identifier, password, remember }) => {
    const result = await authApi.login({ identifier, password, remember })
    setUser(result.user)
    setSession({ role: result.user.role, remember: !!remember })
    setSessionExpired(false)
    return result
  }, [])

  const signup = useCallback(async (payload) => {
    const result = await authApi.signup(payload)
    setUser(result.user)
    setSession({ role: result.user.role, remember: false })
    setSessionExpired(false)
    return result
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    setSession(null)
  }, [])

  const updateProfile = useCallback(async (updates) => {
    const result = await authApi.updateProfile(updates)
    setUser(result.user)
    return result.user
  }, [])

  const updateSettings = useCallback(async (settings) => {
    const result = await authApi.updateSettings(settings)
    setUser(result.user)
    return result.user
  }, [])

  const changePassword = useCallback(async (payload) => {
    return authApi.changePassword(payload)
  }, [])

  const verifyEmail = useCallback(async () => {
    const result = await authApi.verifyEmail()
    setUser(result.user)
    return result.user
  }, [])

  const resendVerification = useCallback(async () => {
    return authApi.resendVerification()
  }, [])

  const loginWithProvider = useCallback(async (provider) => {
    return authApi.loginWithProvider(provider)
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    return authApi.requestPasswordReset(email)
  }, [])

  const resetPassword = useCallback(async (payload) => {
    return authApi.resetPassword(payload)
  }, [])

  const refreshUser = useCallback(async () => {
    const result = await authApi.me()
    if (result?.user) {
      setUser(result.user)
      setSession({
        role: result.user.role,
        remember: localStorage.getItem('stockflow_auth_remember') !== 'false',
      })
      return result.user
    }
    return null
  }, [])

  const can = useCallback((permission) => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }, [user])

  const value = useMemo(() => ({
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    sessionExpired,
    setSessionExpired,
    login,
    signup,
    logout,
    updateProfile,
    updateSettings,
    changePassword,
    verifyEmail,
    resendVerification,
    loginWithProvider,
    requestPasswordReset,
    resetPassword,
    refreshUser,
    can,
  }), [
    user, session, isLoading, sessionExpired,
    login, signup, logout, updateProfile, updateSettings,
    changePassword, verifyEmail, resendVerification,
    loginWithProvider, requestPasswordReset, resetPassword, refreshUser, can,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
