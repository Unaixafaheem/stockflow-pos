import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false, padding = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : {}}
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] dark:border-slate-800/80 dark:bg-slate-900 ${padding ? 'p-5 sm:p-6' : ''} ${hover ? 'hover:shadow-[var(--shadow-card-hover)] hover:border-slate-200 dark:hover:border-slate-700' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
