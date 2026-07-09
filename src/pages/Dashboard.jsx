import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
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
} from 'recharts'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import { formatCurrency, formatDateTime, formatNumber } from '../utils/formatters'
import { getStockStatus } from '../utils/helpers'

export default function Dashboard() {
  const { products, customers, orders } = useApp()

  const stats = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'Completed')
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
    const lowStockProducts = products.filter((p) => getStockStatus(p.stockQuantity, p.lowStockThreshold) !== 'ok')
    return { totalRevenue, lowStockProducts }
  }, [products, orders])

  const revenueChartData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.date)
        return orderDate.toDateString() === date.toDateString() && o.status === 'Completed'
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
      .filter((o) => o.status === 'Completed')
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
        <Badge variant={row.status === 'Completed' ? 'success' : row.status === 'Refunded' ? 'danger' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'date', label: 'Date', render: (row) => formatDateTime(row.date) },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back, Unaiza! Here's what's happening with your store today."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="primary" trend={12.5} trendLabel="vs last week" />
        <StatCard title="Total Products" value={formatNumber(products.length)} icon={Package} color="emerald" trend={3.2} trendLabel="new items" />
        <StatCard title="Total Customers" value={formatNumber(customers.filter((c) => c.id !== 'cust_7').length)} icon={Users} color="violet" trend={8.1} trendLabel="this month" />
        <StatCard title="Total Orders" value={formatNumber(orders.length)} icon={ShoppingBag} color="amber" trend={-2.4} trendLabel="vs last week" />
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
