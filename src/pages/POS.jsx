import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingCart, CreditCard, Banknote, Globe, Receipt, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { formatCurrency } from '../utils/formatters'
import { calculateTax, PAYMENT_METHODS } from '../utils/helpers'

const paymentIcons = { Cash: Banknote, Card: CreditCard, Online: Globe }

export default function POS() {
  const { products, customers, completeCheckout } = useApp()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)

  const availableProducts = useMemo(
    () => products.filter((p) => p.stockQuantity > 0 && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
    )),
    [products, search]
  )

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = calculateTax(Math.max(0, subtotal - discount))
  const total = Math.max(0, subtotal - discount) + tax

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          addToast('Not enough stock available', 'warning')
          return prev
        }
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, price: product.sellingPrice, quantity: 1, maxStock: product.stockQuantity }]
    })
  }

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item
        const newQty = item.quantity + delta
        if (newQty <= 0) return null
        if (newQty > item.maxStock) {
          addToast('Not enough stock available', 'warning')
          return item
        }
        return { ...item, quantity: newQty }
      }).filter(Boolean)
    )
  }

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      addToast('Cart is empty', 'warning')
      return
    }
    const customer = customers.find((c) => c.id === selectedCustomer)
    const order = completeCheckout({
      items: cart,
      customerId: selectedCustomer,
      customerName: customer?.name || 'Walk-in Customer',
      discount: parseFloat(discount) || 0,
      paymentMethod,
    })
    setLastOrder(order)
    setReceiptOpen(true)
    setCart([])
    setDiscount(0)
    addToast('Order completed successfully!')
  }

  return (
    <div>
      <PageHeader title="POS / Checkout" description="Process sales quickly and efficiently with real-time inventory updates." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card className="mb-5">
            <SearchInput value={search} onChange={setSearch} placeholder="Search products by name, SKU, or barcode..." />
            <p className="mt-3 text-xs text-slate-500">{availableProducts.length} product{availableProducts.length !== 1 ? 's' : ''} available</p>
          </Card>

          {availableProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {availableProducts.map((product, index) => (
                  <motion.button
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    whileHover={{ y: -4, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(product)}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-shadow hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-primary-800"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 transition-colors group-hover:from-primary-500 group-hover:to-primary-600 group-hover:text-white dark:from-primary-900/40 dark:to-primary-900/20 dark:text-primary-400">
                        <Package className="h-5 w-5" />
                      </div>
                      <Badge variant="info" className="text-[10px]">{product.category}</Badge>
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
                    <p className="text-xl font-bold tracking-tight text-primary-600 dark:text-primary-400">{formatCurrency(product.sellingPrice)}</p>
                    <p className="mt-1.5 text-xs text-slate-400">{product.stockQuantity} in stock</p>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState title="No products found" description="Try a different search or check inventory levels." />
          )}
        </div>

        <div className="xl:col-span-4">
          <Card className="sticky top-20 overflow-hidden !p-0" padding={false}>
            <div className="border-b border-slate-100 bg-gradient-to-r from-primary-600 to-violet-600 px-5 py-4 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                <ShoppingCart className="h-5 w-5" />
                Cart
                <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">{cart.length}</span>
              </h3>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="select-base"
                >
                  <option value="walk-in">Walk-in Customer</option>
                  {customers.filter((c) => c.id !== 'cust_7').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 dark:border-slate-700">
                  <ShoppingCart className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400">No items in cart</p>
                  <p className="mt-1 text-xs text-slate-400">Click a product to add</p>
                </div>
              ) : (
                <div className="mb-4 max-h-72 space-y-2 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="w-16 text-right text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                      <button onClick={() => removeItem(item.productId)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-5 space-y-2.5 rounded-xl bg-slate-50/80 p-4 dark:bg-slate-800/30">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Discount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax (8%)</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2.5 dark:border-slate-700">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = paymentIcons[method]
                    const selected = paymentMethod === method
                    return (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                          selected
                            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm shadow-primary-500/10 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${selected ? 'text-primary-600' : ''}`} />
                        {method}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={cart.length === 0}>
                Complete Checkout
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={receiptOpen} onClose={() => setReceiptOpen(false)} title="Receipt" size="md">
        {lastOrder && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <Receipt className="h-7 w-7 text-white" />
              </div>
            </div>
            <h3 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Payment Successful</h3>
            <p className="mb-5 font-mono text-sm text-slate-500">{lastOrder.id}</p>

            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-left text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <p className="font-semibold text-slate-900 dark:text-white">Customer: {lastOrder.customerName}</p>
              <p className="mt-1 text-slate-500">{new Date(lastOrder.date).toLocaleString()}</p>
              <hr className="my-3 border-slate-200 dark:border-slate-700" />
              {lastOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-300">{item.name} ×{item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
              <hr className="my-3 border-slate-200 dark:border-slate-700" />
              <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Subtotal</span><span>{formatCurrency(lastOrder.subtotal)}</span></div>
              {lastOrder.discount > 0 && <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Discount</span><span>-{formatCurrency(lastOrder.discount)}</span></div>}
              <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Tax</span><span>{formatCurrency(lastOrder.tax)}</span></div>
              <div className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary-600">{formatCurrency(lastOrder.total)}</span></div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="info">{lastOrder.paymentMethod}</Badge>
                <Badge variant="success">{lastOrder.status}</Badge>
              </div>
            </div>

            <Button className="w-full" onClick={() => setReceiptOpen(false)}>Close Receipt</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
