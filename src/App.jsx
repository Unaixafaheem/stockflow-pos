import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/layout/Layout'
import ToastContainer from './components/ui/Toast'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute'

import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import POS from './pages/POS'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Employees from './pages/Employees'
import Reports from './pages/Reports'
import Stores from './pages/Stores'
import Suppliers from './pages/Suppliers'
import Coupons from './pages/Coupons'
import Shifts from './pages/Shifts'
import Loyalty from './pages/Loyalty'
import Alerts from './pages/Alerts'
import AuditLog from './pages/AuditLog'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import Unauthorized from './pages/auth/Unauthorized'
import SessionExpired from './pages/auth/SessionExpired'

function PermissionGate({ permission, children }) {
  const { can } = useAuth()
  if (permission && !can(permission)) return <Navigate to="/unauthorized" replace />
  return children
}

function AppRoutes() {
  const { isLoading: appLoading, isOffline } = useApp()
  const { isLoading: authLoading, isAuthenticated } = useAuth()

  const blocking = authLoading || (isAuthenticated && appLoading)

  if (blocking) {
    return (
      <LoadingSpinner
        fullScreen
        message={isOffline ? 'Loading cached StockFlow data...' : 'Loading StockFlow POS...'}
      />
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/session-expired" element={<SessionExpired />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="dashboard" element={<PermissionGate permission="dashboard"><Dashboard /></PermissionGate>} />
          <Route path="products" element={<PermissionGate permission="products"><Products /></PermissionGate>} />
          <Route path="pos" element={<PermissionGate permission="pos"><POS /></PermissionGate>} />
          <Route path="orders" element={<PermissionGate permission="orders"><Orders /></PermissionGate>} />
          <Route path="customers" element={<PermissionGate permission="customers"><Customers /></PermissionGate>} />
          <Route path="employees" element={<PermissionGate permission="employees"><Employees /></PermissionGate>} />
          <Route path="reports" element={<PermissionGate permission="reports"><Reports /></PermissionGate>} />
          <Route path="stores" element={<PermissionGate permission="stores"><Stores /></PermissionGate>} />
          <Route path="suppliers" element={<PermissionGate permission="suppliers"><Suppliers /></PermissionGate>} />
          <Route path="coupons" element={<PermissionGate permission="coupons"><Coupons /></PermissionGate>} />
          <Route path="shifts" element={<PermissionGate permission="shifts"><Shifts /></PermissionGate>} />
          <Route path="loyalty" element={<PermissionGate permission="loyalty"><Loyalty /></PermissionGate>} />
          <Route path="alerts" element={<PermissionGate permission="alerts"><Alerts /></PermissionGate>} />
          <Route path="audit" element={<PermissionGate permission="audit"><AuditLog /></PermissionGate>} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <AppRoutes />
            <ToastContainer />
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
