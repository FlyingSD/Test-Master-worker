import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoginPage from '@/pages/LoginPage'
import Layout from '@/components/Layout'
import DashboardPage from '@/pages/DashboardPage'
import ParentDashboardPage from '@/pages/ParentDashboardPage'
import StudentsPage from '@/pages/StudentsPage'
import PaymentsPage from '@/pages/PaymentsPage'
import EventsPage from '@/pages/EventsPage'
import DiscountsPage from '@/pages/DiscountsPage'
import ReportsPage from '@/pages/ReportsPage'
import AdminPanelPage from '@/pages/AdminPanelPage'
import ParentsPage from '@/pages/ParentsPage'
import InventoryPage from '@/pages/InventoryPage'
import ExpensesPage from '@/pages/ExpensesPage'
import SettingsPage from '@/pages/SettingsPage'
import AttendancePage from '@/pages/AttendancePage'
import ErrorDashboardPage from '@/pages/ErrorDashboardPage'
import MyChildrenPage from '@/pages/MyChildrenPage'
import MyChildDetailPage from '@/pages/MyChildDetailPage'
import HomeworkPage from '@/pages/HomeworkPage'

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
            <Route index element={isParent ? <ParentDashboardPage /> : <DashboardPage />} />
            <Route path="my-children" element={<MyChildrenPage />} />
            <Route path="my-children/:id" element={<MyChildDetailPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="parents" element={<ParentsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="discounts" element={<DiscountsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPanelPage />} />
            <Route path="errors" element={<ErrorDashboardPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
