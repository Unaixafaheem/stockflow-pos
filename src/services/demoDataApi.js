import { getInitialData } from '../data/sampleData'
import { generateId, generateOrderId, calculateTax } from '../utils/helpers'
import { authService } from '../auth/authService'
import { saveTokens, clearTokens, getAccessToken } from './api'

const DATA_KEY = 'stockflow_demo_data_v1'
const DEMO_ACCESS = 'demo_access_token'
const DEMO_REFRESH = 'demo_refresh_token'

const defaultStores = [
  {
    id: 'store_demo_main',
    name: 'StockFlow Downtown',
    code: 'DTN',
    address: '120 Market Street, Suite 200',
    phone: '+1 (555) 100-2000',
    status: 'Active',
  },
  {
    id: 'store_demo_east',
    name: 'StockFlow Eastside',
    code: 'EST',
    address: '88 Riverside Ave',
    phone: '+1 (555) 100-3000',
    status: 'Active',
  },
]

function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  const initial = getInitialData()
  const seeded = {
    ...initial,
    stores: defaultStores,
    coupons: [
      {
        id: 'coup_welcome',
        code: 'WELCOME10',
        type: 'percent',
        value: 10,
        minOrder: 20,
        active: true,
        usageLimit: 100,
        usedCount: 0,
      },
    ],
    shifts: [],
    currentShiftId: null,
    refunds: [],
    loyalty: {
      tiers: [
        { id: 'tier_bronze', name: 'Bronze', minPoints: 0, earnRate: 1 },
        { id: 'tier_silver', name: 'Silver', minPoints: 500, earnRate: 1.25 },
        { id: 'tier_gold', name: 'Gold', minPoints: 1500, earnRate: 1.5 },
      ],
      balances: {},
      history: {},
    },
    audit: [],
    alerts: [],
    suppliers: [
      { id: 'sup_1', name: 'Fresh Farms Co.', email: 'orders@freshfarms.com', phone: '+1 (555) 200-1000', status: 'Active' },
      { id: 'sup_2', name: 'AquaPure Inc.', email: 'sales@aquapure.com', phone: '+1 (555) 200-2000', status: 'Active' },
    ],
    purchaseOrders: [],
  }
  saveData(seeded)
  return seeded
}

function saveData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}

function issueDemoTokens(remember = true) {
  saveTokens({ accessToken: DEMO_ACCESS, refreshToken: DEMO_REFRESH }, remember)
}

export function isDemoToken(token = getAccessToken()) {
  return token === DEMO_ACCESS
}

export const demoAuthApi = {
  async login({ identifier, password, remember = true }) {
    const result = await authService.login({ identifier, password, remember })
    issueDemoTokens(remember)
    return {
      user: result.user,
      accessToken: DEMO_ACCESS,
      refreshToken: DEMO_REFRESH,
    }
  },

  async signup(payload) {
    const result = await authService.signup(payload)
    issueDemoTokens(false)
    return {
      user: result.user,
      accessToken: DEMO_ACCESS,
      refreshToken: DEMO_REFRESH,
      needsVerification: result.needsVerification,
    }
  },

  async logout() {
    await authService.logout()
    clearTokens()
  },

  async me() {
    if (!getAccessToken()) return null
    const result = await authService.getCurrentSession()
    if (!result.user) return null
    return { user: result.user }
  },

  updateProfile: (updates) => authService.getCurrentSession().then(async ({ user }) => {
    if (!user) throw new Error('Not authenticated')
    return authService.updateProfile(user.id, updates)
  }),

  updateSettings: (settings) => authService.getCurrentSession().then(async ({ user }) => {
    if (!user) throw new Error('Not authenticated')
    return authService.updateSettings(user.id, settings)
  }),

  changePassword: (payload) => authService.getCurrentSession().then(async ({ user }) => {
    if (!user) throw new Error('Not authenticated')
    return authService.changePassword(user.id, payload)
  }),

  requestPasswordReset: (email) => authService.requestPasswordReset(email),
  resetPassword: (payload) => authService.resetPassword(payload),
  verifyEmail: () => authService.getCurrentSession().then(async ({ user }) => {
    if (!user) throw new Error('Not authenticated')
    return authService.verifyEmail(user.id)
  }),
  resendVerification: () => authService.getCurrentSession().then(async ({ user }) => {
    if (!user) throw new Error('Not authenticated')
    return authService.resendVerification(user.id)
  }),
  loginWithProvider: (provider) => authService.loginWithProvider(provider),
}

export const demoProductsApi = {
  list: async () => loadData().products,
  getByBarcode: async (code) => {
    const product = loadData().products.find((p) => p.barcode === code)
    if (!product) throw Object.assign(new Error('Product not found'), { status: 404 })
    return product
  },
  create: async (data) => {
    const store = loadData()
    const created = { id: generateId('prod'), ...data }
    store.products = [...store.products, created]
    saveData(store)
    return created
  },
  update: async (id, data) => {
    const store = loadData()
    store.products = store.products.map((p) => (p.id === id ? { ...p, ...data } : p))
    saveData(store)
    return store.products.find((p) => p.id === id)
  },
  remove: async (id) => {
    const store = loadData()
    store.products = store.products.filter((p) => p.id !== id)
    saveData(store)
    return { success: true }
  },
}

export const demoCustomersApi = {
  list: async () => loadData().customers,
  create: async (data) => {
    const store = loadData()
    const created = {
      id: generateId('cust'),
      totalPurchases: 0,
      lastPurchaseDate: null,
      ...data,
    }
    store.customers = [...store.customers, created]
    saveData(store)
    return created
  },
  update: async (id, data) => {
    const store = loadData()
    store.customers = store.customers.map((c) => (c.id === id ? { ...c, ...data } : c))
    saveData(store)
    return store.customers.find((c) => c.id === id)
  },
  remove: async (id) => {
    const store = loadData()
    store.customers = store.customers.filter((c) => c.id !== id)
    saveData(store)
    return { success: true }
  },
}

export const demoEmployeesApi = {
  list: async () => loadData().employees,
  create: async (data) => {
    const store = loadData()
    const created = { id: generateId('emp'), status: 'Active', ...data }
    store.employees = [...store.employees, created]
    saveData(store)
    return created
  },
  update: async (id, data) => {
    const store = loadData()
    store.employees = store.employees.map((e) => (e.id === id ? { ...e, ...data } : e))
    saveData(store)
    return store.employees.find((e) => e.id === id)
  },
  remove: async (id) => {
    const store = loadData()
    store.employees = store.employees.filter((e) => e.id !== id)
    saveData(store)
    return { success: true }
  },
}

export const demoOrdersApi = {
  list: async () => loadData().orders,
  get: async (id) => {
    const order = loadData().orders.find((o) => o.id === id)
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })
    return order
  },
  checkout: async (payload) => {
    const store = loadData()
    const lines = payload.items.map((item) => {
      const product = store.products.find((p) => p.id === item.productId)
      if (!product) throw new Error('Product not found')
      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.sellingPrice,
        total: product.sellingPrice * item.quantity,
      }
    })
    const subtotal = lines.reduce((sum, l) => sum + l.total, 0)
    const discount = Number(payload.discount) || 0
    const tax = calculateTax(Math.max(0, subtotal - discount))
    const total = Math.max(0, subtotal - discount) + tax
    const order = {
      id: generateOrderId(),
      date: new Date().toISOString(),
      customerId: payload.customerId || null,
      customerName: payload.customerName || 'Walk-in Customer',
      items: lines,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: payload.paymentMethod,
      status: 'Completed',
    }
    store.orders = [order, ...store.orders]
    store.products = store.products.map((p) => {
      const line = payload.items.find((i) => i.productId === p.id)
      if (!line) return p
      return { ...p, stockQuantity: Math.max(0, p.stockQuantity - line.quantity) }
    })
    if (payload.customerId) {
      store.customers = store.customers.map((c) =>
        c.id === payload.customerId
          ? { ...c, totalPurchases: (c.totalPurchases || 0) + total, lastPurchaseDate: order.date }
          : c,
      )
    }
    saveData(store)
    return order
  },
}

export const demoReportsApi = {
  summary: async () => {
    const { orders, products } = loadData()
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
    return {
      revenue,
      orders: orders.length,
      products: products.length,
      lowStock: products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length,
    }
  },
  activity: async () => {
    const { orders } = loadData()
    const cash = orders.filter((o) => o.paymentMethod === 'Cash').reduce((s, o) => s + o.total, 0)
    const card = orders.filter((o) => o.paymentMethod === 'Card').reduce((s, o) => s + o.total, 0)
    const online = orders.filter((o) => o.paymentMethod === 'Online').reduce((s, o) => s + o.total, 0)
    return {
      paymentBreakdown: [
        { method: 'Cash', total: cash },
        { method: 'Card', total: card },
        { method: 'Online', total: online },
      ],
      cashierPerformance: [
        { name: 'Demo Cashier', orders: orders.length, revenue: cash + card + online },
      ],
    }
  },
}

export const demoStoresApi = {
  list: async () => loadData().stores,
  create: async (data) => {
    const store = loadData()
    const created = { id: generateId('store'), status: 'Active', ...data }
    store.stores = [...store.stores, created]
    saveData(store)
    return created
  },
  update: async (id, data) => {
    const store = loadData()
    store.stores = store.stores.map((s) => (s.id === id ? { ...s, ...data } : s))
    saveData(store)
    return store.stores.find((s) => s.id === id)
  },
  select: async (id) => {
    const session = await authService.getCurrentSession()
    if (session.user) {
      await authService.updateProfile(session.user.id, { currentStoreId: id })
    }
    return { success: true, storeId: id }
  },
  inventory: async () => loadData().products,
}

export const demoSuppliersApi = {
  list: async () => loadData().suppliers,
  create: async (data) => {
    const store = loadData()
    const created = { id: generateId('sup'), status: 'Active', ...data }
    store.suppliers = [...store.suppliers, created]
    saveData(store)
    return created
  },
  update: async (id, data) => {
    const store = loadData()
    store.suppliers = store.suppliers.map((s) => (s.id === id ? { ...s, ...data } : s))
    saveData(store)
    return store.suppliers.find((s) => s.id === id)
  },
  remove: async (id) => {
    const store = loadData()
    store.suppliers = store.suppliers.filter((s) => s.id !== id)
    saveData(store)
    return { success: true }
  },
  purchaseOrders: async () => loadData().purchaseOrders,
  createPurchaseOrder: async (data) => {
    const store = loadData()
    const created = {
      id: generateId('po'),
      status: 'Open',
      createdAt: new Date().toISOString(),
      ...data,
    }
    store.purchaseOrders = [created, ...store.purchaseOrders]
    saveData(store)
    return created
  },
  receivePurchaseOrder: async (id) => {
    const store = loadData()
    store.purchaseOrders = store.purchaseOrders.map((po) =>
      po.id === id ? { ...po, status: 'Received' } : po,
    )
    saveData(store)
    return store.purchaseOrders.find((po) => po.id === id)
  },
}

export const demoCouponsApi = {
  list: async () => loadData().coupons,
  create: async (data) => {
    const store = loadData()
    const created = { id: generateId('coup'), usedCount: 0, active: true, ...data }
    store.coupons = [...store.coupons, created]
    saveData(store)
    return created
  },
  update: async (id, data) => {
    const store = loadData()
    store.coupons = store.coupons.map((c) => (c.id === id ? { ...c, ...data } : c))
    saveData(store)
    return store.coupons.find((c) => c.id === id)
  },
  remove: async (id) => {
    const store = loadData()
    store.coupons = store.coupons.filter((c) => c.id !== id)
    saveData(store)
    return { success: true }
  },
  validate: async ({ code, subtotal = 0 }) => {
    const coupon = loadData().coupons.find(
      (c) => c.code.toLowerCase() === String(code || '').toLowerCase() && c.active !== false,
    )
    if (!coupon) throw Object.assign(new Error('Invalid coupon'), { status: 400 })
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      throw Object.assign(new Error(`Minimum order is $${coupon.minOrder}`), { status: 400 })
    }
    const discount =
      coupon.type === 'percent' ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value)
    return { valid: true, coupon, discount }
  },
}

export const demoShiftsApi = {
  list: async () => loadData().shifts,
  current: async () => {
    const store = loadData()
    return store.shifts.find((s) => s.id === store.currentShiftId) || null
  },
  open: async (data) => {
    const store = loadData()
    const shift = {
      id: generateId('shift'),
      openedAt: new Date().toISOString(),
      status: 'Open',
      openingCash: Number(data.openingCash) || 0,
      storeId: data.storeId || null,
    }
    store.shifts = [shift, ...store.shifts]
    store.currentShiftId = shift.id
    saveData(store)
    return shift
  },
  close: async (id, data) => {
    const store = loadData()
    store.shifts = store.shifts.map((s) =>
      s.id === id
        ? {
            ...s,
            status: 'Closed',
            closedAt: new Date().toISOString(),
            closingCash: Number(data.closingCash) || 0,
          }
        : s,
    )
    if (store.currentShiftId === id) store.currentShiftId = null
    saveData(store)
    return { shift: store.shifts.find((s) => s.id === id) }
  },
}

export const demoRefundsApi = {
  list: async () => loadData().refunds,
  create: async (data) => {
    const store = loadData()
    const refund = {
      id: generateId('ref'),
      createdAt: new Date().toISOString(),
      status: 'Completed',
      ...data,
    }
    store.refunds = [refund, ...store.refunds]
    if (data.orderId) {
      store.orders = store.orders.map((o) =>
        o.id === data.orderId ? { ...o, status: 'Refunded' } : o,
      )
    }
    saveData(store)
    return refund
  },
}

export const demoLoyaltyApi = {
  tiers: async () => loadData().loyalty.tiers,
  customers: async () => {
    const store = loadData()
    return store.customers.map((c) => ({
      ...c,
      points: store.loyalty.balances[c.id] || 0,
    }))
  },
  history: async (customerId) => loadData().loyalty.history[customerId] || [],
  adjust: async ({ customerId, points, note }) => {
    const store = loadData()
    const next = (store.loyalty.balances[customerId] || 0) + Number(points)
    store.loyalty.balances[customerId] = next
    const entry = {
      id: generateId('loy'),
      points: Number(points),
      note: note || '',
      createdAt: new Date().toISOString(),
    }
    store.loyalty.history[customerId] = [entry, ...(store.loyalty.history[customerId] || [])]
    saveData(store)
    return { points: next }
  },
  quoteRedeem: async ({ customerId, points }) => {
    const balance = loadData().loyalty.balances[customerId] || 0
    const pts = Math.min(Number(points) || 0, balance)
    return { points: pts, value: pts * 0.01 }
  },
}

export const demoAuditApi = {
  list: async () => loadData().audit,
}

export const demoAlertsApi = {
  list: async () => {
    const store = loadData()
    if (store.alerts.length) return store.alerts
    return store.products
      .filter((p) => p.stockQuantity <= p.lowStockThreshold)
      .map((p) => ({
        id: generateId('alert'),
        productId: p.id,
        productName: p.name,
        stockQuantity: p.stockQuantity,
        threshold: p.lowStockThreshold,
        status: 'Open',
        channel: 'email',
      }))
  },
  scan: async () => ({ scanned: true, created: 0 }),
  resend: async () => ({ success: true }),
}
