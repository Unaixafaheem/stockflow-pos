import { Link } from 'react-router-dom'
import { BrandMark, BRAND } from '../../brand/brand'

const sizes = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4', title: 'text-sm', sub: 'text-[9px]' },
  md: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5', title: 'text-base', sub: 'text-[10px]' },
  lg: { box: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6', title: 'text-lg', sub: 'text-[11px]' },
}

export default function BrandLogo({
  to = '/',
  size = 'md',
  showWordmark = true,
  inverted = false,
  className = '',
}) {
  const s = sizes[size] || sizes.md
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex items-center justify-center bg-primary-600 text-white shadow-lg shadow-primary-600/25 ${s.box}`}
      >
        <BrandMark className={s.icon} />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <p className={`font-bold tracking-tight ${s.title} ${inverted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {BRAND.name}
          </p>
          <p className={`font-semibold uppercase tracking-[0.16em] ${s.sub} ${inverted ? 'text-white/70' : 'text-slate-400'}`}>
            {BRAND.tagline}
          </p>
        </div>
      )}
    </div>
  )

  if (!to) return content
  return (
    <Link to={to} className="inline-flex shrink-0 transition-opacity hover:opacity-90">
      {content}
    </Link>
  )
}
