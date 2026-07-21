import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/summary', requirePermission('reports', 'dashboard'), async (_req, res) => {
  const [products, customers, orders, completed] = await Promise.all([
    prisma.product.findMany(),
    prisma.customer.findMany(),
    prisma.order.findMany({ include: { items: true } }),
    prisma.order.findMany({ where: { status: 'Completed' }, include: { items: true } }),
  ])

  const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0)
  const lowStock = products.filter((p) => p.stockQuantity <= p.lowStockThreshold)

  const productSales = {}
  completed.forEach((order) => {
    order.items.forEach((item) => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, sold: 0, revenue: 0 }
      productSales[item.name].sold += item.quantity
      productSales[item.name].revenue += item.total
    })
  })

  const revenueByCategory = {}
  completed.forEach((order) => {
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId)
      const cat = product?.category || 'Other'
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + item.total
    })
  })

  res.json({
    totalRevenue,
    productCount: products.length,
    customerCount: customers.filter((c) => c.name !== 'Walk-in Customer').length,
    orderCount: orders.length,
    lowStock,
    bestSelling: Object.values(productSales).sort((a, b) => b.sold - a.sold).slice(0, 8),
    revenueByCategory: Object.entries(revenueByCategory).map(([name, value]) => ({ name, value })),
  })
})

router.get('/activity', requirePermission('dashboard', 'reports'), async (_req, res) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const [todayOrders, users] = await Promise.all([
    prisma.order.findMany({
      where: {
        date: { gte: start },
        status: { in: ['Completed', 'Partially Refunded'] },
      },
    }),
    prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, role: true } }),
  ])

  const paymentBreakdown = { Cash: 0, Card: 0, Online: 0 }
  todayOrders.forEach((o) => {
    const key = paymentBreakdown[o.paymentMethod] != null ? o.paymentMethod : 'Card'
    paymentBreakdown[key] = (paymentBreakdown[key] || 0) + o.total
  })

  const byCashier = {}
  todayOrders.forEach((o) => {
    const id = o.createdById || 'unknown'
    if (!byCashier[id]) byCashier[id] = { userId: id, orders: 0, revenue: 0 }
    byCashier[id].orders += 1
    byCashier[id].revenue += o.total
  })

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))
  const cashierPerformance = Object.values(byCashier)
    .map((row) => {
      const u = userMap[row.userId]
      return {
        ...row,
        name: u ? `${u.firstName} ${u.lastName}` : 'Unknown',
        role: u?.role || '—',
        revenue: Number(row.revenue.toFixed(2)),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  res.json({
    date: start.toISOString(),
    orderCount: todayOrders.length,
    totalSales: Number(todayOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
    paymentBreakdown: Object.entries(paymentBreakdown).map(([method, amount]) => ({
      method,
      amount: Number(amount.toFixed(2)),
    })),
    cashierPerformance,
  })
})

export default router
