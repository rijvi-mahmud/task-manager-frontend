import { Link } from '@tanstack/react-router'
import { authApi } from '../api/authApi'
import { AuthLayout } from '../components/AuthLayout'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we’ll send you a link to choose a new password."
      footer={<Link to="/login" className="font-medium text-accent underline-offset-4 hover:underline">Back to sign in</Link>}
    >
      <ForgotPasswordForm onSubmit={email => authApi.requestPasswordReset(email)} />
    </AuthLayout>
  )
}
