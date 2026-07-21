import { Link } from 'react-router-dom'
import { Clock, LogIn } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthCard from '../../components/auth/AuthCard'
import Button from '../../components/ui/Button'
import { useAuth } from '../../auth/AuthContext'
import { useEffect } from 'react'

export default function SessionExpired() {
  const { setSessionExpired } = useAuth()

  useEffect(() => {
    setSessionExpired(false)
  }, [setSessionExpired])

  return (
    <AuthLayout title="Session expired" subtitle="For your security, please sign in again to continue.">
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/30">
            <Clock className="h-7 w-7 text-white" />
          </div>
          <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
            Your session has timed out. Sign back in to access your StockFlow POS dashboard.
          </p>
          <Link to="/login">
            <Button className="w-full" size="lg" icon={LogIn}>Sign In Again</Button>
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
