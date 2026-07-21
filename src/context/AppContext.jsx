import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { THEME_KEY } from '../data/sampleData'
import { useAuth } from '../auth/AuthContext'
import {
  productsApi,
  customersApi,
  employeesApi,
  ordersApi,
  storesApi,
} from '../services/endpoints'
import { saveOfflineCache, loadOfflineCache, enqueueOfflineCheckout } from '../offline/storage'
import { calculateTax } from '../utils/helpers'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { isAuthenticated, isLoading: authLoading, can, user, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [orders, setOrders] = useState([])
  const [stores, setStores] = useState([])
  const [dataError, setDataError] = useState(null)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)

  const currentStoreId = user?.currentStoreId || null

  useEffect(() => {
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([])
      setCustomers([])
      setEmployees([])
      setOrders([])
      setStores([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setDataError(null)
    try {
      const storeParams = currentStoreId ? { storeId: currentStoreId } : {}
      const [productsData, customersData, ordersData, storesData] = await Promise.all([
        productsApi.list(storeParams),
        customersApi.list(),
        ordersApi.list(),
        storesApi.list().catch(() => []),
      ])
      setProducts(productsData)
      setCustomers(customersData)
      setOrders(ordersData)
      setStores(storesData)
      saveOfflineCache({
        products: productsData,
        customers: customersData,
        orders: ordersData,
        stores: storesData,
      })

      if (can('employees')) {
        try {
          setEmployees(await employeesApi.list())
        } catch {
          setEmployees([])
        }
      } else {
        setEmployees([])
      }
    } catch (err) {
      console.error(err)
      const cached = loadOfflineCache()
      if (cached) {
        setProducts(cached.products || [])
        setCustomers(cached.customers || [])
        setOrders(cached.orders || [])
        setStores(cached.stores || [])
        setDataError('Showing cached data (offline)')
      } else {
        setDataError(err.message || 'Failed to load data from API')
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, can, currentStoreId])

  useEffect(() => {
    if (authLoading) return
    refreshData()
  }, [authLoading, isAuthenticated, refreshData])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const selectStore = useCallback(async (storeId) => {
    if (!navigator.onLine) {
      throw new Error('Store switch requires an online connection')
    }
    await storesApi.select(storeId)
    if (refreshUser) await refreshUser()
    const productsData = await productsApi.list({ storeId })
    setProducts(productsData)
  }, [refreshUser])

  const addProduct = useCallback(async (product) => {
    const created = await productsApi.create(product)
    setProducts((prev) => [...prev, created])
    return created
  }, [])

  const updateProduct = useCallback(async (id, updates) => {
    const updated = await productsApi.update(id, updates)
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }, [])

  const deleteProduct = useCallback(async (id) => {
    await productsApi.remove(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addCustomer = useCallback(async (customer) => {
    const created = await customersApi.create(customer)
    setCustomers((prev) => [...prev, created])
    return created
  }, [])

  const updateCustomer = useCallback(async (id, updates) => {
    const updated = await customersApi.update(id, updates)
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }, [])

  const deleteCustomer = useCallback(async (id) => {
    await customersApi.remove(id)
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addEmployee = useCallback(async (employee) => {
    const created = await employeesApi.create(employee)
    setEmployees((prev) => [...prev, created])
    return created
  }, [])

  const updateEmployee = useCallback(async (id, updates) => {
    const updated = await employeesApi.update(id, updates)
    setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }, [])

  const deleteEmployee = useCallback(async (id) => {
    await employeesApi.remove(id)
    setEmployees((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const completeCheckout = useCallback(async ({
    items,
    customerId,
    customerName,
    discount,
    paymentMethod,
    couponCode,
    loyaltyPointsToRedeem,
    storeId,
  }) => {
    const payload = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customerId,
      customerName,
      discount,
      paymentMethod,
      couponCode: couponCode || undefined,
      loyaltyPointsToRedeem: loyaltyPointsToRedeem || 0,
      storeId: storeId || currentStoreId || undefined,
    }

    if (!navigator.onLine) {
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const disc = Number(discount) || 0
      const tax = calculateTax(Math.max(0, subtotal - disc))
      const total = Math.max(0, subtotal - disc) + tax
      const offlineOrder = {
        id: `OFF-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customerName: customerName || 'Walk-in Customer',
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.price * i.quantity,
        })),
        subtotal,
        discount: disc,
        tax,
        total,
        paymentMethod,
        status: 'Queued Offline',
        offline: true,
      }
      enqueueOfflineCheckout(payload)
      window.dispatchEvent(new Event('stockflow-offline-queue'))
      setOrders((prev) => [offlineOrder, ...prev])
      setProducts((prev) => prev.map((p) => {
        const line = items.find((i) => i.productId === p.id)
        if (!line) return p
        return { ...p, stockQuantity: Math.max(0, p.stockQuantity - line.quantity) }
      }))
      return offlineOrder
    }

    const order = await ordersApi.checkout(payload)

    const storeParams = currentStoreId ? { storeId: currentStoreId } : {}
    const [productsData, customersData, ordersData] = await Promise.all([
      productsApi.list(storeParams),
      customersApi.list(),
      ordersApi.list(),
    ])
    setProducts(productsData)
    setCustomers(customersData)
    setOrders(ordersData)
    saveOfflineCache({ products: productsData, customers: customersData, orders: ordersData, stores })
    return order
  }, [currentStoreId, stores])

  const findProductByBarcode = useCallback(async (barcode) => {
    if (!navigator.onLine) {
      const local = products.find((p) => p.barcode === barcode)
      if (!local) throw new Error('Product not found in offline cache')
      return local
    }
    return productsApi.getByBarcode(barcode, currentStoreId ? { storeId: currentStoreId } : {})
  }, [currentStoreId, products])

  const value = {
    isLoading,
    dataError,
    isOffline,
    theme,
    toggleTheme,
    products,
    customers,
    employees,
    orders,
    stores,
    currentStoreId,
    refreshData,
    selectStore,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    completeCheckout,
    findProductByBarcode,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
