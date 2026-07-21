import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import BrandLogo from '../brand/BrandLogo'
import { useApp } from '../../context/AppContext'

export default function AuthLayout({ children, title, subtitle }) {
  const { theme, toggleTheme } = useApp()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-primary-950/30">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-400/15 blur-3xl dark:bg-primary-600/10" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-700/10" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo to="/" size="md" />
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-md"
          >
            {(title || subtitle) && (
              <div className="mb-6 text-center">
                {title && (
                  <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </main>

        <footer className="px-4 py-5 text-center text-xs text-slate-400 sm:px-6">
          © {new Date().getFullYear()} StockFlow POS. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
