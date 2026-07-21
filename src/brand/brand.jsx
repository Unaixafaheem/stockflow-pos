export const BRAND = {
  name: 'StockFlow',
  tagline: 'POS System',
  product: 'StockFlow POS',
  description: 'Inventory and checkout software for modern retailers.',
  primaryHex: '#0f766e',
  primaryRgb: [15, 118, 110],
}

/** Shared mark used in app chrome, auth, landing, and receipts */
export function BrandMark({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.5C4 6.12 5.12 5 6.5 5H14l6 5.5L14 16H6.5C5.12 16 4 14.88 4 13.5V7.5Z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M3 9.5C3 8.12 4.12 7 5.5 7H13l5.5 4.5L13 16H5.5C4.12 16 3 14.88 3 13.5V9.5Z"
        fill="currentColor"
      />
      <circle cx="8" cy="11.5" r="1.25" fill="white" />
      <path d="M11 11.5h5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
