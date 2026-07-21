export const ROLES = ['Admin', 'Manager', 'Cashier']

export const ROLE_PERMISSIONS = {
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

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || []
  return perms.includes('*') || perms.includes(permission)
}

export function sanitizeUser(user) {
  if (!user) return null
  const {
    passwordHash,
    notificationsJson,
    connectedJson,
    ...rest
  } = user

  let notifications = {
    email: true,
    lowStock: true,
    orders: true,
    marketing: false,
  }
  let connectedAccounts = { google: false, microsoft: false }

  try {
    notifications = { ...notifications, ...JSON.parse(notificationsJson || '{}') }
  } catch { /* ignore */ }
  try {
    connectedAccounts = { ...connectedAccounts, ...JSON.parse(connectedJson || '{}') }
  } catch { /* ignore */ }

  return {
    ...rest,
    notifications,
    connectedAccounts,
  }
}
