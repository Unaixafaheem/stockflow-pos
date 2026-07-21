import { describe, it, expect } from 'vitest'
import { calculateTax, calculateTotal, getStockStatus, TAX_RATE, generateOrderId } from '../utils/helpers'
import { formatCurrency, formatNumber } from '../utils/formatters'
import { hasPermission, ROLE_PERMISSIONS } from '../auth/constants'

describe('helpers', () => {
  it('calculates 8% tax', () => {
    expect(calculateTax(100)).toBeCloseTo(8)
    expect(TAX_RATE).toBe(0.08)
  })

  it('calculates totals with discount', () => {
    const result = calculateTotal(100, 20)
    expect(result.discounted).toBe(80)
    expect(result.taxAmount).toBeCloseTo(6.4)
    expect(result.total).toBeCloseTo(86.4)
  })

  it('classifies stock status', () => {
    expect(getStockStatus(0, 10)).toBe('out')
    expect(getStockStatus(5, 10)).toBe('low')
    expect(getStockStatus(50, 10)).toBe('ok')
  })

  it('generates order ids with ORD prefix', () => {
    expect(generateOrderId()).toMatch(/^ORD-\d{6}$/)
  })
})

describe('formatters', () => {
  it('formats currency in USD', () => {
    expect(formatCurrency(12.5)).toContain('12.50')
    expect(formatCurrency(null)).toContain('0.00')
  })

  it('formats numbers with grouping', () => {
    expect(formatNumber(1200)).toMatch(/1,?200/)
  })
})

describe('RBAC permissions', () => {
  it('gives Admin wildcard access', () => {
    expect(hasPermission('Admin', 'audit')).toBe(true)
    expect(hasPermission('Admin', 'anything')).toBe(true)
  })

  it('restricts Cashier from products admin', () => {
    expect(hasPermission('Cashier', 'pos')).toBe(true)
    expect(hasPermission('Cashier', 'products')).toBe(false)
    expect(ROLE_PERMISSIONS.Cashier).toContain('refunds')
  })

  it('returns false for unknown roles', () => {
    expect(hasPermission('Guest', 'dashboard')).toBe(false)
    expect(hasPermission(undefined, 'dashboard')).toBe(false)
  })
})
