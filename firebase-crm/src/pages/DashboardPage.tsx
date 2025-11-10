import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  AlertCircle,
  CreditCard,
  Activity,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudents } from '@/hooks/useStudents'
import { usePayments } from '@/hooks/usePayments'
import { useExpenses } from '@/hooks/useExpenses'
import { useTodayEvents } from '@/hooks/useEvents'
import { formatCurrency, formatDate, isOverdue } from '@/utils/formatters'
import { Link } from 'react-router-dom'
import RevenueExpensesChart from '@/components/RevenueExpensesChart'
import ExpensesByCategoryChart from '@/components/ExpensesByCategoryChart'

export default function DashboardPage() {
  const { isAdmin } = useAuth()
  const { students } = useStudents()
  const { payments } = usePayments()
  const { expenses } = useExpenses()
  const { events: todayEvents } = useTodayEvents()

  // Calculate stats
  const activeStudents = students.filter((s) => s.status === 'active')
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const profit = totalRevenue - totalExpenses

  // Overdue payments - students with past due dates
  const overduePayments = activeStudents.filter((s) => {
    const dueDate = s.dueDate instanceof Date ? s.dueDate : s.dueDate.toDate()
    return isOverdue(dueDate)
  })

  // Upcoming payments - next 7 days
  const upcomingPayments = activeStudents.filter((s) => {
    const dueDate = s.dueDate instanceof Date ? s.dueDate : s.dueDate.toDate()
    const now = new Date()
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate > now && dueDate <= weekLater
  })

  // Stats - admins see financial data, teachers see only operational data
  const stats = isAdmin ? [
    {
      name: 'Общи приходи',
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Общи разходи',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Печалба',
      value: formatCurrency(profit),
      icon: Wallet,
      color: profit >= 0 ? 'text-primary' : 'text-red-600',
      bgColor: profit >= 0 ? 'bg-primary-light' : 'bg-red-50',
    },
    {
      name: 'Активни ученици',
      value: activeStudents.length.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ] : [
    {
      name: 'Активни ученици',
      value: activeStudents.length.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Добре дошли в Светлинки CRM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card card-hover">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts - Only admins see financial charts */}
      {isAdmin && (payments.length > 0 || expenses.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueExpensesChart />
          <ExpensesByCategoryChart />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-light rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Днешни уроци</h2>
          </div>
          <div className="space-y-3">
            {todayEvents.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Няма уроци за днес</p>
              </div>
            ) : (
              todayEvents.slice(0, 3).map((event) => {
                const startTime = event.startTime instanceof Date
                  ? event.startTime
                  : event.startTime.toDate()
                return (
                  <div
                    key={event.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {startTime.toLocaleTimeString('bg-BG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {event.group && ` • ${event.group}`}
                    </p>
                  </div>
                )
              })
            )}
            {todayEvents.length > 3 && (
              <Link to="/events" className="block text-center text-primary hover:text-primary-hover text-sm font-medium">
                Виж всички ({todayEvents.length})
              </Link>
            )}
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Просрочени плащания
            </h2>
          </div>
          <div className="space-y-3">
            {overduePayments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Няма просрочени плащания</p>
              </div>
            ) : (
              overduePayments.slice(0, 3).map((student) => (
                <div
                  key={student.id}
                  className="p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-red-600">
                    Падеж: {formatDate(student.dueDate)} • {formatCurrency(student.fee)}
                  </p>
                </div>
              ))
            )}
            {overduePayments.length > 3 && (
              <Link to="/students" className="block text-center text-red-600 hover:text-red-700 text-sm font-medium">
                Виж всички ({overduePayments.length})
              </Link>
            )}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Предстоящи плащания (7 дни)
            </h2>
          </div>
          <div className="space-y-3">
            {upcomingPayments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Няма предстоящи плащания</p>
              </div>
            ) : (
              upcomingPayments.slice(0, 3).map((student) => (
                <div
                  key={student.id}
                  className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-yellow-700">
                    Падеж: {formatDate(student.dueDate)} • {formatCurrency(student.fee)}
                  </p>
                </div>
              ))
            )}
            {upcomingPayments.length > 3 && (
              <Link to="/students" className="block text-center text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                Виж всички ({upcomingPayments.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Последни плащания
          </h2>
        </div>
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма плащания за показване</p>
              <p className="text-sm mt-2">
                Започнете като добавите ученици и плащания
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{payment.studentName}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(payment.date)} • {payment.method}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              ))}
              {payments.length > 5 && (
                <Link
                  to="/payments"
                  className="block text-center text-primary hover:text-primary-hover text-sm font-medium pt-3"
                >
                  Виж всички плащания ({payments.length})
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Guide */}
      {students.length === 0 && payments.length === 0 && (
        <div className="card bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🚀 Първи стъпки
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/students" className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h3 className="font-semibold">Добавете ученици</h3>
              </div>
              <p className="text-sm text-gray-600">
                Започнете със създаването на профили на вашите ученици
              </p>
            </Link>
            <Link to="/payments" className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h3 className="font-semibold">Въведете плащания</h3>
              </div>
              <p className="text-sm text-gray-600">
                Проследявайте месечните такси и плащания
              </p>
            </Link>
            <Link to="/events" className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h3 className="font-semibold">Създайте събития</h3>
              </div>
              <p className="text-sm text-gray-600">
                Организирайте уроци и специални събития
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
