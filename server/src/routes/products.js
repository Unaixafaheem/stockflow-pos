import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { writeAudit } from '../utils/audit.js'

const router = Router()
router.use(requireAuth)

async function withStoreStock(products, storeId) {
  if (!storeId || !products.length) return products
  const inventory = await prisma.storeInventory.findMany({
    where: {
      storeId,
      productId: { in: products.map((p) => p.id) },
    },
  })
  const map = Object.fromEntries(inventory.map((i) => [i.productId, i]))
  return products.map((p) => {
    const inv = map[p.id]
    if (!inv) return { ...p, stockQuantity: 0, storeId }
    return {
      ...p,
      stockQuantity: inv.stockQuantity,
      lowStockThreshold: inv.lowStockThreshold,
      storeId,
    }
  })
}

router.get('/', requirePermission('products', 'pos', 'dashboard'), async (req, res) => {
  const { q, category, barcode } = req.query
  const storeId = req.query.storeId || req.user.currentStoreId || null
  const where = {}
  if (category && category !== 'All') where.category = category
  if (barcode) where.barcode = String(barcode)
  if (q) {
    where.OR = [
      { name: { contains: String(q) } },
      { sku: { contains: String(q) } },
      { barcode: { contains: String(q) } },
    ]
  }
  const products = await prisma.product.findMany({ where, orderBy: { name: 'asc' } })
  res.json(await withStoreStock(products, storeId))
})

router.get('/barcode/:code', requirePermission('products', 'pos'), async (req, res) => {
  const storeId = req.query.storeId || req.user.currentStoreId || null
  const product = await prisma.product.findUnique({ where: { barcode: req.params.code } })
  if (!product) return res.status(404).json({ message: 'Product not found for barcode' })
  const [enriched] = await withStoreStock([product], storeId)
  res.json(enriched)
})

router.post('/', requirePermission('products'), async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        name: req.body.name,
        category: req.body.category,
        sku: req.body.sku,
        barcode: req.body.barcode,
        costPrice: Number(req.body.costPrice),
        sellingPrice: Number(req.body.sellingPrice),
        stockQuantity: Number(req.body.stockQuantity),
        lowStockThreshold: Number(req.body.lowStockThreshold),
        supplier: req.body.supplier,
        supplierId: req.body.supplierId || null,
      },
    })

    const stores = await prisma.store.findMany()
    if (stores.length) {
      await prisma.storeInventory.createMany({
        data: stores.map((s) => ({
          storeId: s.id,
          productId: product.id,
          stockQuantity: Number(req.body.stockQuantity),
          lowStockThreshold: Number(req.body.lowStockThreshold),
        })),
      })
    }

    await writeAudit({ user: req.user, action: 'CREATE', entity: 'Product', entityId: product.id, details: { name: product.name } })
    res.status(201).json(product)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'SKU or barcode already exists' })
    }
    res.status(500).json({ message: 'Failed to create product' })
  }
})

router.put('/:id', requirePermission('products'), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        category: req.body.category,
        sku: req.body.sku,
        barcode: req.body.barcode,
        costPrice: Number(req.body.costPrice),
        sellingPrice: Number(req.body.sellingPrice),
        stockQuantity: Number(req.body.stockQuantity),
        lowStockThreshold: Number(req.body.lowStockThreshold),
        supplier: req.body.supplier,
        supplierId: req.body.supplierId || null,
      },
    })

    const storeId = req.user.currentStoreId
    if (storeId) {
      await prisma.storeInventory.upsert({
        where: { storeId_productId: { storeId, productId: product.id } },
        update: {
          stockQuantity: Number(req.body.stockQuantity),
          lowStockThreshold: Number(req.body.lowStockThreshold),
        },
        create: {
          storeId,
          productId: product.id,
          stockQuantity: Number(req.body.stockQuantity),
          lowStockThreshold: Number(req.body.lowStockThreshold),
        },
      })
    }

    await writeAudit({ user: req.user, action: 'UPDATE', entity: 'Product', entityId: product.id })
    res.json(product)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Product not found' })
    if (err.code === 'P2002') return res.status(409).json({ message: 'SKU or barcode already exists' })
    res.status(500).json({ message: 'Failed to update product' })
  }
})

router.delete('/:id', requirePermission('products'), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    await writeAudit({ user: req.user, action: 'DELETE', entity: 'Product', entityId: req.params.id })
    res.json({ success: true })
  } catch {
    res.status(404).json({ message: 'Product not found' })
  }
})

export default router
