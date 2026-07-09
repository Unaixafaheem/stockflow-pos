import { generateId, generateOrderId } from '../utils/helpers'

const daysAgo = (days) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const sampleProducts = [
  { id: 'prod_1', name: 'Organic Whole Milk 1L', category: 'Dairy', sku: 'DAI-001', barcode: '8901234567890', costPrice: 1.85, sellingPrice: 3.49, stockQuantity: 48, lowStockThreshold: 15, supplier: 'Fresh Farms Co.' },
  { id: 'prod_2', name: 'Sourdough Bread Loaf', category: 'Bakery', sku: 'BAK-001', barcode: '8901234567891', costPrice: 1.20, sellingPrice: 4.99, stockQuantity: 22, lowStockThreshold: 10, supplier: 'Golden Crust Bakery' },
  { id: 'prod_3', name: 'Sparkling Water 12-Pack', category: 'Beverages', sku: 'BEV-001', barcode: '8901234567892', costPrice: 4.50, sellingPrice: 8.99, stockQuantity: 35, lowStockThreshold: 12, supplier: 'AquaPure Inc.' },
  { id: 'prod_4', name: 'Potato Chips Classic', category: 'Snacks', sku: 'SNK-001', barcode: '8901234567893', costPrice: 0.95, sellingPrice: 2.49, stockQuantity: 8, lowStockThreshold: 20, supplier: 'Crunchy Snacks Ltd.' },
  { id: 'prod_5', name: 'Bananas (per lb)', category: 'Produce', sku: 'PRD-001', barcode: '8901234567894', costPrice: 0.35, sellingPrice: 0.69, stockQuantity: 120, lowStockThreshold: 30, supplier: 'Green Valley Farms' },
  { id: 'prod_6', name: 'Frozen Pizza Margherita', category: 'Frozen', sku: 'FRZ-001', barcode: '8901234567895', costPrice: 3.20, sellingPrice: 6.99, stockQuantity: 18, lowStockThreshold: 10, supplier: 'FrostBite Foods' },
  { id: 'prod_7', name: 'Dish Soap 500ml', category: 'Household', sku: 'HOU-001', barcode: '8901234567896', costPrice: 1.40, sellingPrice: 3.29, stockQuantity: 5, lowStockThreshold: 15, supplier: 'CleanHome Supplies' },
  { id: 'prod_8', name: 'Shampoo 400ml', category: 'Personal Care', sku: 'PC-001', barcode: '8901234567897', costPrice: 2.80, sellingPrice: 5.99, stockQuantity: 28, lowStockThreshold: 10, supplier: 'GlowCare Products' },
  { id: 'prod_9', name: 'Orange Juice 2L', category: 'Beverages', sku: 'BEV-002', barcode: '8901234567898', costPrice: 2.10, sellingPrice: 4.49, stockQuantity: 32, lowStockThreshold: 12, supplier: 'Sunrise Beverages' },
  { id: 'prod_10', name: 'Cheddar Cheese Block 200g', category: 'Dairy', sku: 'DAI-002', barcode: '8901234567899', costPrice: 2.50, sellingPrice: 5.49, stockQuantity: 14, lowStockThreshold: 8, supplier: 'Fresh Farms Co.' },
  { id: 'prod_11', name: 'Wireless Earbuds', category: 'Electronics', sku: 'ELC-001', barcode: '8901234567900', costPrice: 18.00, sellingPrice: 39.99, stockQuantity: 12, lowStockThreshold: 5, supplier: 'TechGear Direct' },
  { id: 'prod_12', name: 'Mixed Salad Greens 150g', category: 'Produce', sku: 'PRD-002', barcode: '8901234567901', costPrice: 1.10, sellingPrice: 3.99, stockQuantity: 3, lowStockThreshold: 10, supplier: 'Green Valley Farms' },
  { id: 'prod_13', name: 'Chocolate Bar Dark 100g', category: 'Snacks', sku: 'SNK-002', barcode: '8901234567902', costPrice: 0.80, sellingPrice: 2.29, stockQuantity: 45, lowStockThreshold: 15, supplier: 'Sweet Treats Co.' },
  { id: 'prod_14', name: 'Paper Towels 6-Roll', category: 'Household', sku: 'HOU-002', barcode: '8901234567903', costPrice: 3.50, sellingPrice: 7.99, stockQuantity: 20, lowStockThreshold: 8, supplier: 'CleanHome Supplies' },
  { id: 'prod_15', name: 'Greek Yogurt 500g', category: 'Dairy', sku: 'DAI-003', barcode: '8901234567904', costPrice: 1.60, sellingPrice: 3.79, stockQuantity: 0, lowStockThreshold: 10, supplier: 'Fresh Farms Co.' },
]

export const sampleCustomers = [
  { id: 'cust_1', name: 'Sarah Mitchell', phone: '+1 (555) 234-5678', email: 'sarah.mitchell@email.com', totalPurchases: 1247.85, lastPurchaseDate: daysAgo(1) },
  { id: 'cust_2', name: 'James Rodriguez', phone: '+1 (555) 345-6789', email: 'j.rodriguez@email.com', totalPurchases: 892.40, lastPurchaseDate: daysAgo(3) },
  { id: 'cust_3', name: 'Emily Chen', phone: '+1 (555) 456-7890', email: 'emily.chen@email.com', totalPurchases: 2156.30, lastPurchaseDate: daysAgo(0) },
  { id: 'cust_4', name: 'Michael Thompson', phone: '+1 (555) 567-8901', email: 'm.thompson@email.com', totalPurchases: 456.75, lastPurchaseDate: daysAgo(7) },
  { id: 'cust_5', name: 'Lisa Anderson', phone: '+1 (555) 678-9012', email: 'lisa.a@email.com', totalPurchases: 678.20, lastPurchaseDate: daysAgo(2) },
  { id: 'cust_6', name: 'David Park', phone: '+1 (555) 789-0123', email: 'david.park@email.com', totalPurchases: 334.50, lastPurchaseDate: daysAgo(14) },
  { id: 'cust_7', name: 'Walk-in Customer', phone: '—', email: '—', totalPurchases: 0, lastPurchaseDate: null },
]

export const sampleEmployees = [
  { id: 'emp_1', name: 'Alexandra Rivera', role: 'Admin', email: 'alex.rivera@stockflow.com', phone: '+1 (555) 111-0001', status: 'Active' },
  { id: 'emp_2', name: 'Marcus Johnson', role: 'Manager', email: 'marcus.j@stockflow.com', phone: '+1 (555) 111-0002', status: 'Active' },
  { id: 'emp_3', name: 'Priya Sharma', role: 'Cashier', email: 'priya.s@stockflow.com', phone: '+1 (555) 111-0003', status: 'Active' },
  { id: 'emp_4', name: 'Chris O\'Brien', role: 'Cashier', email: 'chris.o@stockflow.com', phone: '+1 (555) 111-0004', status: 'On Leave' },
  { id: 'emp_5', name: 'Nina Kowalski', role: 'Inventory Staff', email: 'nina.k@stockflow.com', phone: '+1 (555) 111-0005', status: 'Active' },
  { id: 'emp_6', name: 'Tom Harris', role: 'Inventory Staff', email: 'tom.h@stockflow.com', phone: '+1 (555) 111-0006', status: 'Inactive' },
]

const buildOrderItems = (items) =>
  items.map(({ productId, quantity }) => {
    const product = sampleProducts.find((p) => p.id === productId)
    return {
      productId,
      name: product.name,
      quantity,
      price: product.sellingPrice,
      total: product.sellingPrice * quantity,
    }
  })

export const sampleOrders = [
  {
    id: generateOrderId(),
    date: daysAgo(0),
    customerId: 'cust_3',
    customerName: 'Emily Chen',
    items: buildOrderItems([
      { productId: 'prod_1', quantity: 2 },
      { productId: 'prod_4', quantity: 3 },
      { productId: 'prod_9', quantity: 1 },
    ]),
    subtotal: 19.95,
    discount: 2.0,
    tax: 1.44,
    total: 19.39,
    paymentMethod: 'Card',
    status: 'Completed',
  },
  {
    id: generateOrderId(),
    date: daysAgo(1),
    customerId: 'cust_1',
    customerName: 'Sarah Mitchell',
    items: buildOrderItems([
      { productId: 'prod_2', quantity: 1 },
      { productId: 'prod_5', quantity: 4 },
      { productId: 'prod_13', quantity: 2 },
    ]),
    subtotal: 14.33,
    discount: 0,
    tax: 1.15,
    total: 15.48,
    paymentMethod: 'Cash',
    status: 'Completed',
  },
  {
    id: generateOrderId(),
    date: daysAgo(2),
    customerId: 'cust_5',
    customerName: 'Lisa Anderson',
    items: buildOrderItems([
      { productId: 'prod_11', quantity: 1 },
      { productId: 'prod_8', quantity: 1 },
    ]),
    subtotal: 45.98,
    discount: 5.0,
    tax: 3.28,
    total: 44.26,
    paymentMethod: 'Online',
    status: 'Completed',
  },
  {
    id: generateOrderId(),
    date: daysAgo(3),
    customerId: 'cust_2',
    customerName: 'James Rodriguez',
    items: buildOrderItems([
      { productId: 'prod_3', quantity: 2 },
      { productId: 'prod_6', quantity: 1 },
      { productId: 'prod_14', quantity: 1 },
    ]),
    subtotal: 32.96,
    discount: 0,
    tax: 2.64,
    total: 35.60,
    paymentMethod: 'Card',
    status: 'Completed',
  },
  {
    id: generateOrderId(),
    date: daysAgo(5),
    customerId: 'cust_4',
    customerName: 'Michael Thompson',
    items: buildOrderItems([
      { productId: 'prod_7', quantity: 2 },
      { productId: 'prod_10', quantity: 1 },
    ]),
    subtotal: 12.07,
    discount: 0,
    tax: 0.97,
    total: 13.04,
    paymentMethod: 'Cash',
    status: 'Completed',
  },
  {
    id: generateOrderId(),
    date: daysAgo(8),
    customerId: 'cust_6',
    customerName: 'David Park',
    items: buildOrderItems([
      { productId: 'prod_1', quantity: 1 },
      { productId: 'prod_12', quantity: 2 },
    ]),
    subtotal: 11.47,
    discount: 0,
    tax: 0.92,
    total: 12.39,
    paymentMethod: 'Card',
    status: 'Refunded',
  },
  {
    id: generateOrderId(),
    date: daysAgo(12),
    customerId: 'cust_3',
    customerName: 'Emily Chen',
    items: buildOrderItems([
      { productId: 'prod_11', quantity: 2 },
      { productId: 'prod_3', quantity: 1 },
    ]),
    subtotal: 88.97,
    discount: 10.0,
    tax: 6.32,
    total: 85.29,
    paymentMethod: 'Online',
    status: 'Completed',
  },
  {
    id: generateOrderId(),
    date: daysAgo(15),
    customerId: 'cust_1',
    customerName: 'Sarah Mitchell',
    items: buildOrderItems([
      { productId: 'prod_5', quantity: 6 },
      { productId: 'prod_2', quantity: 2 },
      { productId: 'prod_9', quantity: 2 },
    ]),
    subtotal: 22.81,
    discount: 0,
    tax: 1.82,
    total: 24.63,
    paymentMethod: 'Card',
    status: 'Completed',
  },
]

export const getInitialData = () => ({
  products: sampleProducts,
  customers: sampleCustomers,
  employees: sampleEmployees,
  orders: sampleOrders,
})

export const STORAGE_KEY = 'stockflow_pos_data'
export const THEME_KEY = 'stockflow_pos_theme'
