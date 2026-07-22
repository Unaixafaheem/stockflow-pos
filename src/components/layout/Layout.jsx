import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'
import CommandPalette from './CommandPalette'
import OfflineBanner from '../offline/OfflineBanner'
import OnboardingTour from '../onboarding/OnboardingTour'
import ErrorBoundary from '../ui/ErrorBoundary'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../auth/AuthContext'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const { refreshData, dataError, isOffline } = useApp()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-primary-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setCommandOpen(true)}
        />
        <OfflineBanner onSynced={refreshData} />
        {dataError && (
          <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="min-w-0 flex-1 truncate">
              {isOffline ? 'Offline — ' : ''}{dataError}
            </p>
            <button
              type="button"
              onClick={refreshData}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold dark:bg-slate-900/50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      {isAuthenticated && <OnboardingTour enabled />}
    </div>
  )
}
