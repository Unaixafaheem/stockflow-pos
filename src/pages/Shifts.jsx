import { useState, useEffect, useCallback } from 'react'
import { Clock, Play, Square } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { shiftsApi } from '../services/endpoints'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export default function Shifts() {
  const { currentStoreId, stores } = useApp()
  const { addToast } = useToast()
  const [currentShift, setCurrentShift] = useState(null)
  const [history, setHistory] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [openForm, setOpenForm] = useState({ openingCash: 0, notes: '' })
  const [closeForm, setCloseForm] = useState({ closingCash: 0, notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadShifts = useCallback(async () => {
    try {
      const [current, list] = await Promise.all([
        shiftsApi.current(),
        shiftsApi.list(),
      ])
      setCurrentShift(current)
      setHistory(list)
    } catch (err) {
      addToast(err.message || 'Failed to load shifts', 'error')
    }
  }, [addToast])

  useEffect(() => { loadShifts() }, [loadShifts])

  const expectedCash = currentShift
    ? (currentShift.openingCash + currentShift.cashSales - currentShift.refundTotal)
    : 0

  const handleOpenShift = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await shiftsApi.open({
        openingCash: Number(openForm.openingCash),
        notes: openForm.notes || undefined,
        storeId: currentStoreId || undefined,
      })
      addToast('Shift opened successfully')
      setOpenModal(false)
      setOpenForm({ openingCash: 0, notes: '' })
      await loadShifts()
    } catch (err) {
      addToast(err.message || 'Failed to open shift', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseShift = async (e) => {
    e.preventDefault()
    if (!currentShift) return
    setSubmitting(true)
    try {
      const result = await shiftsApi.close(currentShift.id, {
        closingCash: Number(closeForm.closingCash),
        notes: closeForm.notes || undefined,
      })
      const variance = result.variance ?? (Number(closeForm.closingCash) - expectedCash)
      addToast(`Shift closed. Variance: ${formatCurrency(variance)}`)
      setCloseModal(false)
      setCloseForm({ closingCash: 0, notes: '' })
      await loadShifts()
    } catch (err) {
      addToast(err.message || 'Failed to close shift', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const closeVariance = Number(closeForm.closingCash) - expectedCash

  const historyColumns = [
    { key: 'openedAt', label: 'Opened', render: (row) => formatDateTime(row.openedAt) },
    { key: 'closedAt', label: 'Closed', render: (row) => row.closedAt ? formatDateTime(row.closedAt) : '—' },
    { key: 'store', label: 'Store', render: (row) => row.store?.name || '—' },
    { key: 'user', label: 'Cashier', render: (row) => row.user ? `${row.user.firstName} ${row.user.lastName}` : '—' },
    { key: 'openingCash', label: 'Opening', render: (row) => formatCurrency(row.openingCash) },
    { key: 'expectedCash', label: 'Expected', render: (row) => row.expectedCash != null ? formatCurrency(row.expectedCash) : '—' },
    { key: 'closingCash', label: 'Counted', render: (row) => row.closingCash != null ? formatCurrency(row.closingCash) : '—' },
    { key: 'status', label: 'Status', render: (row) => (
      <Badge variant={row.status === 'Open' ? 'warning' : 'success'}>{row.status}</Badge>
    )},
  ]

  return (
    <div>
      <PageHeader title="Shifts" description="Open and close cashier shifts with cash reconciliation.">
        {!currentShift ? (
          <Button icon={Play} onClick={() => setOpenModal(true)}>Open Shift</Button>
        ) : (
          <Button icon={Square} variant="secondary" onClick={() => {
            setCloseForm({ closingCash: expectedCash, notes: '' })
            setCloseModal(true)
          }}>
            Close Shift
          </Button>
        )}
      </PageHeader>

      <Card className="mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Current Shift</h3>
            {currentShift ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge variant="warning">Open</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Store</p>
                  <p className="text-sm font-medium">{currentShift.store?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Opened</p>
                  <p className="text-sm font-medium">{formatDateTime(currentShift.openedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Opening Cash</p>
                  <p className="text-sm font-medium">{formatCurrency(currentShift.openingCash)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cash Sales</p>
                  <p className="text-sm font-medium">{formatCurrency(currentShift.cashSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Refunds</p>
                  <p className="text-sm font-medium">{formatCurrency(currentShift.refundTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expected Cash</p>
                  <p className="text-sm font-bold text-primary-600">{formatCurrency(expectedCash)}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No open shift. Open a shift before processing cash sales.</p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Shift History</h3>
        <Table columns={historyColumns} data={history} emptyMessage="No shift history" />
      </Card>

      <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="Open Shift">
        <form onSubmit={handleOpenShift} className="space-y-4">
          {currentStoreId && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Store: {stores.find((s) => s.id === currentStoreId)?.name || currentStoreId}
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Opening Cash</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={openForm.openingCash}
              onChange={(e) => setOpenForm({ ...openForm, openingCash: e.target.value })}
              className="input-base"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</label>
            <textarea value={openForm.notes} onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })} className="input-base min-h-[80px]" />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? 'Opening...' : 'Open Shift'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={closeModal} onClose={() => setCloseModal(false)} title="Close Shift">
        <form onSubmit={handleCloseShift} className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Expected cash</span>
              <span className="font-semibold">{formatCurrency(expectedCash)}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Counted Closing Cash</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={closeForm.closingCash}
              onChange={(e) => setCloseForm({ ...closeForm, closingCash: e.target.value })}
              className="input-base"
              required
            />
          </div>
          <div className={`rounded-lg px-3 py-2 text-sm ${
            closeVariance === 0
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
              : closeVariance > 0
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
          }`}>
            Variance: {formatCurrency(closeVariance)} {closeVariance === 0 ? '(balanced)' : closeVariance > 0 ? '(over)' : '(short)'}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</label>
            <textarea value={closeForm.notes} onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })} className="input-base min-h-[80px]" />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCloseModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? 'Closing...' : 'Close Shift'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
