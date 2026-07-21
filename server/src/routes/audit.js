import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', requirePermission('audit'), async (req, res) => {
  const where = {}
  if (req.query.entity) where.entity = String(req.query.entity)
  if (req.query.action) where.action = String(req.query.action)
  if (req.query.userId) where.userId = String(req.query.userId)

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: Number(req.query.limit || 150),
  })

  res.json(logs.map((log) => ({
    ...log,
    details: (() => {
      try { return JSON.parse(log.details || '{}') } catch { return {} }
    })(),
  })))
})

export default router
