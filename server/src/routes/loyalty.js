import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { LOYALTY_TIERS, POINT_VALUE, tierFromPoints } from '../utils/commerce.js'
import { writeAudit } from '../utils/audit.js'

const router = Router()
router.use(requireAuth)

router.get('/tiers', requirePermission('loyalty', 'pos', 'customers'), (_req, res) => {
  res.json({
    tiers: LOYALTY_TIERS,
    pointValue: POINT_VALUE,
    redeemNote: '100 points = $1.00 at checkout',
  })
})

router.get('/customers', requirePermission('loyalty', 'customers'), async (_req, res) => {
  const customers = await prisma.customer.findMany({
    where: { name: { not: 'Walk-in Customer' } },
    orderBy: { loyaltyPoints: 'desc' },
  })
  res.json(customers)
})

router.get('/customers/:id/history', requirePermission('loyalty', 'customers'), async (req, res) => {
  const history = await prisma.loyaltyTransaction.findMany({
    where: { customerId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json(history)
})

router.post('/adjust', requirePermission('loyalty'), async (req, res) => {
  const { customerId, points, note } = req.body
  const pts = Number(points)
  if (!customerId || !pts) {
    return res.status(400).json({ message: 'Customer and points are required' })
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return res.status(404).json({ message: 'Customer not found' })

  const newPoints = Math.max(0, customer.loyaltyPoints + pts)
  const updated = await prisma.$transaction(async (tx) => {
    await tx.loyaltyTransaction.create({
      data: {
        customerId,
        points: pts,
        type: pts >= 0 ? 'adjust_earn' : 'adjust_redeem',
        note: note || 'Manual adjustment',
      },
    })
    return tx.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: newPoints,
        loyaltyTier: tierFromPoints(newPoints),
      },
    })
  })

  await writeAudit({
    user: req.user,
    action: 'LOYALTY_ADJUST',
    entity: 'Customer',
    entityId: customerId,
    details: { points: pts, note },
  })

  res.json(updated)
})

router.post('/quote-redeem', requirePermission('loyalty', 'pos'), async (req, res) => {
  const points = Number(req.body.points || 0)
  const customerId = req.body.customerId
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return res.status(404).json({ message: 'Customer not found' })
  if (points <= 0) return res.json({ discount: 0, points: 0 })
  if (points > customer.loyaltyPoints) {
    return res.status(400).json({ message: 'Not enough loyalty points' })
  }
  const discount = Number((points * POINT_VALUE).toFixed(2))
  res.json({ discount, points, available: customer.loyaltyPoints })
})

export default router
