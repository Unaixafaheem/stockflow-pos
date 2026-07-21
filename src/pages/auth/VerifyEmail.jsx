import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthCard from '../../components/auth/AuthCard'
import Button from '../../components/ui/Button'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function VerifyEmail() {
  const { user, verifyEmail, resendVerification, isAuthenticated, isLoading } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (user?.emailVerified) setVerified(true)
  }, [user])

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const handleVerify = async () => {
    setLoading(true)
    try {
      await verifyEmail()
      setVerified(true)
      addToast('Email verified successfully')
    } catch (err) {
      addToast(err.message || 'Verification failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await resendVerification()
      addToast('Verification email resent')
    } catch (err) {
      addToast(err.message || 'Could not resend email', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title={verified ? 'Email verified' : 'Verify your email'}
      subtitle={verified
        ? 'Your email is confirmed. You\'re all set to use StockFlow POS.'
        : `We sent a verification message to ${user?.email || 'your email'}.`}
    >
      <AuthCard>
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
              verified
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
                : 'bg-gradient-to-br from-primary-500 to-violet-600 shadow-primary-500/30'
            }`}
          >
            {verified ? <CheckCircle2 className="h-7 w-7 text-white" /> : <Mail className="h-7 w-7 text-white" />}
          </motion.div>

          {!verified ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                For this demo, click below to verify your email instantly.
              </p>
              <Button className="w-full" size="lg" onClick={handleVerify} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleResend} disabled={resending}>
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Resend Email
              </Button>
            </div>
          ) : (
            <Button className="w-full" size="lg" onClick={() => navigate('/', { replace: true })}>
              Continue to Dashboard
            </Button>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
