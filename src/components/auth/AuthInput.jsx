export default function AuthInput({
  label,
  id,
  error,
  hint,
  className = '',
  ...props
}) {
  const inputId = id || props.name

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`input-base ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  )
}
