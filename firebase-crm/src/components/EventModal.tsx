import { useState, useEffect, memo } from 'react'
import { X, Save, Calendar, Clock, MapPin, Briefcase } from 'lucide-react'
import { useAddEvent, useUpdateEvent } from '@/hooks/useEvents'
import { useGroups } from '@/hooks/useGroups'
import { Event, EventFormValues } from '@/types'
import { Timestamp } from 'firebase/firestore'

interface EventModalProps {
  event?: Event | null
  onClose: () => void
}

function EventModal({ event, onClose }: EventModalProps) {
  const addEvent = useAddEvent()
  const updateEvent = useUpdateEvent()
  const { groups, loading: loadingGroups } = useGroups()

  const [formData, setFormData] = useState<EventFormValues>({
    title: '',
    type: 'Урок',
    group: '',
    businessDescription: '',
    startTime: new Date(),
    endTime: new Date(Date?.now() + 60 * 60 * 1000), // +1 hour
    location: '',
    teacherId: '',
    studentIds: [],
    notes: '',
    color: '#46B19D',
  })

  const [customGroup, setCustomGroup] = useState(false)

  // Load event data if editing
  useEffect(() => {
    if (event) {
      setFormData({
        title: event?.title,
        type: event?.type,
        group: event?.group || '',
        businessDescription: event?.businessDescription || '',
        startTime: event?.startTime instanceof Timestamp
          ? event?.startTime.toDate()
          : event?.startTime,
        endTime: event?.endTime instanceof Timestamp
          ? event?.endTime.toDate()
          : event?.endTime,
        location: event?.location || '',
        teacherId: event?.teacherId || '',
        studentIds: event?.studentIds || [],
        notes: event?.notes || '',
        color: event?.color || '#46B19D',
      })
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    // Validate that end time is after start time
    if (formData?.endTime <= formData?.startTime) {
      alert('Крайният час трябва да е след началния час')
      return
    }

    if (event) {
      // Update existing event
      await updateEvent?.mutateAsync({
        id: event?.id,
        data: formData,
      })
    } else {
      // Add new event
      await addEvent?.mutateAsync(formData)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {event ? 'Редактиране на събитие' : 'Добавяне на събитие'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="label">
              Заглавие <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input"
              placeholder="Урок по ментална аритметика"
              value={formData?.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e?.target.value })
              }
            />
          </div>

          {/* Type & Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Тип <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input"
                value={formData?.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e?.target.value as 'Урок' | 'Събитие' | 'Ваканция' | 'Друго',
                  })
                }
              >
                <option value="Урок">Урок</option>
                <option value="Събитие">Събитие</option>
                <option value="Ваканция">Ваканция</option>
                <option value="Друго">Друго</option>
              </select>
            </div>

            <div>
              <label className="label">Група</label>
              {loadingGroups ? (
                <div className="input flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Зареждане на групи...
                </div>
              ) : (
                <>
                  <select
                    className="input"
                    value={customGroup ? '__custom__' : (formData?.group || '')}
                    onChange={(e) => {
                      if (e?.target.value === '__custom__') {
                        setCustomGroup(true)
                        setFormData({ ...formData, group: '' })
                      } else {
                        setCustomGroup(false)
                        setFormData({ ...formData, group: e?.target.value })
                      }
                    }}
                  >
                    <option value="">Без група</option>
                    {groups
                      .filter(g => g?.status === 'active')
                      .map((group) => (
                        <option key={group?.id} value={group?.name}>
                          {group?.name} {group?.subject ? `(${group?.subject})` : ''}
                        </option>
                      ))}
                    <option value="__custom__">➕ Нова група (въведете име)</option>
                  </select>
                  {customGroup && (
                    <input
                      type="text"
                      className="input mt-2"
                      placeholder="Име на нова група..."
                      value={formData?.group}
                      onChange={(e) =>
                        setFormData({ ...formData, group: e?.target.value })
                      }
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Business Description - НОВОТО ПОЛЕ */}
          <div>
            <label className="label">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent" />
                <span>Бизнес описание</span>
              </div>
            </label>
            <input
              type="text"
              className="input"
              placeholder="Expo 2026, Семинар, Презентация..."
              value={formData?.businessDescription}
              onChange={(e) =>
                setFormData({ ...formData, businessDescription: e?.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              💼 Описание на бизнес събитието (напр. "Expo 2026", "Семинар за родители")
            </p>
          </div>

          {/* Start & End Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Начален час <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="datetime-local"
                  required
                  className="input pl-10"
                  value={
                    formData?.startTime instanceof Date
                      ? formData?.startTime.toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startTime: new Date(e?.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">
                Краен час <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="datetime-local"
                  required
                  className="input pl-10"
                  value={
                    formData?.endTime instanceof Date
                      ? formData?.endTime.toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endTime: new Date(e?.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="label">Локация</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Зала 1, Онлайн..."
                value={formData?.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e?.target.value })
                }
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="label">Цвят в календара</label>
            <div className="flex gap-3">
              {[
                { name: 'Primary', value: '#46B19D' },
                { name: 'Blue', value: '#3B82F6' },
                { name: 'Purple', value: '#A855F7' },
                { name: 'Orange', value: '#F97316' },
                { name: 'Red', value: '#EF4444' },
                { name: 'Green', value: '#10B981' },
              ].map((color) => (
                <button
                  key={color?.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color?.value })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData?.color === color?.value
                      ? 'ring-4 ring-offset-2 ring-gray-300 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color?.value }}
                  title={color?.name}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Бележки</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Допълнителна информация..."
              value={formData?.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e?.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={addEvent?.isPending || updateEvent?.isPending}
              className="btn btn-primary flex-1"
            >
              {addEvent?.isPending || updateEvent?.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {event ? 'Запази промените' : 'Добави събитие'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// PERFORMANCE FIX: Wrap in React.memo to prevent unnecessary re-renders
export default memo(EventModal)
