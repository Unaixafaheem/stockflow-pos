import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const accessSecret = process.env.JWT_ACCESS_SECRET || 'stockflow_access_secret'
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'stockflow_refresh_secret'
const accessExpires = process.env.JWT_ACCESS_EXPIRES || '15m'
const refreshExpires = process.env.JWT_REFRESH_EXPIRES || '7d'

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, username: user.username },
    accessSecret,
    { expiresIn: accessExpires }
  )
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    refreshSecret,
    { expiresIn: refreshExpires }
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret)
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getRefreshExpiryDate() {
  // default 7 days
  const days = 7
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}
