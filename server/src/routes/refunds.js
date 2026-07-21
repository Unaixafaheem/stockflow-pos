import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { writeAudit } from '../utils/audit.js'
import { adjustStoreStock } from '../utils/commerce.js'

const router = Router()
router.use(requireAuth)

router.get('/', requirePermission('refunds', 'orders'), async (_req, res) => {
  const refunds = await prisma.refund.findMany({
    include: { order: true, items: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(refunds)
})

router.post('/', requirePermission('refunds', 'orders', 'pos'), async (req, res) => {
  try {
    const { orderId, reason, restock = true, items } = req.body
    if (!orderId || !reason || !items?.length) {
      return res.status(400).json({ message: 'Order, reason, and items are required' })
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: { items: true, refunds: { include: { items: true } } },
    })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.status === 'Refunded') {
      return res.status(400).json({ message: 'Order is already fully refunded' })
    }

    const refundedQtyByItem = {}
    order.refunds.forEach((r) => {
      r.items.forEach((ri) => {
        if (ri.orderItemId) {
          refundedQtyByItem[ri.orderItemId] = (refundedQtyByItem[ri.orderItemId] || 0) + ri.quantity
        }
      })
    })

    const lineItems = []
    let amount = 0
    for (const reqItem of items) {
      const orderItem = order.items.find((i) => i.id === reqItem.orderItemId)
      if (!orderItem) return res.status(400).json({ message: 'Invalid order item' })
      const already = refundedQtyByItem[orderItem.id] || 0
      const qty = Number(reqItem.quantity)
      if (qty <= 0 || already + qty > orderItem.quantity) {
        return res.status(400).json({ message: `Invalid refund quantity for ${orderItem.name}` })
      }
      const lineAmount = Number(((orderItem.price * qty)).toFixed(2))
      amount += lineAmount
      lineItems.push({
        orderItemId: orderItem.id,
        productId: orderItem.productId,
        name: orderItem.name,
        quantity: qty,
        amount: lineAmount,
      })
    }

    amount = Number(amount.toFixed(2))
    const refundNumber = `REF-${Math.floor(100000 + Math.random() * 900000)}`

    const refund = await prisma.$transaction(async (tx) => {
      if (restock) {
        for (const item of lineItems) {
          if (!item.productId) continue
          await adjustStoreStock(tx, {
            storeId: order.storeId,
            productId: item.productId,
            delta: item.quantity,
          })
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }
      }

      const created = await tx.refund.create({
        data: {
          refundNumber,
          orderId: order.id,
          amount,
          reason,
          restock: !!restock,
          status: 'Completed',
          createdById: req.user.id,
          items: { create: lineItems },
        },
        include: { items: true, order: true },
      })

      // Determine if fully refunded
      const allRefunds = await tx.refund.findMany({
        where: { orderId: order.id },
        include: { items: true },
      })
      const qtyMap = {}
      allRefunds.forEach((r) => {
        r.items.forEach((ri) => {
          if (ri.orderItemId) qtyMap[ri.orderItemId] = (qtyMap[ri.orderItemId] || 0) + ri.quantity
        })
      })
      const fullyRefunded = order.items.every((oi) => (qtyMap[oi.id] || 0) >= oi.quantity)

      await tx.order.update({
        where: { id: order.id },
        data: { status: fullyRefunded ? 'Refunded' : 'Partially Refunded' },
      })

      if (order.shiftId) {
        await tx.shift.update({
          where: { id: order.shiftId },
          data: { refundTotal: { increment: amount } },
        })
      }

      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalPurchases: { decrement: amount } },
        })
      }

      return created
    })

    await writeAudit({
      user: req.user,
      action: 'REFUND',
      entity: 'Order',
      entityId: order.id,
      details: { refundNumber, amount, reason, restock },
    })

    res.status(201).json(refund)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Refund failed' })
  }
})

export default router
