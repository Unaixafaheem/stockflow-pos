import { motion } from 'framer-motion'

export default function AuthCard({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8 dark:border-slate-800/80 dark:bg-slate-900 ${className}`}
    >
      {children}
    </motion.div>
  )
}
