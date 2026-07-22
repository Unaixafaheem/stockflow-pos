import { generateId } from '../utils/helpers'
import {
  AUTH_ROLES,
  DEMO_CREDENTIALS,
  SESSION_MAX_AGE_MS,
  REMEMBER_MAX_AGE_MS,
} from './constants'
import {
  loadUsers,
  saveUsers,
  loadSession,
  saveSession,
  clearSession,
  loadResetTokens,
  saveResetTokens,
} from './authStorage'

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

function baseUser(overrides) {
  return {
    phone: '',
    storeName: 'StockFlow Downtown',
    country: 'United States',
    emailVerified: true,
    status: 'Active',
    themePreference: 'system',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    currentStoreId: 'store_demo_main',
    connectedAccounts: { google: false, microsoft: false },
    notifications: {
      email: true,
      lowStock: true,
      orders: true,
      marketing: false,
    },
    ...overrides,
  }
}

function createDemoUsers() {
  return [
    baseUser({
      id: 'user_demo_admin',
      firstName: 'Unaiza',
      lastName: 'Faheem',
      username: DEMO_CREDENTIALS.username,
      email: DEMO_CREDENTIALS.email,
      phone: '+1 (555) 010-0001',
      password: DEMO_CREDENTIALS.password,
      role: 'Admin',
    }),
    baseUser({
      id: 'user_demo_manager',
      firstName: 'Marcus',
      lastName: 'Johnson',
      username: 'manager',
      email: 'manager@stockflow.com',
      phone: '+1 (555) 010-0002',
      password: 'manager123',
      role: 'Manager',
    }),
    baseUser({
      id: 'user_demo_cashier',
      firstName: 'Priya',
      lastName: 'Sharma',
      username: 'cashier',
      email: 'cashier@stockflow.com',
      phone: '+1 (555) 010-0003',
      password: 'cashier123',
      role: 'Cashier',
    }),
  ]
}

function ensureSeedUsers() {
  const users = loadUsers()
  const demos = createDemoUsers()
  if (users.length === 0) {
    saveUsers(demos)
    return demos
  }

  let next = [...users]
  let changed = false
  for (const demo of demos) {
    const exists = next.some(
      (u) => u.email === demo.email || u.username === demo.username || u.id === demo.id,
    )
    if (!exists) {
      next = [demo, ...next]
      changed = true
    }
  }
  if (changed) saveUsers(next)
  return next
}

function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

function findUser(identifier) {
  const users = ensureSeedUsers()
  const value = identifier.trim().toLowerCase()
  return users.find(
    (u) => u.email.toLowerCase() === value || u.username.toLowerCase() === value
  )
}

function createSession(user, remember) {
  const now = Date.now()
  return {
    userId: user.id,
    role: user.role,
    issuedAt: now,
    expiresAt: now + (remember ? REMEMBER_MAX_AGE_MS : SESSION_MAX_AGE_MS),
    remember: !!remember,
  }
}

function isSessionValid(session) {
  if (!session?.expiresAt) return false
  return Date.now() < session.expiresAt
}

export const authService = {
  async getCurrentSession() {
    await delay(200)
    ensureSeedUsers()
    const { session, remember } = loadSession()
    if (!session) return { user: null, session: null, remember: false, expired: false }

    if (!isSessionValid(session)) {
      clearSession()
      return { user: null, session: null, remember: false, expired: true }
    }

    const users = loadUsers()
    const user = users.find((u) => u.id === session.userId)
    if (!user) {
      clearSession()
      return { user: null, session: null, remember: false, expired: false }
    }

    return { user: sanitizeUser(user), session, remember, expired: false }
  },

  async login({ identifier, password, remember = false }) {
    await delay(700)
    const user = findUser(identifier)
    if (!user || user.password !== password) {
      const error = new Error('Invalid email/username or password')
      error.code = 'INVALID_CREDENTIALS'
      throw error
    }
    if (user.status === 'Inactive') {
      const error = new Error('This account has been deactivated')
      error.code = 'ACCOUNT_INACTIVE'
      throw error
    }

    const users = loadUsers()
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
    )
    saveUsers(updated)

    const session = createSession(user, remember)
    saveSession(session, remember)

    return {
      user: sanitizeUser({ ...user, lastLogin: new Date().toISOString() }),
      session,
    }
  },

  async signup(payload) {
    await delay(800)
    const users = ensureSeedUsers()
    const emailExists = users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())
    const usernameExists = users.some(
      (u) => u.username.toLowerCase() === payload.username.toLowerCase()
    )

    if (emailExists) {
      const error = new Error('An account with this email already exists')
      error.code = 'EMAIL_EXISTS'
      throw error
    }
    if (usernameExists) {
      const error = new Error('This username is already taken')
      error.code = 'USERNAME_EXISTS'
      throw error
    }
    if (!AUTH_ROLES.includes(payload.role)) {
      const error = new Error('Invalid role selected')
      error.code = 'INVALID_ROLE'
      throw error
    }

    const user = {
      id: generateId('user'),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      username: payload.username.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      password: payload.password,
      role: payload.role,
      storeName: payload.storeName.trim(),
      country: payload.country,
      emailVerified: false,
      status: 'Active',
      themePreference: 'system',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      connectedAccounts: { google: false, microsoft: false },
      notifications: {
        email: true,
        lowStock: true,
        orders: true,
        marketing: false,
      },
    }

    saveUsers([...users, user])

    // Auto-login after signup (session), but require email verification UI
    const session = createSession(user, false)
    saveSession(session, false)

    return {
      user: sanitizeUser(user),
      session,
      needsVerification: true,
    }
  },

  async logout() {
    await delay(200)
    clearSession()
    return true
  },

  async requestPasswordReset(email) {
    await delay(700)
    const user = findUser(email)
    // Always return success for security (don't reveal if email exists)
    if (user) {
      const token = generateId('reset')
      const tokens = loadResetTokens()
      tokens[token] = {
        userId: user.id,
        email: user.email,
        expiresAt: Date.now() + 60 * 60 * 1000,
      }
      saveResetTokens(tokens)
      return { success: true, token, email: user.email }
    }
    return { success: true, token: null, email }
  },

  async resetPassword({ token, password }) {
    await delay(700)
    const tokens = loadResetTokens()
    const entry = tokens[token]
    if (!entry || entry.expiresAt < Date.now()) {
      const error = new Error('This reset link is invalid or has expired')
      error.code = 'INVALID_TOKEN'
      throw error
    }

    const users = loadUsers()
    const updated = users.map((u) =>
      u.id === entry.userId ? { ...u, password } : u
    )
    saveUsers(updated)

    delete tokens[token]
    saveResetTokens(tokens)
    clearSession()

    return { success: true }
  },

  async verifyEmail(userId) {
    await delay(500)
    const users = loadUsers()
    const updated = users.map((u) =>
      u.id === userId ? { ...u, emailVerified: true } : u
    )
    saveUsers(updated)
    const user = updated.find((u) => u.id === userId)
    return { user: sanitizeUser(user) }
  },

  async resendVerification(userId) {
    await delay(600)
    return { success: true }
  },

  async updateProfile(userId, updates) {
    await delay(500)
    const users = loadUsers()
    const updated = users.map((u) => {
      if (u.id !== userId) return u
      return {
        ...u,
        firstName: updates.firstName?.trim() ?? u.firstName,
        lastName: updates.lastName?.trim() ?? u.lastName,
        phone: updates.phone?.trim() ?? u.phone,
        storeName: updates.storeName?.trim() ?? u.storeName,
        country: updates.country ?? u.country,
        username: updates.username?.trim() ?? u.username,
        currentStoreId: updates.currentStoreId ?? u.currentStoreId,
      }
    })
    saveUsers(updated)
    return { user: sanitizeUser(updated.find((u) => u.id === userId)) }
  },

  async updateSettings(userId, settings) {
    await delay(400)
    const users = loadUsers()
    const updated = users.map((u) => {
      if (u.id !== userId) return u
      return {
        ...u,
        themePreference: settings.themePreference ?? u.themePreference,
        notifications: { ...u.notifications, ...(settings.notifications || {}) },
      }
    })
    saveUsers(updated)
    return { user: sanitizeUser(updated.find((u) => u.id === userId)) }
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    await delay(600)
    const users = loadUsers()
    const user = users.find((u) => u.id === userId)
    if (!user || user.password !== currentPassword) {
      const error = new Error('Current password is incorrect')
      error.code = 'WRONG_PASSWORD'
      throw error
    }
    const updated = users.map((u) =>
      u.id === userId ? { ...u, password: newPassword } : u
    )
    saveUsers(updated)
    return { success: true }
  },

  /**
   * OAuth abstraction — ready for Firebase/Google/Microsoft later.
   * Returns a structured "not configured" result instead of fake login.
   */
  async loginWithProvider(provider) {
    await delay(400)
    return {
      configured: false,
      provider,
      message: `${provider} sign-in is ready to connect. Configure your OAuth provider to enable it.`,
    }
  },
}
