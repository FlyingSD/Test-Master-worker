import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Users as UsersIcon, Phone, Mail, Video, Upload, X, FileDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useParents, useDeleteParent, useUploadVideoToParent, useDeleteVideoFromParent } from '@/hooks/useParents'
import { useStudents } from '@/hooks/useStudents'
import { exportParentsToExcel } from '@/utils/excelExport'
import { usePagination } from '@/hooks/usePagination'
import { Parent } from '@/types'
import ParentModal from '@/components/ParentModal'
import Pagination from '@/components/Pagination'

export default function ParentsPage() {
  const { userData } = useAuth()
  const { parents, loading } = useParents()
  const { students } = useStudents()
  const deleteParent = useDeleteParent()
  const uploadVideo = useUploadVideoToParent()
  const deleteVideo = useDeleteVideoFromParent()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingParent, setEditingParent] = useState<Parent | null>(null)
  const [viewingParent, setViewingParent] = useState<Parent | null>(null)
  const [uploadingVideoFor, setUploadingVideoFor] = useState<string | null>(null)

  // 🔒 SECURITY: Only teachers and admins can view all parents (GDPR protection)
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  // Filter parents
  const filteredParents = parents?.filter((parent) => {
    const term = searchTerm?.toLowerCase()
    return (
      parent?.name.toLowerCase().includes(term) ||
      parent?.phone?.toLowerCase().includes(term) ||
      parent?.phone2?.toLowerCase().includes(term) ||
      parent?.email?.toLowerCase().includes(term)
    )
  })

  // Pagination
  const {
    paginatedItems: paginatedParents,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    totalItems,
  } = usePagination(filteredParents, 20)

  // Stats
  const parentsWithMultipleChildren = parents?.filter((p) => p?.studentIds.length > 1).length
  const totalStudents = parents?.reduce((sum, p) => sum + p?.studentIds.length, 0)

  // Get student names for a parent
  const getStudentNames = (parent: Parent) => {
    return parent?.studentIds
      .map((studentId) => {
        const student = students?.find((s) => s?.id === studentId)
        return student?.name || 'Неизвестен'
      })
      .join(', ')
  }

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent)
    setIsModalOpen(true)
  }

  const handleDelete = async (parentId: string, parentName: string) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете ${parentName}?`)) {
      await deleteParent?.mutateAsync(parentId)
    }
  }

  const handleViewDetails = (parent: Parent) => {
    setViewingParent(parent)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingParent(null)
  }

  const handleCloseDetailsModal = () => {
    setViewingParent(null)
  }

  const handleVideoUpload = async (parentId: string, file: File) => {
    try {
      await uploadVideo?.mutateAsync({ parentId, videoFile: file })
    } catch (error) {
      console.error('Error uploading video:', error)
    }
  }

  const handleVideoDelete = async (parentId: string, videoUrl: string) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете това видео?')) {
      try {
        await deleteVideo?.mutateAsync({ parentId, videoUrl })
      } catch (error) {
        console.error('Error deleting video:', error)
      }
    }
  }

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>, parentId: string) => {
    const file = e?.target?.files?.[0]
    if (file) {
      handleVideoUpload(parentId, file)
    }
    setUploadingVideoFor(null)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на родители...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Родители</h1>
          <p className="text-gray-600 mt-1">
            Управление на родители и техните контакти
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportParentsToExcel(parents)}
            className="btn btn-ghost"
            disabled={parents?.length === 0}
          >
            <FileDown className="w-5 h-5" />
            Експорт Excel
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Добави родител
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
              <p className="text-sm text-gray-600">Общо родители</p>
              <p className="text-2xl font-bold text-gray-900">{parents?.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">С няколко деца</p>
              <p className="text-2xl font-bold text-gray-900">{parentsWithMultipleChildren}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent-light rounded-xl">
              <UsersIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Връзки с ученици</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Търсене по име, телефон или имейл..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target.value)}
          />
        </div>
      </div>

      {/* Parents Table */}
      <div className="card overflow-hidden">
        {filteredParents?.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени родители
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като добавите първия родител'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави първи родител
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
                  <th>Контакти</th>
                  <th>Ученици</th>
                  <th>Родство</th>
                  <th>Видео</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParents?.map((parent) => (
                  <tr key={parent?.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                          {parent?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {parent?.name}
                          </p>
                          {parent?.companyName && (
                            <p className="text-xs text-gray-500">
                              {parent?.companyName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{parent?.phone}</span>
                        </div>
                        {parent?.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{parent?.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {parent?.studentIds.length > 0 ? (
                          <span className="text-gray-700">
                            {getStudentNames(parent)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Няма ученици</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {parent?.relationship && (
                        <span className="badge badge-primary">
                          {parent?.relationship}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {parent?.videoUrls && parent?.videoUrls.length > 0 && (
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <Video className="w-4 h-4" />
                            {parent?.videoUrls.length}
                          </span>
                        )}
                        <label
                          className="p-2 hover:bg-primary-light rounded-lg transition-colors cursor-pointer"
                          title="Качи видео"
                        >
                          <Upload className="w-4 h-4 text-primary" />
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => handleVideoFileSelect(e, parent?.id)}
                          />
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(parent)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Преглед"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(parent)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Редактиране"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(parent?.id, parent?.name)}
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

      {/* Parent Modal */}
      {isModalOpen && (
        <ParentModal
          parent={editingParent}
          onClose={handleCloseModal}
        />
      )}

      {/* Parent Details Modal with Videos */}
      {viewingParent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {viewingParent?.name}
                </h2>
                <p className="text-gray-600">Детайли за родител</p>
              </div>
              <button
                onClick={handleCloseDetailsModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="card">
                <h3 className="font-semibold text-lg mb-4">Контактна информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Телефон</p>
                    <p className="font-medium">{viewingParent?.phone}</p>
                  </div>
                  {viewingParent?.phone2 && (
                    <div>
                      <p className="text-sm text-gray-600">Втори телефон</p>
                      <p className="font-medium">{viewingParent?.phone2}</p>
                    </div>
                  )}
                  {viewingParent?.email && (
                    <div>
                      <p className="text-sm text-gray-600">Имейл</p>
                      <p className="font-medium">{viewingParent?.email}</p>
                    </div>
                  )}
                  {viewingParent?.address && (
                    <div>
                      <p className="text-sm text-gray-600">Адрес</p>
                      <p className="font-medium">{viewingParent?.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Info */}
              {viewingParent?.companyName && (
                <div className="card">
                  <h3 className="font-semibold text-lg mb-4">Фирмена информация</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Име на фирма</p>
                      <p className="font-medium">{viewingParent?.companyName}</p>
                    </div>
                    {viewingParent?.companyVAT && (
                      <div>
                        <p className="text-sm text-gray-600">ЕИК/БУЛСТАТ</p>
                        <p className="font-medium">{viewingParent?.companyVAT}</p>
                      </div>
                    )}
                    {viewingParent?.companyAddress && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Адрес за фактури</p>
                        <p className="font-medium">{viewingParent?.companyAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Children */}
              <div className="card">
                <h3 className="font-semibold text-lg mb-4">Деца ({viewingParent?.studentIds.length})</h3>
                <div className="space-y-2">
                  {viewingParent?.studentIds.map((studentId) => {
                    const student = students?.find((s) => s?.id === studentId)
                    return (
                      <div key={studentId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {student?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{student?.name || 'Неизвестен'}</p>
                          {student && (
                            <p className="text-sm text-gray-600">{student?.group}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {viewingParent?.studentIds.length === 0 && (
                    <p className="text-gray-500">Няма добавени ученици</p>
                  )}
                </div>
              </div>

              {/* Videos */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">
                    Видео клипове ({viewingParent?.videoUrls?.length || 0})
                  </h3>
                  <label className="btn btn-primary cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Качи видео
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleVideoFileSelect(e, viewingParent?.id)}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingParent?.videoUrls && viewingParent?.videoUrls.length > 0 ? (
                    viewingParent?.videoUrls.map((videoUrl, index) => (
                      <div key={index} className="relative group">
                        <video
                          src={videoUrl}
                          controls
                          className="w-full rounded-lg"
                        />
                        <button
                          onClick={() => handleVideoDelete(viewingParent?.id, videoUrl)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-gray-500">Няма качени видео клипове</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewingParent?.notes && (
                <div className="card">
                  <h3 className="font-semibold text-lg mb-4">Бележки</h3>
                  <p className="text-gray-700">{viewingParent?.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
