import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { safeRedirect } from '../authSchemas'
import { AuthLayout } from '../components/AuthLayout'
import { RegisterForm } from '../components/RegisterForm'
import { useAuthActions } from '../hooks/useSession'

const route = getRouteApi('/register')

export function RegisterPage() {
  const { redirect } = route.useSearch()
  const navigate = useNavigate()
  const { register } = useAuthActions()
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Invited to a workspace? Register with that email to join it."
      footer={<>Already have an account? <Link to="/login" search={{ redirect }} className="font-medium text-accent underline-offset-4 hover:underline">Sign in</Link></>}
    >
      <RegisterForm onSubmit={async (input) => {
        await register(input)
        await navigate({ href: safeRedirect(redirect), replace: true })
      }} />
    </AuthLayout>
  )
}
