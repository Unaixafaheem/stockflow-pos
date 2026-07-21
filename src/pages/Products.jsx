import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { formatCurrency } from '../utils/formatters'
import { PRODUCT_CATEGORIES, getStockStatus } from '../utils/helpers'
import { downloadCsv, productsToCsvRows } from '../utils/csvExport'

const emptyProduct = {
  name: '',
  category: 'Beverages',
  sku: '',
  barcode: '',
  costPrice: '',
  sellingPrice: '',
  stockQuantity: '',
  lowStockThreshold: '',
  supplier: '',
}

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyProduct)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyProduct)
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      sku: product.sku,
      barcode: product.barcode,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      supplier: product.supplier,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      ...form,
      costPrice: parseFloat(form.costPrice),
      sellingPrice: parseFloat(form.sellingPrice),
      stockQuantity: parseInt(form.stockQuantity, 10),
      lowStockThreshold: parseInt(form.lowStockThreshold, 10),
    }
    try {
      if (editingId) {
        await updateProduct(editingId, data)
        addToast('Product updated successfully')
      } else {
        await addProduct(data)
        addToast('Product added successfully')
      }
      setModalOpen(false)
    } catch (err) {
      addToast(err.message || 'Failed to save product', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProduct(deleteId)
      addToast('Product deleted', 'warning')
    } catch (err) {
      addToast(err.message || 'Failed to delete product', 'error')
    } finally {
      setDeleteId(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Product', render: (row) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
        <p className="text-xs text-slate-400">{row.sku}</p>
      </div>
    )},
    { key: 'category', label: 'Category', render: (row) => <Badge variant="info">{row.category}</Badge> },
    { key: 'sellingPrice', label: 'Price', render: (row) => formatCurrency(row.sellingPrice) },
    { key: 'stockQuantity', label: 'Stock', render: (row) => {
      const status = getStockStatus(row.stockQuantity, row.lowStockThreshold)
      return (
        <div className="flex items-center gap-2">
          <span>{row.stockQuantity}</span>
          {status === 'low' && <Badge variant="warning">Low</Badge>}
          {status === 'out' && <Badge variant="danger">Out</Badge>}
        </div>
      )
    }},
    { key: 'supplier', label: 'Supplier' },
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
      <PageHeader title="Products" description="Manage your inventory and product catalog.">
        <Button
          variant="secondary"
          icon={Download}
          onClick={() => {
            downloadCsv('stockflow-products.csv', productsToCsvRows(filtered))
            addToast('Products exported to CSV')
          }}
        >
          Export CSV
        </Button>
        <Button icon={Plus} onClick={openAdd}>Add Product</Button>
      </PageHeader>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, SKU, or barcode..." className="flex-1" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select-base"
          >
            <option value="All">All Categories</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <Table columns={columns} data={filtered} emptyMessage="No products match your search" />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { key: 'name', label: 'Product Name', type: 'text', required: true, span: 2 },
            { key: 'category', label: 'Category', type: 'select', options: PRODUCT_CATEGORIES },
            { key: 'sku', label: 'SKU', type: 'text', required: true },
            { key: 'barcode', label: 'Barcode', type: 'text', required: true },
            { key: 'costPrice', label: 'Cost Price', type: 'number', step: '0.01', required: true },
            { key: 'sellingPrice', label: 'Selling Price', type: 'number', step: '0.01', required: true },
            { key: 'stockQuantity', label: 'Stock Quantity', type: 'number', required: true },
            { key: 'lowStockThreshold', label: 'Low Stock Threshold', type: 'number', required: true },
            { key: 'supplier', label: 'Supplier', type: 'text', required: true, span: 2 },
          ].map((field) => (
            <div key={field.key} className={field.span === 2 ? 'sm:col-span-2' : ''}>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="select-base"
                  required
                >
                  {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  step={field.step}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="input-base"
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Update Product' : 'Add Product'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  )
}
