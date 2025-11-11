import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Users, CreditCard, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudentsByParent } from '@/hooks/useStudents'
import { usePaymentsByParent } from '@/hooks/usePayments'
import { useHomeworkByStudent } from '@/hooks/useHomework'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { Link } from 'react-router-dom'

export default function ParentDashboardPage() {
  const { user, userData, isParent } = useAuth()
  const { students, loading: studentsLoading } = useStudentsByParent(user?.uid || '')

  // 🔒 SECURITY FIX: Use specialized hook that only loads THIS parent's payments (server-side filtered)
  // BEFORE: usePayments() loaded ALL families' payments ❌ PRIVACY/GDPR VIOLATION!
  // AFTER: usePaymentsByParent() loads only this parent's children's payments ✅
  const { payments: myPayments, loading: paymentsLoading } = usePaymentsByParent(user?.uid || '')

  // 🔒 SECURITY: Only parents should access parent dashboard
  if (userData && !isParent) {
    return <Navigate to="/" replace />
  }

  if (studentsLoading || paymentsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане...</p>
        </div>
      </div>
    )
  }

  // No need to manually filter - myPayments already filtered server-side ✅

  // Calculate total paid
  const totalPaid = myPayments?.reduce((sum, p) => sum + p?.amount, 0)

  // Calculate overdue (students with dueDate in the past)
  const today = new Date()
  const overdueStudents = students?.filter(s => {
    const dueDate = s?.dueDate instanceof Date ? s?.dueDate : s?.dueDate?.toDate?.()
    return dueDate && dueDate < today
  })

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Добре дошли!</h1>
        <p className="text-gray-600 mt-1">
          Преглед на вашите деца и плащания
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Моите деца</p>
              <p className="text-2xl font-bold text-gray-900">{students?.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Платено тази година</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${overdueStudents?.length > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <AlertCircle className={`w-6 h-6 ${overdueStudents?.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Просрочени</p>
              <p className="text-2xl font-bold text-gray-900">{overdueStudents?.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Children */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Моите деца</h2>
        </div>

        {students?.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Няма добавени деца</p>
          </div>
        ) : (
          <div className="space-y-4">
            {students?.map((student) => {
              const dueDate = student?.dueDate instanceof Date ? student?.dueDate : student?.dueDate?.toDate?.()
              const isOverdue = dueDate && dueDate < today

              return (
                <Link
                  key={student?.id}
                  to={`/my-children/${student?.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">
                            {student?.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{student?.name}</h3>
                          <p className="text-sm text-gray-600">
                            {student?.group} • {student?.studyType}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        isOverdue
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {isOverdue ? (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Просрочено
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Платено
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Падеж: {dueDate ? formatDate(dueDate) : 'Няма'}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Последни плащания</h2>

        {myPayments?.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Няма плащания</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myPayments?.slice(0, 5).map((payment) => {
              const student = students?.find(s => s?.id === payment?.studentId)
              return (
                <div key={payment?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student?.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(payment?.date)} • {payment?.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(payment?.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment?.article || 'Месечна такса'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {myPayments?.length > 5 && (
          <div className="mt-4 text-center">
            <Link to="/payments" className="text-primary hover:text-primary-hover font-medium">
              Виж всички →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
