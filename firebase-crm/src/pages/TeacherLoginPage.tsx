/**
 * Teacher Login Page
 * Login page for teachers with email/password only
 * Teachers cannot self-register - only Admin creates teacher accounts
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, validateRoleAccess } from '@/hooks/useAuth'
import { Mail, Lock, ArrowLeft, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherLoginPage() {
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

    try {
      setLoading(true)
      await signInWithEmail(email, password)

      // SECURITY: Validate role after login
      setTimeout(() => {
        if (userData && !validateRoleAccess('teacher', userData?.role)) {
          toast?.error('Достъпът отказан: Това е вход само за учители')
          navigate('/login/parent')
        } else if (userData?.role === 'teacher') {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад към начална страница
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Вход за Учител
            </h1>
            <p className="text-gray-600">
              Влезте в профила си за достъп до вашите групи и ученици
            </p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имейл
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e?.target.value)}
                  placeholder="teacher@school?.com"
                  className="input pl-10"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Парола
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e?.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password?role=teacher"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Забравена парола?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {loading ? 'Влизане...' : 'Вход'}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-900">
              <strong>Забележка:</strong> Учителските профили се създават от
              администратор. Ако нямате профил, моля свържете се с администратора.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
