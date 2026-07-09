import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/layout/Layout'
import ToastContainer from './components/ui/Toast'
import LoadingSpinner from './components/ui/LoadingSpinner'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import POS from './pages/POS'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Employees from './pages/Employees'
import Reports from './pages/Reports'

function AppRoutes() {
  const { isLoading } = useApp()

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading StockFlow POS..." />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="pos" element={<POS />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="employees" element={<Employees />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <AppRoutes />
          <ToastContainer />
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  )
}
