import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function BarcodeScanner({ onScan, buttonLabel = 'Scan Barcode' }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef(null)
  const runningRef = useRef(false)
  const elementId = 'stockflow-barcode-reader'

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false

    const start = async () => {
      try {
        setError('')
        const scanner = new Html5Qrcode(elementId)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          async (decodedText) => {
            if (cancelled) return
            onScan?.(decodedText)
            await stopScanner()
            setOpen(false)
          },
          () => {}
        )
        runningRef.current = true
      } catch (err) {
        setError(err?.message || 'Unable to access camera. You can still type barcodes manually.')
      }
    }

    start()

    return () => {
      cancelled = true
      stopScanner()
    }
  }, [open, onScan])

  const stopScanner = async () => {
    try {
      if (scannerRef.current && runningRef.current) {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      }
    } catch {
      // ignore stop errors
    } finally {
      runningRef.current = false
      scannerRef.current = null
    }
  }

  const handleClose = async () => {
    await stopScanner()
    setOpen(false)
  }

  return (
    <>
      <Button type="button" variant="secondary" icon={Camera} onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>

      <Modal isOpen={open} onClose={handleClose} title="Scan Barcode / QR" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Point your camera at a product barcode. USB barcode scanners also work by typing into the POS search field.
          </p>
          <div id={elementId} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700" />
          {error && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
              {error}
            </p>
          )}
          <Button variant="secondary" className="w-full" icon={X} onClick={handleClose}>
            Close Scanner
          </Button>
        </div>
      </Modal>
    </>
  )
}
