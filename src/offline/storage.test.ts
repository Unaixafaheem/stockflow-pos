import { describe, it, expect, beforeEach } from 'vitest'
import {
  enqueueOfflineCheckout,
  getOfflineQueue,
  setOfflineQueue,
  saveOfflineCache,
  loadOfflineCache,
  markOnboardingDone,
  isOnboardingDone,
  resetOnboarding,
} from '../offline/storage'

describe('offline storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('queues offline checkouts', () => {
    const entry = enqueueOfflineCheckout({ items: [{ productId: 'p1', quantity: 1 }] })
    expect(entry.type).toBe('checkout')
    expect(getOfflineQueue()).toHaveLength(1)
    setOfflineQueue([])
    expect(getOfflineQueue()).toHaveLength(0)
  })

  it('persists offline catalog cache', () => {
    saveOfflineCache({
      products: [{ id: '1', name: 'Milk', category: 'Dairy', sku: 'D1', barcode: '1', costPrice: 1, sellingPrice: 2, stockQuantity: 5, lowStockThreshold: 2, supplier: 'A' }],
      customers: [],
      orders: [],
      stores: [],
    })
    const cache = loadOfflineCache()
    expect(cache?.products[0]?.name).toBe('Milk')
    expect(cache?.savedAt).toBeTruthy()
  })

  it('tracks onboarding completion', () => {
    expect(isOnboardingDone()).toBe(false)
    markOnboardingDone()
    expect(isOnboardingDone()).toBe(true)
    resetOnboarding()
    expect(isOnboardingDone()).toBe(false)
  })
})
