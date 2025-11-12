import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, TrendingDown, DollarSign, Calendar, FileText, FileDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses, useDeleteExpense, useTotalExpenses } from '@/hooks/useExpenses'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { exportExpensesToExcel } from '@/utils/excelExport'
import { usePagination } from '@/hooks/usePagination'
import { Expense } from '@/types'
import ExpenseModal from '@/components/ExpenseModal'
import Pagination from '@/components/Pagination'
import DateRangePicker from '@/components/DateRangePicker'

export default function ExpensesPage() {
  const { userData } = useAuth()

  // 🔒 SECURITY: Only admins can view business expenses
  if (userData?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const { expenses, loading } = useExpenses()
  const deleteExpense = useDeleteExpense()
  const totalExpenses = useTotalExpenses()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Get unique categories from expenses
  const categories = Array.from(new Set(expenses?.map((exp) => exp?.category)))

  // Filter expenses
  const filteredExpenses = expenses?.filter((expense) => {
    const matchesSearch = expense?.description.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      expense?.receiptNumber?.toLowerCase().includes(searchTerm?.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense?.category === categoryFilter

    // Date range filter
    let matchesDateRange = true
    if (startDate || endDate) {
      const expenseDate = expense?.date instanceof Date ? expense?.date : expense?.date.toDate()
      if (startDate && expenseDate < startDate) matchesDateRange = false
      if (endDate) {
        const endOfDay = new Date(endDate)
        endOfDay?.setHours(23, 59, 59, 999)
        if (expenseDate > endOfDay) matchesDateRange = false
      }
    }

    return matchesSearch && matchesCategory && matchesDateRange
  })

  // Pagination
  const {
    paginatedItems: paginatedExpenses,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    totalItems,
  } = usePagination(filteredExpenses, 20)

  // Calculate stats
  const expensesByCategory = expenses?.reduce((acc, exp) => {
    acc[exp?.category] = (acc[exp?.category] || 0) + exp?.amount
    return acc
  }, {} as Record<string, number>)

  const largestExpense = expenses?.length > 0 ? Math?.max(...expenses?.map((e) => e?.amount)) : 0
  const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0]

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsModalOpen(true)
  }

  const handleDelete = async (expenseId: string, description: string) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете "${description}"?`)) {
      await deleteExpense?.mutateAsync(expenseId)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingExpense(null)
  }

  const handleClearDateFilter = () => {
    setStartDate(null)
    setEndDate(null)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Наем': 'bg-purple-100 text-purple-800',
      'Ток': 'bg-yellow-100 text-yellow-800',
      'Вода': 'bg-blue-100 text-blue-800',
      'Интернет': 'bg-cyan-100 text-cyan-800',
      'Заплати': 'bg-green-100 text-green-800',
      'Материали': 'bg-orange-100 text-orange-800',
      'Реклама': 'bg-pink-100 text-pink-800',
      'Други': 'bg-gray-100 text-gray-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на разходи...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Разходи</h1>
          <p className="text-gray-600 mt-1">
            Управление на разходи и разходи
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportExpensesToExcel(filteredExpenses)}
            className="btn btn-ghost"
            disabled={filteredExpenses?.length === 0}
          >
            <FileDown className="w-5 h-5" />
            Експорт Excel
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Добави разход
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Общо разходи</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Брой разходи</p>
              <p className="text-2xl font-bold text-gray-900">{expenses?.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Най-голям разход</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(largestExpense)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Топ категория</p>
              <p className="text-sm font-bold text-gray-900">
                {topCategory ? topCategory[0] : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {topCategory ? formatCurrency(topCategory[1]) : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Търсене по описание или номер на документ..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`btn ${
                categoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Всички ({expenses?.length})
            </button>
            {categories?.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`btn ${
                  categoryFilter === category ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                {category} ({expenses?.filter((e) => e?.category === category).length})
              </button>
            ))}
          </div>

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

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        {filteredExpenses?.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени разходи
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като добавите първия разход'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави първи разход
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
                  <th>Категория</th>
                  <th>Описание</th>
                  <th>Сума</th>
                  <th>Документ</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses?.map((expense) => (
                  <tr key={expense?.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {formatDate(expense?.date)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getCategoryColor(expense?.category)}`}>
                        {expense?.category}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900 max-w-xs truncate">
                        {expense?.description}
                      </p>
                    </td>
                    <td>
                      <p className="font-bold text-red-600">
                        {formatCurrency(expense?.amount)}
                      </p>
                    </td>
                    <td>
                      {expense?.receiptNumber ? (
                        <span className="text-sm text-gray-600">
                          {expense?.receiptNumber}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Редактиране"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense?.id, expense?.description)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Изтриване"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
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

      {/* Expense Modal */}
      {isModalOpen && (
        <ExpenseModal
          expense={editingExpense}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
