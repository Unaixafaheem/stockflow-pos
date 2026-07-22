import Button from '../ui/Button'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../context/ToastContext'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z" />
      <path fill="#34A853" d="M3.9 7.3l3 2.2C7.8 7.3 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 8.5 2.7 5.5 4.7 3.9 7.3z" />
      <path fill="#4A90E2" d="M12 21.3c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8l-3 2.3c1.6 3.1 4.7 4.9 8.1 4.9z" />
      <path fill="#FBBC05" d="M6.9 14.1c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3-2.3C3.3 9.2 3 10.5 3 12s.3 2.8.9 4l3-1.9z" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
      <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
    </svg>
  )
}

export default function SocialAuthButtons() {
  const { loginWithProvider } = useAuth()
  const { addToast } = useToast()

  const handleProvider = async (provider) => {
    try {
      const result = await loginWithProvider(provider)
      if (!result?.configured) {
        addToast(
          result?.message ||
            `${provider} sign-in is not configured yet. Use a demo account below to explore StockFlow.`,
          'info',
        )
      }
    } catch {
      addToast(
        `${provider} sign-in is not configured yet. Use a demo account below to explore StockFlow.`,
        'info',
      )
    }
  }

  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => handleProvider('Google')}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => handleProvider('Microsoft')}
      >
        <MicrosoftIcon />
        Continue with Microsoft
      </Button>
    </div>
  )
}
