import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Banknote,
  CreditCard,
  Globe,
  Trophy,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { useAuth } from '../auth/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import { formatCurrency, formatDateTime, formatNumber } from '../utils/formatters'
import { getStockStatus } from '../utils/helpers'
import { reportsApi } from '../services/endpoints'

const PAYMENT_COLORS = { Cash: '#10b981', Card: '#6366f1', Online: '#f59e0b' }
const PAYMENT_ICONS = { Cash: Banknote, Card: CreditCard, Online: Globe }

export default function Dashboard() {
  const { products, customers, orders } = useApp()
  const { user } = useAuth()
  const [activity, setActivity] = useState(null)

  useEffect(() => {
    reportsApi.activity().then(setActivity).catch(() => setActivity(null))
  }, [orders])

  const stats = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'Completed' || o.status === 'Partially Refunded')
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
    const lowStockProducts = products.filter((p) => getStockStatus(p.stockQuantity, p.lowStockThreshold) !== 'ok')
    return { totalRevenue, lowStockProducts }
  }, [products, orders])

  const todayLocal = useMemo(() => {
    const today = new Date().toDateString()
    const todays = orders.filter((o) => new Date(o.date).toDateString() === today && o.status !== 'Refunded' && o.status !== 'Queued Offline')
    const byMethod = { Cash: 0, Card: 0, Online: 0 }
    todays.forEach((o) => {
      if (byMethod[o.paymentMethod] != null) byMethod[o.paymentMethod] += o.total
    })
    return {
      count: todays.length,
      total: todays.reduce((s, o) => s + o.total, 0),
      byMethod,
    }
  }, [orders])

  const paymentChartData = useMemo(() => {
    if (activity?.paymentBreakdown?.length) {
      return activity.paymentBreakdown.filter((p) => p.amount > 0)
    }
    return Object.entries(todayLocal.byMethod)
      .filter(([, amount]) => amount > 0)
      .map(([method, amount]) => ({ method, amount }))
  }, [activity, todayLocal])

  const cashiers = activity?.cashierPerformance || []

  const revenueChartData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.date)
        return orderDate.toDateString() === date.toDateString() && (o.status === 'Completed' || o.status === 'Partially Refunded')
      })
      days.push({
        name: dayStr,
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      })
    }
    return days
  }, [orders])

  const bestSellingData = useMemo(() => {
    const productSales = {}
    orders
      .filter((o) => o.status === 'Completed' || o.status === 'Partially Refunded')
      .forEach((order) => {
        order.items.forEach((item) => {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity
        })
      })
    return Object.entries(productSales)
      .map(([name, sold]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6)
  }, [orders])

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [orders]
  )

  const recentColumns = [
    { key: 'id', label: 'Order ID', render: (row) => <span className="font-mono text-xs">{row.id}</span> },
    { key: 'customerName', label: 'Customer' },
    { key: 'total', label: 'Total', render: (row) => formatCurrency(row.total) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'Completed' ? 'success' : row.status === 'Refunded' || row.status === 'Queued Offline' ? 'warning' : 'danger'}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'date', label: 'Date', render: (row) => formatDateTime(row.date) },
  ]

  const firstName = user?.firstName || 'there'

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}! Here's what's happening with your store today.`}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="primary" trend={12.5} trendLabel="vs last week" />
        <StatCard title="Total Products" value={formatNumber(products.length)} icon={Package} color="emerald" trend={3.2} trendLabel="new items" />
        <StatCard title="Total Customers" value={formatNumber(customers.filter((c) => c.name !== 'Walk-in Customer').length)} icon={Users} color="violet" trend={8.1} trendLabel="this month" />
        <StatCard title="Total Orders" value={formatNumber(orders.length)} icon={ShoppingBag} color="amber" trend={-2.4} trendLabel="vs last week" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Today’s payments</h3>
            <p className="text-xs text-slate-500">
              Cash vs card vs online · {formatCurrency(activity?.totalSales ?? todayLocal.total)}
            </p>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {['Cash', 'Card', 'Online'].map((method) => {
              const Icon = PAYMENT_ICONS[method]
              const amount = activity?.paymentBreakdown?.find((p) => p.method === method)?.amount
                ?? todayLocal.byMethod[method]
                ?? 0
              return (
                <div key={method} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                  <Icon className="mx-auto mb-1 h-4 w-4" style={{ color: PAYMENT_COLORS[method] }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{method}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(amount)}</p>
                </div>
              )
            })}
          </div>
          {paymentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={paymentChartData} dataKey="amount" nameKey="method" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {paymentChartData.map((entry) => (
                    <Cell key={entry.method} fill={PAYMENT_COLORS[entry.method] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No sales yet today</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <Trophy className="h-4 w-4 text-amber-500" />
                Cashier performance
              </h3>
              <p className="text-xs text-slate-500">Orders and revenue by cashier today</p>
            </div>
          </div>
          {cashiers.length > 0 ? (
            <div className="space-y-3">
              {cashiers.map((c, index) => {
                const max = cashiers[0]?.revenue || 1
                const pct = Math.round((c.revenue / max) * 100)
                return (
                  <div key={c.userId} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.role} · {c.orders} order{c.orders === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(c.revenue)}</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">No cashier sales recorded today yet</p>
          )}
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-xs text-slate-500">Last 7 days performance</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Best-Selling Products</h3>
            <p className="text-xs text-slate-500">Top performers by units sold</p>
          </div>
          {bestSellingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bestSellingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                />
                <Bar dataKey="sold" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">No sales data yet</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Sales</h3>
            <Link to="/orders" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Table columns={recentColumns} data={recentOrders} />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Low Stock Alerts</h3>
            <Badge variant="danger">{stats.lowStockProducts.length}</Badge>
          </div>
          {stats.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockProducts.slice(0, 6).map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5 transition-colors hover:bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/15 dark:hover:bg-amber-900/25"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-slate-500">
                      {product.stockQuantity === 0 ? 'Out of stock' : `${product.stockQuantity} left`}
                    </p>
                  </div>
                  <Badge variant={product.stockQuantity === 0 ? 'danger' : 'warning'}>
                    {product.stockQuantity === 0 ? 'Out' : 'Low'}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">All products are well stocked</p>
          )}
        </Card>
      </div>
    </div>
  )
}
