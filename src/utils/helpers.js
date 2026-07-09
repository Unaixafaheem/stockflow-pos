export const generateId = (prefix = 'id') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

export const generateOrderId = () => {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `ORD-${num}`
}

export const TAX_RATE = 0.08

export const calculateTax = (subtotal) => subtotal * TAX_RATE

export const calculateTotal = (subtotal, discount = 0, tax) => {
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
]

export const EMPLOYEE_ROLES = ['Admin', 'Manager', 'Cashier', 'Inventory Staff']

export const PAYMENT_METHODS = ['Cash', 'Card', 'Online']

export const ORDER_STATUSES = ['Completed', 'Refunded', 'Pending']

export const EMPLOYEE_STATUSES = ['Active', 'On Leave', 'Inactive']

export const getStockStatus = (stock, threshold) => {
  if (stock <= 0) return 'out'
  if (stock <= threshold) return 'low'
  return 'ok'
}
