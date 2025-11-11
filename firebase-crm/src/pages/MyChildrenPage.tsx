/**
 * My Children Page - Enhanced Version
 * Shows parent's linked children with payment info and QR sharing
 * Features:
 * - List of linked children with details
 * - Share QR code modal for adding additional parents
 * - Link another child button
 */

import { Users, CreditCard, Calendar, AlertCircle, CheckCircle, QrCode, Plus, Share2 } from 'lucide-react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useStudentsByParent } from '@/hooks/useStudents'
import { usePaymentsByParent } from '@/hooks/usePayments'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { useState, useEffect } from 'react'
import { triggerHaptic } from '@/utils/touchGestures'
import { generateQRCodeDataUrl } from '@/utils/qrCode'
import { Student } from '@/types'
import toast from 'react-hot-toast'

export default function MyChildrenPage() {
  const { user, userData, isParent } = useAuth()
  const { students, loading: studentsLoading } = useStudentsByParent(user?.uid || '')
  const { payments: myPayments, loading: paymentsLoading } = usePaymentsByParent(user?.uid || '')

  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [qrModalStudent, setQrModalStudent] = useState<Student | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

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

  const today = new Date()

  // Handle QR code sharing
  const handleShareQR = async (student: Student) => {
    setQrModalStudent(student)
    try {
      const qrUrl = await generateQRCodeDataUrl(student.studentCode)
      setQrCodeUrl(qrUrl)
    } catch (error: any) {
      console.error('Error generating QR code:', error)
      toast.error('Грешка при генериране на QR код')
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrl || !qrModalStudent) return

    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `QR-${qrModalStudent.name.replace(/\s+/g, '-')}-${qrModalStudent.studentCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR кодът е изтеглен')
  }

  const closeQRModal = () => {
    setQrModalStudent(null)
    setQrCodeUrl(null)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Моите деца</h1>
          <p className="text-gray-600 mt-1">
            Преглед на информация за всички деца
          </p>
        </div>
        {/* Link Another Child Button */}
        <Link
          to="/link-student"
          className="btn-primary flex items-center gap-2"
          onClick={() => triggerHaptic('tap')}
        >
          <Plus className="w-4 h-4" />
          Свържи друго дете
        </Link>
      </div>

      {/* Children List */}
      {students.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Няма добавени деца</p>
          <Link
            to="/link-student"
            className="btn-primary inline-flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Сканирай QR код за свързване
          </Link>
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
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        Код: {student.studentCode}
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
                      Месечна такса
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(student.fee)}
                    </p>
                  </div>
                </div>

                {/* Recent Payments */}
                {studentPayments.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        triggerHaptic('light')
                        setExpandedStudent(isExpanded ? null : student.id)
                      }}
                      className="text-sm font-medium text-primary hover:text-primary-hover mb-2 flex items-center gap-1 min-h-[44px]"
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
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <strong>Общо платено:</strong> {formatCurrency(totalPaid)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      triggerHaptic('tap')
                      handleShareQR(student)
                    }}
                    className="btn border-2 border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Share2 className="w-4 h-4" />
                    Сподели QR
                  </button>
                  <Link
                    to={`/my-children/${student.id}`}
                    onClick={() => triggerHaptic('tap')}
                    className="btn btn-primary flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    Детайли
                  </Link>
                </div>
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

      {/* QR Code Modal */}
      {qrModalStudent && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                QR Код за {qrModalStudent.name}
              </h3>
              <p className="text-gray-600 mb-6">
                Споделете този QR код с другия родител за да свърже детето към своя профил
              </p>

              {qrCodeUrl ? (
                <>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
                    <img
                      src={qrCodeUrl}
                      alt={`QR код за ${qrModalStudent.name}`}
                      className="mx-auto"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 text-left">
                    <p className="text-sm text-blue-900">
                      <strong>Код на ученик:</strong>{' '}
                      <span className="font-mono text-lg">{qrModalStudent.studentCode}</span>
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      Другият родител може да сканира този код или да въведе ръчно
                      кода в приложението
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadQR}
                      className="btn border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      Изтегли QR
                    </button>
                    <button
                      onClick={closeQRModal}
                      className="btn-primary"
                    >
                      Затвори
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Генериране на QR код...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
