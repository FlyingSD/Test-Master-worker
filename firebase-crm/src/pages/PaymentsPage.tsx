import { useState } from 'react'
import { Plus, Search, Edit, Trash2, CreditCard, TrendingUp, Calendar, FileDown, Users } from 'lucide-react'
import { usePayments, useDeletePayment } from '@/hooks/usePayments'
import { useAuth } from '@/hooks/useAuth'
import { useStudentsByParent } from '@/hooks/useStudents'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { exportPaymentsToExcel } from '@/utils/excelExport'
import { usePagination } from '@/hooks/usePagination'
import PaymentModal from '@/components/PaymentModal'
import BulkPaymentModal from '@/components/BulkPaymentModal'
import Pagination from '@/components/Pagination'
import DateRangePicker from '@/components/DateRangePicker'
import { Payment } from '@/types'

export default function PaymentsPage() {
  const { payments, loading } = usePayments()
  const deletePayment = useDeletePayment()
  const { user, isParent, isAdmin } = useAuth()
  const { students: myChildren } = useStudentsByParent(user?.uid || '')

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [filterArticle, setFilterArticle] = useState<string>('all')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // For parents: get list of their children's IDs
  const myChildrenIds = isParent ? myChildren?.map(s => s?.id) : []

  // Filter payments (including parent-specific filtering)
  const filteredPayments = payments?.filter((payment) => {
    // If parent, only show payments for their children
    if (isParent && !myChildrenIds?.includes(payment?.studentId)) {
      return false
    }
    const matchesSearch = payment?.studentName.toLowerCase().includes(searchTerm?.toLowerCase())
    const matchesMethod = filterMethod === 'all' || payment?.method === filterMethod
    const matchesArticle = filterArticle === 'all' || payment?.article === filterArticle

    // Date range filter
    let matchesDateRange = true
    if (startDate || endDate) {
      const paymentDate = payment?.date instanceof Date ? payment?.date : payment?.date.toDate()
      if (startDate && paymentDate < startDate) matchesDateRange = false
      if (endDate) {
        const endOfDay = new Date(endDate)
        endOfDay?.setHours(23, 59, 59, 999)
        if (paymentDate > endOfDay) matchesDateRange = false
      }
    }

    return matchesSearch && matchesMethod && matchesArticle && matchesDateRange
  })

  // Pagination
  const {
    paginatedItems: paginatedPayments,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    totalItems,
  } = usePagination(filteredPayments, 20)

  // 🔒 SECURITY: Stats - Only calculate financial totals for admins
  const totalRevenue = isAdmin ? payments?.reduce((sum, p) => sum + p?.amount, 0) : 0
  const thisMonth = isAdmin ? payments?.filter((p) => {
    const paymentDate = p?.date instanceof Date ? p?.date : p?.date.toDate()
    const now = new Date()
    return paymentDate?.getMonth() === now?.getMonth() && paymentDate?.getFullYear() === now?.getFullYear()
  }) : []
  const monthRevenue = isAdmin ? thisMonth?.reduce((sum, p) => sum + p?.amount, 0) : 0

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setIsModalOpen(true)
  }

  const handleDelete = async (paymentId: string, studentName: string) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете плащането на ${studentName}?`)) {
      await deletePayment?.mutateAsync(paymentId)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPayment(null)
  }

  const handleClearDateFilter = () => {
    setStartDate(null)
    setEndDate(null)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на плащания...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Плащания</h1>
          <p className="text-gray-600 mt-1">Проследяване на плащания и приходи</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportPaymentsToExcel(filteredPayments)}
            className="btn btn-ghost"
            disabled={filteredPayments?.length === 0}
          >
            <FileDown className="w-5 h-5" />
            Експорт Excel
          </button>
          {!isParent && (
            <>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="btn btn-ghost"
              >
                <Users className="w-5 h-5" />
                Групово плащане
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави плащане
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats - Only admins see financial statistics */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Общо приходи</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-xl">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Този месец</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(monthRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Брой плащания</p>
                <p className="text-2xl font-bold text-gray-900">{payments?.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Търсене по име на ученик..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target.value)}
            />
          </div>

          {/* Method filter */}
          <select
            className="input md:w-48"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e?.target.value)}
          >
            <option value="all">Всички методи</option>
            <option value="Кеш">Кеш</option>
            <option value="ПОС">ПОС</option>
            <option value="Банков път">Банков път</option>
            <option value="Фактура">Фактура</option>
          </select>

          {/* Article filter */}
          <select
            className="input md:w-48"
            value={filterArticle}
            onChange={(e) => setFilterArticle(e?.target.value)}
          >
            <option value="all">Всички артикули</option>
            <option value="">Такса</option>
            <option value="Абакус">Абакус</option>
            <option value="Учебна тетрадка">Учебна тетрадка</option>
            <option value="Други">Други</option>
          </select>

          {/* Date Range Filter */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={handleClearDateFilter}
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        {filteredPayments?.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени плащания
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като добавите първото си плащане'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави първо плащане
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Ученик</th>
                  <th>Сума</th>
                  <th>Артикул</th>
                  <th>Метод</th>
                  <th>Бележки</th>
                  {!isParent && <th>Действия</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedPayments?.map((payment) => (
                  <tr key={payment?.id}>
                    <td>{formatDate(payment?.date)}</td>
                    <td>
                      <div className="font-medium text-gray-900">
                        {payment?.studentName}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-green-600">
                          {formatCurrency(payment?.amount)}
                        </p>
                        {payment?.amountEUR && (
                          <p className="text-xs text-gray-500">
                            {formatCurrency(payment?.amountEUR, 'EUR')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      {payment?.article ? (
                        <span className="badge badge-primary">
                          {payment?.article}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Такса</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {payment?.method}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {payment?.notes || '-'}
                      </p>
                    </td>
                    {!isParent && (
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(payment)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Редактиране"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment?.id, payment?.studentName)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Изтриване"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
          </>
        )}
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <PaymentModal
          payment={editingPayment}
          onClose={handleCloseModal}
        />
      )}

      {/* Bulk Payment Modal */}
      {isBulkModalOpen && (
        <BulkPaymentModal
          onClose={() => setIsBulkModalOpen(false)}
        />
      )}
    </div>
  )
}
