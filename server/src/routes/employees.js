import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', requirePermission('employees'), async (_req, res) => {
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } })
  res.json(employees)
})

router.post('/', requirePermission('employees'), async (req, res) => {
  const employee = await prisma.employee.create({
    data: {
      name: req.body.name,
      role: req.body.role,
      email: req.body.email,
      phone: req.body.phone || null,
      status: req.body.status || 'Active',
    },
  })
  res.status(201).json(employee)
})

router.put('/:id', requirePermission('employees'), async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        role: req.body.role,
        email: req.body.email,
        phone: req.body.phone || null,
        status: req.body.status,
      },
    })
    res.json(employee)
  } catch {
    res.status(404).json({ message: 'Employee not found' })
  }
})

router.delete('/:id', requirePermission('employees'), async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch {
    res.status(404).json({ message: 'Employee not found' })
  }
})

export default router
