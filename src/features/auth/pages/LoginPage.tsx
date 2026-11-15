import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { Alert } from '../../../components/ui/Alert'
import { safeRedirect } from '../authSchemas'
import { AuthLayout } from '../components/AuthLayout'
import { LoginForm } from '../components/LoginForm'
import { useAuthActions } from '../hooks/useSession'

const route = getRouteApi('/login')

export function LoginPage() {
  const { redirect, reset } = route.useSearch()
  const navigate = useNavigate()
  const { login } = useAuthActions()
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Sign in to your workspaces."
      footer={<>New here? <Link to="/register" search={{ redirect }} className="font-medium text-accent underline-offset-4 hover:underline">Create an account</Link></>}
    >
      <div className="flex flex-col gap-4">
        {reset && <Alert tone="success">Password updated. Sign in with your new password.</Alert>}
        <LoginForm onSubmit={async (input) => {
          await login(input)
          await navigate({ href: safeRedirect(redirect), replace: true })
        }} />
        <Link to="/forgot-password" className="self-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline">Forgot your password?</Link>
      </div>
    </AuthLayout>
  )
}
