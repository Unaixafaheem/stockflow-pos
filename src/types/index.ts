export type AuthRole = 'Admin' | 'Manager' | 'Cashier'

export type StockStatus = 'ok' | 'low' | 'out'

export type PaymentMethod = 'Cash' | 'Card' | 'Online'

export type OrderStatus = 'Completed' | 'Refunded' | 'Pending' | 'Partially Refunded' | 'Queued Offline'

export interface User {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  phone?: string | null
  role: AuthRole | string
  storeName?: string | null
  country?: string | null
  emailVerified?: boolean
  status?: string
  currentStoreId?: string | null
  notifications?: Record<string, boolean>
  connectedAccounts?: Record<string, boolean>
}

export interface Product {
  id: string
  name: string
  category: string
  sku: string
  barcode: string
  costPrice: number
  sellingPrice: number
  stockQuantity: number
  lowStockThreshold: number
  supplier: string
  supplierId?: string | null
  storeId?: string | null
}

export interface Customer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  totalPurchases: number
  lastPurchaseDate?: string | null
  loyaltyPoints?: number
  loyaltyTier?: string
}

export interface OrderItem {
  id?: string
  productId?: string | null
  name: string
  quantity: number
  price: number
  total: number
}

export interface Order {
  id: string
  dbId?: string
  date: string
  storeId?: string | null
  storeName?: string | null
  customerId?: string | null
  customerName: string
  items: OrderItem[]
  subtotal: number
  discount: number
  couponCode?: string | null
  couponDiscount?: number
  loyaltyPointsRedeemed?: number
  loyaltyDiscount?: number
  tax: number
  total: number
  paymentMethod: PaymentMethod | string
  status: OrderStatus | string
  shiftId?: string | null
  createdById?: string | null
  createdByName?: string | null
  refunds?: unknown[]
  offline?: boolean
}

export interface Store {
  id: string
  name: string
  code: string
  address?: string | null
  phone?: string | null
  status: string
}

export interface ApiError extends Error {
  status?: number
  code?: string
  data?: unknown
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user?: User
}

export interface OfflineQueueEntry {
  id: string
  type: 'checkout'
  payload: Record<string, unknown>
  createdAt: string
}

export interface OfflineCache {
  products: Product[]
  customers: Customer[]
  orders: Order[]
  stores: Store[]
  savedAt: string
}
