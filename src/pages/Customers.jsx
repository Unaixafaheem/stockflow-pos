import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { formatCurrency, formatDate } from '../utils/formatters'

const emptyCustomer = { name: '', phone: '', email: '' }

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyCustomer)

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    )
  }, [customers, search])

  const openAdd = () => { setEditingId(null); setForm(emptyCustomer); setModalOpen(true) }
  const openEdit = (c) => { setEditingId(c.id); setForm({ name: c.name, phone: c.phone, email: c.email }); setModalOpen(true) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      updateCustomer(editingId, form)
      addToast('Customer updated successfully')
    } else {
      addCustomer(form)
      addToast('Customer added successfully')
    }
    setModalOpen(false)
  }

  const columns = [
    { key: 'name', label: 'Name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
          {row.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <span className="font-medium">{row.name}</span>
      </div>
    )},
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'totalPurchases', label: 'Total Purchases', render: (row) => formatCurrency(row.totalPurchases) },
    { key: 'lastPurchaseDate', label: 'Last Purchase', render: (row) => row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : '—' },
    { key: 'actions', label: 'Actions', render: (row) => row.id !== 'cust_7' ? (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => { setDeleteId(row.id); setConfirmOpen(true) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ) : <span className="text-xs text-slate-400">System</span> },
  ]

  return (
    <div>
      <PageHeader title="Customers" description="Manage your customer database and purchase history.">
        <Button icon={Plus} onClick={openAdd}>Add Customer</Button>
      </PageHeader>

      <Card>
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." />
        </div>
        <Table columns={columns} data={filtered} emptyMessage="No customers found" />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'phone', 'email'].map((field) => (
            <div key={field}>
              <label className="mb-1 block text-sm font-medium capitalize text-slate-700 dark:text-slate-300">{field}</label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="input-base"
                required
              />
            </div>
          ))}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { deleteCustomer(deleteId); addToast('Customer deleted', 'warning'); setDeleteId(null) }}
        title="Delete Customer"
        message="Are you sure you want to delete this customer?"
        confirmText="Delete"
      />
    </div>
  )
}
