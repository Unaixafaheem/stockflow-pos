import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { writeAudit } from '../utils/audit.js'
import { adjustStoreStock } from '../utils/commerce.js'

const router = Router()
router.use(requireAuth)

router.get('/', requirePermission('suppliers', 'products'), async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { purchaseOrders: true, products: true } } },
    orderBy: { name: 'asc' },
  })
  res.json(suppliers)
})

router.post('/', requirePermission('suppliers'), async (req, res) => {
  const supplier = await prisma.supplier.create({
    data: {
      name: req.body.name,
      email: req.body.email || null,
      phone: req.body.phone || null,
      address: req.body.address || null,
      notes: req.body.notes || null,
      status: req.body.status || 'Active',
    },
  })
  await writeAudit({ user: req.user, action: 'CREATE', entity: 'Supplier', entityId: supplier.id })
  res.status(201).json(supplier)
})

router.put('/:id', requirePermission('suppliers'), async (req, res) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        notes: req.body.notes || null,
        status: req.body.status,
      },
    })
    await writeAudit({ user: req.user, action: 'UPDATE', entity: 'Supplier', entityId: supplier.id })
    res.json(supplier)
  } catch {
    res.status(404).json({ message: 'Supplier not found' })
  }
})

router.delete('/:id', requirePermission('suppliers'), async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } })
    await writeAudit({ user: req.user, action: 'DELETE', entity: 'Supplier', entityId: req.params.id })
    res.json({ success: true })
  } catch {
    res.status(404).json({ message: 'Supplier not found' })
  }
})

// Purchase orders
router.get('/purchase-orders', requirePermission('suppliers', 'products'), async (_req, res) => {
  const orders = await prisma.purchaseOrder.findMany({
    include: { supplier: true, store: true, items: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(orders)
})

router.post('/purchase-orders', requirePermission('suppliers'), async (req, res) => {
  try {
    const items = req.body.items || []
    if (!items.length) return res.status(400).json({ message: 'Add at least one item' })

    const lineItems = items.map((item) => ({
      productId: item.productId || null,
      name: item.name,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      total: Number(item.quantity) * Number(item.unitCost),
    }))
    const totalCost = lineItems.reduce((sum, i) => sum + i.total, 0)
    const poNumber = `PO-${Math.floor(100000 + Math.random() * 900000)}`

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: req.body.supplierId,
        storeId: req.body.storeId || req.user.currentStoreId || null,
        status: req.body.status || 'Ordered',
        totalCost,
        notes: req.body.notes || null,
        createdById: req.user.id,
        orderedAt: new Date(),
        items: { create: lineItems },
      },
      include: { supplier: true, store: true, items: true },
    })

    await writeAudit({ user: req.user, action: 'CREATE', entity: 'PurchaseOrder', entityId: po.id, details: { poNumber } })
    res.status(201).json(po)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create purchase order' })
  }
})

router.post('/purchase-orders/:id/receive', requirePermission('suppliers', 'products'), async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    })
    if (!po) return res.status(404).json({ message: 'Purchase order not found' })
    if (po.status === 'Received') return res.status(400).json({ message: 'Already received' })

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of po.items) {
        if (!item.productId) continue
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        await adjustStoreStock(tx, {
          storeId: po.storeId,
          productId: item.productId,
          delta: item.quantity,
          threshold: product?.lowStockThreshold,
        })
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        })
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: item.quantity },
        })
      }

      return tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'Received', receivedAt: new Date() },
        include: { supplier: true, store: true, items: true },
      })
    })

    await writeAudit({ user: req.user, action: 'RECEIVE', entity: 'PurchaseOrder', entityId: po.id })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to receive purchase order' })
  }
})

export default router
