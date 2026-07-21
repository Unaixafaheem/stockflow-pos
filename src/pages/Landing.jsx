import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ScanBarcode, Store, BarChart3 } from 'lucide-react'
import BrandLogo from '../components/brand/BrandLogo'
import Button from '../components/ui/Button'
import { useAuth } from '../auth/AuthContext'
import { BRAND } from '../brand/brand'

const features = [
  { icon: ScanBarcode, title: 'Fast checkout', text: 'Barcode scan, coupons, loyalty, and shifts in one POS.' },
  { icon: Store, title: 'Multi-store stock', text: 'Separate inventory per branch with purchase orders.' },
  { icon: BarChart3, title: 'Clear reporting', text: 'Cash vs card, cashier performance, and audit trails.' },
]

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(105deg, rgba(2,18,17,0.92) 0%, rgba(15,118,110,0.55) 45%, rgba(2,18,17,0.75) 100%), url(https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=2000&q=80)',
          }}
        />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 py-6 sm:px-8">
          <header className="flex items-center justify-between">
            <BrandLogo to="/" inverted size="md" />
            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="sm">Open dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hidden text-sm font-medium text-white/80 hover:text-white sm:inline">
                    Sign in
                  </Link>
                  <Link to="/login">
                    <Button size="sm">Try demo</Button>
                  </Link>
                </>
              )}
            </div>
          </header>

          <main className="flex flex-1 flex-col justify-center pb-16 pt-20 sm:pb-24 sm:pt-24">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl"
            >
              {BRAND.name}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 max-w-xl text-2xl font-semibold leading-snug text-teal-50 sm:text-3xl"
            >
              Sell faster. Track stock. Run every store from one POS.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg"
            >
              {BRAND.description} Built for retailers who need checkout, inventory, and reports without the clutter.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                <Button size="lg" icon={ArrowRight}>
                  {isAuthenticated ? 'Go to dashboard' : 'Start free demo'}
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/15">
                  Sign in
                </Button>
              </Link>
            </motion.div>
            <p className="mt-5 text-sm text-white/55">
              Demo: <span className="text-white/85">admin@stockflow.com</span> / <span className="text-white/85">admin123</span>
            </p>
          </main>
        </div>
      </div>

      <section className="border-t border-white/10 bg-slate-950 px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20 text-primary-300">
                <f.icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center gap-3 text-sm text-slate-400">
          {['Multi-store', 'Refunds', 'Loyalty', 'Audit log', 'Offline-ready'].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary-400" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-slate-500 sm:px-8">
        © {new Date().getFullYear()} {BRAND.product}. Built for retail teams.
      </footer>
    </div>
  )
}
