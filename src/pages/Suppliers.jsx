import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, PackageCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { suppliersApi } from '../services/endpoints'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { formatCurrency, formatDateTime } from '../utils/formatters'

const emptySupplier = { name: '', email: '', phone: '', address: '', notes: '', status: 'Active' }
const statusVariant = { Active: 'success', Inactive: 'danger', Ordered: 'warning', Received: 'success', Draft: 'default' }

export default function Suppliers() {
  const { products, stores, currentStoreId } = useApp()
  const { addToast } = useToast()
  const [tab, setTab] = useState('suppliers')
  const [suppliers, setSuppliers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [search, setSearch] = useState('')
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [poModalOpen, setPoModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptySupplier)
  const [poForm, setPoForm] = useState({
    supplierId: '',
    storeId: currentStoreId || '',
    notes: '',
    items: [{ productId: '', name: '', quantity: 1, unitCost: 0 }],
  })
  const [receivingId, setReceivingId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [suppliersData, poData] = await Promise.all([
        suppliersApi.list(),
        suppliersApi.purchaseOrders(),
      ])
      setSuppliers(suppliersData)
      setPurchaseOrders(poData)
    } catch (err) {
      addToast(err.message || 'Failed to load supplier data', 'error')
    }
  }, [addToast])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (currentStoreId && !poForm.storeId) {
      setPoForm((prev) => ({ ...prev, storeId: currentStoreId }))
    }
  }, [currentStoreId, poForm.storeId])

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [suppliers, search])

  const openAddSupplier = () => { setEditingId(null); setForm(emptySupplier); setSupplierModalOpen(true) }
  const openEditSupplier = (s) => {
    setEditingId(s.id)
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', notes: s.notes || '', status: s.status })
    setSupplierModalOpen(true)
  }

  const handleSupplierSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await suppliersApi.update(editingId, form)
        addToast('Supplier updated successfully')
      } else {
        await suppliersApi.create(form)
        addToast('Supplier added successfully')
      }
      setSupplierModalOpen(false)
      await loadData()
    } catch (err) {
      addToast(err.message || 'Failed to save supplier', 'error')
    }
  }

  const addPoLine = () => {
    setPoForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', name: '', quantity: 1, unitCost: 0 }],
    }))
  }

  const updatePoLine = (index, field, value) => {
    setPoForm((prev) => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      if (field === 'productId' && value) {
        const product = products.find((p) => p.id === value)
        if (product) {
          items[index].name = product.name
          items[index].unitCost = product.costPrice || 0
        }
      }
      return { ...prev, items }
    })
  }

  const removePoLine = (index) => {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleCreatePo = async (e) => {
    e.preventDefault()
    const items = poForm.items.filter((i) => i.name && i.quantity > 0)
    if (!poForm.supplierId) {
      addToast('Select a supplier', 'error')
      return
    }
    if (!items.length) {
      addToast('Add at least one line item', 'error')
      return
    }
    try {
      await suppliersApi.createPurchaseOrder({
        supplierId: poForm.supplierId,
        storeId: poForm.storeId || currentStoreId,
        notes: poForm.notes || undefined,
        status: 'Ordered',
        items,
      })
      addToast('Purchase order created')
      setPoModalOpen(false)
      setPoForm({
        supplierId: '',
        storeId: currentStoreId || '',
        notes: '',
        items: [{ productId: '', name: '', quantity: 1, unitCost: 0 }],
      })
      await loadData()
    } catch (err) {
      addToast(err.message || 'Failed to create purchase order', 'error')
    }
  }

  const handleReceive = async (id) => {
    setReceivingId(id)
    try {
      await suppliersApi.receivePurchaseOrder(id)
      addToast('Purchase order received — stock updated')
      await loadData()
    } catch (err) {
      addToast(err.message || 'Failed to receive purchase order', 'error')
    } finally {
      setReceivingId(null)
    }
  }

  const supplierColumns = [
    { key: 'name', label: 'Supplier', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={statusVariant[row.status] || 'default'}>{row.status}</Badge> },
    { key: 'orders', label: 'POs', render: (row) => row._count?.purchaseOrders ?? 0 },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEditSupplier(row)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => { setDeleteId(row.id); setConfirmOpen(true) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )},
  ]

  const poColumns = [
    { key: 'poNumber', label: 'PO #', render: (row) => <span className="font-mono text-xs font-medium">{row.poNumber}</span> },
    { key: 'supplier', label: 'Supplier', render: (row) => row.supplier?.name || '—' },
    { key: 'store', label: 'Store', render: (row) => row.store?.name || '—' },
    { key: 'totalCost', label: 'Total', render: (row) => formatCurrency(row.totalCost) },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={statusVariant[row.status] || 'default'}>{row.status}</Badge> },
    { key: 'orderedAt', label: 'Ordered', render: (row) => row.orderedAt ? formatDateTime(row.orderedAt) : '—' },
    { key: 'actions', label: 'Actions', render: (row) => row.status === 'Ordered' ? (
      <Button
        size="sm"
        icon={PackageCheck}
        disabled={receivingId === row.id}
        onClick={() => handleReceive(row.id)}
      >
        {receivingId === row.id ? 'Receiving...' : 'Receive'}
      </Button>
    ) : null },
  ]

  return (
    <div>
      <PageHeader title="Suppliers" description="Manage vendors and purchase orders for inventory replenishment.">
        {tab === 'suppliers' ? (
          <Button icon={Plus} onClick={openAddSupplier}>Add Supplier</Button>
        ) : (
          <Button icon={Plus} onClick={() => setPoModalOpen(true)}>Create PO</Button>
        )}
      </PageHeader>

      <div className="mb-4 flex gap-2">
        {['suppliers', 'orders'].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {key === 'suppliers' ? 'Suppliers' : 'Purchase Orders'}
          </button>
        ))}
      </div>

      <Card>
        {tab === 'suppliers' ? (
          <>
            <div className="mb-4">
              <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers..." />
            </div>
            <Table columns={supplierColumns} data={filteredSuppliers} emptyMessage="No suppliers found" />
          </>
        ) : (
          <Table columns={poColumns} data={purchaseOrders} emptyMessage="No purchase orders found" />
        )}
      </Card>

      <Modal isOpen={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} title={editingId ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          {['name', 'email', 'phone', 'address'].map((field) => (
            <div key={field}>
              <label className="mb-1 block text-sm font-medium capitalize text-slate-700 dark:text-slate-300">{field}</label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="input-base"
                required={field === 'name'}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-base min-h-[80px]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select-base">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setSupplierModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={poModalOpen} onClose={() => setPoModalOpen(false)} title="Create Purchase Order" size="lg">
        <form onSubmit={handleCreatePo} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Supplier</label>
              <select value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })} className="select-base" required>
                <option value="">Select supplier</option>
                {suppliers.filter((s) => s.status === 'Active').map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Store</label>
              <select value={poForm.storeId} onChange={(e) => setPoForm({ ...poForm, storeId: e.target.value })} className="select-base">
                <option value="">Select store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <input type="text" value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} className="input-base" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Line Items</h4>
              <Button type="button" size="sm" variant="secondary" onClick={addPoLine}>Add line</Button>
            </div>
            <div className="space-y-3">
              {poForm.items.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-5">
                  <select
                    value={item.productId}
                    onChange={(e) => updatePoLine(index, 'productId', e.target.value)}
                    className="select-base sm:col-span-2"
                  >
                    <option value="">Custom item</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => updatePoLine(index, 'name', e.target.value)}
                    className="input-base"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updatePoLine(index, 'quantity', Number(e.target.value))}
                    className="input-base"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Unit cost"
                      value={item.unitCost}
                      onChange={(e) => updatePoLine(index, 'unitCost', Number(e.target.value))}
                      className="input-base flex-1"
                      required
                    />
                    {poForm.items.length > 1 && (
                      <button type="button" onClick={() => removePoLine(index)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setPoModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Create PO</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await suppliersApi.remove(deleteId)
            addToast('Supplier deleted', 'warning')
            await loadData()
          } catch (err) {
            addToast(err.message || 'Delete failed', 'error')
          } finally {
            setDeleteId(null)
          }
        }}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier?"
        confirmText="Delete"
      />
    </div>
  )
}
