import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Store as StoreIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { storesApi } from '../services/endpoints'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import { formatDate } from '../utils/formatters'

const emptyStore = { name: '', code: '', address: '', phone: '', status: 'Active' }
const statusVariant = { Active: 'success', Inactive: 'danger' }

export default function Stores() {
  const { currentStoreId, selectStore, refreshData } = useApp()
  const { addToast } = useToast()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyStore)
  const [switchingId, setSwitchingId] = useState(null)

  const loadStores = useCallback(async () => {
    setLoading(true)
    try {
      const data = await storesApi.list()
      setStores(data)
    } catch (err) {
      addToast(err.message || 'Failed to load stores', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadStores() }, [loadStores])

  const openAdd = () => { setEditingId(null); setForm(emptyStore); setModalOpen(true) }
  const openEdit = (s) => {
    setEditingId(s.id)
    setForm({ name: s.name, code: s.code, address: s.address || '', phone: s.phone || '', status: s.status })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await storesApi.update(editingId, form)
        addToast('Store updated successfully')
      } else {
        await storesApi.create(form)
        addToast('Store created successfully')
      }
      setModalOpen(false)
      await loadStores()
      await refreshData()
    } catch (err) {
      addToast(err.message || 'Failed to save store', 'error')
    }
  }

  const handleSwitch = async (id) => {
    setSwitchingId(id)
    try {
      await selectStore(id)
      addToast('Switched to store successfully')
      await loadStores()
    } catch (err) {
      addToast(err.message || 'Failed to switch store', 'error')
    } finally {
      setSwitchingId(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Store', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
          <StoreIcon className="h-4 w-4" />
        </div>
        <div>
          <span className="font-medium">{row.name}</span>
          {row.id === currentStoreId && (
            <Badge variant="info" className="ml-2">Current</Badge>
          )}
        </div>
      </div>
    )},
    { key: 'code', label: 'Code', render: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { key: 'address', label: 'Address', render: (row) => row.address || '—' },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={statusVariant[row.status] || 'default'}>{row.status}</Badge> },
    { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt) },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
          <Pencil className="h-4 w-4" />
        </button>
        {row.status === 'Active' && row.id !== currentStoreId && (
          <Button
            size="sm"
            variant="secondary"
            disabled={switchingId === row.id}
            onClick={() => handleSwitch(row.id)}
          >
            {switchingId === row.id ? 'Switching...' : 'Switch to store'}
          </Button>
        )}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Stores" description="Manage retail locations and switch your active store context.">
        <Button icon={Plus} onClick={openAdd}>Add Store</Button>
      </PageHeader>

      {currentStoreId && (
        <div className="mb-4">
          <Badge variant="info">
            Active store: {stores.find((s) => s.id === currentStoreId)?.name || currentStoreId}
          </Badge>
        </div>
      )}

      <Card>
        <Table columns={columns} data={stores} emptyMessage={loading ? 'Loading stores...' : 'No stores found'} />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Store' : 'Add Store'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'Name', required: true },
            { key: 'code', label: 'Code', required: true, disabled: !!editingId },
            { key: 'address', label: 'Address' },
            { key: 'phone', label: 'Phone' },
          ].map(({ key, label, required, disabled }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input-base"
                required={required}
                disabled={disabled}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select-base">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
