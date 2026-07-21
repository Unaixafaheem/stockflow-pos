import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { writeAudit } from '../utils/audit.js'

const router = Router()
router.use(requireAuth)

router.get('/', requirePermission('shifts', 'reports'), async (req, res) => {
  const where = {}
  if (req.query.status) where.status = req.query.status
  if (req.query.mine === 'true') where.userId = req.user.id
  const shifts = await prisma.shift.findMany({
    where,
    include: { store: true, user: { select: { id: true, firstName: true, lastName: true, role: true } } },
    orderBy: { openedAt: 'desc' },
    take: 100,
  })
  res.json(shifts)
})

router.get('/current', requirePermission('shifts', 'pos'), async (req, res) => {
  const shift = await prisma.shift.findFirst({
    where: { userId: req.user.id, status: 'Open' },
    include: { store: true },
  })
  res.json(shift)
})

router.post('/open', requirePermission('shifts', 'pos'), async (req, res) => {
  const existing = await prisma.shift.findFirst({
    where: { userId: req.user.id, status: 'Open' },
  })
  if (existing) {
    return res.status(400).json({ message: 'You already have an open shift', shift: existing })
  }

  const shift = await prisma.shift.create({
    data: {
      userId: req.user.id,
      storeId: req.body.storeId || req.user.currentStoreId || null,
      openingCash: Number(req.body.openingCash || 0),
      status: 'Open',
      notes: req.body.notes || null,
    },
    include: { store: true },
  })
  await writeAudit({ user: req.user, action: 'OPEN_SHIFT', entity: 'Shift', entityId: shift.id })
  res.status(201).json(shift)
})

router.post('/:id/close', requirePermission('shifts', 'pos'), async (req, res) => {
  const shift = await prisma.shift.findUnique({ where: { id: req.params.id } })
  if (!shift || shift.status !== 'Open') {
    return res.status(400).json({ message: 'Shift is not open' })
  }
  if (shift.userId !== req.user.id && req.user.role === 'Cashier') {
    return res.status(403).json({ message: 'You can only close your own shift' })
  }

  const closingCash = Number(req.body.closingCash || 0)
  const expectedCash = shift.openingCash + shift.cashSales - shift.refundTotal

  const updated = await prisma.shift.update({
    where: { id: shift.id },
    data: {
      status: 'Closed',
      closedAt: new Date(),
      closingCash,
      expectedCash: Number(expectedCash.toFixed(2)),
      notes: req.body.notes || shift.notes,
    },
    include: { store: true, user: { select: { firstName: true, lastName: true, role: true } } },
  })

  await writeAudit({
    user: req.user,
    action: 'CLOSE_SHIFT',
    entity: 'Shift',
    entityId: shift.id,
    details: {
      expectedCash: updated.expectedCash,
      closingCash: updated.closingCash,
      variance: Number((closingCash - expectedCash).toFixed(2)),
    },
  })

  res.json({
    ...updated,
    variance: Number((closingCash - expectedCash).toFixed(2)),
  })
})

export default router
