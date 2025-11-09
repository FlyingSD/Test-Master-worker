import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import Layout from '@/components/Layout'
import DashboardPage from '@/pages/DashboardPage'
import StudentsPage from '@/pages/StudentsPage'
import PaymentsPage from '@/pages/PaymentsPage'
import EventsPage from '@/pages/EventsPage'

// Placeholder pages (will be created later)
const ExpensesPage = () => <div className="p-6">Разходи страница - в разработка</div>
const AttendancePage = () => <div className="p-6">Присъствия страница - в разработка</div>
const ParentsPage = () => <div className="p-6">Родители страница - в разработка</div>
const DiscountsPage = () => <div className="p-6">Отстъпки страница - в разработка</div>
const ReportsPage = () => <div className="p-6">Репорти страница - в разработка</div>
const SettingsPage = () => <div className="p-6">Настройки страница - в разработка</div>

export default function App() {
  const { user, loading } = useAuth()

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
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="discounts" element={<DiscountsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
