import { Users, CreditCard, BookOpen, AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useStudentsByParent } from '@/hooks/useStudents'
import { usePaymentsByParent } from '@/hooks/usePayments'
import { useHomeworkByStudent } from '@/hooks/useHomework'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function MyChildrenPage() {
  const { user, userData, isParent } = useAuth()
  const { students, loading: studentsLoading } = useStudentsByParent(user?.uid || '')

  // 🔒 SECURITY FIX: Use specialized hook that only loads THIS parent's payments (server-side filtered)
  // BEFORE: usePayments() loaded ALL families' payments ❌ PRIVACY VIOLATION!
  // AFTER: usePaymentsByParent() loads only this parent's children's payments ✅
  const { payments: myPayments, loading: paymentsLoading } = usePaymentsByParent(user?.uid || '')

  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // 🔒 SECURITY: Only parents can access their children's page
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

  const today = new Date()

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Моите деца</h1>
        <p className="text-gray-600 mt-1">
          Преглед на информация за всички деца
        </p>
      </div>

      {/* Children List */}
      {students.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Няма добавени деца</p>
          <p className="text-sm text-gray-500 mt-2">
            Свържете се с администратора за добавяне на деца към вашия профил
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {students.map((student) => {
            const dueDate = student.dueDate instanceof Date ? student.dueDate : student.dueDate?.toDate?.()
            const isOverdue = dueDate && dueDate < today

            // Get payments for this student
            const studentPayments = myPayments
              .filter(p => p.studentId === student.id)
              .sort((a, b) => {
                const dateA = a.date instanceof Date ? a.date : a.date?.toDate?.() || new Date(0)
                const dateB = b.date instanceof Date ? b.date : b.date?.toDate?.() || new Date(0)
                return dateB.getTime() - dateA.getTime()
              })
              .slice(0, 3)

            const totalPaid = myPayments
              .filter(p => p.studentId === student.id)
              .reduce((sum, p) => sum + p.amount, 0)

            const isExpanded = expandedStudent === student.id

            return (
              <div key={student.id} className="card hover:shadow-lg transition-shadow">
                {/* Student Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">
                        {student.group} • {student.studyType}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Месечна такса: {formatCurrency(student.fee)}
                      </p>
                    </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isOverdue
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isOverdue ? (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Просрочено
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Платено
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      Падеж
                    </div>
                    <p className="font-semibold text-gray-900">
                      {dueDate ? formatDate(dueDate) : 'Няма'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <CreditCard className="w-4 h-4" />
                      Платено общо
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>
                </div>

                {/* Recent Payments */}
                {studentPayments.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                      className="text-sm font-medium text-primary hover:text-primary-hover mb-2 flex items-center gap-1"
                    >
                      {isExpanded ? '▼' : '▶'} Последни плащания ({studentPayments.length})
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 animate-fade-in">
                        {studentPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {payment.article || 'Месечна такса'}
                              </p>
                              <p className="text-gray-600">
                                {formatDate(payment.date)} • {payment.method}
                              </p>
                            </div>
                            <p className="font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Link
                  to={`/my-children/${student.id}`}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Виж детайли и домашни
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary Card */}
      {students.length > 0 && (
        <div className="card bg-primary-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Общо деца</p>
              <p className="text-3xl font-bold text-primary">{students.length}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-1">Общо платено</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(myPayments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
