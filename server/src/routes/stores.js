import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { writeAudit } from '../utils/audit.js'

const router = Router()
router.use(requireAuth)

router.get('/', requirePermission('stores', 'pos', 'dashboard'), async (_req, res) => {
  const stores = await prisma.store.findMany({ orderBy: { name: 'asc' } })
  res.json(stores)
})

router.post('/', requirePermission('stores'), async (req, res) => {
  try {
    const store = await prisma.store.create({
      data: {
        name: req.body.name,
        code: req.body.code.toUpperCase(),
        address: req.body.address || null,
        phone: req.body.phone || null,
        status: req.body.status || 'Active',
      },
    })

    // Seed inventory rows from catalog
    const products = await prisma.product.findMany()
    if (products.length) {
      await prisma.storeInventory.createMany({
        data: products.map((p) => ({
          storeId: store.id,
          productId: p.id,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
        })),
      })
    }

    await writeAudit({ user: req.user, action: 'CREATE', entity: 'Store', entityId: store.id, details: { name: store.name } })
    res.status(201).json(store)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Store code already exists' })
    res.status(500).json({ message: 'Failed to create store' })
  }
})

router.put('/:id', requirePermission('stores'), async (req, res) => {
  try {
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        code: req.body.code?.toUpperCase(),
        address: req.body.address || null,
        phone: req.body.phone || null,
        status: req.body.status,
      },
    })
    await writeAudit({ user: req.user, action: 'UPDATE', entity: 'Store', entityId: store.id })
    res.json(store)
  } catch {
    res.status(404).json({ message: 'Store not found' })
  }
})

router.post('/:id/select', requirePermission('stores', 'pos', 'dashboard'), async (req, res) => {
  const store = await prisma.store.findUnique({ where: { id: req.params.id } })
  if (!store || store.status !== 'Active') {
    return res.status(404).json({ message: 'Store not available' })
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { currentStoreId: store.id },
  })
  await writeAudit({ user: req.user, action: 'SELECT_STORE', entity: 'Store', entityId: store.id })
  res.json({ store, currentStoreId: user.currentStoreId })
})

router.get('/:id/inventory', requirePermission('stores', 'products', 'pos'), async (req, res) => {
  const inventory = await prisma.storeInventory.findMany({
    where: { storeId: req.params.id },
    include: { product: true },
    orderBy: { product: { name: 'asc' } },
  })
  res.json(inventory.map((row) => ({
    ...row.product,
    stockQuantity: row.stockQuantity,
    lowStockThreshold: row.lowStockThreshold,
    storeInventoryId: row.id,
    storeId: row.storeId,
  })))
})

export default router
