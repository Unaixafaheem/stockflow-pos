import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { writeAudit } from '../utils/audit.js'

const router = Router()
router.use(requireAuth)

router.get('/', requirePermission('coupons', 'pos'), async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(coupons)
})

router.post('/', requirePermission('coupons'), async (req, res) => {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: String(req.body.code).toUpperCase().trim(),
        name: req.body.name,
        type: req.body.type,
        value: Number(req.body.value),
        category: req.body.category || null,
        minPurchase: Number(req.body.minPurchase || 0),
        maxUses: req.body.maxUses != null ? Number(req.body.maxUses) : null,
        bogoBuyQty: Number(req.body.bogoBuyQty || 1),
        bogoGetQty: Number(req.body.bogoGetQty || 1),
        active: req.body.active !== false,
        startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null,
        endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
      },
    })
    await writeAudit({ user: req.user, action: 'CREATE', entity: 'Coupon', entityId: coupon.id })
    res.status(201).json(coupon)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Coupon code already exists' })
    res.status(500).json({ message: 'Failed to create coupon' })
  }
})

router.put('/:id', requirePermission('coupons'), async (req, res) => {
  try {
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        type: req.body.type,
        value: Number(req.body.value),
        category: req.body.category || null,
        minPurchase: Number(req.body.minPurchase || 0),
        maxUses: req.body.maxUses != null ? Number(req.body.maxUses) : null,
        bogoBuyQty: Number(req.body.bogoBuyQty || 1),
        bogoGetQty: Number(req.body.bogoGetQty || 1),
        active: req.body.active !== false,
        startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null,
        endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
      },
    })
    res.json(coupon)
  } catch {
    res.status(404).json({ message: 'Coupon not found' })
  }
})

router.delete('/:id', requirePermission('coupons'), async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } })
    await writeAudit({ user: req.user, action: 'DELETE', entity: 'Coupon', entityId: req.params.id })
    res.json({ success: true })
  } catch {
    res.status(404).json({ message: 'Coupon not found' })
  }
})

router.post('/validate', requirePermission('pos', 'coupons'), async (req, res) => {
  const code = String(req.body.code || '').toUpperCase().trim()
  const subtotal = Number(req.body.subtotal || 0)
  const items = req.body.items || []

  const coupon = await prisma.coupon.findUnique({ where: { code } })
  if (!coupon || !coupon.active) {
    return res.status(404).json({ message: 'Invalid coupon code' })
  }
  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) {
    return res.status(400).json({ message: 'Coupon is not active yet' })
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return res.status(400).json({ message: 'Coupon has expired' })
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return res.status(400).json({ message: 'Coupon usage limit reached' })
  }
  if (subtotal < coupon.minPurchase) {
    return res.status(400).json({ message: `Minimum purchase of $${coupon.minPurchase} required` })
  }

  let discount = 0
  if (coupon.type === 'percent') {
    discount = (subtotal * coupon.value) / 100
  } else if (coupon.type === 'fixed') {
    discount = coupon.value
  } else if (coupon.type === 'category') {
    const categoryTotal = items
      .filter((i) => i.category === coupon.category)
      .reduce((sum, i) => sum + (i.price * i.quantity), 0)
    discount = (categoryTotal * coupon.value) / 100
  } else if (coupon.type === 'bogo') {
    // Apply free items of lowest price among eligible cart lines
    const expanded = []
    items.forEach((i) => {
      for (let n = 0; n < i.quantity; n += 1) expanded.push(i.price)
    })
    expanded.sort((a, b) => a - b)
    const sets = Math.floor(expanded.length / (coupon.bogoBuyQty + coupon.bogoGetQty))
    const freeCount = sets * coupon.bogoGetQty
    discount = expanded.slice(0, freeCount).reduce((sum, p) => sum + p, 0)
  }

  discount = Math.min(subtotal, Number(discount.toFixed(2)))
  res.json({ coupon, discount })
})

export default router
