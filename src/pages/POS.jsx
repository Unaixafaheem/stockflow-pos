import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingCart, CreditCard, Banknote, Globe, Receipt, Package, Download, Ticket, Gift, Store, Clock, Printer } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SearchInput from '../components/ui/SearchInput'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import BarcodeScanner from '../components/pos/BarcodeScanner'
import { formatCurrency } from '../utils/formatters'
import { calculateTax, PAYMENT_METHODS } from '../utils/helpers'
import { downloadOrderReceipt } from '../utils/pdfReceipt'
import { printThermalReceipt } from '../utils/printReceipt'
import { couponsApi, shiftsApi, loyaltyApi } from '../services/endpoints'

const paymentIcons = { Cash: Banknote, Card: CreditCard, Online: Globe }

export default function POS() {
  const {
    products, customers, stores, currentStoreId, selectStore, completeCheckout, findProductByBarcode,
  } = useApp()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState(0)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [currentShift, setCurrentShift] = useState(null)
  const [openingCash, setOpeningCash] = useState(100)
  const [closingCash, setClosingCash] = useState(0)
  const [shiftModal, setShiftModal] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer)

  useEffect(() => {
    shiftsApi.current().then(setCurrentShift).catch(() => setCurrentShift(null))
  }, [])

  useEffect(() => {
    setLoyaltyPoints(0)
    setLoyaltyDiscount(0)
  }, [selectedCustomer])

  const availableProducts = useMemo(
    () => products.filter((p) => p.stockQuantity > 0 && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
    )),
    [products, search]
  )

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const manualDiscount = parseFloat(discount) || 0
  const totalDiscount = manualDiscount + couponDiscount + loyaltyDiscount
  const taxable = Math.max(0, subtotal - totalDiscount)
  const tax = calculateTax(taxable)
  const total = taxable + tax

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
      return [...prev, {
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.sellingPrice,
        quantity: 1,
        maxStock: product.stockQuantity,
      }]
    })
    setAppliedCoupon(null)
    setCouponDiscount(0)
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
    setAppliedCoupon(null)
    setCouponDiscount(0)
  }

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
    setAppliedCoupon(null)
    setCouponDiscount(0)
  }

  const handleBarcodeScan = useCallback(async (code) => {
    try {
      const product = await findProductByBarcode(code)
      if (!product || product.stockQuantity <= 0) {
        addToast('Scanned product is out of stock or not found', 'warning')
        return
      }
      addToCart(product)
      addToast(`Added ${product.name} from barcode scan`)
    } catch {
      const local = products.find((p) => p.barcode === code)
      if (local) {
        addToCart(local)
        addToast(`Added ${local.name}`)
      } else {
        addToast('No product found for that barcode', 'error')
      }
    }
  }, [findProductByBarcode, products, addToast])

  const applyCoupon = async () => {
    if (!couponCode.trim() || cart.length === 0) return
    try {
      const result = await couponsApi.validate({
        code: couponCode,
        subtotal,
        items: cart.map((i) => ({
          price: i.price,
          quantity: i.quantity,
          category: i.category,
        })),
      })
      setAppliedCoupon(result.coupon)
      setCouponDiscount(result.discount)
      addToast(`Coupon ${result.coupon.code} applied (−${formatCurrency(result.discount)})`)
    } catch (err) {
      setAppliedCoupon(null)
      setCouponDiscount(0)
      addToast(err.message || 'Invalid coupon', 'error')
    }
  }

  const applyLoyalty = async () => {
    if (!selectedCustomerData || selectedCustomer === 'walk-in') {
      addToast('Select a loyalty customer first', 'warning')
      return
    }
    const pts = Math.min(Number(loyaltyPoints) || 0, selectedCustomerData.loyaltyPoints || 0)
    if (pts <= 0) {
      setLoyaltyDiscount(0)
      return
    }
    try {
      const quote = await loyaltyApi.quoteRedeem({ customerId: selectedCustomer, points: pts })
      setLoyaltyPoints(quote.points)
      setLoyaltyDiscount(quote.discount)
      addToast(`Redeeming ${quote.points} pts (−${formatCurrency(quote.discount)})`)
    } catch (err) {
      addToast(err.message || 'Could not redeem points', 'error')
    }
  }

  const handleStoreChange = async (storeId) => {
    try {
      await selectStore(storeId)
      setCart([])
      addToast('Store switched — cart cleared for inventory accuracy')
    } catch (err) {
      addToast(err.message || 'Failed to switch store', 'error')
    }
  }

  const openShift = async () => {
    try {
      const shift = await shiftsApi.open({ openingCash: Number(openingCash) || 0, storeId: currentStoreId })
      setCurrentShift(shift)
      setShiftModal(false)
      addToast('Shift opened')
    } catch (err) {
      addToast(err.message || 'Could not open shift', 'error')
    }
  }

  const closeShift = async () => {
    if (!currentShift) return
    try {
      const result = await shiftsApi.close(currentShift.id, { closingCash: Number(closingCash) || 0 })
      addToast(`Shift closed. Variance: ${formatCurrency(result.variance)}`)
      setCurrentShift(null)
      setShiftModal(false)
    } catch (err) {
      addToast(err.message || 'Could not close shift', 'error')
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty', 'warning')
      return
    }
    setCheckingOut(true)
    try {
      const customer = customers.find((c) => c.id === selectedCustomer)
      const order = await completeCheckout({
        items: cart,
        customerId: selectedCustomer,
        customerName: customer?.name || 'Walk-in Customer',
        discount: manualDiscount,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        loyaltyPointsToRedeem: loyaltyPoints || 0,
        storeId: currentStoreId,
      })
      setLastOrder(order)
      setReceiptOpen(true)
      setCart([])
      setDiscount(0)
      setCouponCode('')
      setAppliedCoupon(null)
      setCouponDiscount(0)
      setLoyaltyPoints(0)
      setLoyaltyDiscount(0)
      setLoyaltyDiscount(0)
      setMobileCartOpen(false)
      addToast('Order completed successfully!')
      shiftsApi.current().then(setCurrentShift).catch(() => {})
    } catch (err) {
      addToast(err.message || 'Checkout failed', 'error')
    } finally {
      setCheckingOut(false)
    }
  }

  const cartPanel = (
            <div className="p-5">
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="select-base min-h-11"
                >
                  <option value="walk-in">Walk-in Customer</option>
                  {customers.filter((c) => c.name !== 'Walk-in Customer').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.loyaltyPoints || 0} pts ({c.loyaltyTier || 'Bronze'})
                    </option>
                  ))}
                </select>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 dark:border-slate-700">
                  <ShoppingCart className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400">No items in cart</p>
                  <p className="mt-1 text-xs text-slate-400">Tap a product to add</p>
                </div>
              ) : (
                <div className="mb-4 max-h-[40vh] space-y-2 overflow-y-auto xl:max-h-52">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
                        <button type="button" onClick={() => updateQuantity(item.productId, -1)} className="rounded-md p-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Decrease">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.productId, 1)} className="rounded-md p-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Increase">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="w-16 text-right text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                      <button type="button" onClick={() => removeItem(item.productId)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20" aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-3 space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="input-base min-h-11 pl-9"
                    />
                  </div>
                  <Button variant="secondary" onClick={applyCoupon}>Apply</Button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-600">Applied {appliedCoupon.code} (−{formatCurrency(couponDiscount)})</p>
                )}

                {selectedCustomer !== 'walk-in' && selectedCustomerData && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Gift className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        max={selectedCustomerData.loyaltyPoints || 0}
                        value={loyaltyPoints}
                        onChange={(e) => setLoyaltyPoints(e.target.value)}
                        placeholder={`Points (max ${selectedCustomerData.loyaltyPoints || 0})`}
                        className="input-base min-h-11 pl-9"
                      />
                    </div>
                    <Button variant="secondary" onClick={applyLoyalty}>Redeem</Button>
                  </div>
                )}
              </div>

              <div className="mb-5 space-y-2.5 rounded-xl bg-slate-50/80 p-4 dark:bg-slate-800/30">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Manual discount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-right text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Coupon</span>
                    <span>−{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Loyalty</span>
                    <span>−{formatCurrency(loyaltyDiscount)}</span>
                  </div>
                )}
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
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
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

              <Button className="w-full min-h-12" size="lg" onClick={handleCheckout} disabled={cart.length === 0 || checkingOut}>
                {checkingOut ? 'Processing...' : `Charge ${formatCurrency(total)}`}
              </Button>
            </div>
  )

  const currentStore = stores.find((s) => s.id === currentStoreId)

  return (
    <div>
      <PageHeader title="POS / Checkout" description="Process sales with store stock, coupons, loyalty, and shift tracking.">
        <div className="flex flex-wrap items-center gap-2">
          {stores.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <Store className="h-4 w-4 text-slate-400" />
              <select
                value={currentStoreId || ''}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <Button
            variant="secondary"
            icon={Clock}
            onClick={() => {
              setClosingCash(0)
              setShiftModal(true)
            }}
          >
            {currentShift ? 'Close Shift' : 'Open Shift'}
          </Button>
        </div>
      </PageHeader>

      {(currentStore || currentShift) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {currentStore && <Badge variant="info">Store: {currentStore.name}</Badge>}
          {currentShift ? (
            <Badge variant="success">Shift open · cash sales {formatCurrency(currentShift.cashSales || 0)}</Badge>
          ) : (
            <Badge variant="warning">No open shift</Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 pb-24 xl:grid-cols-12 xl:pb-0">
        <div className="xl:col-span-8">
          <Card className="mb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search or scan barcode..."
                className="flex-1"
              />
              <BarcodeScanner onScan={handleBarcodeScan} />
            </div>
            <p className="mt-3 text-xs text-slate-500">{availableProducts.length} product{availableProducts.length !== 1 ? 's' : ''} available</p>
          </Card>

          {availableProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {availableProducts.map((product, index) => (
                  <motion.button
                    key={product.id}
                    layout
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      addToCart(product)
                    }}
                    className="group min-h-[7.5rem] rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-shadow hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-primary-800"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white dark:bg-primary-900/40 dark:text-primary-400">
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

        {/* Desktop cart */}
        <div className="hidden xl:col-span-4 xl:block">
          <Card className="sticky top-20 overflow-hidden !p-0" padding={false}>
            <div className="border-b border-slate-100 bg-primary-600 px-5 py-4 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                <ShoppingCart className="h-5 w-5" />
                Cart
                <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">{cart.length}</span>
              </h3>
            </div>
            {cartPanel}
          </Card>
        </div>
      </div>

      {/* Tablet / phone sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur xl:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="flex min-h-12 flex-1 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4 text-primary-600" />
              {cart.length} item{cart.length === 1 ? '' : 's'}
            </span>
            <span className="text-base font-bold text-primary-600">{formatCurrency(total)}</span>
          </button>
          <Button
            className="min-h-12 shrink-0"
            onClick={() => (cart.length ? handleCheckout() : setMobileCartOpen(true))}
            disabled={checkingOut}
          >
            {cart.length ? 'Checkout' : 'View cart'}
          </Button>
        </div>
      </div>

      {/* Mobile cart sheet */}
      <Modal isOpen={mobileCartOpen} onClose={() => setMobileCartOpen(false)} title="Cart" size="lg">
        <div className="-mx-1 max-h-[70vh] overflow-y-auto">
          {cartPanel}
        </div>
      </Modal>

      <Modal
        isOpen={shiftModal}
        onClose={() => setShiftModal(false)}
        title={currentShift ? 'Close Shift' : 'Open Shift'}
      >
        {!currentShift ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Opening cash</label>
              <input type="number" min="0" step="0.01" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className="input-base" />
            </div>
            <Button className="w-full" onClick={openShift}>Open Shift</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Expected cash ≈ opening + cash sales − refunds
              ({formatCurrency((currentShift.openingCash || 0) + (currentShift.cashSales || 0) - (currentShift.refundTotal || 0))})
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Closing cash counted</label>
              <input type="number" min="0" step="0.01" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} className="input-base" />
            </div>
            <Button className="w-full" onClick={closeShift}>Close Shift & Report</Button>
          </div>
        )}
      </Modal>

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
              {(lastOrder.discount > 0 || lastOrder.couponDiscount > 0 || lastOrder.loyaltyDiscount > 0) && (
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Discounts</span>
                  <span>−{formatCurrency((lastOrder.discount || 0) + (lastOrder.couponDiscount || 0) + (lastOrder.loyaltyDiscount || 0))}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Tax</span><span>{formatCurrency(lastOrder.tax)}</span></div>
              <div className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary-600">{formatCurrency(lastOrder.total)}</span></div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="info">{lastOrder.paymentMethod}</Badge>
                <Badge variant="success">{lastOrder.status}</Badge>
                {lastOrder.couponCode && <Badge variant="purple">{lastOrder.couponCode}</Badge>}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                variant="secondary"
                icon={Printer}
                onClick={() => {
                  printThermalReceipt(lastOrder, {
                    storeName: currentStore?.name || 'StockFlow POS',
                    storeAddress: currentStore?.address,
                    storePhone: currentStore?.phone,
                  })
                  addToast('Opening print dialog')
                }}
              >
                Print Receipt
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                icon={Download}
                onClick={() => {
                  downloadOrderReceipt(lastOrder)
                  addToast('Receipt PDF downloaded')
                }}
              >
                Download PDF
              </Button>
              <Button className="flex-1" onClick={() => setReceiptOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
