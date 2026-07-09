import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  UserCog,
  BarChart3,
  Boxes,
  X,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/pos', icon: ShoppingCart, label: 'POS / Checkout' },
  { to: '/orders', icon: ClipboardList, label: 'Orders / Sales' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/employees', icon: UserCog, label: 'Employees' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200/80 bg-white shadow-xl shadow-slate-200/20 transition-transform duration-300 ease-out dark:border-slate-800/80 dark:bg-slate-900 dark:shadow-black/20 lg:static lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 shadow-lg shadow-primary-500/30">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">StockFlow</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">POS System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden dark:hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Main Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-50/50 text-primary-700 shadow-sm shadow-primary-500/10 dark:from-primary-900/40 dark:to-primary-900/20 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary-600"
                    />
                  )}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-800/50 dark:text-primary-400'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
                  }`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50/80 to-violet-50/50 p-4 dark:border-primary-900/50 dark:from-primary-900/20 dark:to-violet-900/10">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">Quick Tip</p>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              Use POS / Checkout for fast sales processing and real-time stock updates.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
