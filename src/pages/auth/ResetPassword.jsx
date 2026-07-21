import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthCard from '../../components/auth/AuthCard'
import PasswordInput from '../../components/auth/PasswordInput'
import PasswordStrength from '../../components/auth/PasswordStrength'
import Button from '../../components/ui/Button'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const next = {}
    if (!token) next.form = 'Invalid or missing reset token'
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await resetPassword({ token, password: form.password })
      setSuccess(true)
      addToast('Password updated successfully')
    } catch (err) {
      addToast(err.message || 'Reset failed', 'error')
      setErrors({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={success ? 'Password updated' : 'Reset password'}
      subtitle={success ? 'You can now sign in with your new password.' : 'Choose a strong new password for your account.'}
    >
      <AuthCard>
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">Your password has been reset successfully.</p>
            <Button className="w-full" onClick={() => navigate('/login')}>Go to Sign In</Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <PasswordInput
                label="New Password"
                name="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
                autoComplete="new-password"
              />
              <PasswordStrength password={form.password} />
            </div>
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
            {errors.form && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400" role="alert">
                {errors.form}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
