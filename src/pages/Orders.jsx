import { useState, useMemo } from 'react'
import { Eye, Download, FileText, RotateCcw, Printer } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../auth/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { ORDER_STATUSES } from '../utils/helpers'
import { downloadCsv, ordersToCsvRows } from '../utils/csvExport'
import { downloadOrderReceipt } from '../utils/pdfReceipt'
import { printThermalReceipt } from '../utils/printReceipt'
import { refundsApi } from '../services/endpoints'

const REFUND_REASONS = [
  'Damaged item',
  'Wrong item',
  'Customer changed mind',
  'Expired product',
  'Pricing error',
  'Other',
]

export default function Orders() {
  const { orders, refreshData } = useApp()
  const { can } = useAuth()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundReason, setRefundReason] = useState(REFUND_REASONS[0])
  const [restock, setRestock] = useState(true)
  const [refundQtys, setRefundQtys] = useState({})
  const [submitting, setSubmitting] = useState(false)

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
    if (status === 'Refunded' || status === 'Partially Refunded') return 'danger'
    return 'warning'
  }

  const openRefund = (order) => {
    const already = {}
    ;(order.refunds || []).forEach((r) => {
      ;(r.items || []).forEach((ri) => {
        if (ri.orderItemId) already[ri.orderItemId] = (already[ri.orderItemId] || 0) + ri.quantity
      })
    })
    const qtys = {}
    order.items.forEach((item) => {
      const remaining = item.quantity - (already[item.id] || 0)
      qtys[item.id] = remaining > 0 ? remaining : 0
    })
    setRefundQtys(qtys)
    setRefundReason(REFUND_REASONS[0])
    setRestock(true)
    setSelectedOrder(order)
    setRefundOpen(true)
  }

  const submitRefund = async () => {
    if (!selectedOrder) return
    const items = Object.entries(refundQtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity: Number(quantity) }))

    if (!items.length) {
      addToast('Select at least one item quantity to refund', 'warning')
      return
    }

    setSubmitting(true)
    try {
      await refundsApi.create({
        orderId: selectedOrder.dbId || selectedOrder.id,
        reason: refundReason,
        restock,
        items,
      })
      addToast('Refund processed successfully')
      setRefundOpen(false)
      setSelectedOrder(null)
      await refreshData()
    } catch (err) {
      addToast(err.message || 'Refund failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'id', label: 'Order ID', render: (row) => <span className="font-mono text-xs font-medium">{row.id}</span> },
    { key: 'date', label: 'Date / Time', render: (row) => formatDateTime(row.date) },
    { key: 'storeName', label: 'Store', render: (row) => row.storeName || '—' },
    { key: 'customerName', label: 'Customer' },
    { key: 'items', label: 'Items', render: (row) => `${row.items.length} item${row.items.length !== 1 ? 's' : ''}` },
    { key: 'total', label: 'Total', render: (row) => <span className="font-medium">{formatCurrency(row.total)}</span> },
    { key: 'paymentMethod', label: 'Payment', render: (row) => <Badge variant="info">{row.paymentMethod}</Badge> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge> },
    { key: 'actions', label: '', render: (row) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setSelectedOrder(row)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800"
        >
          <Eye className="h-4 w-4" />
        </button>
        {can('refunds') && row.status !== 'Refunded' && (
          <button
            onClick={() => openRefund(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
            title="Refund"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Orders / Sales" description="View sales, process partial refunds, and restock returned items.">
        <Button
          variant="secondary"
          icon={Download}
          onClick={() => {
            downloadCsv('stockflow-orders.csv', ordersToCsvRows(filtered))
            addToast('Orders exported to CSV')
          }}
        >
          Export CSV
        </Button>
      </PageHeader>

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
            <option value="Partially Refunded">Partially Refunded</option>
          </select>
        </div>
        <Table columns={columns} data={filtered} emptyMessage="No orders found" />
      </Card>

      <Modal isOpen={!!selectedOrder && !refundOpen} onClose={() => setSelectedOrder(null)} title="Order Details" size="lg">
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
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id || item.name}>
                      <td className="px-4 py-2.5">{item.name}</td>
                      <td className="px-4 py-2.5 text-right">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(selectedOrder.refunds || []).length > 0 && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-900/10">
                <p className="mb-2 text-sm font-semibold text-rose-700 dark:text-rose-400">Refunds</p>
                {selectedOrder.refunds.map((r) => (
                  <p key={r.id} className="text-xs text-slate-600 dark:text-slate-300">
                    {r.refundNumber}: −{formatCurrency(r.amount)} · {r.reason}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
              {selectedOrder.discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Discount</span><span>−{formatCurrency(selectedOrder.discount)}</span></div>}
              {selectedOrder.couponDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Coupon ({selectedOrder.couponCode})</span><span>−{formatCurrency(selectedOrder.couponDiscount)}</span></div>}
              {selectedOrder.loyaltyDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Loyalty</span><span>−{formatCurrency(selectedOrder.loyaltyDiscount)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-slate-500">Tax</span><span>{formatCurrency(selectedOrder.tax)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary-600">{formatCurrency(selectedOrder.total)}</span></div>
              <Badge variant={statusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  icon={Printer}
                  onClick={() => {
                    printThermalReceipt(selectedOrder, { storeName: selectedOrder.storeName || 'StockFlow POS' })
                    addToast('Opening print dialog')
                  }}
                >
                  Print Receipt
                </Button>
                <Button
                  variant="secondary"
                  icon={FileText}
                  onClick={() => {
                    downloadOrderReceipt(selectedOrder)
                    addToast('Receipt PDF downloaded')
                  }}
                >
                  Download PDF Receipt
                </Button>
                {can('refunds') && selectedOrder.status !== 'Refunded' && (
                  <Button variant="secondary" icon={RotateCcw} onClick={() => openRefund(selectedOrder)}>
                    Process Refund
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={refundOpen} onClose={() => setRefundOpen(false)} title="Process Refund" size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Order {selectedOrder.id} · Partial refunds supported</p>
            <div className="space-y-3">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(item.price)} · ordered {item.quantity}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={refundQtys[item.id] ?? 0}
                    onChange={(e) => setRefundQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Refund reason</label>
              <select value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="select-base">
                {REFUND_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
              Restock returned items to inventory
            </label>
            <Button className="w-full" onClick={submitRefund} disabled={submitting}>
              {submitting ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
