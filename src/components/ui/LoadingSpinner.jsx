import { motion } from 'framer-motion'
import BrandLogo from '../brand/BrandLogo'

export default function LoadingSpinner({ fullScreen = false, message = 'Loading...' }) {
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5"
    >
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-soft rounded-2xl bg-primary-500/20 blur-xl" />
        <BrandLogo to={null} showWordmark={false} size="lg" />
      </div>
      <div className="h-1 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <motion.div
          className="h-full w-1/2 rounded-full bg-primary-600"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-primary-950/20">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-20">{content}</div>
}
