import { useState } from 'react'
import { Loader2, Save, Shield, Mail, Phone, Store, Calendar, Clock, Palette } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import AuthInput from '../components/auth/AuthInput'
import { COUNTRIES } from '../auth/constants'
import { formatDate, formatDateTime } from '../utils/formatters'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { theme } = useApp()
  const { addToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    phone: user?.phone || '',
    storeName: user?.storeName || '',
    country: user?.country || 'United States',
  })

  if (!user) return null

  const fullName = `${user.firstName} ${user.lastName}`
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(form)
      setEditing(false)
      addToast('Profile updated successfully')
    } catch (err) {
      addToast(err.message || 'Update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal information and account details.">
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit Profile</Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-primary-500/30">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{fullName}</h2>
            <p className="mt-1 text-sm text-slate-500">@{user.username}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="info">{user.role}</Badge>
              <Badge variant={user.status === 'Active' ? 'success' : 'danger'}>{user.status}</Badge>
              {user.emailVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            {[
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Phone, label: 'Phone', value: user.phone || '—' },
              { icon: Store, label: 'Store', value: user.storeName || '—' },
              { icon: Shield, label: 'Role', value: user.role },
              { icon: Calendar, label: 'Member since', value: user.createdAt ? formatDate(user.createdAt) : '—' },
              { icon: Clock, label: 'Last login', value: user.lastLogin ? formatDateTime(user.lastLogin) : '—' },
              { icon: Palette, label: 'Theme', value: theme === 'dark' ? 'Dark' : 'Light' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
            {editing ? 'Edit Profile' : 'Profile Details'}
          </h3>
          <p className="mb-5 text-sm text-slate-500">
            {editing ? 'Update your personal and store information.' : 'Your account information as it appears across StockFlow.'}
          </p>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AuthInput label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                <AuthInput label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <AuthInput label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              <AuthInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <AuthInput label="Store Name" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
                <select className="select-base" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: 'Full Name', value: fullName },
                { label: 'Username', value: `@${user.username}` },
                { label: 'Email', value: user.email },
                { label: 'Phone', value: user.phone || '—' },
                { label: 'Store Name', value: user.storeName || '—' },
                { label: 'Country', value: user.country || '—' },
                { label: 'Role', value: user.role },
                { label: 'Status', value: user.status },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
