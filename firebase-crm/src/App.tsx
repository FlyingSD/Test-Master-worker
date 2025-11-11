import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import ErrorBoundary from '@/components/ErrorBoundary'

// Eager load critical components
import LoginPage from '@/pages/LoginPage'
import Layout from '@/components/Layout'

// Lazy load all page components for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ParentDashboardPage = lazy(() => import('@/pages/ParentDashboardPage'))
const StudentsPage = lazy(() => import('@/pages/StudentsPage'))
const GroupsPage = lazy(() => import('@/pages/GroupsPage'))
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'))
const EventsPage = lazy(() => import('@/pages/EventsPage'))
const DiscountsPage = lazy(() => import('@/pages/DiscountsPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const AdminPanelPage = lazy(() => import('@/pages/AdminPanelPage'))
const ParentsPage = lazy(() => import('@/pages/ParentsPage'))
const InventoryPage = lazy(() => import('@/pages/InventoryPage'))
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const LabelsManagementPage = lazy(() => import('@/pages/LabelsManagementPage'))
const AttendancePage = lazy(() => import('@/pages/AttendancePage'))
const ErrorDashboardPage = lazy(() => import('@/pages/ErrorDashboardPage'))
const MyChildrenPage = lazy(() => import('@/pages/MyChildrenPage'))
const MyChildDetailPage = lazy(() => import('@/pages/MyChildDetailPage'))
const HomeworkPage = lazy(() => import('@/pages/HomeworkPage'))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-600">Зареждане...</p>
    </div>
  </div>
)

export default function App() {
  const { user, loading, isParent } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <LoginPage />}
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={user ? <Layout /> : <Navigate to="/login" replace />}
            >
              <Route
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    {isParent ? <ParentDashboardPage /> : <DashboardPage />}
                  </Suspense>
                }
              />
              <Route
                path="my-children"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MyChildrenPage />
                  </Suspense>
                }
              />
              <Route
                path="my-children/:id"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MyChildDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="students"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <StudentsPage />
                  </Suspense>
                }
              />
              <Route
                path="groups"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <GroupsPage />
                  </Suspense>
                }
              />
              <Route
                path="homework"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <HomeworkPage />
                  </Suspense>
                }
              />
              <Route
                path="payments"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PaymentsPage />
                  </Suspense>
                }
              />
              <Route
                path="expenses"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ExpensesPage />
                  </Suspense>
                }
              />
              <Route
                path="events"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <EventsPage />
                  </Suspense>
                }
              />
              <Route
                path="attendance"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AttendancePage />
                  </Suspense>
                }
              />
              <Route
                path="parents"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ParentsPage />
                  </Suspense>
                }
              />
              <Route
                path="inventory"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <InventoryPage />
                  </Suspense>
                }
              />
              <Route
                path="discounts"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DiscountsPage />
                  </Suspense>
                }
              />
              <Route
                path="reports"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ReportsPage />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
              <Route
                path="labels"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LabelsManagementPage />
                  </Suspense>
                }
              />
              <Route
                path="admin"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AdminPanelPage />
                  </Suspense>
                }
              />
              <Route
                path="errors"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ErrorDashboardPage />
                  </Suspense>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}
