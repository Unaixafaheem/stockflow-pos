import { useEffect, useState, useCallback } from 'react'
import { WifiOff, CloudUpload, CheckCircle2 } from 'lucide-react'
import { getOfflineQueue, setOfflineQueue } from '../../offline/storage'
import { ordersApi } from '../../services/endpoints'
import { useToast } from '../../context/ToastContext'

export default function OfflineBanner({ onSynced }) {
  const { addToast } = useToast()
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pending, setPending] = useState(() => getOfflineQueue().length)
  const [syncing, setSyncing] = useState(false)

  const refreshPending = useCallback(() => {
    setPending(getOfflineQueue().length)
  }, [])

  const syncQueue = useCallback(async () => {
    const queue = getOfflineQueue()
    if (!queue.length || !navigator.onLine) {
      refreshPending()
      return
    }
    setSyncing(true)
    const remaining = []
    let synced = 0
    for (const entry of queue) {
      try {
        if (entry.type === 'checkout') {
          await ordersApi.checkout(entry.payload)
          synced += 1
        }
      } catch {
        remaining.push(entry)
      }
    }
    setOfflineQueue(remaining)
    refreshPending()
    setSyncing(false)
    if (synced > 0) {
      addToast(`Synced ${synced} offline sale${synced === 1 ? '' : 's'}`)
      onSynced?.()
    }
  }, [addToast, onSynced, refreshPending])

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      syncQueue()
    }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('stockflow-offline-queue', refreshPending)
    if (navigator.onLine) syncQueue()
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('stockflow-offline-queue', refreshPending)
    }
  }, [syncQueue, refreshPending])

  if (online && pending === 0) return null

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${
      online
        ? 'border-b border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300'
        : 'border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200'
    }`}>
      <div className="flex items-center gap-2">
        {online ? <CheckCircle2 className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span>
          {online
            ? `${pending} offline sale${pending === 1 ? '' : 's'} waiting to sync`
            : `You're offline${pending ? ` · ${pending} sale${pending === 1 ? '' : 's'} queued` : ' · cached catalog available'}`}
        </span>
      </div>
      {online && pending > 0 && (
        <button
          type="button"
          onClick={syncQueue}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold shadow-sm dark:bg-slate-900/50"
        >
          <CloudUpload className="h-3.5 w-3.5" />
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      )}
    </div>
  )
}
