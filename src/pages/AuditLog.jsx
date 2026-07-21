import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '../context/ToastContext'
import { auditApi } from '../services/endpoints'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'
import { formatDateTime } from '../utils/formatters'

const ENTITY_OPTIONS = ['', 'Store', 'Supplier', 'Product', 'Order', 'Customer', 'Coupon', 'Shift', 'PurchaseOrder', 'StockAlert']

export default function AuditLog() {
  const { addToast } = useToast()
  const [logs, setLogs] = useState([])
  const [entityFilter, setEntityFilter] = useState('')
  const [actionSearch, setActionSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (entityFilter) params.entity = entityFilter
      if (actionSearch) params.action = actionSearch
      const data = await auditApi.list(params)
      setLogs(data)
    } catch (err) {
      addToast(err.message || 'Failed to load audit log', 'error')
    } finally {
      setLoading(false)
    }
  }, [entityFilter, actionSearch, addToast])

  useEffect(() => {
    const timer = setTimeout(loadLogs, 300)
    return () => clearTimeout(timer)
  }, [loadLogs])

  const filtered = useMemo(() => {
    if (!actionSearch) return logs
    const q = actionSearch.toLowerCase()
    return logs.filter((log) =>
      log.action.toLowerCase().includes(q) ||
      (log.userName || '').toLowerCase().includes(q)
    )
  }, [logs, actionSearch])

  const columns = [
    { key: 'createdAt', label: 'When', render: (row) => formatDateTime(row.createdAt) },
    { key: 'userName', label: 'User', render: (row) => (
      <span className="font-medium">{row.userName || (row.user ? `${row.user.firstName} ${row.user.lastName}` : 'System')}</span>
    )},
    { key: 'action', label: 'Action', render: (row) => <Badge variant="info">{row.action}</Badge> },
    { key: 'entity', label: 'Entity', render: (row) => row.entity },
    { key: 'entityId', label: 'Entity ID', render: (row) => (
      <span className="font-mono text-xs text-slate-500">{row.entityId ? row.entityId.slice(0, 12) + '…' : '—'}</span>
    )},
    { key: 'details', label: 'Details', render: (row) => (
      <code className="block max-w-xs truncate rounded bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        {JSON.stringify(row.details || {})}
      </code>
    )},
  ]

  return (
    <div>
      <PageHeader title="Audit Log" description="Track system actions and changes for compliance and troubleshooting." />

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={actionSearch}
            onChange={setActionSearch}
            placeholder="Search by action..."
            className="flex-1"
          />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="select-base"
          >
            {ENTITY_OPTIONS.map((e) => (
              <option key={e || 'all'} value={e}>{e || 'All Entities'}</option>
            ))}
          </select>
        </div>
        <Table
          columns={columns}
          data={filtered}
          emptyMessage={loading ? 'Loading audit log...' : 'No audit entries found'}
        />
      </Card>
    </div>
  )
}
