import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, LayoutDashboard, Package, ShoppingCart, ClipboardList, Users, UserCog,
  BarChart3, Store, Truck, TicketPercent, Clock, Award, BellRing, ScrollText,
  Settings, User, ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useApp } from '../../context/AppContext'

const NAV_COMMANDS = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard', keywords: 'home overview' },
  { id: 'nav-products', label: 'Go to Products', path: '/products', icon: Package, permission: 'products', keywords: 'inventory stock sku' },
  { id: 'nav-pos', label: 'Go to POS / Checkout', path: '/pos', icon: ShoppingCart, permission: 'pos', keywords: 'sell cart checkout' },
  { id: 'nav-orders', label: 'Go to Orders', path: '/orders', icon: ClipboardList, permission: 'orders', keywords: 'sales refunds' },
  { id: 'nav-customers', label: 'Go to Customers', path: '/customers', icon: Users, permission: 'customers', keywords: 'clients' },
  { id: 'nav-employees', label: 'Go to Employees', path: '/employees', icon: UserCog, permission: 'employees', keywords: 'staff team' },
  { id: 'nav-reports', label: 'Go to Reports', path: '/reports', icon: BarChart3, permission: 'reports', keywords: 'analytics' },
  { id: 'nav-stores', label: 'Go to Stores', path: '/stores', icon: Store, permission: 'stores', keywords: 'branches locations' },
  { id: 'nav-suppliers', label: 'Go to Suppliers', path: '/suppliers', icon: Truck, permission: 'suppliers', keywords: 'purchase orders po' },
  { id: 'nav-coupons', label: 'Go to Coupons', path: '/coupons', icon: TicketPercent, permission: 'coupons', keywords: 'discounts promo' },
  { id: 'nav-shifts', label: 'Go to Shifts', path: '/shifts', icon: Clock, permission: 'shifts', keywords: 'cash drawer' },
  { id: 'nav-loyalty', label: 'Go to Loyalty', path: '/loyalty', icon: Award, permission: 'loyalty', keywords: 'points rewards' },
  { id: 'nav-alerts', label: 'Go to Alerts', path: '/alerts', icon: BellRing, permission: 'alerts', keywords: 'low stock' },
  { id: 'nav-audit', label: 'Go to Audit Log', path: '/audit', icon: ScrollText, permission: 'audit', keywords: 'history logs' },
  { id: 'nav-profile', label: 'Go to Profile', path: '/profile', icon: User, permission: 'profile', keywords: 'account' },
  { id: 'nav-settings', label: 'Go to Settings', path: '/settings', icon: Settings, permission: 'settings', keywords: 'preferences' },
]

function matchesQuery(item, q) {
  if (!q) return true
  const hay = `${item.label} ${item.keywords || ''} ${item.sku || ''} ${item.barcode || ''}`.toLowerCase()
  return q.split(/\s+/).every((part) => hay.includes(part))
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { can } = useAuth()
  const { products, customers, orders } = useApp()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const nav = NAV_COMMANDS
      .filter((c) => can(c.permission))
      .filter((c) => matchesQuery(c, q))
      .map((c) => ({ ...c, group: 'Navigation', type: 'nav' }))

    const productHits = (products || [])
      .filter((p) => matchesQuery({
        label: p.name,
        keywords: `${p.category} ${p.sku} ${p.barcode}`,
        sku: p.sku,
        barcode: p.barcode,
      }, q))
      .slice(0, 6)
      .map((p) => ({
        id: `product-${p.id}`,
        label: p.name,
        hint: `${p.sku} · $${Number(p.sellingPrice).toFixed(2)}`,
        path: '/products',
        icon: Package,
        group: 'Products',
        type: 'product',
      }))

    const customerHits = (customers || [])
      .filter((c) => c.name !== 'Walk-in Customer')
      .filter((c) => matchesQuery({ label: c.name, keywords: `${c.email || ''} ${c.phone || ''}` }, q))
      .slice(0, 5)
      .map((c) => ({
        id: `customer-${c.id}`,
        label: c.name,
        hint: c.email || c.phone || 'Customer',
        path: '/customers',
        icon: Users,
        group: 'Customers',
        type: 'customer',
      }))

    const orderHits = q
      ? (orders || [])
        .filter((o) => `${o.id} ${o.customerName}`.toLowerCase().includes(q))
        .slice(0, 5)
        .map((o) => ({
          id: `order-${o.id}`,
          label: o.id,
          hint: `${o.customerName} · $${Number(o.total).toFixed(2)}`,
          path: '/orders',
          icon: ClipboardList,
          group: 'Orders',
          type: 'order',
        }))
      : []

    if (!q) return nav.slice(0, 10)
    return [...nav.slice(0, 6), ...productHits, ...customerHits, ...orderHits]
  }, [query, can, products, customers, orders])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[active]) {
        e.preventDefault()
        run(results[active])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, onClose])

  const run = (item) => {
    if (!item) return
    navigate(item.path)
    onClose()
  }

  let lastGroup = null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            type="button"
            aria-label="Close command palette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, products, customers, orders…"
                className="h-14 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
              <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-600">ESC</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-500">No matches for “{query}”</p>
              ) : (
                results.map((item, index) => {
                  const showGroup = item.group !== lastGroup
                  lastGroup = item.group
                  const Icon = item.icon
                  return (
                    <div key={item.id}>
                      {showGroup && (
                        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {item.group}
                        </p>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => run(item)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          active === index
                            ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          active === index ? 'bg-primary-100 text-primary-600 dark:bg-primary-800/50' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.label}</p>
                          {item.hint && <p className="truncate text-xs text-slate-400">{item.hint}</p>}
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 opacity-40" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span className="ml-auto">⌘K to toggle</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
