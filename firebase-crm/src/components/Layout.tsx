import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Percent,
  FileText,
  Menu,
  X,
  LogOut,
  Shield,
  Package,
  AlertTriangle,
  TrendingDown,
  Settings,
  UserCheck,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin, getRoleDisplayName, getRoleBadgeColor } from '@/utils/permissions'

// Navigation item type
interface NavItem {
  name: string
  href: string
  icon: any
  roles: string[]
}

// Main navigation items (Admin & Teacher)
const mainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'teacher'] },
  { name: 'Ученици', href: '/students', icon: Users, roles: ['admin', 'teacher'] },
  { name: 'Домашни', href: '/homework', icon: BookOpen, roles: ['admin', 'teacher'] },
  { name: 'Родители', href: '/parents', icon: Users, roles: ['admin', 'teacher'] },
  { name: 'Плащания', href: '/payments', icon: CreditCard, roles: ['admin', 'teacher', 'parent'] },
  { name: 'Разходи', href: '/expenses', icon: TrendingDown, roles: ['admin', 'teacher'] },
  { name: 'Склад', href: '/inventory', icon: Package, roles: ['admin', 'teacher'] },
  { name: 'Присъствия', href: '/attendance', icon: UserCheck, roles: ['admin', 'teacher'] },
  { name: 'Події', href: '/events', icon: Calendar, roles: ['admin', 'teacher', 'parent'] },
  { name: 'Отстъпки', href: '/discounts', icon: Percent, roles: ['admin', 'teacher'] },
  { name: 'Репорти', href: '/reports', icon: FileText, roles: ['admin', 'teacher'] },
  { name: 'Настройки', href: '/settings', icon: Settings, roles: ['admin'] },
  { name: '⚠️ Грешки', href: '/errors', icon: AlertTriangle, roles: ['admin', 'teacher'] },
]

// Parent-specific navigation
const parentNavigation: NavItem[] = [
  { name: 'Начало', href: '/', icon: LayoutDashboard, roles: ['parent'] },
  { name: 'Моите деца', href: '/my-children', icon: Users, roles: ['parent'] },
  { name: 'Плащания', href: '/payments', icon: CreditCard, roles: ['parent'] },
  { name: 'Події', href: '/events', icon: Calendar, roles: ['parent'] },
]

// Admin-only navigation
const adminNavigation: NavItem[] = [
  { name: '👑 Admin Panel', href: '/admin', icon: Shield, roles: ['admin'] },
]

export default function Layout() {
  const { userData, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Get user role
  const userRole = userData?.role || 'parent'

  // Filter navigation based on user role
  const getNavigation = () => {
    if (userRole === 'parent') {
      return parentNavigation
    }

    // For admin and teacher, combine main navigation with admin navigation if applicable
    const nav = mainNavigation.filter(item => item.roles.includes(userRole))

    if (isAdmin(userRole)) {
      return [...nav, ...adminNavigation]
    }

    return nav
  }

  const navigation = getNavigation()

  // Mobile navigation also filtered by role
  const getMobileNavigation = () => {
    if (userRole === 'parent') {
      return [
        { name: 'Начало', href: '/', icon: LayoutDashboard },
        { name: 'Деца', href: '/my-children', icon: Users },
        { name: 'Плащания', href: '/payments', icon: CreditCard },
        { name: 'Події', href: '/events', icon: Calendar },
      ]
    }

    return [
      { name: 'Начало', href: '/', icon: LayoutDashboard },
      { name: 'Ученици', href: '/students', icon: Users },
      { name: 'Плащания', href: '/payments', icon: CreditCard },
      { name: 'Події', href: '/events', icon: Calendar },
      { name: 'Още', href: '/more', icon: Menu },
    ]
  }

  const mobileNavigation = getMobileNavigation()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
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
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all touch-manipulation ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
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
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
                <span className={`badge text-xs ${getRoleBadgeColor(userRole)}`}>
                  {getRoleDisplayName(userRole)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn btn-ghost w-full justify-start touch-manipulation"
          >
            <LogOut className="w-5 h-5" />
            Изход
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30 safe-area-inset-top">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg active:bg-gray-200 touch-manipulation"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className="text-xl">💡</span>
            <span className="font-bold text-gray-900">Светлинки CRM</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
        <div className={`grid h-16 ${mobileNavigation.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {mobileNavigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href === '/more' && !mobileNavigation.slice(0, 4).some(nav => nav.href === location.pathname))

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-1 touch-manipulation transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-600 active:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
