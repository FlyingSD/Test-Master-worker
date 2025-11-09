import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingDown,
  Calendar,
  UserCheck,
  UsersRound,
  Percent,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ученици', href: '/students', icon: Users },
  { name: 'Плащания', href: '/payments', icon: CreditCard },
  { name: 'Разходи', href: '/expenses', icon: TrendingDown },
  { name: 'События', href: '/events', icon: Calendar },
  { name: 'Присъствия', href: '/attendance', icon: UserCheck },
  { name: 'Родители', href: '/parents', icon: UsersRound },
  { name: 'Отстъпки', href: '/discounts', icon: Percent },
  { name: 'Репорти', href: '/reports', icon: FileText },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

export default function Layout() {
  const { userData, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Светлинки</h1>
              <p className="text-xs text-gray-500">CRM System</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin h-[calc(100vh-180px)]">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User info & logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {userData?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userData?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn btn-ghost w-full justify-start"
          >
            <LogOut className="w-5 h-5" />
            Изход
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className="text-xl">💡</span>
            <span className="font-bold text-gray-900">Светлинки CRM</span>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
