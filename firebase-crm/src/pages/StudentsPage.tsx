import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Users as UsersIcon, FileDown, Upload, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudents, useDeleteStudent } from '@/hooks/useStudents'
import { formatDate, formatCurrency, getStatusColor, getStatusText } from '@/utils/formatters'
import { exportStudentsToExcel } from '@/utils/excelExport'
import { usePagination } from '@/hooks/usePagination'
import StudentModal from '@/components/StudentModal'
import CSVImportModal from '@/components/CSVImportModal'
import HomeworkModal from '@/components/HomeworkModal'
import Pagination from '@/components/Pagination'
import { Student } from '@/types'

export default function StudentsPage() {
  const { userData } = useAuth()
  const { students, loading } = useStudents()
  const deleteStudent = useDeleteStudent()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [selectedStudentForHomework, setSelectedStudentForHomework] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // 🔒 SECURITY: Only teachers and admins can view all students
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  // Filter students
  const filteredStudents = students?.filter((student) => {
    const matchesSearch = student?.name.toLowerCase().includes(searchTerm?.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' || student?.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Pagination
  const {
    paginatedItems: paginatedStudents,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    totalItems,
  } = usePagination(filteredStudents, 20)

  // Stats
  const activeCount = students?.filter((s) => s?.status === 'active').length
  const totalRevenue = students
    .filter((s) => s?.status === 'active')
    .reduce((sum, s) => sum + s?.fee, 0)

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const handleDelete = async (studentId: string, studentName: string) => {
    if (window?.confirm(`Сигурни ли сте, че искате да изтриете ${studentName}?`)) {
      await deleteStudent?.mutateAsync(studentId)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingStudent(null)
  }

  const handleViewHomework = (studentId: string) => {
    setSelectedStudentForHomework(studentId)
    setIsHomeworkModalOpen(true)
  }

  const handleCloseHomeworkModal = () => {
    setIsHomeworkModalOpen(false)
    setSelectedStudentForHomework(null)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на ученици...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ученици</h1>
          <p className="text-gray-600 mt-1">
            Управление на ученици и техните профили
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="btn btn-ghost"
            disabled={filteredStudents?.length === 0}
          >
            <FileDown className="w-5 h-5" />
            Експорт Excel
          </button>
          <button
            onClick={() => setIsCSVModalOpen(true)}
            className="btn btn-ghost"
          >
            <Upload className="w-5 h-5" />
            CSV Import
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Добави ученик
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-light rounded-xl">
              <UsersIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Активни ученици</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Общо ученици</p>
              <p className="text-2xl font-bold text-gray-900">{students?.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent-light rounded-xl">
              <UsersIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Месечни приходи</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalRevenue)}
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
              placeholder="Търсене по име..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`btn ${
                filterStatus === 'all' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Всички ({students?.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`btn ${
                filterStatus === 'active' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Активни ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`btn ${
                filterStatus === 'inactive' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Неактивни ({students?.length - activeCount})
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        {filteredStudents?.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени ученици
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като добавите първия си ученик'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави първи ученик
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
              <thead>
                <tr>
                  <th>Име</th>
                  <th>Група</th>
                  <th>Тип обучение</th>
                  <th>Месечна такса</th>
                  <th>Падеж</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents?.map((student) => (
                  <tr key={student?.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                          {student?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student?.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{student?.group}</td>
                    <td>
                      <span className="badge badge-primary">
                        {student?.studyType}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">
                          {formatCurrency(student?.fee)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(student?.feeEUR, 'EUR')}
                        </p>
                      </div>
                    </td>
                    <td>{formatDate(student?.dueDate)}</td>
                    <td>
                      <span
                        className={`badge ${getStatusColor(student?.status)}`}
                      >
                        {getStatusText(student?.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewHomework(student?.id)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Домашни"
                        >
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Редактиране"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(student?.id, student?.name)}
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

      {/* Student Modal */}
      {isModalOpen && (
        <StudentModal
          student={editingStudent}
          onClose={handleCloseModal}
        />
      )}

      {/* CSV Import Modal */}
      {isCSVModalOpen && (
        <CSVImportModal
          onClose={() => setIsCSVModalOpen(false)}
        />
      )}

      {/* Homework Modal */}
      {isHomeworkModalOpen && selectedStudentForHomework && (
        <HomeworkModal
          studentId={selectedStudentForHomework}
          onClose={handleCloseHomeworkModal}
        />
      )}
    </div>
  )
}
