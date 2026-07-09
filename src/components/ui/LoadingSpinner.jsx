import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ fullScreen = false, message = 'Loading...' }) {
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-xl" />
        <Loader2 className="relative h-10 w-10 animate-spin text-primary-600" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-20">{content}</div>
}
