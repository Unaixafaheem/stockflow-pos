import type { AuthRole } from '../types'

export const AUTH_ROLES: AuthRole[] = ['Admin', 'Manager', 'Cashier']

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: ['*'],
  Manager: [
    'dashboard', 'products', 'orders', 'customers', 'employees',
    'reports', 'pos', 'profile', 'settings', 'export',
    'stores', 'suppliers', 'coupons', 'shifts', 'loyalty', 'audit', 'alerts', 'refunds',
  ],
  Cashier: [
    'dashboard', 'pos', 'orders', 'customers', 'profile', 'settings', 'export',
    'shifts', 'loyalty', 'refunds',
  ],
}

export const hasPermission = (role: string | undefined | null, permission: string): boolean => {
  const perms = ROLE_PERMISSIONS[role || '']
  if (!perms) return false
  return perms.includes('*') || perms.includes(permission)
}

export const AUTH_STORAGE_KEYS = {
  session: 'stockflow_auth_session',
  users: 'stockflow_auth_users',
  remember: 'stockflow_auth_remember',
  resetTokens: 'stockflow_auth_reset_tokens',
} as const

export const DEMO_CREDENTIALS = {
  email: 'admin@stockflow.com',
  username: 'admin',
  password: 'admin123',
} as const

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Pakistan',
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'Germany',
  'France',
  'Other',
] as const

export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000
export const REMEMBER_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
