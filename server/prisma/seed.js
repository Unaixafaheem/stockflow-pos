import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const daysAgo = (days) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

const productDefs = [
  { name: 'Organic Whole Milk 1L', category: 'Dairy', sku: 'DAI-001', barcode: '8901234567890', costPrice: 1.85, sellingPrice: 3.49, stockQuantity: 48, lowStockThreshold: 15, supplier: 'Fresh Farms Co.' },
  { name: 'Sourdough Bread Loaf', category: 'Bakery', sku: 'BAK-001', barcode: '8901234567891', costPrice: 1.20, sellingPrice: 4.99, stockQuantity: 22, lowStockThreshold: 10, supplier: 'Golden Crust Bakery' },
  { name: 'Sparkling Water 12-Pack', category: 'Beverages', sku: 'BEV-001', barcode: '8901234567892', costPrice: 4.50, sellingPrice: 8.99, stockQuantity: 35, lowStockThreshold: 12, supplier: 'AquaPure Inc.' },
  { name: 'Potato Chips Classic', category: 'Snacks', sku: 'SNK-001', barcode: '8901234567893', costPrice: 0.95, sellingPrice: 2.49, stockQuantity: 8, lowStockThreshold: 20, supplier: 'Crunchy Snacks Ltd.' },
  { name: 'Bananas (per lb)', category: 'Produce', sku: 'PRD-001', barcode: '8901234567894', costPrice: 0.35, sellingPrice: 0.69, stockQuantity: 120, lowStockThreshold: 30, supplier: 'Green Valley Farms' },
  { name: 'Frozen Pizza Margherita', category: 'Frozen', sku: 'FRZ-001', barcode: '8901234567895', costPrice: 3.20, sellingPrice: 6.99, stockQuantity: 18, lowStockThreshold: 10, supplier: 'FrostBite Foods' },
  { name: 'Dish Soap 500ml', category: 'Household', sku: 'HOU-001', barcode: '8901234567896', costPrice: 1.40, sellingPrice: 3.29, stockQuantity: 5, lowStockThreshold: 15, supplier: 'CleanHome Supplies' },
  { name: 'Shampoo 400ml', category: 'Personal Care', sku: 'PC-001', barcode: '8901234567897', costPrice: 2.80, sellingPrice: 5.99, stockQuantity: 28, lowStockThreshold: 10, supplier: 'GlowCare Products' },
  { name: 'Orange Juice 2L', category: 'Beverages', sku: 'BEV-002', barcode: '8901234567898', costPrice: 2.10, sellingPrice: 4.49, stockQuantity: 32, lowStockThreshold: 12, supplier: 'Sunrise Beverages' },
  { name: 'Cheddar Cheese Block 200g', category: 'Dairy', sku: 'DAI-002', barcode: '8901234567899', costPrice: 2.50, sellingPrice: 5.49, stockQuantity: 14, lowStockThreshold: 8, supplier: 'Fresh Farms Co.' },
  { name: 'Wireless Earbuds', category: 'Electronics', sku: 'ELC-001', barcode: '8901234567900', costPrice: 18.00, sellingPrice: 39.99, stockQuantity: 12, lowStockThreshold: 5, supplier: 'TechGear Direct' },
  { name: 'Mixed Salad Greens 150g', category: 'Produce', sku: 'PRD-002', barcode: '8901234567901', costPrice: 1.10, sellingPrice: 3.99, stockQuantity: 3, lowStockThreshold: 10, supplier: 'Green Valley Farms' },
  { name: 'Chocolate Bar Dark 100g', category: 'Snacks', sku: 'SNK-002', barcode: '8901234567902', costPrice: 0.80, sellingPrice: 2.29, stockQuantity: 45, lowStockThreshold: 15, supplier: 'Sweet Treats Co.' },
  { name: 'Paper Towels 6-Roll', category: 'Household', sku: 'HOU-002', barcode: '8901234567903', costPrice: 3.50, sellingPrice: 7.99, stockQuantity: 20, lowStockThreshold: 8, supplier: 'CleanHome Supplies' },
  { name: 'Greek Yogurt 500g', category: 'Dairy', sku: 'DAI-003', barcode: '8901234567904', costPrice: 1.60, sellingPrice: 3.79, stockQuantity: 0, lowStockThreshold: 10, supplier: 'Fresh Farms Co.' },
]

async function clearAll() {
  await prisma.refundItem.deleteMany()
  await prisma.refund.deleteMany()
  await prisma.loyaltyTransaction.deleteMany()
  await prisma.stockAlert.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.storeInventory.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.store.deleteMany()
}

async function main() {
  console.log('Seeding StockFlow database with commerce features...')
  await clearAll()

  const mainStore = await prisma.store.create({
    data: {
      name: 'StockFlow Downtown',
      code: 'DTN',
      address: '120 Market Street, Suite 200',
      phone: '+1 (555) 100-2000',
      status: 'Active',
    },
  })
  const eastStore = await prisma.store.create({
    data: {
      name: 'StockFlow Eastside',
      code: 'EST',
      address: '88 Riverside Ave',
      phone: '+1 (555) 100-3000',
      status: 'Active',
    },
  })

  const passwordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      firstName: 'Unaiza',
      lastName: 'Faheem',
      username: 'admin',
      email: 'admin@stockflow.com',
      phone: '+1 (555) 010-0001',
      passwordHash,
      role: 'Admin',
      storeName: mainStore.name,
      country: 'United States',
      emailVerified: true,
      status: 'Active',
      currentStoreId: mainStore.id,
      notificationsJson: JSON.stringify({ email: true, lowStock: true, orders: true, marketing: false }),
      connectedJson: JSON.stringify({ google: false, microsoft: false }),
    },
  })
  await prisma.user.create({
    data: {
      firstName: 'Marcus',
      lastName: 'Johnson',
      username: 'manager',
      email: 'manager@stockflow.com',
      phone: '+1 (555) 010-0002',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'Manager',
      storeName: mainStore.name,
      country: 'United States',
      emailVerified: true,
      status: 'Active',
      currentStoreId: mainStore.id,
    },
  })
  await prisma.user.create({
    data: {
      firstName: 'Priya',
      lastName: 'Sharma',
      username: 'cashier',
      email: 'cashier@stockflow.com',
      phone: '+1 (555) 010-0003',
      passwordHash: await bcrypt.hash('cashier123', 10),
      role: 'Cashier',
      storeName: mainStore.name,
      country: 'United States',
      emailVerified: true,
      status: 'Active',
      currentStoreId: mainStore.id,
    },
  })

  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'Fresh Farms Co.', email: 'orders@freshfarms.com', phone: '+1 (555) 200-1001', status: 'Active' } }),
    prisma.supplier.create({ data: { name: 'Golden Crust Bakery', email: 'sales@goldencrust.com', phone: '+1 (555) 200-1002', status: 'Active' } }),
    prisma.supplier.create({ data: { name: 'AquaPure Inc.', email: 'wholesale@aquapure.com', phone: '+1 (555) 200-1003', status: 'Active' } }),
    prisma.supplier.create({ data: { name: 'Crunchy Snacks Ltd.', email: 'b2b@crunchy.com', phone: '+1 (555) 200-1004', status: 'Active' } }),
    prisma.supplier.create({ data: { name: 'Green Valley Farms', email: 'hello@greenvalley.com', phone: '+1 (555) 200-1005', status: 'Active' } }),
    prisma.supplier.create({ data: { name: 'CleanHome Supplies', email: 'orders@cleanhome.com', phone: '+1 (555) 200-1006', status: 'Active' } }),
  ])
  const supplierByName = Object.fromEntries(suppliers.map((s) => [s.name, s]))

  const createdProducts = []
  for (const p of productDefs) {
    const supplierRef = supplierByName[p.supplier]
    createdProducts.push(await prisma.product.create({
      data: { ...p, supplierId: supplierRef?.id || null },
    }))
  }

  for (const product of createdProducts) {
    await prisma.storeInventory.create({
      data: {
        storeId: mainStore.id,
        productId: product.id,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
      },
    })
    // Eastside gets slightly different stock levels
    await prisma.storeInventory.create({
      data: {
        storeId: eastStore.id,
        productId: product.id,
        stockQuantity: Math.max(0, Math.floor(product.stockQuantity * 0.6)),
        lowStockThreshold: product.lowStockThreshold,
      },
    })
  }

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Sarah Mitchell', phone: '+1 (555) 234-5678', email: 'sarah.mitchell@email.com', totalPurchases: 1247.85, lastPurchaseDate: daysAgo(1), loyaltyPoints: 620, loyaltyTier: 'Silver' } }),
    prisma.customer.create({ data: { name: 'James Rodriguez', phone: '+1 (555) 345-6789', email: 'j.rodriguez@email.com', totalPurchases: 892.40, lastPurchaseDate: daysAgo(3), loyaltyPoints: 210, loyaltyTier: 'Bronze' } }),
    prisma.customer.create({ data: { name: 'Emily Chen', phone: '+1 (555) 456-7890', email: 'emily.chen@email.com', totalPurchases: 2156.30, lastPurchaseDate: daysAgo(0), loyaltyPoints: 1680, loyaltyTier: 'Gold' } }),
    prisma.customer.create({ data: { name: 'Michael Thompson', phone: '+1 (555) 567-8901', email: 'm.thompson@email.com', totalPurchases: 456.75, lastPurchaseDate: daysAgo(7), loyaltyPoints: 90, loyaltyTier: 'Bronze' } }),
    prisma.customer.create({ data: { name: 'Lisa Anderson', phone: '+1 (555) 678-9012', email: 'lisa.a@email.com', totalPurchases: 678.20, lastPurchaseDate: daysAgo(2), loyaltyPoints: 540, loyaltyTier: 'Silver' } }),
    prisma.customer.create({ data: { name: 'David Park', phone: '+1 (555) 789-0123', email: 'david.park@email.com', totalPurchases: 334.50, lastPurchaseDate: daysAgo(14), loyaltyPoints: 45, loyaltyTier: 'Bronze' } }),
    prisma.customer.create({ data: { name: 'Walk-in Customer', phone: '—', email: '—', totalPurchases: 0, loyaltyPoints: 0, loyaltyTier: 'Bronze' } }),
  ])

  await prisma.employee.createMany({
    data: [
      { name: 'Alexandra Rivera', role: 'Admin', email: 'alex.rivera@stockflow.com', phone: '+1 (555) 111-0001', status: 'Active' },
      { name: 'Marcus Johnson', role: 'Manager', email: 'marcus.j@stockflow.com', phone: '+1 (555) 111-0002', status: 'Active' },
      { name: 'Priya Sharma', role: 'Cashier', email: 'priya.s@stockflow.com', phone: '+1 (555) 111-0003', status: 'Active' },
      { name: "Chris O'Brien", role: 'Cashier', email: 'chris.o@stockflow.com', phone: '+1 (555) 111-0004', status: 'On Leave' },
      { name: 'Nina Kowalski', role: 'Inventory Staff', email: 'nina.k@stockflow.com', phone: '+1 (555) 111-0005', status: 'Active' },
      { name: 'Tom Harris', role: 'Inventory Staff', email: 'tom.h@stockflow.com', phone: '+1 (555) 111-0006', status: 'Inactive' },
    ],
  })

  await prisma.coupon.createMany({
    data: [
      { code: 'SAVE10', name: '10% Off Entire Cart', type: 'percent', value: 10, minPurchase: 20, maxUses: 500, usedCount: 12, active: true },
      { code: 'WELCOME5', name: '$5 Off Welcome', type: 'fixed', value: 5, minPurchase: 15, maxUses: 200, usedCount: 40, active: true },
      { code: 'DAIRY15', name: '15% Off Dairy', type: 'category', value: 15, category: 'Dairy', minPurchase: 0, active: true },
      { code: 'BOGO1', name: 'Buy 1 Get 1 Free', type: 'bogo', value: 0, bogoBuyQty: 1, bogoGetQty: 1, minPurchase: 0, active: true },
    ],
  })

  const bySku = Object.fromEntries(createdProducts.map((p) => [p.sku, p]))
  const emily = customers[2]
  const freshFarms = supplierByName['Fresh Farms Co.']

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-100001',
      supplierId: freshFarms.id,
      storeId: mainStore.id,
      status: 'Ordered',
      totalCost: 55.5,
      notes: 'Weekly dairy restock',
      createdById: admin.id,
      orderedAt: daysAgo(1),
      items: {
        create: [
          { productId: bySku['DAI-001'].id, name: bySku['DAI-001'].name, quantity: 24, unitCost: 1.85, total: 44.4 },
          { productId: bySku['DAI-003'].id, name: bySku['DAI-003'].name, quantity: 12, unitCost: 1.60, total: 19.2 },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      date: daysAgo(0),
      storeId: mainStore.id,
      customerId: emily.id,
      customerName: emily.name,
      subtotal: 19.95,
      discount: 2,
      couponCode: 'WELCOME5',
      couponDiscount: 0,
      tax: 1.44,
      total: 19.39,
      paymentMethod: 'Card',
      status: 'Completed',
      createdById: admin.id,
      items: {
        create: [
          { productId: bySku['DAI-001'].id, name: bySku['DAI-001'].name, quantity: 2, price: 3.49, total: 6.98 },
          { productId: bySku['SNK-001'].id, name: bySku['SNK-001'].name, quantity: 3, price: 2.49, total: 7.47 },
          { productId: bySku['BEV-002'].id, name: bySku['BEV-002'].name, quantity: 1, price: 4.49, total: 4.49 },
        ],
      },
    },
  })

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: emily.id,
      points: 20,
      type: 'earn',
      note: 'Seed purchase earn',
    },
  })

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, userName: 'Unaiza Faheem', action: 'SEED', entity: 'System', details: JSON.stringify({ note: 'Database seeded' }) },
      { userId: admin.id, userName: 'Unaiza Faheem', action: 'CREATE', entity: 'PurchaseOrder', entityId: po.id, details: JSON.stringify({ poNumber: po.poNumber }) },
    ],
  })

  await prisma.stockAlert.create({
    data: {
      productId: bySku['HOU-001'].id,
      storeId: mainStore.id,
      channel: 'email',
      message: `Low stock: Dish Soap 500ml has 5 units left at ${mainStore.name}`,
      status: 'DemoQueued',
    },
  })

  console.log('Seed complete.')
  console.log('Stores: Downtown (DTN), Eastside (EST)')
  console.log('Demo users:')
  console.log('  admin@stockflow.com / admin123 (Admin)')
  console.log('  manager@stockflow.com / manager123 (Manager)')
  console.log('  cashier@stockflow.com / cashier123 (Cashier)')
  console.log('Coupons: SAVE10, WELCOME5, DAIRY15, BOGO1')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
