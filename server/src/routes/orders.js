import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { writeAudit } from '../utils/audit.js'
import {
  adjustStoreStock,
  checkAndCreateStockAlerts,
  earnRateForTier,
  POINTS_PER_DOLLAR,
  POINT_VALUE,
  tierFromPoints,
} from '../utils/commerce.js'

const router = Router()
router.use(requireAuth)

function mapOrder(order, userMap = {}) {
  const creator = order.createdById ? userMap[order.createdById] : null
  return {
    id: order.orderNumber,
    dbId: order.id,
    date: order.date.toISOString(),
    storeId: order.storeId,
    storeName: order.store?.name || null,
    customerId: order.customerId,
    customerName: order.customerName,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode,
    couponDiscount: order.couponDiscount,
    loyaltyPointsRedeemed: order.loyaltyPointsRedeemed,
    loyaltyDiscount: order.loyaltyDiscount,
    tax: order.tax,
    total: order.total,
    paymentMethod: order.paymentMethod,
    status: order.status,
    shiftId: order.shiftId,
    createdById: order.createdById || null,
    createdByName: creator ? `${creator.firstName} ${creator.lastName}` : null,
    refunds: order.refunds || [],
  }
}

router.get('/', requirePermission('orders', 'dashboard', 'reports'), async (_req, res) => {
  const [orders, users] = await Promise.all([
    prisma.order.findMany({
      include: { items: true, store: true, refunds: { include: { items: true } } },
      orderBy: { date: 'desc' },
    }),
    prisma.user.findMany({ select: { id: true, firstName: true, lastName: true } }),
  ])
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))
  res.json(orders.map((o) => mapOrder(o, userMap)))
})

router.get('/:id', requirePermission('orders', 'pos'), async (req, res) => {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: req.params.id }, { orderNumber: req.params.id }],
    },
    include: { items: true, store: true, refunds: { include: { items: true } } },
  })
  if (!order) return res.status(404).json({ message: 'Order not found' })
  res.json(mapOrder(order))
})

router.post('/checkout', requirePermission('pos'), async (req, res) => {
  try {
    const {
      items,
      customerId,
      customerName,
      discount = 0,
      paymentMethod,
      storeId,
      couponCode,
      loyaltyPointsToRedeem = 0,
    } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }

    const activeStoreId = storeId || req.user.currentStoreId || null
    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

    for (const item of items) {
      const product = productMap[item.productId]
      if (!product) return res.status(400).json({ message: `Product not found: ${item.productId}` })

      let stock = product.stockQuantity
      if (activeStoreId) {
        const inv = await prisma.storeInventory.findUnique({
          where: { storeId_productId: { storeId: activeStoreId, productId: product.id } },
        })
        stock = inv?.stockQuantity ?? 0
      }
      if (stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` })
      }
    }

    const lineItems = items.map((item) => {
      const product = productMap[item.productId]
      const price = product.sellingPrice
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        quantity: Number(item.quantity),
        price,
        total: price * Number(item.quantity),
      }
    })

    const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0)
    let manualDiscount = Math.max(0, Number(discount) || 0)
    let couponDiscount = 0
    let appliedCoupon = null

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(couponCode).toUpperCase().trim() },
      })
      if (!coupon || !coupon.active) {
        return res.status(400).json({ message: 'Invalid coupon' })
      }
      if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ message: 'Coupon usage limit reached' })
      }
      if (subtotal < coupon.minPurchase) {
        return res.status(400).json({ message: `Minimum purchase $${coupon.minPurchase} required` })
      }

      if (coupon.type === 'percent') couponDiscount = (subtotal * coupon.value) / 100
      else if (coupon.type === 'fixed') couponDiscount = coupon.value
      else if (coupon.type === 'category') {
        const catTotal = lineItems
          .filter((i) => i.category === coupon.category)
          .reduce((s, i) => s + i.total, 0)
        couponDiscount = (catTotal * coupon.value) / 100
      } else if (coupon.type === 'bogo') {
        const prices = []
        lineItems.forEach((i) => {
          for (let n = 0; n < i.quantity; n += 1) prices.push(i.price)
        })
        prices.sort((a, b) => a - b)
        const sets = Math.floor(prices.length / (coupon.bogoBuyQty + coupon.bogoGetQty))
        couponDiscount = prices.slice(0, sets * coupon.bogoGetQty).reduce((s, p) => s + p, 0)
      }
      couponDiscount = Math.min(subtotal, Number(couponDiscount.toFixed(2)))
      appliedCoupon = coupon
    }

    let loyaltyDiscount = 0
    let loyaltyPointsRedeemed = Math.max(0, Number(loyaltyPointsToRedeem) || 0)
    let customer = null
    if (customerId && customerId !== 'walk-in') {
      customer = await prisma.customer.findUnique({ where: { id: customerId } })
      if (customer && loyaltyPointsRedeemed > 0) {
        if (loyaltyPointsRedeemed > customer.loyaltyPoints) {
          return res.status(400).json({ message: 'Not enough loyalty points' })
        }
        loyaltyDiscount = Number((loyaltyPointsRedeemed * POINT_VALUE).toFixed(2))
      }
    }

    const totalDiscount = Math.min(subtotal, manualDiscount + couponDiscount + loyaltyDiscount)
    const taxable = Math.max(0, subtotal - totalDiscount)
    const tax = Number((taxable * 0.08).toFixed(2))
    const total = Number((taxable + tax).toFixed(2))
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`

    const openShift = await prisma.shift.findFirst({
      where: { userId: req.user.id, status: 'Open' },
    })

    const order = await prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        await adjustStoreStock(tx, {
          storeId: activeStoreId,
          productId: item.productId,
          delta: -item.quantity,
        })
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
        await checkAndCreateStockAlerts(tx, {
          storeId: activeStoreId,
          productId: item.productId,
          channel: 'email',
        })
      }

      let resolvedCustomerId = null
      if (customer) {
        resolvedCustomerId = customer.id
        const earnMultiplier = earnRateForTier(customer.loyaltyTier)
        const earned = Math.floor(total * POINTS_PER_DOLLAR * earnMultiplier)
        const pointsAfterRedeem = customer.loyaltyPoints - loyaltyPointsRedeemed + earned

        await tx.customer.update({
          where: { id: customer.id },
          data: {
            totalPurchases: { increment: total },
            lastPurchaseDate: new Date(),
            loyaltyPoints: Math.max(0, pointsAfterRedeem),
            loyaltyTier: tierFromPoints(Math.max(0, pointsAfterRedeem)),
          },
        })

        if (loyaltyPointsRedeemed > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId: customer.id,
              points: -loyaltyPointsRedeemed,
              type: 'redeem',
              note: `Redeemed at checkout ${orderNumber}`,
            },
          })
        }
        if (earned > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId: customer.id,
              points: earned,
              type: 'earn',
              note: `Earned from order ${orderNumber}`,
            },
          })
        }
      }

      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        })
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          storeId: activeStoreId,
          customerId: resolvedCustomerId,
          customerName: customerName || customer?.name || 'Walk-in Customer',
          subtotal,
          discount: manualDiscount,
          couponCode: appliedCoupon?.code || null,
          couponDiscount,
          loyaltyPointsRedeemed,
          loyaltyDiscount,
          tax,
          total,
          paymentMethod: paymentMethod || 'Cash',
          status: 'Completed',
          shiftId: openShift?.id || null,
          createdById: req.user.id,
          items: {
            create: lineItems.map(({ productId, name, quantity, price, total: lineTotal }) => ({
              productId, name, quantity, price, total: lineTotal,
            })),
          },
        },
        include: { items: true, store: true, refunds: true },
      })

      if (openShift) {
        const cashInc = paymentMethod === 'Cash' ? total : 0
        const cardInc = paymentMethod === 'Card' ? total : 0
        const onlineInc = paymentMethod === 'Online' ? total : 0
        await tx.shift.update({
          where: { id: openShift.id },
          data: {
            cashSales: { increment: cashInc },
            cardSales: { increment: cardInc },
            onlineSales: { increment: onlineInc },
            orderCount: { increment: 1 },
          },
        })
      }

      return created
    })

    await writeAudit({
      user: req.user,
      action: 'CHECKOUT',
      entity: 'Order',
      entityId: order.id,
      details: { orderNumber, total, paymentMethod, storeId: activeStoreId },
    })

    res.status(201).json(mapOrder(order))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Checkout failed' })
  }
})

export default router
