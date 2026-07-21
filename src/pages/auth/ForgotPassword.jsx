import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthCard from '../../components/auth/AuthCard'
import AuthInput from '../../components/auth/AuthInput'
import Button from '../../components/ui/Button'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetToken, setResetToken] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await requestPasswordReset(email)
      setSent(true)
      setResetToken(result.token)
      addToast('If an account exists, a reset link has been sent')
    } catch (err) {
      addToast(err.message || 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={sent ? 'Check your email' : 'Forgot password'}
      subtitle={sent
        ? 'We sent password reset instructions to your inbox.'
        : 'Enter your email and we\'ll send you a reset link.'}
    >
      <AuthCard>
        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Reset instructions sent to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
            </p>
            {resetToken && (
              <div className="mb-5 rounded-xl border border-primary-100 bg-primary-50/60 p-3 text-left dark:border-primary-900/40 dark:bg-primary-900/20">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">Demo reset link</p>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="mt-1 block break-all text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  Continue to reset password →
                </Link>
              </div>
            )}
            <Link to="/login">
              <Button variant="secondary" className="w-full" icon={ArrowLeft}>Back to Sign In</Button>
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AuthInput
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
