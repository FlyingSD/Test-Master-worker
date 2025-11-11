import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Users, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useGroups, useDeleteGroup } from '@/hooks/useGroups'
import { formatCurrency } from '@/utils/formatters'
import { usePagination } from '@/hooks/usePagination'
import GroupModal from '@/components/GroupModal'
import Pagination from '@/components/Pagination'
import { Group } from '@/types'
import { GROUP_STATUS_LABELS } from '@/constants/appConstants'

export default function GroupsPage() {
  const { userData, isAdmin, isTeacher } = useAuth()
  const { groups, loading } = useGroups()
  const deleteGroup = useDeleteGroup()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')

  // 🔒 SECURITY: Only teachers and admins can view groups
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  // Filter groups
  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' || group.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Pagination
  const {
    paginatedItems: paginatedGroups,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    totalItems,
  } = usePagination(filteredGroups, 20)

  // Stats
  const activeCount = groups.filter((g) => g.status === 'active').length
  const totalCapacity = groups
    .filter((g) => g.status === 'active')
    .reduce((sum, g) => sum + (g.capacity || 0), 0)
  const totalStudents = groups
    .filter((g) => g.status === 'active')
    .reduce((sum, g) => sum + g.currentStudents, 0)

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setIsModalOpen(true)
  }

  const handleDelete = async (groupId: string, groupName: string) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете "${groupName}"?`)) {
      await deleteGroup.mutateAsync(groupId)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingGroup(null)
  }

  const formatSchedule = (schedule?: Group['schedule']) => {
    if (!schedule || schedule.length === 0) return 'Няма график'

    return schedule
      .map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`)
      .join(', ')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success'
      case 'inactive':
        return 'badge-warning'
      case 'archived':
        return 'badge-error'
      default:
        return 'badge-neutral'
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на групи...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Групи</h1>
          <p className="text-gray-600 mt-1">
            Управление на групи, класове и курсове
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Добави група
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-light rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Активни групи</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ученици / Капацитет</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents} / {totalCapacity}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent-light rounded-xl">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Общо групи</p>
              <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
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
              placeholder="Търсене по име, предмет или учител..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`btn ${
                filterStatus === 'all' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Всички ({groups.length})
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
              Неактивни ({groups.filter(g => g.status === 'inactive').length})
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`btn ${
                filterStatus === 'archived' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Архивирани ({groups.filter(g => g.status === 'archived').length})
            </button>
          </div>
        </div>
      </div>

      {/* Groups Table */}
      <div className="card overflow-hidden">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени групи
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като добавите първата си група'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави първа група
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Име на групата</th>
                    <th>Учител</th>
                    <th>Предмет / Ниво</th>
                    <th>График</th>
                    <th>Цена</th>
                    <th>Капацитет</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGroups.map((group) => (
                    <tr key={group.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                            {group.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {group.name}
                            </p>
                            {group.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {group.teacherName ? (
                          <span className="badge badge-primary">
                            {group.teacherName}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Без учител</span>
                        )}
                      </td>
                      <td>
                        <div>
                          {group.subject && (
                            <p className="font-medium text-gray-900">
                              {group.subject}
                            </p>
                          )}
                          {group.level && (
                            <p className="text-xs text-gray-500">{group.level}</p>
                          )}
                          {!group.subject && !group.level && (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm max-w-[250px]">
                          {formatSchedule(group.schedule)}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(group.price)}
                          </p>
                          {group.priceEUR && (
                            <p className="text-xs text-gray-500">
                              {formatCurrency(group.priceEUR, 'EUR')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {group.currentStudents}{group.capacity ? ` / ${group.capacity}` : ''}
                          </p>
                          {group.capacity && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  group.currentStudents >= group.capacity
                                    ? 'bg-red-500'
                                    : group.currentStudents / group.capacity > 0.8
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    (group.currentStudents / group.capacity) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusColor(group.status)}`}
                        >
                          {GROUP_STATUS_LABELS[group.status]}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(group)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Редактиране"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          {/* 🔒 SECURITY: Only admins can delete groups */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(group.id, group.name)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Изтриване"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
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

      {/* Group Modal */}
      {isModalOpen && (
        <GroupModal
          group={editingGroup}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
