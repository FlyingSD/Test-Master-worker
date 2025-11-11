/**
 * Admin Login Page
 * Minimal design for admin access at /sys
 * No links to this page in the UI - must be accessed directly
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, validateRoleAccess, checkAdminWhitelist } from '@/hooks/useAuth'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { signInWithEmail, userData } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React?.FormEvent) => {
    e?.preventDefault()

    if (!email || !password) {
      toast?.error('Моля, попълнете всички полета')
      return
    }

    // SECURITY: Pre-check admin whitelist
    if (!checkAdminWhitelist(email)) {
      toast?.error('Достъпът отказан: Неоторизиран имейл')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      await signInWithEmail(email, password)

      // SECURITY: Double-check role after login
      // Wait a bit for userData to load
      setTimeout(() => {
        if (userData && !validateRoleAccess('admin', userData?.role)) {
          toast?.error('Достъпът отказан: Нямате администраторски права')
          navigate('/')
        } else if (userData?.role === 'admin') {
          navigate('/dashboard')
        }
      }, 500)
    } catch (error) {
      // Error handled by useAuth
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Admin Access
            </h1>
            <p className="text-sm text-gray-400">
              Authorized personnel only
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e?.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e?.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-xs text-gray-600 mt-4">
          /sys
        </p>
      </div>
    </div>
  )
}
