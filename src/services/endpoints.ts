// @ts-nocheck
import { api, saveTokens, clearTokens, getRefreshToken, getAccessToken } from './api'
import {
  ensureRuntimeMode,
  forceDemoMode,
  isDemoMode,
  isUnreachableApiError,
} from './runtimeMode'
import {
  demoAuthApi,
  demoProductsApi,
  demoCustomersApi,
  demoEmployeesApi,
  demoOrdersApi,
  demoReportsApi,
  demoStoresApi,
  demoSuppliersApi,
  demoCouponsApi,
  demoShiftsApi,
  demoRefundsApi,
  demoLoyaltyApi,
  demoAuditApi,
  demoAlertsApi,
  isDemoToken,
} from './demoDataApi'

async function withBackend(apiCall, demoCall) {
  const mode = await ensureRuntimeMode()
  if (mode === 'demo') return demoCall()
  try {
    return await apiCall()
  } catch (err) {
    if (isUnreachableApiError(err) || err?.status === 404 || err?.status === 405) {
      forceDemoMode()
      return demoCall()
    }
    throw err
  }
}

export const authApi = {
  async login({ identifier, password, remember = true }) {
    return withBackend(
      async () => {
        const data = await api.post('/auth/login', { identifier, password })
        saveTokens(data, remember)
        return data
      },
      () => demoAuthApi.login({ identifier, password, remember }),
    )
  },

  async signup(payload) {
    return withBackend(
      async () => {
        const data = await api.post('/auth/signup', payload)
        saveTokens(data, false)
        return data
      },
      () => demoAuthApi.signup(payload),
    )
  },

  async logout() {
    if (isDemoMode() || isDemoToken()) {
      await demoAuthApi.logout()
      return
    }
    try {
      await api.post('/auth/logout', { refreshToken: getRefreshToken() })
    } catch {
      // ignore
    }
    clearTokens()
  },

  async me() {
    if (!getAccessToken()) return null
    if (isDemoMode() || isDemoToken()) return demoAuthApi.me()
    return withBackend(
      () => api.get('/auth/me'),
      () => demoAuthApi.me(),
    )
  },

  updateProfile: (updates) =>
    withBackend(
      () => api.patch('/auth/profile', updates),
      () => demoAuthApi.updateProfile(updates),
    ),
  updateSettings: (settings) =>
    withBackend(
      () => api.patch('/auth/settings', settings),
      () => demoAuthApi.updateSettings(settings),
    ),
  changePassword: (payload) =>
    withBackend(
      () => api.post('/auth/change-password', payload),
      () => demoAuthApi.changePassword(payload),
    ),
  requestPasswordReset: (email) =>
    withBackend(
      () => api.post('/auth/forgot-password', { email }),
      () => demoAuthApi.requestPasswordReset(email),
    ),
  resetPassword: (payload) =>
    withBackend(
      () => api.post('/auth/reset-password', payload),
      () => demoAuthApi.resetPassword(payload),
    ),
  verifyEmail: () =>
    withBackend(
      () => api.post('/auth/verify-email', {}),
      () => demoAuthApi.verifyEmail(),
    ),
  resendVerification: () =>
    withBackend(
      () => api.post('/auth/resend-verification', {}),
      () => demoAuthApi.resendVerification(),
    ),
  loginWithProvider: async (provider) => {
    try {
      return await withBackend(
        () => api.post(`/auth/oauth/${provider}`, {}),
        () => demoAuthApi.loginWithProvider(provider),
      )
    } catch {
      return demoAuthApi.loginWithProvider(provider)
    }
  },
}

export const productsApi = {
  list: (params = {}) =>
    withBackend(() => {
      const qs = new URLSearchParams(params).toString()
      return api.get(`/products${qs ? `?${qs}` : ''}`)
    }, () => demoProductsApi.list(params)),
  getByBarcode: (code, params = {}) =>
    withBackend(() => {
      const qs = new URLSearchParams(params).toString()
      return api.get(`/products/barcode/${encodeURIComponent(code)}${qs ? `?${qs}` : ''}`)
    }, () => demoProductsApi.getByBarcode(code, params)),
  create: (data) => withBackend(() => api.post('/products', data), () => demoProductsApi.create(data)),
  update: (id, data) =>
    withBackend(() => api.put(`/products/${id}`, data), () => demoProductsApi.update(id, data)),
  remove: (id) => withBackend(() => api.delete(`/products/${id}`), () => demoProductsApi.remove(id)),
}

export const customersApi = {
  list: () => withBackend(() => api.get('/customers'), () => demoCustomersApi.list()),
  create: (data) => withBackend(() => api.post('/customers', data), () => demoCustomersApi.create(data)),
  update: (id, data) =>
    withBackend(() => api.put(`/customers/${id}`, data), () => demoCustomersApi.update(id, data)),
  remove: (id) => withBackend(() => api.delete(`/customers/${id}`), () => demoCustomersApi.remove(id)),
}

export const employeesApi = {
  list: () => withBackend(() => api.get('/employees'), () => demoEmployeesApi.list()),
  create: (data) => withBackend(() => api.post('/employees', data), () => demoEmployeesApi.create(data)),
  update: (id, data) =>
    withBackend(() => api.put(`/employees/${id}`, data), () => demoEmployeesApi.update(id, data)),
  remove: (id) => withBackend(() => api.delete(`/employees/${id}`), () => demoEmployeesApi.remove(id)),
}

export const ordersApi = {
  list: () => withBackend(() => api.get('/orders'), () => demoOrdersApi.list()),
  get: (id) =>
    withBackend(() => api.get(`/orders/${encodeURIComponent(id)}`), () => demoOrdersApi.get(id)),
  checkout: (payload) =>
    withBackend(() => api.post('/orders/checkout', payload), () => demoOrdersApi.checkout(payload)),
}

export const reportsApi = {
  summary: () => withBackend(() => api.get('/reports/summary'), () => demoReportsApi.summary()),
  activity: () => withBackend(() => api.get('/reports/activity'), () => demoReportsApi.activity()),
}

export const storesApi = {
  list: () => withBackend(() => api.get('/stores'), () => demoStoresApi.list()),
  create: (data) => withBackend(() => api.post('/stores', data), () => demoStoresApi.create(data)),
  update: (id, data) =>
    withBackend(() => api.put(`/stores/${id}`, data), () => demoStoresApi.update(id, data)),
  select: (id) =>
    withBackend(() => api.post(`/stores/${id}/select`, {}), () => demoStoresApi.select(id)),
  inventory: (id) =>
    withBackend(() => api.get(`/stores/${id}/inventory`), () => demoStoresApi.inventory(id)),
}

export const suppliersApi = {
  list: () => withBackend(() => api.get('/suppliers'), () => demoSuppliersApi.list()),
  create: (data) => withBackend(() => api.post('/suppliers', data), () => demoSuppliersApi.create(data)),
  update: (id, data) =>
    withBackend(() => api.put(`/suppliers/${id}`, data), () => demoSuppliersApi.update(id, data)),
  remove: (id) => withBackend(() => api.delete(`/suppliers/${id}`), () => demoSuppliersApi.remove(id)),
  purchaseOrders: () =>
    withBackend(() => api.get('/suppliers/purchase-orders'), () => demoSuppliersApi.purchaseOrders()),
  createPurchaseOrder: (data) =>
    withBackend(
      () => api.post('/suppliers/purchase-orders', data),
      () => demoSuppliersApi.createPurchaseOrder(data),
    ),
  receivePurchaseOrder: (id) =>
    withBackend(
      () => api.post(`/suppliers/purchase-orders/${id}/receive`, {}),
      () => demoSuppliersApi.receivePurchaseOrder(id),
    ),
}

export const couponsApi = {
  list: () => withBackend(() => api.get('/coupons'), () => demoCouponsApi.list()),
  create: (data) => withBackend(() => api.post('/coupons', data), () => demoCouponsApi.create(data)),
  update: (id, data) =>
    withBackend(() => api.put(`/coupons/${id}`, data), () => demoCouponsApi.update(id, data)),
  remove: (id) => withBackend(() => api.delete(`/coupons/${id}`), () => demoCouponsApi.remove(id)),
  validate: (payload) =>
    withBackend(() => api.post('/coupons/validate', payload), () => demoCouponsApi.validate(payload)),
}

export const shiftsApi = {
  list: (params = {}) =>
    withBackend(() => {
      const qs = new URLSearchParams(params).toString()
      return api.get(`/shifts${qs ? `?${qs}` : ''}`)
    }, () => demoShiftsApi.list(params)),
  current: () => withBackend(() => api.get('/shifts/current'), () => demoShiftsApi.current()),
  open: (data) => withBackend(() => api.post('/shifts/open', data), () => demoShiftsApi.open(data)),
  close: (id, data) =>
    withBackend(() => api.post(`/shifts/${id}/close`, data), () => demoShiftsApi.close(id, data)),
}

export const refundsApi = {
  list: () => withBackend(() => api.get('/refunds'), () => demoRefundsApi.list()),
  create: (data) => withBackend(() => api.post('/refunds', data), () => demoRefundsApi.create(data)),
}

export const loyaltyApi = {
  tiers: () => withBackend(() => api.get('/loyalty/tiers'), () => demoLoyaltyApi.tiers()),
  customers: () => withBackend(() => api.get('/loyalty/customers'), () => demoLoyaltyApi.customers()),
  history: (customerId) =>
    withBackend(
      () => api.get(`/loyalty/customers/${customerId}/history`),
      () => demoLoyaltyApi.history(customerId),
    ),
  adjust: (data) =>
    withBackend(() => api.post('/loyalty/adjust', data), () => demoLoyaltyApi.adjust(data)),
  quoteRedeem: (data) =>
    withBackend(() => api.post('/loyalty/quote-redeem', data), () => demoLoyaltyApi.quoteRedeem(data)),
}

export const auditApi = {
  list: (params = {}) =>
    withBackend(() => {
      const qs = new URLSearchParams(params).toString()
      return api.get(`/audit${qs ? `?${qs}` : ''}`)
    }, () => demoAuditApi.list(params)),
}

export const alertsApi = {
  list: () => withBackend(() => api.get('/alerts'), () => demoAlertsApi.list()),
  scan: (data = {}) =>
    withBackend(() => api.post('/alerts/scan', data), () => demoAlertsApi.scan(data)),
  resend: (id) =>
    withBackend(() => api.post(`/alerts/${id}/resend`, {}), () => demoAlertsApi.resend(id)),
}
