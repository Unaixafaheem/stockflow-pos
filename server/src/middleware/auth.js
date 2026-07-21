import { verifyAccessToken } from '../utils/tokens.js'
import { hasPermission } from '../utils/roles.js'
import prisma from '../utils/prisma.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.status !== 'Active') {
      return res.status(401).json({ message: 'Invalid or inactive account' })
    }

    req.user = user
    req.auth = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid token', code: 'TOKEN_EXPIRED' })
  }
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    const role = req.user?.role
    const allowed = permissions.some((p) => hasPermission(role, p))
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission for this action' })
    }
    next()
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Insufficient role privileges' })
    }
    next()
  }
}
