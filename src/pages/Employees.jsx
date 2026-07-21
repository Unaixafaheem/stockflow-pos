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
import { EMPLOYEE_ROLES, EMPLOYEE_STATUSES } from '../utils/helpers'
import { downloadCsv, employeesToCsvRows } from '../utils/csvExport'

const emptyEmployee = { name: '', role: 'Cashier', email: '', phone: '', status: 'Active' }

const statusVariant = { Active: 'success', 'On Leave': 'warning', Inactive: 'danger' }
const roleVariant = { Admin: 'danger', Manager: 'purple', Cashier: 'info', 'Inventory Staff': 'default' }

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyEmployee)

  const filtered = useMemo(() => {
    return employees.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
    )
  }, [employees, search])

  const openAdd = () => { setEditingId(null); setForm(emptyEmployee); setModalOpen(true) }
  const openEdit = (e) => { setEditingId(e.id); setForm({ name: e.name, role: e.role, email: e.email, phone: e.phone, status: e.status }); setModalOpen(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateEmployee(editingId, form)
        addToast('Employee updated successfully')
      } else {
        await addEmployee(form)
        addToast('Employee added successfully')
      }
      setModalOpen(false)
    } catch (err) {
      addToast(err.message || 'Failed to save employee', 'error')
    }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
          {row.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <span className="font-medium">{row.name}</span>
      </div>
    )},
    { key: 'role', label: 'Role', render: (row) => <Badge variant={roleVariant[row.role]}>{row.role}</Badge> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge> },
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
      <PageHeader title="Employees" description="Manage staff accounts, roles, and access levels.">
        <Button
          variant="secondary"
          icon={Download}
          onClick={() => {
            downloadCsv('stockflow-employees.csv', employeesToCsvRows(filtered))
            addToast('Employees exported to CSV')
          }}
        >
          Export CSV
        </Button>
        <Button icon={Plus} onClick={openAdd}>Add Employee</Button>
      </PageHeader>

      <Card>
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />
        </div>
        <Table columns={columns} data={filtered} emptyMessage="No employees found" />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="select-base">
                {EMPLOYEE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select-base">
                {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-base" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-base" required />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await deleteEmployee(deleteId)
            addToast('Employee deleted', 'warning')
          } catch (err) {
            addToast(err.message || 'Delete failed', 'error')
          } finally {
            setDeleteId(null)
          }
        }}
        title="Delete Employee"
        message="Are you sure you want to remove this employee?"
        confirmText="Delete"
      />
    </div>
  )
}
