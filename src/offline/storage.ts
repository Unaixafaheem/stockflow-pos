import type { AuthTokens, OfflineCache, OfflineQueueEntry, Product, Customer, Order, Store } from '../types'

const QUEUE_KEY = 'stockflow_offline_queue'
const CACHE_KEY = 'stockflow_offline_cache'
const ONBOARDING_KEY = 'stockflow_onboarding_done'

export function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}

export function markOnboardingDone(): void {
  localStorage.setItem(ONBOARDING_KEY, '1')
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY)
}

export function getOfflineQueue(): OfflineQueueEntry[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as OfflineQueueEntry[]
  } catch {
    return []
  }
}

export function enqueueOfflineCheckout(payload: Record<string, unknown>): OfflineQueueEntry {
  const queue = getOfflineQueue()
  const entry: OfflineQueueEntry = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'checkout',
    payload,
    createdAt: new Date().toISOString(),
  }
  queue.push(entry)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  return entry
}

export function setOfflineQueue(queue: OfflineQueueEntry[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function saveOfflineCache({
  products,
  customers,
  orders,
  stores,
}: {
  products?: Product[]
  customers?: Customer[]
  orders?: Order[]
  stores?: Store[]
}): void {
  const cache: OfflineCache = {
    products: products || [],
    customers: customers || [],
    orders: orders || [],
    stores: stores || [],
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

export function loadOfflineCache(): OfflineCache | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as OfflineCache | null
  } catch {
    return null
  }
}

export type { AuthTokens }
