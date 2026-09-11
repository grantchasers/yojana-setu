import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" aria-busy="true">
        <div
          className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to="/" replace />
  }

  return children
}
