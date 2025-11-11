import { useState, useEffect } from 'react'
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
import { useNotifications } from '@/hooks/useNotifications'
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions'
import { useLabels } from '@/hooks/useLabels'
import { isAdmin, getRoleDisplayName, getRoleBadgeColor } from '@/utils/permissions'
import { triggerHaptic } from '@/utils/touchGestures'
import { FeatureName, SystemSettings } from '@/types'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Navigation item type
interface NavItem {
  name: string
  href: string
  icon: any
  roles: string[]
  feature?: FeatureName // Optional feature name for permission check
}

// Main navigation items generator (Admin & Teacher)
const getMainNavigation = (labels: any): NavItem[] => [
  { name: labels?.navigation.dashboard, href: '/', icon: LayoutDashboard, roles: ['admin', 'teacher'], feature: 'dashboard' },
  { name: labels?.navigation.students, href: '/students', icon: Users, roles: ['admin', 'teacher'], feature: 'students' },
  { name: labels?.navigation.groups, href: '/groups', icon: Users, roles: ['admin', 'teacher'], feature: 'groups' },
  { name: labels?.navigation.homework, href: '/homework', icon: BookOpen, roles: ['admin', 'teacher'], feature: 'homework' },
  { name: labels?.navigation.parents, href: '/parents', icon: Users, roles: ['admin', 'teacher'], feature: 'parents' },
  { name: labels?.navigation.payments, href: '/payments', icon: CreditCard, roles: ['admin', 'teacher', 'parent'], feature: 'payments' },
  { name: labels?.navigation.expenses, href: '/expenses', icon: TrendingDown, roles: ['admin', 'teacher'], feature: 'expenses' },
  { name: labels?.navigation.inventory, href: '/inventory', icon: Package, roles: ['admin', 'teacher'], feature: 'inventory' },
  { name: labels?.navigation.attendance, href: '/attendance', icon: UserCheck, roles: ['admin', 'teacher'], feature: 'attendance' },
  { name: labels?.navigation.events, href: '/events', icon: Calendar, roles: ['admin', 'teacher', 'parent'], feature: 'events' },
  { name: labels?.navigation.discounts, href: '/discounts', icon: Percent, roles: ['admin', 'teacher'], feature: 'discounts' },
  { name: labels?.navigation.reports, href: '/reports', icon: FileText, roles: ['admin', 'teacher'], feature: 'reports' },
  { name: labels?.navigation.settings, href: '/settings', icon: Settings, roles: ['admin'] }, // No feature check - admin only
  { name: labels?.navigation.errors, href: '/errors', icon: AlertTriangle, roles: ['admin', 'teacher'], feature: 'errors' },
]

// Parent-specific navigation generator
const getParentNavigation = (labels: any): NavItem[] => [
  { name: labels?.navigation.dashboard, href: '/', icon: LayoutDashboard, roles: ['parent'], feature: 'dashboard' },
  { name: labels?.navigation.myChildren, href: '/my-children', icon: Users, roles: ['parent'], feature: 'my-children' },
  { name: labels?.navigation.payments, href: '/payments', icon: CreditCard, roles: ['parent'], feature: 'payments' },
  { name: labels?.navigation.events, href: '/events', icon: Calendar, roles: ['parent'], feature: 'events' },
]

// Admin-only navigation generator
const getAdminNavigation = (labels: any): NavItem[] => [
  { name: labels?.navigation.adminPanel, href: '/admin', icon: Shield, roles: ['admin'] },
]

export default function Layout() {
  const { userData, signOut } = useAuth()
  const { total, hasNotifications } = useNotifications()
  const { hasFeatureAccess, loading: permissionsLoading } = useFeaturePermissions()
  const { labels } = useLabels()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settings, setSettings] = useState<Partial<SystemSettings>>({})
  const location = useLocation()

  // Get user role
  const userRole = userData?.role || 'parent'

  // Load system settings for logo
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'system')
        const docSnap = await getDoc(docRef)
        if (docSnap?.exists()) {
          setSettings(docSnap?.data() as SystemSettings)
        }
      } catch (error) {
        console?.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  // Generate navigation items with labels
  const mainNavigation = getMainNavigation(labels)
  const parentNavigation = getParentNavigation(labels)
  const adminNavigation = getAdminNavigation(labels)

  // Filter navigation based on user role and feature permissions
  const getNavigation = () => {
    if (userRole === 'parent') {
      // Filter parent navigation by feature permissions
      return parentNavigation?.filter(item => {
        if (!item?.feature) return true // No feature check needed
        return hasFeatureAccess(item?.feature, userRole)
      })
    }

    // For admin and teacher, filter by role AND feature permissions
    const nav = mainNavigation?.filter(item => {
      // First check if role is allowed
      if (!item?.roles.includes(userRole)) return false

      // Then check feature permission (admins always pass this check)
      if (!item?.feature) return true // No feature check needed (e?.g., Settings)
      return hasFeatureAccess(item?.feature, userRole)
    })

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
        { name: labels?.navigation.dashboard, href: '/', icon: LayoutDashboard },
        { name: 'Деца', href: '/my-children', icon: Users },
        { name: labels?.navigation.payments, href: '/payments', icon: CreditCard },
        { name: labels?.navigation.events, href: '/events', icon: Calendar },
      ]
    }

    return [
      { name: labels?.navigation.dashboard, href: '/', icon: LayoutDashboard },
      { name: labels?.navigation.students, href: '/students', icon: Users },
      { name: labels?.navigation.payments, href: '/payments', icon: CreditCard },
      { name: labels?.navigation.events, href: '/events', icon: Calendar },
      { name: 'Още', href: '/more', icon: Menu },
    ]
  }

  const mobileNavigation = getMobileNavigation()

  const handleSignOut = async () => {
    triggerHaptic('medium')
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
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center overflow-hidden">
              {settings?.schoolLogo ? (
                <img
                  src={settings?.schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-2xl">💡</span>
              )}
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{settings?.schoolName || 'Светлинки'}</h1>
              <p className="text-xs text-gray-500">CRM System</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('tap')
              setSidebarOpen(false)
            }}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin h-[calc(100vh-180px)]">
          {navigation?.map((item) => (
            <NavLink
              key={item?.name}
              to={item?.href}
              end={item?.href === '/'}
              onClick={() => {
                triggerHaptic('light')
                setSidebarOpen(false)
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all touch-manipulation min-h-[44px] ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                }`
              }
            >
              <item?.icon className="w-5 h-5" />
              <span className="flex-1">{item?.name}</span>
              {/* Show notification badge for "Моите деца" */}
              {item?.href === '/my-children' && hasNotifications && (
                <span className="ml-auto px-2 py-0?.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                  {total}
                </span>
              )}
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
            onClick={() => {
              triggerHaptic('tap')
              setSidebarOpen(true)
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg active:bg-gray-200 touch-manipulation -ml-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            {settings?.schoolLogo ? (
              <img
                src={settings?.schoolLogo}
                alt="School Logo"
                className="w-8 h-8 object-contain"
              />
            ) : (
              <span className="text-xl">💡</span>
            )}
            <span className="font-bold text-gray-900">{settings?.schoolName || 'Светлинки'} CRM</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-3?.5rem)] lg:min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
        <div className={`grid h-16 ${mobileNavigation?.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {mobileNavigation?.map((item) => {
            const isActive = location?.pathname === item?.href ||
              (item?.href === '/more' && !mobileNavigation?.slice(0, 4).some(nav => nav?.href === location?.pathname))

            return (
              <NavLink
                key={item?.name}
                to={item?.href}
                onClick={() => triggerHaptic('tap')}
                className={`flex flex-col items-center justify-center gap-1 touch-manipulation transition-colors min-h-[56px] ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-600 active:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <item?.icon className="w-5 h-5" />
                  {/* Show notification badge for "Деца" (my-children) */}
                  {item?.href === '/my-children' && hasNotifications && (
                    <span className="absolute -top-2 -right-2 px-1?.5 py-0?.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] text-center">
                      {total}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item?.name}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
