import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Card from './Card'

const colorMap = {
  primary: {
    icon: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25',
    accent: 'from-primary-500/5 to-transparent',
  },
  emerald: {
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    accent: 'from-emerald-500/5 to-transparent',
  },
  amber: {
    icon: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25',
    accent: 'from-amber-500/5 to-transparent',
  },
  rose: {
    icon: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/25',
    accent: 'from-rose-500/5 to-transparent',
  },
  violet: {
    icon: 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25',
    accent: 'from-violet-500/5 to-transparent',
  },
}

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'primary' }) {
  const colors = colorMap[color] || colorMap.primary

  return (
    <Card hover className="relative overflow-hidden">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${colors.accent}`} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl"
          >
            {value}
          </motion.p>
          {trend !== undefined && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
                trend >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}
