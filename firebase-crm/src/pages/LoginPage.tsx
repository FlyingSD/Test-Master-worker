import { useState } from 'react'
import { LogIn, Mail, Lock, User, Chrome } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, signUp, loading } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSignUp) {
      await signUp(formData.email, formData.password, formData.name)
    } else {
      await signInWithEmail(formData.email, formData.password)
    }
  }

  const handleGoogleLogin = async () => {
    await signInWithGoogle()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">💡</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Светлинки CRM</h1>
          <p className="text-gray-600">
            {isSignUp ? 'Създайте нов акаунт' : 'Влезте във вашия акаунт'}
          </p>
        </div>

        {/* Login Card */}
        <div className="card animate-slide-in">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                !isSignUp
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                isSignUp
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="label">Име</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    className="input pl-10"
                    placeholder="Вашето име"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Имейл</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  className="input pl-10"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">Парола</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Зареждане...
                </div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {isSignUp ? 'Регистрация' : 'Вход'}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-secondary w-full"
          >
            <Chrome className="w-5 h-5" />
            {isSignUp ? 'Регистрация с Google' : 'Вход с Google'}
          </button>

          {/* Demo Credentials */}
          {!isSignUp && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-blue-900 mb-2">
                🔐 Demo Credentials:
              </p>
              <div className="text-xs text-blue-700 space-y-1 font-mono">
                <div>Email: admin@svetlinki.bg</div>
                <div>Password: admin123</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Светлинки CRM © 2024
        </p>
      </div>
    </div>
  )
}
