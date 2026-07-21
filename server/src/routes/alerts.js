import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { checkAndCreateStockAlerts } from '../utils/commerce.js'
import { writeAudit } from '../utils/audit.js'

const router = Router()
router.use(requireAuth)

/**
 * Demo alert dispatcher.
 * Ready for EmailJS / WhatsApp — configure env vars and replace the stub send.
 * EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, ALERT_EMAIL_TO
 */
async function dispatchAlert(alert) {
  const configured = !!(
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY &&
    process.env.ALERT_EMAIL_TO
  )

  if (!configured) {
    return {
      ...alert,
      status: 'DemoQueued',
      dispatchNote: 'EmailJS/WhatsApp not configured. Alert stored for demo. Set EMAILJS_* env vars to enable live send.',
    }
  }

  // Placeholder for EmailJS REST call — kept production-ready without hard dependency
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: process.env.ALERT_EMAIL_TO,
          message: alert.message,
          channel: alert.channel,
        },
      }),
    })
    const status = response.ok ? 'Sent' : 'Failed'
    return prisma.stockAlert.update({
      where: { id: alert.id },
      data: { status },
    })
  } catch {
    return prisma.stockAlert.update({
      where: { id: alert.id },
      data: { status: 'Failed' },
    })
  }
}

router.get('/', requirePermission('alerts', 'products', 'dashboard'), async (_req, res) => {
  const alerts = await prisma.stockAlert.findMany({
    include: { product: true, store: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(alerts)
})

router.post('/scan', requirePermission('alerts', 'products'), async (req, res) => {
  const storeId = req.body.storeId || req.user.currentStoreId || null
  const products = await prisma.product.findMany()
  const created = []

  for (const product of products) {
    const alert = await checkAndCreateStockAlerts(null, {
      storeId,
      productId: product.id,
      channel: req.body.channel || 'email',
    })
    if (alert) {
      const dispatched = await dispatchAlert(alert)
      created.push(dispatched)
    }
  }

  await writeAudit({
    user: req.user,
    action: 'STOCK_ALERT_SCAN',
    entity: 'StockAlert',
    details: { created: created.length, storeId },
  })

  res.json({
    scanned: products.length,
    alertsCreated: created.length,
    alerts: created,
  })
})

router.post('/:id/resend', requirePermission('alerts'), async (req, res) => {
  const alert = await prisma.stockAlert.findUnique({ where: { id: req.params.id } })
  if (!alert) return res.status(404).json({ message: 'Alert not found' })
  const result = await dispatchAlert(alert)
  res.json(result)
})

export default router
