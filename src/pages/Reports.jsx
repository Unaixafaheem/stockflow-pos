import { useMemo } from 'react'
import { Download, TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import { formatCurrency, formatNumber } from '../utils/formatters'
import { getStockStatus } from '../utils/helpers'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4f46e5', '#7c3aed', '#6d28d9', '#5b21b6']

export default function Reports() {
  const { products, orders } = useApp()
  const { addToast } = useToast()

  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'Completed'), [orders])

  const reportStats = useMemo(() => {
    const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0)
    const avgOrder = completedOrders.length ? totalSales / completedOrders.length : 0
    const totalItemsSold = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)
    return { totalSales, avgOrder, totalItemsSold, orderCount: completedOrders.length }
  }, [completedOrders])

  const bestSelling = useMemo(() => {
    const sales = {}
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!sales[item.name]) sales[item.name] = { name: item.name, sold: 0, revenue: 0 }
        sales[item.name].sold += item.quantity
        sales[item.name].revenue += item.total
      })
    })
    return Object.values(sales).sort((a, b) => b.sold - a.sold).slice(0, 8)
  }, [completedOrders])

  const lowStock = useMemo(
    () => products.filter((p) => getStockStatus(p.stockQuantity, p.lowStockThreshold) !== 'ok'),
    [products]
  )

  const revenueByCategory = useMemo(() => {
    const categories = {}
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId)
        const cat = product?.category || 'Other'
        categories[cat] = (categories[cat] || 0) + item.total
      })
    })
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
  }, [completedOrders, products])

  const monthlySales = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toLocaleDateString('en-US', { month: 'short' })
      const monthOrders = completedOrders.filter((o) => {
        const orderDate = new Date(o.date)
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear()
      })
      months.push({
        month: monthStr,
        sales: monthOrders.reduce((sum, o) => sum + o.total, 0),
        orders: monthOrders.length,
      })
    }
    return months
  }, [completedOrders])

  const handleExport = () => {
    addToast('Report export started — download will begin shortly', 'info')
  }

  return (
    <div>
      <PageHeader title="Reports" description="Analytics and insights for your business performance.">
        <Button icon={Download} variant="secondary" onClick={handleExport}>Export Report</Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Sales" value={formatCurrency(reportStats.totalSales)} icon={DollarSign} color="primary" />
        <StatCard title="Orders Completed" value={formatNumber(reportStats.orderCount)} icon={TrendingUp} color="emerald" />
        <StatCard title="Avg. Order Value" value={formatCurrency(reportStats.avgOrder)} icon={Package} color="violet" />
        <StatCard title="Items Sold" value={formatNumber(reportStats.totalItemsSold)} icon={AlertTriangle} color="amber" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Monthly Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Revenue by Category</h3>
          {revenueByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={revenueByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">No category data available</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Best-Selling Products</h3>
          {bestSelling.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bestSelling}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" angle={-20} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                <Bar dataKey="sold" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">No sales data yet</p>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Low-Stock Products</h3>
            <Badge variant="danger">{lowStock.length}</Badge>
          </div>
          {lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.category} · Threshold: {product.lowStockThreshold}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600">{product.stockQuantity}</p>
                    <Badge variant={product.stockQuantity === 0 ? 'danger' : 'warning'}>
                      {product.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">All products are well stocked</p>
          )}
        </Card>
      </div>
    </div>
  )
}
