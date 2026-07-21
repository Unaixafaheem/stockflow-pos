import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import { isOnboardingDone, markOnboardingDone } from '../../offline/storage'

const STEPS = [
  {
    title: 'Welcome to StockFlow',
    body: 'Your inventory + POS workspace. This quick tour shows the main places you’ll use every day.',
    path: '/dashboard',
  },
  {
    title: 'Command search',
    body: 'Press ⌘K (or Ctrl+K) anytime to jump to pages, products, customers, or orders instantly.',
    path: '/dashboard',
  },
  {
    title: 'POS / Checkout',
    body: 'Ring up sales with barcodes, coupons, loyalty points, and per-store stock.',
    path: '/pos',
  },
  {
    title: 'Orders & refunds',
    body: 'Review sales history and process partial refunds with optional restocking.',
    path: '/orders',
  },
  {
    title: 'Stores & inventory',
    body: 'Switch branches, manage suppliers, and keep low-stock alerts under control.',
    path: '/stores',
  },
]

export default function OnboardingTour({ enabled = true }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!enabled) return
    if (!isOnboardingDone()) setOpen(true)
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
    const nextStep = step + 1
    setStep(nextStep)
    if (STEPS[nextStep]?.path) navigate(STEPS[nextStep].path)
  }

  const back = () => {
    if (step === 0) return
    const prev = step - 1
    setStep(prev)
    if (STEPS[prev]?.path) navigate(STEPS[prev].path)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="bg-gradient-to-r from-primary-600 to-violet-600 px-5 py-4 text-white">
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
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">{current.title}</h3>
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
                {isLast ? 'Start selling' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
