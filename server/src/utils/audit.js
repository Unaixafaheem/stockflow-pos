import prisma from '../utils/prisma.js'

export async function writeAudit({ user, action, entity, entityId = null, details = {} }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        userName: user ? `${user.firstName} ${user.lastName}` : 'System',
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: JSON.stringify(details),
      },
    })
  } catch (err) {
    console.error('Audit log failed:', err.message)
  }
}

export function auditMiddleware(action, entity) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode < 400 && req.user) {
        const entityId = body?.id || body?.dbId || req.params?.id || null
        writeAudit({
          user: req.user,
          action,
          entity,
          entityId,
          details: { method: req.method, path: req.originalUrl },
        })
      }
      return originalJson(body)
    }
    next()
  }
}
