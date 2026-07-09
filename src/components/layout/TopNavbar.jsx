import { useState } from 'react'
import { Menu, Sun, Moon, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationDropdown from './NotificationDropdown'
import UserProfileDropdown from './UserProfileDropdown'

export default function TopNavbar({ onMenuClick }) {
  const { theme, toggleTheme, products, orders } = useApp()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const { notifications, unreadCount, markAllAsRead, markAsRead, isRead } = useNotifications(products, orders)

  const closeAll = () => {
    setNotificationsOpen(false)
    setProfileOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 shadow-sm md:flex dark:border-slate-700/80 dark:bg-slate-800/50">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search..."
            className="w-44 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none lg:w-60 dark:text-slate-200"
          />
          <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:inline dark:border-slate-600 dark:bg-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <NotificationDropdown
            isOpen={notificationsOpen}
            onToggle={() => { setProfileOpen(false); setNotificationsOpen((v) => !v) }}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            markAllAsRead={markAllAsRead}
            markAsRead={markAsRead}
            isRead={isRead}
          />

        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <UserProfileDropdown
          isOpen={profileOpen}
          onToggle={() => { setNotificationsOpen(false); setProfileOpen((v) => !v) }}
          onClose={closeAll}
        />
      </div>
    </header>
  )
}
