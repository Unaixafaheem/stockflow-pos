import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-primary-600 text-white shadow-md shadow-primary-600/25 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30',
  secondary: 'bg-white text-slate-700 border border-slate-200/80 shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700/80 dark:hover:bg-slate-700',
  danger: 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-600/25 hover:from-rose-700 hover:to-rose-800',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  success: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-800',
}

const sizes = {
  sm: 'px-3.5 py-2 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  icon: Icon,
  ...props
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </motion.button>
  )
}
