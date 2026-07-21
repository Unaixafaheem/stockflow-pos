import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthCard from '../../components/auth/AuthCard'
import AuthInput from '../../components/auth/AuthInput'
import PasswordInput from '../../components/auth/PasswordInput'
import AuthDivider from '../../components/auth/AuthDivider'
import SocialAuthButtons from '../../components/auth/SocialAuthButtons'
import Button from '../../components/ui/Button'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ identifier: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const next = {}
    if (!form.identifier.trim()) next.identifier = 'Email or username is required'
    if (!form.password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login({
        identifier: form.identifier,
        password: form.password,
        remember: form.remember,
      })
      addToast('Welcome back to StockFlow POS')
      navigate(from, { replace: true })
    } catch (err) {
      addToast(err.message || 'Login failed', 'error')
      setErrors({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your StockFlow POS account to continue.">
      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthInput
            label="Email or Username"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="admin@stockflow.com"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            error={errors.identifier}
          />
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />

          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot password?
            </Link>
          </div>

          {errors.form && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400" role="alert">
              {errors.form}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <AuthDivider />
        <SocialAuthButtons />

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Sign up
          </Link>
        </p>

        <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/60 px-3.5 py-3 dark:border-primary-900/40 dark:bg-primary-900/20">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">Demo credentials</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Admin: admin@stockflow.com / admin123</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Manager: manager@stockflow.com / manager123</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Cashier: cashier@stockflow.com / cashier123</p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
