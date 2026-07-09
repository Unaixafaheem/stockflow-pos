import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const styles = {
  success: 'border-emerald-200/80 bg-emerald-50/95 text-emerald-800 shadow-emerald-500/10 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-300',
  error: 'border-rose-200/80 bg-rose-50/95 text-rose-800 shadow-rose-500/10 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-300',
  warning: 'border-amber-200/80 bg-amber-50/95 text-amber-800 shadow-amber-500/10 dark:border-amber-800/60 dark:bg-amber-900/40 dark:text-amber-300',
  info: 'border-primary-200/80 bg-primary-50/95 text-primary-800 shadow-primary-500/10 dark:border-primary-800/60 dark:bg-primary-900/40 dark:text-primary-300',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || icons.info
        return (
          <div
            key={toast.id}
            className={`animate-slide-in-right flex min-w-[280px] max-w-sm items-center gap-3 rounded-xl border px-4 py-3.5 shadow-lg backdrop-blur-sm ${styles[toast.type]}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-lg p-1 opacity-60 transition-opacity hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
