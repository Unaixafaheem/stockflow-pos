import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import Button from '../ui/Button'
import { isOnboardingDone, markOnboardingDone } from '../../offline/storage'

const STEPS = [
  {
    title: 'Welcome to StockFlow',
    body: 'Your inventory + POS workspace. This quick tour shows the main places you’ll use every day.',
  },
  {
    title: 'Command search',
    body: 'Press ⌘K (or Ctrl+K) anytime to jump to pages, products, customers, or orders instantly.',
  },
  {
    title: 'POS / Checkout',
    body: 'Ring up sales with barcodes, coupons, loyalty points, and per-store stock from the sidebar.',
  },
  {
    title: 'Orders & refunds',
    body: 'Review sales history and process partial refunds with optional restocking under Orders.',
  },
  {
    title: 'Stores, alerts & more',
    body: 'Switch branches under Stores, watch low stock in Alerts, and explore suppliers, shifts, and loyalty.',
  },
]

export default function OnboardingTour({ enabled = true }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setOpen(false)
      return
    }
    // Defer one tick so auth/layout finish mounting before showing the tour.
    const timer = window.setTimeout(() => {
      if (!isOnboardingDone()) setOpen(true)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [enabled])

  if (!open) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const finish = () => {
    markOnboardingDone()
    setOpen(false)
  }

  const next = () => {
    if (isLast) {
      finish()
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => {
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
          onClick={finish}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="bg-gradient-to-r from-primary-600 to-teal-700 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm font-semibold">Getting started · {step + 1}/{STEPS.length}</p>
              </div>
              <button type="button" onClick={finish} className="rounded-lg p-1 hover:bg-white/15" aria-label="Skip tour">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </div>

          <div className="px-5 py-5">
            <h3 id="onboarding-title" className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              {current.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{current.body}</p>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <button type="button" onClick={finish} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Skip
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="secondary" icon={ChevronLeft} onClick={back}>
                  Back
                </Button>
              )}
              <Button icon={isLast ? undefined : ChevronRight} onClick={next}>
                {isLast ? 'Got it' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
