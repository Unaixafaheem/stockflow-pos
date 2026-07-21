export const formatCurrency = (amount?: number | null): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount ?? 0)

export const formatDate = (date: string | number | Date): string =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))

export const formatDateTime = (date: string | number | Date): string =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

export const formatNumber = (num?: number | null): string =>
  new Intl.NumberFormat('en-US').format(num ?? 0)
