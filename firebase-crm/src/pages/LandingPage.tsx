/**
 * Landing Page
 * Entry point for unauthenticated users
 * Shows login options for Parent and Teacher
 */

import { Link } from 'react-router-dom'
import { Users, GraduationCap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Добре дошли в Светлинки CRM
          </h1>
          <p className="text-xl text-gray-600">
            Изберете вашия профил за вход
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Parent Login */}
          <Link
            to="/login/parent"
            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity" />

            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Вход за Родител
              </h2>

              <p className="text-gray-600 mb-6">
                Преглеждайте информация за вашите деца, плащания, домашни и присъствия.
              </p>

              <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                <span>Влезте в профила си</span>
                <span className="text-2xl">→</span>
              </div>
            </div>
          </Link>

          {/* Teacher Login */}
          <Link
            to="/login/teacher"
            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity" />

            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Вход за Учител
              </h2>

              <p className="text-gray-600 mb-6">
                Управлявайте вашите групи, ученици, плащания, домашни и присъствия.
              </p>

              <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                <span>Влезте в профила си</span>
                <span className="text-2xl">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>© 2024 Светлинки CRM. Всички права запазени.</p>
        </div>
      </div>
    </div>
  )
}
