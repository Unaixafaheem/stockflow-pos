import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '../utils/prisma.js'
import { sanitizeUser, ROLES } from '../utils/roles.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshExpiryDate,
} from '../utils/tokens.js'
import { requireAuth } from '../middleware/auth.js'
import { writeAudit } from '../utils/audit.js'

const router = Router()

async function issueTokens(user, res) {
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)
  const tokenHash = hashToken(refreshToken)

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId: user.id,
      expiresAt: getRefreshExpiryDate(),
    },
  })

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  }
}

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' })
    }

    const value = identifier.trim().toLowerCase()
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: value }, { username: value }],
      },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email/username or password' })
    }
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'This account has been deactivated' })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
      include: { currentStore: true },
    })

    await writeAudit({
      user: updated,
      action: 'LOGIN',
      entity: 'User',
      entityId: updated.id,
      details: { role: updated.role },
    })

    const tokens = await issueTokens(updated, res)
    res.json(tokens)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Login failed' })
  }
})

router.post('/signup', async (req, res) => {
  try {
    const {
      firstName, lastName, username, email, phone,
      password, role, storeName, country,
    } = req.body

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const selectedRole = ROLES.includes(role) ? role : 'Cashier'
    const emailNorm = email.trim().toLowerCase()
    const usernameNorm = username.trim().toLowerCase()

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailNorm }, { username: usernameNorm }],
      },
    })
    if (existing) {
      return res.status(409).json({
        message: existing.email === emailNorm
          ? 'An account with this email already exists'
          : 'This username is already taken',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: usernameNorm,
        email: emailNorm,
        phone: phone?.trim() || null,
        passwordHash,
        role: selectedRole,
        storeName: storeName?.trim() || null,
        country: country || null,
        emailVerified: false,
        notificationsJson: JSON.stringify({
          email: true, lowStock: true, orders: true, marketing: false,
        }),
        connectedJson: JSON.stringify({ google: false, microsoft: false }),
      },
    })

    const tokens = await issueTokens(user, res)
    res.status(201).json({ ...tokens, needsVerification: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Sign up failed' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' })

    const payload = verifyRefreshToken(refreshToken)
    const tokenHash = hashToken(refreshToken)
    const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } })
    if (!stored || stored.expiresAt < new Date() || stored.userId !== payload.sub) {
      return res.status(401).json({ message: 'Invalid refresh token', code: 'TOKEN_EXPIRED' })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.status !== 'Active') {
      return res.status(401).json({ message: 'Invalid account' })
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } })
    const tokens = await issueTokens(user, res)
    res.json(tokens)
  } catch {
    res.status(401).json({ message: 'Invalid refresh token', code: 'TOKEN_EXPIRED' })
  }
})

router.post('/logout', requireAuth, async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: hashToken(refreshToken) } })
    } else {
      await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } })
    }
    res.json({ success: true })
  } catch {
    res.json({ success: true })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: sanitizeUser(req.user) })
})

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, phone, storeName, country, username } = req.body
    const data = {}
    if (firstName !== undefined) data.firstName = firstName.trim()
    if (lastName !== undefined) data.lastName = lastName.trim()
    if (phone !== undefined) data.phone = phone.trim()
    if (storeName !== undefined) data.storeName = storeName.trim()
    if (country !== undefined) data.country = country
    if (username !== undefined) data.username = username.trim().toLowerCase()

    const user = await prisma.user.update({ where: { id: req.user.id }, data })
    res.json({ user: sanitizeUser(user) })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Username already taken' })
    }
    res.status(500).json({ message: 'Update failed' })
  }
})

router.patch('/settings', requireAuth, async (req, res) => {
  try {
    const { themePreference, notifications } = req.body
    const data = {}
    if (themePreference) data.themePreference = themePreference
    if (notifications) data.notificationsJson = JSON.stringify(notifications)
    const user = await prisma.user.update({ where: { id: req.user.id }, data })
    res.json({ user: sanitizeUser(user) })
  } catch {
    res.status(500).json({ message: 'Settings update failed' })
  }
})

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Invalid password payload' })
    }
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash)
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' })

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    })
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Password change failed' })
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } })
    // Always return success
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          email: user.email,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      })
      return res.json({ success: true, token, email: user.email })
    }
    res.json({ success: true, token: null, email })
  } catch {
    res.status(500).json({ message: 'Request failed' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ message: 'Invalid reset payload' })
    }
    const entry = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!entry || entry.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' })
    }

    await prisma.user.update({
      where: { id: entry.userId },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    })
    await prisma.passwordResetToken.delete({ where: { id: entry.id } })
    await prisma.refreshToken.deleteMany({ where: { userId: entry.userId } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Reset failed' })
  }
})

router.post('/verify-email', requireAuth, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { emailVerified: true },
  })
  res.json({ user: sanitizeUser(user) })
})

router.post('/resend-verification', requireAuth, async (_req, res) => {
  res.json({ success: true })
})

router.post('/oauth/:provider', async (req, res) => {
  const provider = req.params.provider
  res.json({
    configured: false,
    provider,
    message: `${provider} sign-in is ready to connect. Configure your OAuth provider to enable it.`,
  })
})

export default router
