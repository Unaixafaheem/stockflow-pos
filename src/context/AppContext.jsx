import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getInitialData, STORAGE_KEY, THEME_KEY } from '../data/sampleData'
import { generateId, generateOrderId, calculateTax } from '../utils/helpers'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setProducts(data.products ?? [])
        setCustomers(data.customers ?? [])
        setEmployees(data.employees ?? [])
        setOrders(data.orders ?? [])
      } catch {
        const initial = getInitialData()
        setProducts(initial.products)
        setCustomers(initial.customers)
        setEmployees(initial.employees)
        setOrders(initial.orders)
      }
    } else {
      const initial = getInitialData()
      setProducts(initial.products)
      setCustomers(initial.customers)
      setEmployees(initial.employees)
      setOrders(initial.orders)
    }
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, customers, employees, orders }))
    }
  }, [products, customers, employees, orders, isLoading])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const addProduct = useCallback((product) => {
    setProducts((prev) => [...prev, { ...product, id: generateId('prod') }])
  }, [])

  const updateProduct = useCallback((id, updates) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const deleteProduct = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addCustomer = useCallback((customer) => {
    setCustomers((prev) => [...prev, { ...customer, id: generateId('cust'), totalPurchases: 0, lastPurchaseDate: null }])
  }, [])

  const updateCustomer = useCallback((id, updates) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }, [])

  const deleteCustomer = useCallback((id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addEmployee = useCallback((employee) => {
    setEmployees((prev) => [...prev, { ...employee, id: generateId('emp') }])
  }, [])

  const updateEmployee = useCallback((id, updates) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }, [])

  const deleteEmployee = useCallback((id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const completeCheckout = useCallback(({ items, customerId, customerName, discount, paymentMethod }) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discounted = Math.max(0, subtotal - discount)
    const tax = calculateTax(discounted)
    const total = discounted + tax

    const order = {
      id: generateOrderId(),
      date: new Date().toISOString(),
      customerId,
      customerName,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      status: 'Completed',
    }

    setOrders((prev) => [order, ...prev])

    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = items.find((i) => i.productId === p.id)
        if (cartItem) {
          return { ...p, stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity) }
        }
        return p
      })
    )

    if (customerId && customerId !== 'walk-in') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, totalPurchases: (c.totalPurchases || 0) + total, lastPurchaseDate: order.date }
            : c
        )
      )
    }

    return order
  }, [])

  const resetData = useCallback(() => {
    const initial = getInitialData()
    setProducts(initial.products)
    setCustomers(initial.customers)
    setEmployees(initial.employees)
    setOrders(initial.orders)
  }, [])

  const value = {
    isLoading,
    theme,
    toggleTheme,
    products,
    customers,
    employees,
    orders,
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
    resetData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
