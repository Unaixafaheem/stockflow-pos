import { useState, useMemo, useCallback, useEffect } from 'react'
import { formatCurrency } from '../utils/formatters'
import { getStockStatus } from '../utils/helpers'

const READ_KEY = 'stockflow_notifications_read'

export function useNotifications(products, orders) {
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify(readIds))
  }, [readIds])

  const notifications = useMemo(() => {
    const items = []

    products
      .filter((p) => getStockStatus(p.stockQuantity, p.lowStockThreshold) === 'low')
      .slice(0, 4)
      .forEach((p) => {
        items.push({
          id: `low-stock-${p.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${p.name} is running low — only ${p.stockQuantity} units left.`,
          time: new Date().toISOString(),
        })
      })

    products
      .filter((p) => p.stockQuantity === 0)
      .slice(0, 3)
      .forEach((p) => {
        items.push({
          id: `inventory-${p.id}`,
          type: 'inventory',
          title: 'Inventory Warning',
          message: `${p.name} is out of stock. Restock required.`,
          time: new Date().toISOString(),
        })
      })

    const completedOrders = [...orders]
      .filter((o) => o.status === 'Completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)

    completedOrders.forEach((order) => {
      items.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'New Order Completed',
        message: `${order.customerName} placed order ${order.id} for ${formatCurrency(order.total)}.`,
        time: order.date,
      })
    })

    const today = new Date().toDateString()
    const todayOrders = orders.filter(
      (o) => new Date(o.date).toDateString() === today && o.status === 'Completed'
    )
    const todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0)

    items.push({
      id: `daily-sales-${today}`,
      type: 'sales',
      title: 'Daily Sales Summary',
      message: `${todayOrders.length} order${todayOrders.length !== 1 ? 's' : ''} today — total revenue ${formatCurrency(todayTotal)}.`,
      time: new Date().toISOString(),
    })

    return items.sort((a, b) => new Date(b.time) - new Date(a.time))
  }, [products, orders])

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  const markAllAsRead = useCallback(() => {
    setReadIds(notifications.map((n) => n.id))
  }, [notifications])

  const markAsRead = useCallback((id) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const isRead = useCallback((id) => readIds.includes(id), [readIds])

  return { notifications, unreadCount, markAllAsRead, markAsRead, isRead }
}
