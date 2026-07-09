import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, ShoppingBag, TrendingUp, PackageX } from 'lucide-react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { formatDateTime } from '../../utils/formatters'

const typeConfig = {
  low_stock: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  inventory: { icon: PackageX, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400' },
  order: { icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
  sales: { icon: TrendingUp, color: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400' },
}

export default function NotificationDropdown({
  isOpen,
  onToggle,
  onClose,
  notifications,
  unreadCount,
  markAllAsRead,
  markAsRead,
  isRead,
}) {
  const ref = useRef(null)
  useClickOutside(ref, onClose, isOpen)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[min(60vh,400px)] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const config = typeConfig[notification.type] || typeConfig.order
                  const Icon = config.icon
                  const read = isRead(notification.id)

                  return (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3.5 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/50 ${
                        !read ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{notification.title}</p>
                          {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(notification.time)}</p>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500">No notifications</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
