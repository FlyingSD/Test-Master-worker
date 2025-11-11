/**
 * ProtectedRoute Component
 * Protects routes based on authentication and user roles
 * Redirects to appropriate login page if not authenticated
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[] // If not specified, any authenticated user can access
  redirectTo?: string // Custom redirect path
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to landing page
  if (!user || !userData) {
    return <Navigate to={redirectTo || '/'} replace />
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    // Redirect to appropriate dashboard based on role
    switch (userData.role) {
      case 'admin':
        return <Navigate to="/dashboard" replace />
      case 'teacher':
        return <Navigate to="/dashboard" replace />
      case 'parent':
        return <Navigate to="/my-children" replace />
      default:
        return <Navigate to="/" replace />
    }
  }

  // Authenticated and authorized - render children
  return <>{children}</>
}
