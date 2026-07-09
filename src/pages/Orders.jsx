import { useState, useMemo } from 'react'
import { Eye } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { ORDER_STATUSES } from '../utils/helpers'

export default function Orders() {
  const { orders } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const filtered = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((o) => {
        const matchesSearch =
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'All' || o.status === statusFilter
        return matchesSearch && matchesStatus
      })
  }, [orders, search, statusFilter])

  const statusVariant = (status) => {
    if (status === 'Completed') return 'success'
    if (status === 'Refunded') return 'danger'
    return 'warning'
  }

  const columns = [
    { key: 'id', label: 'Order ID', render: (row) => <span className="font-mono text-xs font-medium">{row.id}</span> },
    { key: 'date', label: 'Date / Time', render: (row) => formatDateTime(row.date) },
    { key: 'customerName', label: 'Customer' },
    { key: 'items', label: 'Items', render: (row) => `${row.items.length} item${row.items.length !== 1 ? 's' : ''}` },
    { key: 'total', label: 'Total', render: (row) => <span className="font-medium">{formatCurrency(row.total)}</span> },
    { key: 'paymentMethod', label: 'Payment', render: (row) => <Badge variant="info">{row.paymentMethod}</Badge> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge> },
    { key: 'actions', label: '', render: (row) => (
      <button
        onClick={() => setSelectedOrder(row)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800"
      >
        <Eye className="h-4 w-4" />
      </button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Orders / Sales" description="View and manage all completed sales transactions." />

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by order ID or customer..." className="flex-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-base"
          >
            <option value="All">All Statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Table columns={columns} data={filtered} emptyMessage="No orders found" />
      </Card>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" size="lg">
        {selectedOrder && (
          <div>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Order ID', value: selectedOrder.id },
                { label: 'Customer', value: selectedOrder.customerName },
                { label: 'Date', value: formatDateTime(selectedOrder.date) },
                { label: 'Payment', value: selectedOrder.paymentMethod },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Order Items</h4>
            <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5">{item.name}</td>
                      <td className="px-4 py-2.5 text-right">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
              {selectedOrder.discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Discount</span><span>-{formatCurrency(selectedOrder.discount)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-slate-500">Tax</span><span>{formatCurrency(selectedOrder.tax)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary-600">{formatCurrency(selectedOrder.total)}</span></div>
              <Badge variant={statusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
