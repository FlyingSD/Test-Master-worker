import { useState, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, User, CreditCard, BookOpen, Calendar, CheckCircle, Clock, AlertCircle, AlertTriangle, Printer, Filter, UserCheck, XCircle, HelpCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudentsByParent } from '@/hooks/useStudents'
import { usePayments } from '@/hooks/usePayments'
import { useHomeworkByStudent } from '@/hooks/useHomework'
import { useAttendanceByStudent, useAttendanceStats } from '@/hooks/useAttendance'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { getDueDateStatus, subtractDays } from '@/utils/date'
import { generatePaymentReceipt } from '@/utils/pdfGenerator'
import { triggerHaptic } from '@/utils/touchGestures'
import SwipeableCard from '@/components/SwipeableCard'

type PaymentPeriod = 'all' | '3months' | '6months' | '1year'
type AttendancePeriod = 'all' | '1month' | '3months' | '6months'

export default function MyChildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, userData, isParent } = useAuth()
  const { students, loading: studentsLoading } = useStudentsByParent(user?.uid || '')
  const { payments, loading: paymentsLoading } = usePayments()
  const { homework, loading: homeworkLoading } = useHomeworkByStudent(id || '')
  const { attendance, loading: attendanceLoading } = useAttendanceByStudent(id || '')
  const attendanceStats = useAttendanceStats(id || '')
  const [paymentPeriod, setPaymentPeriod] = useState<PaymentPeriod>('all')
  const [attendancePeriod, setAttendancePeriod] = useState<AttendancePeriod>('all')

  // Get the specific student
  const student = students?.find(s => s?.id === id)

  // 🔒 SECURITY: Only parents can access child detail pages
  if (userData && !isParent) {
    return <Navigate to="/" replace />
  }

  if (studentsLoading || paymentsLoading || homeworkLoading || attendanceLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане...</p>
        </div>
      </div>
    )
  }

  // Check if student exists and belongs to this parent
  if (!student) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ученикът не е намерен</h2>
          <p className="text-gray-600 mb-6">
            Този ученик не съществува или нямате достъп до него
          </p>
          <Link to="/my-children" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Обратно към моите деца
          </Link>
        </div>
      </div>
    )
  }

  // Filter payments for this student with date filtering
  const studentPayments = useMemo(() => {
    const today = new Date()
    let cutoffDate: Date | null = null

    // Calculate cutoff date based on selected period
    if (paymentPeriod === '3months') {
      cutoffDate = subtractDays(today, 90)
    } else if (paymentPeriod === '6months') {
      cutoffDate = subtractDays(today, 180)
    } else if (paymentPeriod === '1year') {
      cutoffDate = subtractDays(today, 365)
    }

    return payments
      .filter(p => {
        if (p?.studentId !== student?.id) return false

        // If filtering by period, check date
        if (cutoffDate) {
          const paymentDate = p?.date instanceof Date ? p?.date : p?.date?.toDate?.()
          if (!paymentDate) return false
          return paymentDate >= cutoffDate
        }

        return true
      })
      .sort((a, b) => {
        const dateA = a?.date instanceof Date ? a?.date : a?.date?.toDate?.() || new Date(0)
        const dateB = b?.date instanceof Date ? b?.date : b?.date?.toDate?.() || new Date(0)
        return dateB?.getTime() - dateA?.getTime()
      })
  }, [payments, student?.id, paymentPeriod])

  const totalPaid = useMemo(() => {
    return studentPayments?.reduce((sum, p) => sum + p?.amount, 0)
  }, [studentPayments])

  // Filter attendance records by period
  const filteredAttendance = useMemo(() => {
    const today = new Date()
    let cutoffDate: Date | null = null

    // Calculate cutoff date based on selected period
    if (attendancePeriod === '1month') {
      cutoffDate = subtractDays(today, 30)
    } else if (attendancePeriod === '3months') {
      cutoffDate = subtractDays(today, 90)
    } else if (attendancePeriod === '6months') {
      cutoffDate = subtractDays(today, 180)
    }

    return attendance?.filter(a => {
      // If filtering by period, check date
      if (cutoffDate) {
        const attendanceDate = a?.date instanceof Date ? a?.date : a?.date?.toDate?.()
        if (!attendanceDate) return false
        return attendanceDate >= cutoffDate
      }
      return true
    })
  }, [attendance, attendancePeriod])

  // Categorize homework
  const today = new Date()
  const assignedHomework = homework?.filter(h => h?.status === 'assigned')
  const completedHomework = homework?.filter(h => h?.status === 'completed')
  const overdueHomework = homework?.filter(h => {
    const dueDate = h?.dueDate instanceof Date ? h?.dueDate : h?.dueDate?.toDate?.()
    return h?.status === 'assigned' && dueDate && dueDate < today
  })

  // Payment status
  const dueDate = student?.dueDate instanceof Date ? student?.dueDate : student?.dueDate?.toDate?.()
  const isOverdue = dueDate && dueDate < today

  // Due date warnings for homework
  const criticalHomework = assignedHomework?.filter(hw => {
    const status = getDueDateStatus(hw?.dueDate)
    return status?.status === 'critical'
  })

  const warningHomework = assignedHomework?.filter(hw => {
    const status = getDueDateStatus(hw?.dueDate)
    return status?.status === 'warning'
  })

  // Payment due date status
  const paymentDueStatus = getDueDateStatus(dueDate)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link
          to="/my-children"
          onClick={() => triggerHaptic('tap')}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{student?.name}</h1>
          <p className="text-gray-600 mt-1">
            {student?.group} • {student?.studyType}
          </p>
        </div>
      </div>

      {/* Warning Alerts */}
      {(paymentDueStatus?.status === 'overdue' || paymentDueStatus?.status === 'critical' ||
        criticalHomework?.length > 0 || warningHomework?.length > 0) && (
        <div className="space-y-3">
          {/* Payment due warning */}
          {(paymentDueStatus?.status === 'overdue' || paymentDueStatus?.status === 'critical') && (
            <div className={`${paymentDueStatus?.bgColor} border-l-4 ${paymentDueStatus?.borderColor} p-4 rounded-lg`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 ${paymentDueStatus?.textColor} flex-shrink-0 mt-0?.5`} />
                <div className="flex-1">
                  <h3 className={`font-semibold ${paymentDueStatus?.textColor}`}>
                    {paymentDueStatus?.status === 'overdue' ? '⚠️ Просрочено плащане!' : '⏰ Падеж на плащане!'}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {paymentDueStatus?.message} • Месечна такса: {formatCurrency(student?.fee)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Critical homework (today or tomorrow) */}
          {criticalHomework?.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0?.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800">
                    🔥 Спешни домашни! ({criticalHomework?.length})
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {criticalHomework?.map(hw => {
                      const status = getDueDateStatus(hw?.dueDate)
                      return <span key={hw?.id} className="block">• {hw?.title} - {status?.message}</span>
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning homework (2-3 days) */}
          {warningHomework?.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0?.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">
                    ⏳ Предстоящи домашни ({warningHomework?.length})
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {warningHomework?.map(hw => {
                      const status = getDueDateStatus(hw?.dueDate)
                      return <span key={hw?.id} className="block">• {hw?.title} - {status?.message}</span>
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student Info Card */}
      <div className="card">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">
              {student?.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Група</p>
                <p className="font-semibold text-gray-900">{student?.group}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Тип обучение</p>
                <p className="font-semibold text-gray-900">{student?.studyType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Месечна такса</p>
                <p className="font-semibold text-gray-900">{formatCurrency(student?.fee)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Следващ падеж</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">
                    {dueDate ? formatDate(dueDate) : 'Няма'}
                  </p>
                  {isOverdue && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                      Просрочен
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Статус</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  student?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {student?.status === 'active' ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Homework Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Домашни</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueHomework?.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                🔴 {overdueHomework?.length} просрочени
              </span>
            )}
            {criticalHomework?.length > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                🔥 {criticalHomework?.length} спешни
              </span>
            )}
            {warningHomework?.length > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                ⏳ {warningHomework?.length} предстоящи
              </span>
            )}
            {assignedHomework?.length > 0 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                {assignedHomework?.length} общо активни
              </span>
            )}
          </div>
        </div>

        {homework?.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Няма зададени домашни</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Overdue homework first */}
            {overdueHomework?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Просрочени
                </h3>
                {overdueHomework?.map((hw) => {
                  const hwDueDate = hw?.dueDate instanceof Date ? hw?.dueDate : hw?.dueDate?.toDate?.()
                  return (
                    <div key={hw?.id} className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg mb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{hw?.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{hw?.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Краен срок: {hwDueDate ? formatDate(hwDueDate) : 'Няма'}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                          Просрочено
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Active homework */}
            {assignedHomework?.filter(h => !overdueHomework?.includes(h)).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Активни
                </h3>
                {assignedHomework?.filter(h => !overdueHomework?.includes(h)).map((hw) => {
                  const dueDateInfo = getDueDateStatus(hw?.dueDate)
                  const hwDueDate = hw?.dueDate instanceof Date ? hw?.dueDate : hw?.dueDate?.toDate?.()

                  return (
                    <div key={hw?.id} className={`p-4 ${dueDateInfo?.bgColor} border-l-4 ${dueDateInfo?.borderColor} rounded-lg mb-2`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{hw?.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{hw?.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Краен срок: {hwDueDate ? formatDate(hwDueDate) : 'Няма'}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 ${dueDateInfo?.bgColor} ${dueDateInfo?.textColor} text-sm font-medium rounded-full border ${dueDateInfo?.borderColor}`}>
                          {dueDateInfo?.message}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Completed homework */}
            {completedHomework?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Завършени ({completedHomework?.length})
                </h3>
                {completedHomework?.slice(0, 3).map((hw) => {
                  const hwCompletedDate = hw?.completedDate instanceof Date ? hw?.completedDate : hw?.completedDate?.toDate?.()
                  return (
                    <div key={hw?.id} className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg mb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{hw?.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{hw?.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Завършено: {hwCompletedDate ? formatDate(hwCompletedDate) : 'Няма дата'}</span>
                            {hw?.grade && <span>Оценка: {hw?.grade}</span>}
                          </div>
                          {hw?.teacherNotes && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              Коментар: {hw?.teacherNotes}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          Готово
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance History */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">История на присъствията</h2>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={attendancePeriod}
              onChange={(e) => setAttendancePeriod(e?.target.value as AttendancePeriod)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">Всички</option>
              <option value="1month">Последният месец</option>
              <option value="3months">Последните 3 месеца</option>
              <option value="6months">Последните 6 месеца</option>
            </select>
          </div>
        </div>

        {/* Attendance Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Общо уроци</p>
            <p className="text-2xl font-bold text-gray-900">{attendanceStats?.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-gray-600">Присъствал</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{attendanceStats?.present}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-gray-600">Отсъствал</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{attendanceStats?.absent}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-gray-600">Закъснял</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{attendanceStats?.late}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Процент присъствие</p>
            <p className="text-2xl font-bold text-purple-600">{attendanceStats?.attendanceRate}%</p>
          </div>
        </div>

        {/* Attendance List */}
        {filteredAttendance?.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Няма данни за присъствия</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAttendance?.map((record) => {
              const attendanceDate = record?.date instanceof Date ? record?.date : record?.date?.toDate?.()

              // Status configuration
              const statusConfig = {
                present: {
                  icon: CheckCircle,
                  label: 'Присъствал',
                  bgColor: 'bg-green-50',
                  textColor: 'text-green-800',
                  borderColor: 'border-green-500',
                  iconColor: 'text-green-600'
                },
                absent: {
                  icon: XCircle,
                  label: 'Отсъствал',
                  bgColor: 'bg-red-50',
                  textColor: 'text-red-800',
                  borderColor: 'border-red-500',
                  iconColor: 'text-red-600'
                },
                late: {
                  icon: Clock,
                  label: 'Закъснял',
                  bgColor: 'bg-yellow-50',
                  textColor: 'text-yellow-800',
                  borderColor: 'border-yellow-500',
                  iconColor: 'text-yellow-600'
                },
                excused: {
                  icon: HelpCircle,
                  label: 'Уважително отсъствие',
                  bgColor: 'bg-blue-50',
                  textColor: 'text-blue-800',
                  borderColor: 'border-blue-500',
                  iconColor: 'text-blue-600'
                }
              }

              const config = statusConfig[record?.status]
              const Icon = config?.icon

              return (
                <div
                  key={record?.id}
                  className={`flex items-center gap-4 p-4 ${config?.bgColor} border-l-4 ${config?.borderColor} rounded-lg`}
                >
                  <Icon className={`w-5 h-5 ${config?.iconColor} flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {attendanceDate ? formatDate(attendanceDate) : 'Няма дата'}
                    </p>
                    {record?.notes && (
                      <p className="text-sm text-gray-600 mt-1">{record?.notes}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 ${config?.bgColor} ${config?.textColor} text-sm font-medium rounded-full border ${config?.borderColor}`}>
                    {config?.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">История на плащанията</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Period Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={paymentPeriod}
                onChange={(e) => setPaymentPeriod(e?.target.value as PaymentPeriod)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">Всички</option>
                <option value="3months">Последните 3 месеца</option>
                <option value="6months">Последните 6 месеца</option>
                <option value="1year">Последната година</option>
              </select>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">Общо платено</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>

        {studentPayments?.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Няма плащания</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studentPayments?.slice(0, 10).map((payment) => {
              const paymentDate = payment?.date instanceof Date ? payment?.date : payment?.date?.toDate?.()
              return (
                <SwipeableCard
                  key={payment?.id}
                  enableSwipe={true}
                  onView={() => {
                    triggerHaptic('success')
                    generatePaymentReceipt(payment, student)
                  }}
                  className="rounded-lg"
                >
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {payment?.article || 'Месечна такса'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {paymentDate ? formatDate(paymentDate) : 'Няма дата'} • {payment?.method}
                      </p>
                      {payment?.notes && (
                        <p className="text-sm text-gray-500 mt-1">{payment?.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(payment?.amount)}
                      </p>
                      {payment?.receiptNumber && (
                        <p className="text-xs text-gray-500">№ {payment?.receiptNumber}</p>
                      )}
                    </div>
                    {/* Print Receipt Button - Touch-friendly size */}
                    <button
                      onClick={() => {
                        triggerHaptic('tap')
                        generatePaymentReceipt(payment, student)
                      }}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-primary-light rounded-lg transition-colors group"
                      title="Принтирай квитанция"
                    >
                      <Printer className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                    </button>
                  </div>
                </SwipeableCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
