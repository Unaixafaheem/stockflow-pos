import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthCard from '../../components/auth/AuthCard'
import Button from '../../components/ui/Button'

export default function Unauthorized() {
  return (
    <AuthLayout title="Access denied" subtitle="You don't have permission to view this page.">
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
            Your current role does not include access to this resource. Contact an administrator if you believe this is a mistake.
          </p>
          <Link to="/dashboard">
            <Button className="w-full" icon={ArrowLeft}>Back to Dashboard</Button>
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
