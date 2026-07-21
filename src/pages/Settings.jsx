import { useState } from 'react'
import { Loader2, Save, Bell, Shield, Link2, Monitor, AlertTriangle, KeyRound } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import PasswordInput from '../components/auth/PasswordInput'
import PasswordStrength from '../components/auth/PasswordStrength'
import ConfirmModal from '../components/ui/ConfirmModal'

const sections = [
  { id: 'general', label: 'General', icon: Monitor },
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'sessions', label: 'Sessions', icon: Monitor },
  { id: 'connected', label: 'Connected Accounts', icon: Link2 },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
]

export default function Settings() {
  const { user, updateSettings, changePassword, logout, loginWithProvider, session } = useAuth()
  const { theme, toggleTheme } = useApp()
  const { addToast } = useToast()
  const [active, setActive] = useState('general')
  const [loading, setLoading] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [notifications, setNotifications] = useState(user?.notifications || {
    email: true, lowStock: true, orders: true, marketing: false,
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  if (!user) return null

  const saveNotifications = async () => {
    setLoading(true)
    try {
      await updateSettings({ notifications })
      addToast('Notification preferences saved')
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    const next = {}
    if (!passwordForm.currentPassword) next.currentPassword = 'Required'
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      next.newPassword = 'Must be at least 8 characters'
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      next.confirmPassword = 'Passwords do not match'
    }
    setPasswordErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      addToast('Password changed successfully')
    } catch (err) {
      addToast(err.message || 'Password change failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleProvider = async (provider) => {
    const result = await loginWithProvider(provider)
    if (!result.configured) addToast(result.message, 'info')
  }

  const handleLogoutAll = async () => {
    await logout()
    addToast('Signed out of all sessions', 'success')
  }

  return (
    <div>
      <PageHeader title="Account Settings" description="Manage appearance, security, notifications, and connected accounts." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="h-fit lg:col-span-1 !p-3" padding={false}>
          <nav className="space-y-1 p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active === section.id
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="lg:col-span-3">
          {active === 'general' && (
            <Card>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">General</h3>
              <p className="mb-5 text-sm text-slate-500">Basic account information for your StockFlow workspace.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { label: 'Account Email', value: user.email },
                  { label: 'Username', value: user.username },
                  { label: 'Role', value: user.role },
                  { label: 'Store', value: user.storeName || '—' },
                  { label: 'Country', value: user.country || '—' },
                  { label: 'Status', value: user.status },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="text-xs uppercase tracking-wider text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Product tour</p>
                  <p className="text-xs text-slate-500">Replay the first-login walkthrough anytime.</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    localStorage.removeItem('stockflow_onboarding_done')
                    addToast('Tour will start on next page load')
                    window.location.reload()
                  }}
                >
                  Replay tour
                </Button>
              </div>
            </Card>
          )}

          {active === 'appearance' && (
            <Card>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Appearance</h3>
              <p className="mb-5 text-sm text-slate-500">Choose how StockFlow looks on this device.</p>
              <div className="flex flex-col gap-4 sm:flex-row">
                {['light', 'dark'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { if (theme !== mode) toggleTheme() }}
                    className={`flex-1 rounded-2xl border p-4 text-left transition-all ${
                      theme === mode
                        ? 'border-primary-500 bg-primary-50 shadow-sm shadow-primary-500/10 dark:bg-primary-900/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <p className="font-semibold capitalize text-slate-900 dark:text-white">{mode} Mode</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {mode === 'light' ? 'Clean light interface for daytime use' : 'Low-glare dark interface for focus'}
                    </p>
                    {theme === mode && <Badge variant="info" className="mt-3">Active</Badge>}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {active === 'notifications' && (
            <Card>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Notifications</h3>
              <p className="mb-5 text-sm text-slate-500">Control which alerts you receive in StockFlow.</p>
              <div className="space-y-3">
                {[
                  { key: 'email', label: 'Email notifications', desc: 'Account and security emails' },
                  { key: 'lowStock', label: 'Low stock alerts', desc: 'Inventory threshold warnings' },
                  { key: 'orders', label: 'Order updates', desc: 'New sales and checkout events' },
                  { key: 'marketing', label: 'Product updates', desc: 'Tips and feature announcements' },
                ].map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!notifications[item.key]}
                      onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-5">
                <Button onClick={saveNotifications} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Preferences
                </Button>
              </div>
            </Card>
          )}

          {active === 'security' && (
            <Card>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Security</h3>
              <p className="mb-5 text-sm text-slate-500">Update your password to keep your account secure.</p>
              <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                <PasswordInput
                  label="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  error={passwordErrors.currentPassword}
                />
                <div>
                  <PasswordInput
                    label="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    error={passwordErrors.newPassword}
                  />
                  <PasswordStrength password={passwordForm.newPassword} />
                </div>
                <PasswordInput
                  label="Confirm New Password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  error={passwordErrors.confirmPassword}
                />
                <Button type="submit" disabled={loading} icon={KeyRound}>
                  {loading ? 'Updating...' : 'Change Password'}
                </Button>
              </form>
            </Card>
          )}

          {active === 'sessions' && (
            <Card>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Active Sessions</h3>
              <p className="mb-5 text-sm text-slate-500">Devices and sessions currently signed in to your account.</p>
              <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">This browser</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Role: {session?.role || user.role} · Remember me: {session?.remember ? 'Yes' : 'No'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Expires: {session?.expiresAt ? new Date(session.expiresAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <Badge variant="success">Current</Badge>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="danger" onClick={() => setLogoutOpen(true)}>Sign out everywhere</Button>
              </div>
            </Card>
          )}

          {active === 'connected' && (
            <Card>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Connected Accounts</h3>
              <p className="mb-5 text-sm text-slate-500">Link social providers when OAuth is configured.</p>
              <div className="space-y-3">
                {[
                  { id: 'Google', connected: user.connectedAccounts?.google },
                  { id: 'Microsoft', connected: user.connectedAccounts?.microsoft },
                ].map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{provider.id}</p>
                      <p className="text-xs text-slate-500">
                        {provider.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleProvider(provider.id)}>
                      {provider.connected ? 'Manage' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {active === 'danger' && (
            <Card className="border-rose-200/80 dark:border-rose-900/40">
              <h3 className="mb-1 text-base font-semibold text-rose-700 dark:text-rose-400">Danger Zone</h3>
              <p className="mb-5 text-sm text-slate-500">
                Sensitive account actions. These do not delete your POS business data stored separately in localStorage.
              </p>
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-900/10">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Sign out of this account</p>
                <p className="mt-1 text-xs text-slate-500">You will need to sign in again to access the dashboard.</p>
                <Button variant="danger" className="mt-4" onClick={() => setLogoutOpen(true)}>Sign Out</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogoutAll}
        title="Sign out?"
        message="Are you sure you want to sign out of StockFlow POS? You will need to log in again to continue."
        confirmText="Sign Out"
      />
    </div>
  )
}
