export default function AuthDivider({ label = 'OR' }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}
