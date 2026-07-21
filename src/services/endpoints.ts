// @ts-nocheck
import { api, saveTokens, clearTokens, getRefreshToken, getAccessToken } from './api'

export const authApi = {
  async login({ identifier, password, remember = true }) {
    const data = await api.post('/auth/login', { identifier, password })
    saveTokens(data, remember)
    return data
  },

  async signup(payload) {
    const data = await api.post('/auth/signup', payload)
    saveTokens(data, false)
    return data
  },

  async logout() {
    try {
      await api.post('/auth/logout', { refreshToken: getRefreshToken() })
    } catch {
      // ignore
    }
    clearTokens()
  },

  async me() {
    if (!getAccessToken()) return null
    return api.get('/auth/me')
  },

  updateProfile: (updates) => api.patch('/auth/profile', updates),
  updateSettings: (settings) => api.patch('/auth/settings', settings),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  verifyEmail: () => api.post('/auth/verify-email', {}),
  resendVerification: () => api.post('/auth/resend-verification', {}),
  loginWithProvider: (provider) => api.post(`/auth/oauth/${provider}`, {}),
}

export const productsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/products${qs ? `?${qs}` : ''}`)
  },
  getByBarcode: (code, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/products/barcode/${encodeURIComponent(code)}${qs ? `?${qs}` : ''}`)
  },
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
}

export const customersApi = {
  list: () => api.get('/customers'),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
}

export const employeesApi = {
  list: () => api.get('/employees'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
}

export const ordersApi = {
  list: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${encodeURIComponent(id)}`),
  checkout: (payload) => api.post('/orders/checkout', payload),
}

export const reportsApi = {
  summary: () => api.get('/reports/summary'),
  activity: () => api.get('/reports/activity'),
}

export const storesApi = {
  list: () => api.get('/stores'),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  select: (id) => api.post(`/stores/${id}/select`, {}),
  inventory: (id) => api.get(`/stores/${id}/inventory`),
}

export const suppliersApi = {
  list: () => api.get('/suppliers'),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  remove: (id) => api.delete(`/suppliers/${id}`),
  purchaseOrders: () => api.get('/suppliers/purchase-orders'),
  createPurchaseOrder: (data) => api.post('/suppliers/purchase-orders', data),
  receivePurchaseOrder: (id) => api.post(`/suppliers/purchase-orders/${id}/receive`, {}),
}

export const couponsApi = {
  list: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  remove: (id) => api.delete(`/coupons/${id}`),
  validate: (payload) => api.post('/coupons/validate', payload),
}

export const shiftsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/shifts${qs ? `?${qs}` : ''}`)
  },
  current: () => api.get('/shifts/current'),
  open: (data) => api.post('/shifts/open', data),
  close: (id, data) => api.post(`/shifts/${id}/close`, data),
}

export const refundsApi = {
  list: () => api.get('/refunds'),
  create: (data) => api.post('/refunds', data),
}

export const loyaltyApi = {
  tiers: () => api.get('/loyalty/tiers'),
  customers: () => api.get('/loyalty/customers'),
  history: (customerId) => api.get(`/loyalty/customers/${customerId}/history`),
  adjust: (data) => api.post('/loyalty/adjust', data),
  quoteRedeem: (data) => api.post('/loyalty/quote-redeem', data),
}

export const auditApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/audit${qs ? `?${qs}` : ''}`)
  },
}

export const alertsApi = {
  list: () => api.get('/alerts'),
  scan: (data = {}) => api.post('/alerts/scan', data),
  resend: (id) => api.post(`/alerts/${id}/resend`, {}),
}
