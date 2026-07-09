const variants = {
  default: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700/60',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800/40',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800/40',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800/40',
  info: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60 dark:bg-primary-900/30 dark:text-primary-400 dark:ring-primary-800/40',
  purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800/40',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
