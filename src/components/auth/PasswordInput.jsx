import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({
  label,
  id,
  error,
  className = '',
  ...props
}) {
  const [visible, setVisible] = useState(false)
  const inputId = id || props.name

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`input-base pr-11 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
