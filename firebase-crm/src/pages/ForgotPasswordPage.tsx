/**
 * Forgot Password Page
 * Password reset page for parents and teachers
 * Theme customization based on role URL parameter
 */

import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [searchParams] = useSearchParams()
  const role = searchParams?.get('role') || 'parent' // Default to parent
  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  // Theme colors based on role
  const isParent = role === 'parent'
  const themeGradient = isParent
    ? 'from-blue-50 via-purple-50 to-pink-50'
    : 'from-purple-50 via-pink-50 to-blue-50'
  const themeColor = isParent ? 'blue' : 'purple'
  const themeBg = isParent
    ? 'from-blue-500 to-purple-600'
    : 'from-purple-500 to-pink-600'
  const loginPath = isParent ? '/login/parent' : '/login/teacher'
  const roleText = isParent ? 'Родител' : 'Учител'

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    if (!email) {
      toast?.error('Моля, въведете имейл адрес')
      return
    }

    try {
      setLoading(true)
      await resetPassword(email)
      setSuccess(true)
    } catch (error) {
      // Error handled by useAuth
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeGradient} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Link
          to={loginPath}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад към вход
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            // Success State
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-br ${themeBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Имейлът е изпратен!
              </h1>
              <p className="text-gray-600 mb-6">
                Проверете пощата си за инструкции как да възстановите паролата си.
                Ако не видите имейла, проверете и папка "Спам".
              </p>
              <Link
                to={loginPath}
                className={`btn-primary w-full bg-gradient-to-r ${themeBg} hover:opacity-90`}
              >
                Назад към вход
              </Link>
            </div>
          ) : (
            // Form State
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${themeBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Забравена парола
                </h1>
                <p className="text-gray-600">
                  Въведете имейл адреса си и ще ви изпратим инструкции за възстановяване на паролата
                </p>
              </div>

              {/* Role Badge */}
              <div className={`mb-6 p-3 bg-${themeColor}-50 border border-${themeColor}-200 rounded-lg text-center`}>
                <p className={`text-sm font-medium text-${themeColor}-900`}>
                  Възстановяване за: <strong>{roleText}</strong>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="your@email?.com"
                      className="input pl-10"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-primary w-full bg-gradient-to-r ${themeBg} hover:opacity-90`}
                >
                  {loading ? 'Изпращане...' : 'Изпрати имейл'}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Спомнихте си паролата?{' '}
                <Link
                  to={loginPath}
                  className={`text-${themeColor}-600 hover:text-${themeColor}-700 font-semibold`}
                >
                  Влезте в профила си
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
