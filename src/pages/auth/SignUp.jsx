import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, UserPlus } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthCard from '../../components/auth/AuthCard'
import AuthInput from '../../components/auth/AuthInput'
import PasswordInput from '../../components/auth/PasswordInput'
import PasswordStrength from '../../components/auth/PasswordStrength'
import AuthDivider from '../../components/auth/AuthDivider'
import SocialAuthButtons from '../../components/auth/SocialAuthButtons'
import Button from '../../components/ui/Button'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../context/ToastContext'
import { AUTH_ROLES, COUNTRIES } from '../../auth/constants'

const initial = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'Cashier',
  storeName: '',
  country: 'United States',
  terms: false,
}

export default function SignUp() {
  const { signup } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const validate = () => {
    const next = {}
    if (!form.firstName.trim()) next.firstName = 'First name is required'
    if (!form.lastName.trim()) next.lastName = 'Last name is required'
    if (!form.username.trim()) next.username = 'Username is required'
    else if (form.username.trim().length < 3) next.username = 'Username must be at least 3 characters'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.phone.trim()) next.phone = 'Phone number is required'
    if (!form.storeName.trim()) next.storeName = 'Store name is required'
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match'
    if (!form.terms) next.terms = 'You must accept the terms to continue'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const result = await signup(form)
      addToast('Account created successfully')
      if (result.needsVerification) {
        navigate('/verify-email', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      addToast(err.message || 'Sign up failed', 'error')
      setErrors({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join StockFlow POS and start managing your store professionally.">
      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthInput label="First Name" name="firstName" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} autoComplete="given-name" />
            <AuthInput label="Last Name" name="lastName" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} autoComplete="family-name" />
          </div>
          <AuthInput label="Username" name="username" value={form.username} onChange={(e) => set('username', e.target.value)} error={errors.username} autoComplete="username" />
          <AuthInput label="Email" name="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} autoComplete="email" />
          <AuthInput label="Phone Number" name="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} autoComplete="tel" />
          <AuthInput label="Store Name" name="storeName" value={form.storeName} onChange={(e) => set('storeName', e.target.value)} error={errors.storeName} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select id="role" className="select-base" value={form.role} onChange={(e) => set('role', e.target.value)}>
                {AUTH_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
              <select id="country" className="select-base" value={form.country} onChange={(e) => set('country', e.target.value)}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <PasswordInput label="Password" name="password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} autoComplete="new-password" />
            <PasswordStrength password={form.password} />
          </div>
          <PasswordInput label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} error={errors.confirmPassword} autoComplete="new-password" />

          <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => set('terms', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              I agree to the <span className="font-medium text-primary-600">Terms & Conditions</span> and Privacy Policy
            </span>
          </label>
          {errors.terms && <p className="text-xs text-rose-600" role="alert">{errors.terms}</p>}
          {errors.form && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400" role="alert">
              {errors.form}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <AuthDivider />
        <SocialAuthButtons />

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
