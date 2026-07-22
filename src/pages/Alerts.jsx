import { useState, useEffect, useCallback } from 'react'
import { BellRing, ScanLine, RefreshCw } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { alertsApi } from '../services/endpoints'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import { formatDateTime } from '../utils/formatters'

const statusVariant = {
  Sent: 'success',
  DemoQueued: 'warning',
  Failed: 'danger',
}

export default function Alerts() {
  const { addToast } = useToast()
  const [alerts, setAlerts] = useState([])
  const [scanning, setScanning] = useState(false)
  const [resendingId, setResendingId] = useState(null)

  const loadAlerts = useCallback(async () => {
    try {
      const data = await alertsApi.list()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      addToast(err.message || 'Failed to load alerts', 'error')
      setAlerts([])
    }
  }, [addToast])

  useEffect(() => { loadAlerts() }, [loadAlerts])

  const handleScan = async () => {
    setScanning(true)
    try {
      const result = await alertsApi.scan({ channel: 'email' })
      addToast(
        `Scan complete: ${result.alertsCreated ?? 0} alert(s) created from ${result.scanned ?? 0} products`,
      )
      await loadAlerts()
    } catch (err) {
      addToast(err.message || 'Scan failed', 'error')
    } finally {
      setScanning(false)
    }
  }

  const handleResend = async (id) => {
    setResendingId(id)
    try {
      await alertsApi.resend(id)
      addToast('Alert resent')
      await loadAlerts()
    } catch (err) {
      addToast(err.message || 'Resend failed', 'error')
    } finally {
      setResendingId(null)
    }
  }

  const columns = [
    { key: 'createdAt', label: 'Date', render: (row) => formatDateTime(row.createdAt) },
    { key: 'product', label: 'Product', render: (row) => row.product?.name || '—' },
    { key: 'store', label: 'Store', render: (row) => row.store?.name || '—' },
    { key: 'channel', label: 'Channel', render: (row) => <Badge variant="info">{row.channel}</Badge> },
    { key: 'message', label: 'Message', render: (row) => (
      <span className="block max-w-md truncate text-sm">{row.message}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <Badge variant={statusVariant[row.status] || 'default'}>{row.status}</Badge>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <Button
        size="sm"
        variant="secondary"
        icon={RefreshCw}
        disabled={resendingId === row.id}
        onClick={() => handleResend(row.id)}
      >
        {resendingId === row.id ? 'Sending...' : 'Resend'}
      </Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Stock Alerts" description="Low-stock notifications and alert dispatch history.">
        <Button icon={ScanLine} disabled={scanning} onClick={handleScan}>{scanning ? 'Scanning...' : 'Scan for Low Stock'}</Button>
      </PageHeader>

      <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10">
        <div className="flex items-start gap-3">
          <BellRing className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Email dispatch</p>
            <p className="mt-1 text-sm text-amber-700/90 dark:text-amber-400/90">
              Configure <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">EMAILJS_SERVICE_ID</code>,{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">EMAILJS_TEMPLATE_ID</code>,{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">EMAILJS_PUBLIC_KEY</code>, and{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">ALERT_EMAIL_TO</code> on the server to enable live email send.
              Without these env vars, alerts are queued in demo mode (<Badge variant="warning" className="ml-1">DemoQueued</Badge>).
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={alerts} emptyMessage="No alerts yet. Run a low-stock scan to generate alerts." />
      </Card>
    </div>
  )
}
