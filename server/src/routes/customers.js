import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', requirePermission('customers', 'pos', 'orders'), async (_req, res) => {
  const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
  res.json(customers)
})

router.post('/', requirePermission('customers'), async (req, res) => {
  const customer = await prisma.customer.create({
    data: {
      name: req.body.name,
      phone: req.body.phone || null,
      email: req.body.email || null,
    },
  })
  res.status(201).json(customer)
})

router.put('/:id', requirePermission('customers'), async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        phone: req.body.phone || null,
        email: req.body.email || null,
      },
    })
    res.json(customer)
  } catch {
    res.status(404).json({ message: 'Customer not found' })
  }
})

router.delete('/:id', requirePermission('customers'), async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch {
    res.status(404).json({ message: 'Customer not found' })
  }
})

export default router
