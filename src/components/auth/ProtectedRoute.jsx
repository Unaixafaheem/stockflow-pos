import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

export function ProtectedRoute({ permission }) {
  const { isAuthenticated, isLoading, can, sessionExpired } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Restoring your session..." />
  }

  if (sessionExpired && !isAuthenticated) {
    return <Navigate to="/session-expired" replace state={{ from: location }} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (permission && !can(permission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
