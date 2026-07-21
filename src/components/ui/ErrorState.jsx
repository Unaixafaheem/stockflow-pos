import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import Button from './Button'

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this section. Check your connection and try again.',
  onRetry,
  offline = false,
  className = '',
}) {
  const Icon = offline ? WifiOff : AlertTriangle

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-50/50 px-6 py-14 text-center dark:border-rose-900/40 dark:bg-rose-950/20 ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mb-5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      {onRetry && (
        <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </motion.div>
  )
}
