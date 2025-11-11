import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useHomework, useDeleteHomework, useUpdateHomework } from '@/hooks/useHomework'
import { useStudents } from '@/hooks/useStudents'
import { formatDate } from '@/utils/formatters'
import { usePagination } from '@/hooks/usePagination'
import HomeworkModal from '@/components/HomeworkModal'
import Pagination from '@/components/Pagination'
import { Homework } from '@/types'
import toast from 'react-hot-toast'

/**
 * HomeworkPage - Dedicated page for teachers to manage all homework
 *
 * ARCHITECTURE PRINCIPLES:
 * - SSOT: Centralized homework data from useHomework hook
 * - PoLP: Only Teachers/Admins can access (enforced by hooks + UI)
 * - SoC: Separated stats, filters, table, and actions
 * - DRY: Reuses existing patterns from PaymentsPage/ExpensesPage
 * - Clean Code: Clear function names, logical sections
 * - RBAC: Role-based access control
 * - Loose Coupling: Uses hooks, not direct Firestore
 */

export default function HomeworkPage() {
  // ============================================================================
  // HOOKS & STATE
  // ============================================================================

  const { userData, isAdmin, isTeacher } = useAuth()
  const { homework, loading } = useHomework()
  const { students } = useStudents()
  const deleteHomework = useDeleteHomework()
  const updateHomework = useUpdateHomework()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null)

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'completed' | 'overdue'>('all')
  const [filterDueDate, setFilterDueDate] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all')

  // Grade input state (for Mark Complete quick action)
  const [gradeInputs, setGradeInputs] = useState<Record<string, number | undefined>>({})

  // ============================================================================
  // SECURITY: Access Control (PoLP)
  // ============================================================================

  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  // ============================================================================
  // COMPUTED VALUES & FILTERING (SoC: Business Logic)
  // ============================================================================

  /**
   * Filter homework based on search term, status, and due date
   */
  const filteredHomework = useMemo(() => {
    return homework?.filter((hw) => {
      // Search filter: title, description, or student name
      const matchesSearch =
        hw?.title.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        hw?.description.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        hw?.studentName.toLowerCase().includes(searchTerm?.toLowerCase())

      // Status filter
      const matchesStatus = filterStatus === 'all' || hw?.status === filterStatus

      // Due date filter
      let matchesDueDate = true
      const today = new Date()
      today?.setHours(0, 0, 0, 0)
      const hwDueDate = hw?.dueDate instanceof Date ? hw?.dueDate : new Date(hw?.dueDate)
      hwDueDate?.setHours(0, 0, 0, 0)

      if (filterDueDate === 'overdue') {
        matchesDueDate = hwDueDate < today && hw?.status !== 'completed'
      } else if (filterDueDate === 'today') {
        matchesDueDate = hwDueDate?.getTime() === today?.getTime()
      } else if (filterDueDate === 'upcoming') {
        matchesDueDate = hwDueDate > today
      }

      return matchesSearch && matchesStatus && matchesDueDate
    })
  }, [homework, searchTerm, filterStatus, filterDueDate])

  /**
   * Stats calculations (SSOT: Single calculation used for display)
   */
  const stats = useMemo(() => {
    const today = new Date()
    today?.setHours(0, 0, 0, 0)

    const total = homework?.length
    const assigned = homework?.filter((hw) => hw?.status === 'assigned').length
    const completed = homework?.filter((hw) => hw?.status === 'completed').length
    const overdue = homework?.filter((hw) => {
      const dueDate = hw?.dueDate instanceof Date ? hw?.dueDate : new Date(hw?.dueDate)
      dueDate?.setHours(0, 0, 0, 0)
      return dueDate < today && hw?.status !== 'completed'
    }).length

    return { total, assigned, completed, overdue }
  }, [homework])

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const {
    paginatedItems: paginatedHomework,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    totalItems,
  } = usePagination(filteredHomework, 20)

  // ============================================================================
  // EVENT HANDLERS (SoC: Event Logic)
  // ============================================================================

  const handleCreate = () => {
    setEditingHomework(null)
    setIsModalOpen(true)
  }

  const handleEdit = (hw: Homework) => {
    setEditingHomework(hw)
    setIsModalOpen(true)
  }

  const handleDelete = async (homeworkId: string, title: string) => {
    if (window?.confirm(`Сигурни ли сте, че искате да изтриете "${title}"?`)) {
      try {
        await deleteHomework?.mutateAsync(homeworkId)
        toast?.success('Домашното беше изтрито успешно!')
      } catch (error) {
        // Error toast is shown automatically by hook
        console?.error('Delete error:', error)
      }
    }
  }

  /**
   * Mark homework as completed with optional grade
   * Quick action from table row
   */
  const handleMarkComplete = async (hw: Homework) => {
    const grade = gradeInputs[hw?.id]

    // Validate grade if provided
    if (grade !== undefined && (grade < 1 || grade > 6)) {
      toast?.error('Оценката трябва да е между 1 и 6')
      return
    }

    try {
      await updateHomework?.mutateAsync({
        id: hw?.id,
        data: {
          status: 'completed',
          completedDate: new Date(),
          grade: grade,
        },
      })

      // Clear grade input after successful completion
      setGradeInputs((prev) => {
        const newInputs = { ...prev }
        delete newInputs[hw?.id]
        return newInputs
      })

      toast?.success('Домашното е маркирано като завършено!')
    } catch (error) {
      console?.error('Mark complete error:', error)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingHomework(null)
  }

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status: Homework['status'], dueDate: Date) => {
    const today = new Date()
    today?.setHours(0, 0, 0, 0)
    const due = dueDate instanceof Date ? new Date(dueDate) : new Date(dueDate)
    due?.setHours(0, 0, 0, 0)

    // Check if overdue
    const isOverdue = due < today && status !== 'completed'

    if (isOverdue) {
      return 'badge bg-red-100 text-red-700'
    }

    switch (status) {
      case 'assigned':
        return 'badge bg-blue-100 text-blue-700'
      case 'completed':
        return 'badge bg-green-100 text-green-700'
      case 'overdue':
        return 'badge bg-red-100 text-red-700'
      default:
        return 'badge bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: Homework['status'], dueDate: Date) => {
    const today = new Date()
    today?.setHours(0, 0, 0, 0)
    const due = dueDate instanceof Date ? new Date(dueDate) : new Date(dueDate)
    due?.setHours(0, 0, 0, 0)

    const isOverdue = due < today && status !== 'completed'

    if (isOverdue) return 'Просрочено'
    if (status === 'assigned') return 'Зададено'
    if (status === 'completed') return 'Завършено'
    return status
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на домашни...</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER (SoC: UI Layer)
  // ============================================================================

  return (
    <div className="p-6 space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            Домашни
          </h1>
          <p className="text-gray-600 mt-1">
            Управление на всички домашни задания
          </p>
        </div>

        <button onClick={handleCreate} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Задай домашно
        </button>
      </div>

      {/* ========== STATS CARDS ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Общо домашни</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Assigned */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Зададени</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.assigned}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Завършени</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats?.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Просрочени</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats?.overdue}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ========== FILTERS ========== */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          Филтри
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Търси по заглавие, описание или ученик..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="input"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e?.target.value as typeof filterStatus)
              }
            >
              <option value="all">Всички статуси</option>
              <option value="assigned">Зададени</option>
              <option value="completed">Завършени</option>
              <option value="overdue">Просрочени</option>
            </select>
          </div>

          {/* Due Date Filter */}
          <div>
            <select
              className="input"
              value={filterDueDate}
              onChange={(e) =>
                setFilterDueDate(e?.target.value as typeof filterDueDate)
              }
            >
              <option value="all">Всички срокове</option>
              <option value="overdue">Просрочени</option>
              <option value="today">Днес</option>
              <option value="upcoming">Предстоящи</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchTerm || filterStatus !== 'all' || filterDueDate !== 'all') && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Активни филтри:</span>
            {searchTerm && (
              <span className="badge bg-blue-100 text-blue-700">
                Търсене: "{searchTerm}"
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="badge bg-blue-100 text-blue-700">
                Статус: {filterStatus}
              </span>
            )}
            {filterDueDate !== 'all' && (
              <span className="badge bg-blue-100 text-blue-700">
                Срок: {filterDueDate}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterDueDate('all')
              }}
              className="text-primary hover:underline"
            >
              Изчисти филтрите
            </button>
          </div>
        )}
      </div>

      {/* ========== TABLE ========== */}
      <div className="card overflow-hidden">
        {filteredHomework?.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Няма намерени домашни
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' || filterDueDate !== 'all'
                ? 'Опитайте различни филтри'
                : 'Започнете като зададете ново домашно'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterDueDate === 'all' && (
              <button onClick={handleCreate} className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Задай домашно
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ученик</th>
                    <th>Заглавие</th>
                    <th>Дата на задаване</th>
                    <th>Краен срок</th>
                    <th>Статус</th>
                    <th>Оценка</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHomework?.map((hw) => (
                    <tr key={hw?.id} className="hover:bg-gray-50">
                      {/* Student Name */}
                      <td>
                        <div className="font-medium text-gray-900">
                          {hw?.studentName}
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td>
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">
                            {hw?.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {hw?.description}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Date */}
                      <td>{formatDate(hw?.assignedDate)}</td>

                      {/* Due Date */}
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(hw?.dueDate)}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span className={getStatusBadge(hw?.status, hw?.dueDate)}>
                          {getStatusText(hw?.status, hw?.dueDate)}
                        </span>
                      </td>

                      {/* Grade */}
                      <td>
                        {hw?.status === 'completed' ? (
                          <span className="font-semibold text-gray-900">
                            {hw?.grade ? `${hw?.grade}/6` : 'Без оценка'}
                          </span>
                        ) : (
                          // Quick grade input for non-completed homework
                          <input
                            type="number"
                            min="1"
                            max="6"
                            placeholder="1-6"
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            value={gradeInputs[hw?.id] || ''}
                            onChange={(e) =>
                              setGradeInputs({
                                ...gradeInputs,
                                [hw?.id]: e?.target.value === '' ? undefined : Number(e?.target.value),
                              })
                            }
                            onClick={(e) => e?.stopPropagation()}
                          />
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-2">
                          {/* Mark Complete Button (only if not completed) */}
                          {hw?.status !== 'completed' && (
                            <button
                              onClick={() => handleMarkComplete(hw)}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Маркирай като завършено"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(hw)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Редактирай"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(hw?.id, hw?.title)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Изтрий"
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

      {/* ========== HOMEWORK MODAL ========== */}
      {isModalOpen && (
        <HomeworkModal homework={editingHomework} onClose={handleCloseModal} />
      )}
    </div>
  )
}
