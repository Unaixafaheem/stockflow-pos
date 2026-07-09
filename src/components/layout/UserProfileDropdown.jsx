import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, User, Settings, LogOut, Shield } from 'lucide-react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useToast } from '../../context/ToastContext'

const USER = {
  name: 'Unaiza Faheem',
  role: 'Admin',
  email: 'unaiza.faheem@stockflow.com',
}

export default function UserProfileDropdown({ isOpen, onToggle, onClose }) {
  const ref = useRef(null)
  const { addToast } = useToast()
  useClickOutside(ref, onClose, isOpen)

  const handleAction = (action) => {
    onClose()
    if (action === 'profile') addToast('Profile page — coming in a future update', 'info')
    if (action === 'settings') addToast('Settings panel — coming in a future update', 'info')
    if (action === 'logout') addToast('Logged out successfully', 'success')
  }

  return (
    <div className="relative ml-2 border-l border-slate-200 pl-3 dark:border-slate-700" ref={ref}>
      <button
        onClick={onToggle}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{USER.name}</p>
          <p className="text-xs text-slate-500">{USER.role}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 shadow-md shadow-primary-500/25 ring-2 ring-white dark:ring-slate-900">
          <User className="h-4 w-4 text-white" />
        </div>
        <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30"
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-primary-50/80 to-violet-50/50 px-4 py-4 dark:border-slate-800 dark:from-primary-900/20 dark:to-violet-900/10">
              <p className="font-semibold text-slate-900 dark:text-white">{USER.name}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                <p className="text-xs font-medium text-primary-600 dark:text-primary-400">Role: {USER.role}</p>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">{USER.email}</p>
            </div>

            <div className="p-1.5">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAction(item.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <item.icon className="h-4 w-4 text-slate-400" />
                  {item.label}
                </button>
              ))}
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                onClick={() => handleAction('logout')}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
