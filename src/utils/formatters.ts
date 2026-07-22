export const formatCurrency = (amount?: number | null): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount ?? 0)

function toValidDate(date: string | number | Date | null | undefined): Date | null {
  if (date == null || date === '') return null
  const d = date instanceof Date ? date : new Date(date)
  return Number.isNaN(d.getTime()) ? null : d
}

export const formatDate = (date?: string | number | Date | null): string => {
  const d = toValidDate(date)
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d)
}

export const formatDateTime = (date?: string | number | Date | null): string => {
  const d = toValidDate(date)
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export const formatNumber = (num?: number | null): string =>
  new Intl.NumberFormat('en-US').format(num ?? 0)
