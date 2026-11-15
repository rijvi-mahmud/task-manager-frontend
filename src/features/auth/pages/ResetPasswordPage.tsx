import { getRouteApi, Link } from '@tanstack/react-router'
import { Alert } from '../../../components/ui/Alert'
import { useAuthActions } from '../hooks/useSession'
import { AuthLayout } from '../components/AuthLayout'
import { ResetPasswordForm } from '../components/ResetPasswordForm'

const route = getRouteApi('/reset-password')

export function ResetPasswordPage() {
  const { token } = route.useSearch()
  const { resetPassword, resetPasswordSucceeded } = useAuthActions()
  return (
    <AuthLayout title="Choose a new password" footer={<Link to="/login" className="font-medium text-accent underline-offset-4 hover:underline">Back to sign in</Link>}>
      {resetPasswordSucceeded ? (
        <p role="status">Your password has been changed. <Link to="/login" search={{ reset: true }} className="underline">Continue to sign in</Link>.</p>
      ) : token ? (
        <ResetPasswordForm onSubmit={newPassword => resetPassword(token, newPassword)} />
      ) : (
        <Alert>
          This reset link is incomplete. <Link to="/forgot-password" className="underline">Request a new one</Link>.
        </Alert>
      )}
    </AuthLayout>
  )
}
