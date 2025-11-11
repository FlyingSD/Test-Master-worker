import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Calendar as CalendarIcon, Clock, MapPin, Briefcase } from 'lucide-react'
import { useEvents, useDeleteEvent } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import { useStudentsByParent } from '@/hooks/useStudents'
import { formatDate } from '@/utils/formatters'
import EventModal from '@/components/EventModal'
import { Event } from '@/types'

export default function EventsPage() {
  const { events, loading } = useEvents()
  const deleteEvent = useDeleteEvent()
  const { user, isParent } = useAuth()
  const { students: myChildren } = useStudentsByParent(user?.uid || '')

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  // Get groups of parent's children for filtering
  const myChildrenGroups = isParent ? myChildren?.map(child => child?.group) : []

  // Filter events
  const filteredEvents = events?.filter((event) => {
    const matchesSearch = event?.title.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      event?.businessDescription?.toLowerCase().includes(searchTerm?.toLowerCase())
    const matchesType = filterType === 'all' || event?.type === filterType

    // 🔒 SECURITY: Parents only see events for their children's groups
    const matchesParentAccess = !isParent ||
      !event?.group || // Events without group (general events)
      myChildrenGroups?.includes(event?.group) // Events for my children's groups

    return matchesSearch && matchesType && matchesParentAccess
  })

  // Stats (also filtered for parents)
  const upcomingEvents = events?.filter((e) => {
    const eventDate = e?.startTime instanceof Date ? e?.startTime : e?.startTime.toDate()
    const matchesParentAccess = !isParent || !e?.group || myChildrenGroups?.includes(e?.group)
    return eventDate > new Date() && matchesParentAccess
  })

  const todayEvents = events?.filter((e) => {
    const eventDate = e?.startTime instanceof Date ? e?.startTime : e?.startTime.toDate()
    const today = new Date()
    const matchesParentAccess = !isParent || !e?.group || myChildrenGroups?.includes(e?.group)
    return eventDate?.toDateString() === today?.toDateString() && matchesParentAccess
  })

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (window?.confirm(`Сигурни ли сте, че искате да изтриете "${eventTitle}"?`)) {
      await deleteEvent?.mutateAsync(eventId)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
  }

  const getTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'Урок':
        return 'bg-blue-50 text-blue-700'
      case 'Събитие':
        return 'bg-purple-50 text-purple-700'
      case 'Ваканция':
        return 'bg-orange-50 text-orange-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на събития...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Събития</h1>
          <p className="text-gray-600 mt-1">
            {isParent ? 'Преглед на уроци и събития' : 'Управление на уроци и събития'}
          </p>
        </div>
        {!isParent && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Добави събитие
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-light rounded-xl">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Общо събития</p>
              <p className="text-2xl font-bold text-gray-900">{events?.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Днес</p>
              <p className="text-2xl font-bold text-gray-900">{todayEvents?.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Предстоящи</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingEvents?.length}</p>
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
              placeholder="Търсене по заглавие или бизнес описание..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target.value)}
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`btn ${
                filterType === 'all' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Всички
            </button>
            <button
              onClick={() => setFilterType('Урок')}
              className={`btn ${
                filterType === 'Урок' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Уроци
            </button>
            <button
              onClick={() => setFilterType('Събитие')}
              className={`btn ${
                filterType === 'Събитие' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              События
            </button>
            <button
              onClick={() => setFilterType('Ваканция')}
              className={`btn ${
                filterType === 'Ваканция' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Ваканция
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="card overflow-hidden">
        {filteredEvents?.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени събития
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като добавите първото си събитие'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави първо събитие
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Заглавие</th>
                  <th>Тип</th>
                  <th>Дата и час</th>
                  <th>Група/Локация</th>
                  <th>Бизнес описание</th>
                  {!isParent && <th>Действия</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEvents?.map((event) => {
                  const startTime = event?.startTime instanceof Date
                    ? event?.startTime
                    : event?.startTime.toDate()
                  const endTime = event?.endTime instanceof Date
                    ? event?.endTime
                    : event?.endTime.toDate()

                  return (
                    <tr key={event?.id}>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {event?.title}
                          </p>
                          {event?.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {event?.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeColor(event?.type)}`}>
                          {event?.type}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{formatDate(startTime)}</p>
                          <p className="text-sm text-gray-600">
                            {startTime?.toLocaleTimeString('bg-BG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {endTime?.toLocaleTimeString('bg-BG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {event?.group && (
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-gray-600">{event?.group}</span>
                            </div>
                          )}
                          {event?.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>{event?.location}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {event?.businessDescription ? (
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-accent flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">
                              {event?.businessDescription}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      {!isParent && (
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(event)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Редактиране"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(event?.id, event?.title)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Изтриване"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <EventModal
          event={editingEvent}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
