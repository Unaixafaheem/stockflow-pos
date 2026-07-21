import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import customerRoutes from './routes/customers.js'
import employeeRoutes from './routes/employees.js'
import orderRoutes from './routes/orders.js'
import reportRoutes from './routes/reports.js'
import storeRoutes from './routes/stores.js'
import supplierRoutes from './routes/suppliers.js'
import couponRoutes from './routes/coupons.js'
import shiftRoutes from './routes/shifts.js'
import refundRoutes from './routes/refunds.js'
import loyaltyRoutes from './routes/loyalty.js'
import auditRoutes from './routes/audit.js'
import alertRoutes from './routes/alerts.js'
import docsRoutes from './routes/docs.js'

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'StockFlow POS API', time: new Date().toISOString() })
})

app.use('/api/docs', docsRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/shifts', shiftRoutes)
app.use('/api/refunds', refundRoutes)
app.use('/api/loyalty', loyaltyRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/alerts', alertRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`StockFlow API running on http://localhost:${PORT}`)
  console.log(`API docs: http://localhost:${PORT}/api/docs`)
})
