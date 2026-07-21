import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { couponsApi } from '../services/endpoints'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { formatCurrency } from '../utils/formatters'
import { PRODUCT_CATEGORIES } from '../utils/helpers'

const COUPON_TYPES = ['percent', 'fixed', 'category', 'bogo']

const emptyCoupon = {
  code: '',
  name: '',
  type: 'percent',
  value: 10,
  category: '',
  minPurchase: 0,
  maxUses: '',
  bogoBuyQty: 1,
  bogoGetQty: 1,
  active: true,
}

export default function Coupons() {
  const { addToast } = useToast()
  const [coupons, setCoupons] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyCoupon)

  const loadCoupons = useCallback(async () => {
    try {
      setCoupons(await couponsApi.list())
    } catch (err) {
      addToast(err.message || 'Failed to load coupons', 'error')
    }
  }, [addToast])

  useEffect(() => { loadCoupons() }, [loadCoupons])

  const filtered = useMemo(() => {
    return coupons.filter((c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [coupons, search])

  const openAdd = () => { setEditingId(null); setForm(emptyCoupon); setModalOpen(true) }
  const openEdit = (c) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      name: c.name,
      type: c.type,
      value: c.value,
      category: c.category || '',
      minPurchase: c.minPurchase || 0,
      maxUses: c.maxUses ?? '',
      bogoBuyQty: c.bogoBuyQty || 1,
      bogoGetQty: c.bogoGetQty || 1,
      active: c.active,
    })
    setModalOpen(true)
  }

  const formatValue = (row) => {
    if (row.type === 'percent' || row.type === 'category') return `${row.value}%`
    if (row.type === 'fixed') return formatCurrency(row.value)
    if (row.type === 'bogo') return `Buy ${row.bogoBuyQty} get ${row.bogoGetQty}`
    return row.value
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      maxUses: form.maxUses === '' ? null : Number(form.maxUses),
      minPurchase: Number(form.minPurchase),
      value: Number(form.value),
      bogoBuyQty: Number(form.bogoBuyQty),
      bogoGetQty: Number(form.bogoGetQty),
      category: form.type === 'category' ? form.category : null,
    }
    try {
      if (editingId) {
        await couponsApi.update(editingId, payload)
        addToast('Coupon updated successfully')
      } else {
        await couponsApi.create(payload)
        addToast('Coupon created successfully')
      }
      setModalOpen(false)
      await loadCoupons()
    } catch (err) {
      addToast(err.message || 'Failed to save coupon', 'error')
    }
  }

  const columns = [
    { key: 'code', label: 'Code', render: (row) => <span className="font-mono text-xs font-semibold text-primary-600">{row.code}</span> },
    { key: 'name', label: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'type', label: 'Type', render: (row) => <Badge variant="info">{row.type}</Badge> },
    { key: 'value', label: 'Value', render: (row) => formatValue(row) },
    { key: 'minPurchase', label: 'Min Purchase', render: (row) => formatCurrency(row.minPurchase) },
    { key: 'uses', label: 'Uses', render: (row) => `${row.usedCount}${row.maxUses != null ? ` / ${row.maxUses}` : ''}` },
    { key: 'active', label: 'Status', render: (row) => <Badge variant={row.active ? 'success' : 'danger'}>{row.active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => { setDeleteId(row.id); setConfirmOpen(true) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Coupons" description="Create and manage discount codes for POS checkout.">
        <Button icon={Plus} onClick={openAdd}>Add Coupon</Button>
      </PageHeader>

      <Card>
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search coupons..." />
        </div>
        <Table columns={columns} data={filtered} emptyMessage="No coupons found" />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Coupon' : 'Add Coupon'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="input-base font-mono"
                required
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select-base">
                {COUPON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {form.type === 'fixed' ? 'Amount ($)' : 'Value (%)'}
              </label>
              <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-base" required />
            </div>
            {form.type === 'category' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select-base" required>
                  <option value="">Select category</option>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {form.type === 'bogo' && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Buy Qty</label>
                  <input type="number" min="1" value={form.bogoBuyQty} onChange={(e) => setForm({ ...form, bogoBuyQty: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Get Qty (free)</label>
                  <input type="number" min="1" value={form.bogoGetQty} onChange={(e) => setForm({ ...form, bogoGetQty: e.target.value })} className="input-base" />
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Min Purchase</label>
              <input type="number" min="0" step="0.01" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Max Uses (blank = unlimited)</label>
              <input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="input-base" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-slate-300" />
            Active
          </label>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await couponsApi.remove(deleteId)
            addToast('Coupon deleted', 'warning')
            await loadCoupons()
          } catch (err) {
            addToast(err.message || 'Delete failed', 'error')
          } finally {
            setDeleteId(null)
          }
        }}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon?"
        confirmText="Delete"
      />
    </div>
  )
}
