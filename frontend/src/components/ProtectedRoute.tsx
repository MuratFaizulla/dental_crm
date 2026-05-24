import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
  roles?: ('admin' | 'doctor' | 'patient')[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && role && !roles.includes(role)) return <Navigate to="/login" replace />

  return <>{children}</>
}
