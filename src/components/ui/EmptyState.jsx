import { motion } from 'framer-motion'
import { PackageOpen } from 'lucide-react'
import Button from './Button'

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  description = 'When you add data, it will show up in this space.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-800/20 ${className}`}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </motion.div>
  )
}
