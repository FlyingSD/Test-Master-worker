import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  AlertCircle,
  CreditCard,
  Activity,
  Plus,
  UserPlus,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudents } from '@/hooks/useStudents'
import { usePayments } from '@/hooks/usePayments'
import { useExpenses } from '@/hooks/useExpenses'
import { useTodayEvents } from '@/hooks/useEvents'
import { useHomework } from '@/hooks/useHomework'
import { useAttendance } from '@/hooks/useAttendance'
import { formatCurrency, formatDate, isOverdue } from '@/utils/formatters'
import { Link, useNavigate } from 'react-router-dom'
import RevenueExpensesChart from '@/components/RevenueExpensesChart'
import ExpensesByCategoryChart from '@/components/ExpensesByCategoryChart'
import { useMemo, useState } from 'react'

type ActivityItem = {
  id: string
  type: 'payment' | 'homework' | 'attendance'
  title: string
  subtitle: string
  timestamp: Date
  icon: any
  color: string
  bgColor: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { isAdmin, isTeacher, isParent, userData } = useAuth()
  const { students } = useStudents()
  const { payments } = usePayments()
  const { expenses } = useExpenses()
  const { events: todayEvents } = useTodayEvents()
  const { homework } = useHomework()
  const { attendance } = useAttendance()
  const [activityFilter, setActivityFilter] = useState<'all' | 'payment' | 'homework' | 'attendance'>('all')

  // 🔒 SECURITY: Filter data by role
  const myStudentIds = useMemo(() => {
    if (isParent && userData?.studentIds) {
      return userData?.studentIds
    }
    return []
  }, [isParent, userData?.studentIds])

  // Filter data based on role
  const visiblePayments = useMemo(() => {
    if (isAdmin || isTeacher) return payments
    if (isParent) return payments?.filter(p => myStudentIds?.includes(p?.studentId))
    return []
  }, [isAdmin, isTeacher, isParent, payments, myStudentIds])

  const visibleHomework = useMemo(() => {
    if (isAdmin || isTeacher) return homework
    if (isParent) return homework?.filter(h => myStudentIds?.includes(h?.studentId))
    return []
  }, [isAdmin, isTeacher, isParent, homework, myStudentIds])

  const visibleAttendance = useMemo(() => {
    if (isAdmin || isTeacher) return attendance
    if (isParent) return attendance?.filter(a => myStudentIds?.includes(a?.studentId))
    return []
  }, [isAdmin, isTeacher, isParent, attendance, myStudentIds])

  // Calculate stats (only for admins)
  const activeStudents = students?.filter((s) => s?.status === 'active')
  const totalRevenue = isAdmin ? payments?.reduce((sum, p) => sum + p?.amount, 0) : 0
  const totalExpenses = isAdmin ? expenses?.reduce((sum, e) => sum + e?.amount, 0) : 0
  const profit = totalRevenue - totalExpenses

  // Overdue payments - students with past due dates
  const overduePayments = activeStudents?.filter((s) => {
    const dueDate = s?.dueDate instanceof Date ? s?.dueDate : s?.dueDate.toDate()
    return isOverdue(dueDate)
  })

  // Upcoming payments - next 7 days
  const upcomingPayments = activeStudents?.filter((s) => {
    const dueDate = s?.dueDate instanceof Date ? s?.dueDate : s?.dueDate.toDate()
    const now = new Date()
    const weekLater = new Date(now?.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate > now && dueDate <= weekLater
  })

  // Recent Activity Feed - combines payments, homework, and attendance
  // 🔒 SECURITY: Uses filtered data based on user role
  const recentActivity = useMemo(() => {
    const activities: ActivityItem[] = []

    // Add payments (filtered by role)
    visiblePayments?.slice(0, 10).forEach(payment => {
      const paymentDate = payment?.date instanceof Date ? payment?.date : payment?.date?.toDate?.()
      if (paymentDate) {
        activities?.push({
          id: `payment-${payment?.id}`,
          type: 'payment',
          title: `${payment?.studentName} - Плащане`,
          subtitle: `${formatCurrency(payment?.amount)} • ${payment?.method}`,
          timestamp: paymentDate,
          icon: CreditCard,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        })
      }
    })

    // Add homework (filtered by role)
    visibleHomework?.slice(0, 10).forEach(hw => {
      const hwDate = hw?.completedDate
        ? (hw?.completedDate instanceof Date ? hw?.completedDate : hw?.completedDate?.toDate?.())
        : (hw?.assignedDate instanceof Date ? hw?.assignedDate : hw?.assignedDate?.toDate?.())

      if (hwDate) {
        activities?.push({
          id: `homework-${hw?.id}`,
          type: 'homework',
          title: `${hw?.studentName} - ${hw?.title}`,
          subtitle: hw?.status === 'completed'
            ? `Завършено${hw?.grade ? ` • Оценка: ${hw?.grade}` : ''}`
            : `Зададено • Краен срок: ${formatDate(hw?.dueDate)}`,
          timestamp: hwDate,
          icon: BookOpen,
          color: hw?.status === 'completed' ? 'text-blue-600' : 'text-orange-600',
          bgColor: hw?.status === 'completed' ? 'bg-blue-50' : 'bg-orange-50'
        })
      }
    })

    // Add attendance (filtered by role)
    visibleAttendance?.slice(0, 10).forEach(att => {
      const attDate = att?.date instanceof Date ? att?.date : att?.date?.toDate?.()
      if (attDate) {
        const statusConfig: Record<string, any> = {
          present: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Присъствал' },
          absent: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Отсъствал' },
          late: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Закъснял' },
          excused: { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Извинено' },
          default: { icon: HelpCircle, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Неизвестен' }
        }
        const config = statusConfig[att?.status] || statusConfig.default

        activities?.push({
          id: `attendance-${att?.id}`,
          type: 'attendance',
          title: `${att?.studentName} - Присъствие`,
          subtitle: `${config.label}${att?.notes ? ` • ${att?.notes}` : ''}`,
          timestamp: attDate,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor
        })
      }
    })

    // Sort by timestamp descending
    return activities?.sort((a, b) => b?.timestamp.getTime() - a?.timestamp.getTime())
  }, [visiblePayments, visibleHomework, visibleAttendance])

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return recentActivity
    return recentActivity?.filter(a => a?.type === activityFilter)
  }, [recentActivity, activityFilter])

  // Quick actions for admins/teachers
  const quickActions = [
    {
      label: 'Добави ученик',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      onClick: () => navigate('/students')
    },
    {
      label: 'Добави плащане',
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      onClick: () => navigate('/payments')
    },
    {
      label: 'Добави домашно',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      onClick: () => navigate('/homework')
    },
    {
      label: 'Добави събитие',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      onClick: () => navigate('/events')
    }
  ]

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
      value: activeStudents?.length.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ] : [
    {
      name: 'Активни ученици',
      value: activeStudents?.length.toString(),
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

      {/* Quick Actions - Only for admins and teachers */}
      {(isAdmin || isTeacher) && (
        <div className="card bg-gradient-to-r from-primary/5 to-accent/5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Бързи действия
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions?.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action?.label}
                  onClick={action?.onClick}
                  className={`flex items-center gap-3 p-4 ${action?.bgColor} ${action?.hoverColor} rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md group`}
                >
                  <div className={`p-2 bg-white rounded-lg ${action?.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900 text-sm">{action?.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats?.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat?.name} className="card card-hover">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat?.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat?.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat?.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat?.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts - Only admins see financial charts */}
      {isAdmin && (payments?.length > 0 || expenses?.length > 0) && (
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
            {todayEvents?.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Няма уроци за днес</p>
              </div>
            ) : (
              todayEvents?.slice(0, 3).map((event) => {
                const startTime = event?.startTime instanceof Date
                  ? event?.startTime
                  : event?.startTime.toDate()
                return (
                  <div
                    key={event?.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{event?.title}</p>
                    <p className="text-sm text-gray-600">
                      {startTime?.toLocaleTimeString('bg-BG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {event?.group && ` • ${event?.group}`}
                    </p>
                  </div>
                )
              })
            )}
            {todayEvents?.length > 3 && (
              <Link to="/events" className="block text-center text-primary hover:text-primary-hover text-sm font-medium">
                Виж всички ({todayEvents?.length})
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
            {overduePayments?.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Няма просрочени плащания</p>
              </div>
            ) : (
              overduePayments?.slice(0, 3).map((student) => (
                <div
                  key={student?.id}
                  className="p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <p className="font-medium text-gray-900">{student?.name}</p>
                  <p className="text-sm text-red-600">
                    Падеж: {formatDate(student?.dueDate)} • {formatCurrency(student?.fee)}
                  </p>
                </div>
              ))
            )}
            {overduePayments?.length > 3 && (
              <Link to="/students" className="block text-center text-red-600 hover:text-red-700 text-sm font-medium">
                Виж всички ({overduePayments?.length})
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
            {upcomingPayments?.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Няма предстоящи плащания</p>
              </div>
            ) : (
              upcomingPayments?.slice(0, 3).map((student) => (
                <div
                  key={student?.id}
                  className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <p className="font-medium text-gray-900">{student?.name}</p>
                  <p className="text-sm text-yellow-700">
                    Падеж: {formatDate(student?.dueDate)} • {formatCurrency(student?.fee)}
                  </p>
                </div>
              ))
            )}
            {upcomingPayments?.length > 3 && (
              <Link to="/students" className="block text-center text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                Виж всички ({upcomingPayments?.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Recent Activity Feed */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Последна активност
            </h2>
          </div>

          {/* Activity Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActivityFilter('all')}
              className={`px-3 py-1?.5 rounded-lg text-sm font-medium transition-colors ${
                activityFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Всички
            </button>
            <button
              onClick={() => setActivityFilter('payment')}
              className={`px-3 py-1?.5 rounded-lg text-sm font-medium transition-colors ${
                activityFilter === 'payment'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Плащания
            </button>
            <button
              onClick={() => setActivityFilter('homework')}
              className={`px-3 py-1?.5 rounded-lg text-sm font-medium transition-colors ${
                activityFilter === 'homework'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Домашни
            </button>
            <button
              onClick={() => setActivityFilter('attendance')}
              className={`px-3 py-1?.5 rounded-lg text-sm font-medium transition-colors ${
                activityFilter === 'attendance'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Присъствия
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredActivities?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма активност за показване</p>
              <p className="text-sm mt-2">
                Започнете като добавите ученици, плащания и домашни
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities?.slice(0, 10).map((activity) => {
                const Icon = activity?.icon
                return (
                  <div
                    key={activity?.id}
                    className={`flex items-center gap-4 p-3 ${activity?.bgColor} rounded-lg hover:shadow-sm transition-shadow`}
                  >
                    <div className={`p-2 bg-white rounded-lg ${activity?.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{activity?.title}</p>
                      <p className="text-sm text-gray-600 truncate">{activity?.subtitle}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {activity?.timestamp.toLocaleDateString('bg-BG', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {activity?.timestamp.toLocaleTimeString('bg-BG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
              {recentActivity?.length > 10 && (
                <div className="text-center pt-3">
                  <p className="text-sm text-gray-500">
                    Показани {Math?.min(10, filteredActivities?.length)} от {recentActivity?.length} активности
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Guide */}
      {students?.length === 0 && payments?.length === 0 && (
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
