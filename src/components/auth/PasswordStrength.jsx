function getStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-slate-200' }
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' }
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' }
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-primary-500' }
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
}

export default function PasswordStrength({ password }) {
  const { score, label, color } = getStrength(password)
  if (!password) return null

  return (
    <div className="mt-2">
      <div className="mb-1.5 flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${level <= score ? color : 'bg-slate-200 dark:bg-slate-700'}`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Password strength: <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </p>
    </div>
  )
}
