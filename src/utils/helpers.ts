export type StockStatus = 'out' | 'low' | 'ok'

export const generateId = (prefix = 'id'): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

export const generateOrderId = (): string => {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `ORD-${num}`
}

export const TAX_RATE = 0.08

export const calculateTax = (subtotal: number): number => subtotal * TAX_RATE

export const calculateTotal = (
  subtotal: number,
  discount = 0,
  tax?: number,
): { discounted: number; taxAmount: number; total: number } => {
  const discounted = Math.max(0, subtotal - discount)
  const taxAmount = tax ?? calculateTax(discounted)
  return { discounted, taxAmount, total: discounted + taxAmount }
}

export const PRODUCT_CATEGORIES = [
  'Beverages',
  'Dairy',
  'Bakery',
  'Snacks',
  'Produce',
  'Frozen',
  'Household',
  'Personal Care',
  'Electronics',
] as const

export const EMPLOYEE_ROLES = ['Admin', 'Manager', 'Cashier', 'Inventory Staff'] as const

export const PAYMENT_METHODS = ['Cash', 'Card', 'Online'] as const

export const ORDER_STATUSES = ['Completed', 'Refunded', 'Pending'] as const

export const EMPLOYEE_STATUSES = ['Active', 'On Leave', 'Inactive'] as const

export const getStockStatus = (stock: number, threshold: number): StockStatus => {
  if (stock <= 0) return 'out'
  if (stock <= threshold) return 'low'
  return 'ok'
}
