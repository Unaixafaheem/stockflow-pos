import { useState, useEffect, useCallback, useMemo } from 'react'
import { Award, Plus, History } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { loyaltyApi } from '../services/endpoints'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import { formatDateTime } from '../utils/formatters'

const tierVariant = { Bronze: 'default', Silver: 'info', Gold: 'warning', Platinum: 'purple' }

export default function Loyalty() {
  const { addToast } = useToast()
  const [tiersData, setTiersData] = useState(null)
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [history, setHistory] = useState([])
  const [adjustForm, setAdjustForm] = useState({ points: 0, note: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [tiers, customerList] = await Promise.all([
        loyaltyApi.tiers(),
        loyaltyApi.customers(),
      ])
      setTiersData(tiers)
      setCustomers(customerList)
    } catch (err) {
      addToast(err.message || 'Failed to load loyalty data', 'error')
    }
  }, [addToast])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [customers, search])

  const openAdjust = (customer) => {
    setSelectedCustomer(customer)
    setAdjustForm({ points: 0, note: '' })
    setAdjustModalOpen(true)
  }

  const openHistory = async (customer) => {
    setSelectedCustomer(customer)
    try {
      const data = await loyaltyApi.history(customer.id)
      setHistory(data)
      setHistoryModalOpen(true)
    } catch (err) {
      addToast(err.message || 'Failed to load history', 'error')
    }
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    if (!selectedCustomer) return
    setSubmitting(true)
    try {
      await loyaltyApi.adjust({
        customerId: selectedCustomer.id,
        points: Number(adjustForm.points),
        note: adjustForm.note || undefined,
      })
      addToast('Loyalty points adjusted')
      setAdjustModalOpen(false)
      await loadData()
    } catch (err) {
      addToast(err.message || 'Failed to adjust points', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Customer', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    { key: 'loyaltyPoints', label: 'Points', render: (row) => <span className="font-semibold text-primary-600">{row.loyaltyPoints}</span> },
    { key: 'loyaltyTier', label: 'Tier', render: (row) => <Badge variant={tierVariant[row.loyaltyTier] || 'default'}>{row.loyaltyTier}</Badge> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => openAdjust(row)}>Adjust</Button>
        <button onClick={() => openHistory(row)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800" title="View history">
          <History className="h-4 w-4" />
        </button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Loyalty Program" description="Manage customer tiers, points, and redemption history." />

      {tiersData?.tiers && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(tiersData.tiers).map(([name, tier]) => (
            <Card key={name} className="!p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{name}</p>
                  <p className="text-xs text-slate-500">{tier.min}+ points</p>
                  {tier.rate && <p className="text-xs text-primary-600">{tier.rate}x earn rate</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tiersData?.redeemNote && (
        <p className="mb-4 text-sm text-slate-500">{tiersData.redeemNote}</p>
      )}

      <Card>
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." />
        </div>
        <Table columns={columns} data={filtered} emptyMessage="No loyalty customers found" />
      </Card>

      <Modal isOpen={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title="Adjust Points">
        {selectedCustomer && (
          <form onSubmit={handleAdjust} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {selectedCustomer.name} — current balance: <strong>{selectedCustomer.loyaltyPoints}</strong> pts
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Points (+ earn / − redeem)</label>
              <input
                type="number"
                value={adjustForm.points}
                onChange={(e) => setAdjustForm({ ...adjustForm, points: e.target.value })}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Note</label>
              <input type="text" value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} className="input-base" />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setAdjustModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? 'Saving...' : 'Apply'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="Loyalty History" size="lg">
        {selectedCustomer && (
          <div>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{selectedCustomer.name}</p>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Type</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Points</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.length ? history.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-2.5">{formatDateTime(tx.createdAt)}</td>
                      <td className="px-4 py-2.5"><Badge variant="info">{tx.type}</Badge></td>
                      <td className={`px-4 py-2.5 text-right font-medium ${tx.points >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.points >= 0 ? '+' : ''}{tx.points}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{tx.note || '—'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No transactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
