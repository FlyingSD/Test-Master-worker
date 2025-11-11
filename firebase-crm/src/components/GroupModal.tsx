import { useState, useEffect } from 'react'
import { X, Save, Calendar, Plus, Trash2 } from 'lucide-react'
import { useAddGroup, useUpdateGroup } from '@/hooks/useGroups'
import { Group } from '@/types'
import { bgnToEur, eurToBgn } from '@/utils/formatters'
import { Timestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  GROUP_STATUS,
  GROUP_STATUS_OPTIONS,
  GROUP_STATUS_LABELS,
  GROUP_LEVEL_OPTIONS,
  DAYS_OF_WEEK_OPTIONS,
} from '@/constants/appConstants'
import { COLLECTIONS } from '@/lib/collections'

interface GroupModalProps {
  group?: Group | null
  onClose: () => void
}

interface Teacher {
  id: string
  name: string
  email: string
}

interface ScheduleItem {
  dayOfWeek: string
  startTime: string
  endTime: string
  location?: string
}

export default function GroupModal({ group, onClose }: GroupModalProps) {
  const addGroup = useAddGroup()
  const updateGroup = useUpdateGroup()

  // Fetch teachers
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const usersRef = collection(db, COLLECTIONS?.USERS)
        const q = query(usersRef, where('role', '==', 'teacher'))
        const snapshot = await getDocs(q)

        const teachersList: Teacher[] = []
        snapshot?.forEach((doc) => {
          const data = doc?.data()
          teachersList?.push({
            id: doc?.id,
            name: data?.name || data?.email,
            email: data?.email,
          })
        })

        setTeachers(teachersList)
      } catch (error) {
        console?.error('Error fetching teachers:', error)
      } finally {
        setLoadingTeachers(false)
      }
    }

    fetchTeachers()
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacherId: '',
    teacherName: '',
    subject: '',
    level: '',
    price: 0,
    priceEUR: 0,
    capacity: undefined as number | undefined,
    currentStudents: 0,
    status: GROUP_STATUS?.ACTIVE,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    notes: '',
  })

  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  // Load group data if editing
  useEffect(() => {
    if (group) {
      setFormData({
        name: group?.name,
        description: group?.description || '',
        teacherId: group?.teacherId || '',
        teacherName: group?.teacherName || '',
        subject: group?.subject || '',
        level: group?.level || '',
        price: group?.price,
        priceEUR: group?.priceEUR || 0,
        capacity: group?.capacity,
        currentStudents: group?.currentStudents,
        status: group?.status,
        startDate: group?.startDate instanceof Timestamp
          ? group?.startDate.toDate()
          : group?.startDate,
        endDate: group?.endDate instanceof Timestamp
          ? group?.endDate.toDate()
          : group?.endDate,
        notes: group?.notes || '',
      })

      // Load schedule if exists
      if (group?.schedule && group?.schedule.length > 0) {
        setSchedule(group?.schedule)
      }
    }
  }, [group])

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    const groupData = {
      ...formData,
      schedule: schedule?.length > 0 ? schedule : undefined,
    }

    if (group) {
      // Update existing group
      await updateGroup?.mutateAsync({
        id: group?.id,
        data: groupData,
      })
    } else {
      // Add new group
      await addGroup?.mutateAsync(groupData as any)
    }

    onClose()
  }

  const handlePriceChange = (value: number, currency: 'BGN' | 'EUR') => {
    if (currency === 'BGN') {
      setFormData({
        ...formData,
        price: value,
        priceEUR: bgnToEur(value),
      })
    } else {
      setFormData({
        ...formData,
        priceEUR: value,
        price: eurToBgn(value),
      })
    }
  }

  const handleTeacherChange = (teacherId: string) => {
    const teacher = teachers?.find(t => t?.id === teacherId)
    setFormData({
      ...formData,
      teacherId,
      teacherName: teacher?.name || '',
    })
  }

  const addScheduleItem = () => {
    setSchedule([
      ...schedule,
      {
        dayOfWeek: DAYS_OF_WEEK_OPTIONS[0],
        startTime: '17:00',
        endTime: '18:00',
        location: '',
      },
    ])
  }

  const removeScheduleItem = (index: number) => {
    setSchedule(schedule?.filter((_, i) => i !== index))
  }

  const updateScheduleItem = (index: number, field: keyof ScheduleItem, value: string) => {
    const newSchedule = [...schedule]
    newSchedule[index] = { ...newSchedule[index], [field]: value }
    setSchedule(newSchedule)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {group ? 'Редактиране на група' : 'Добавяне на група'}
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
          {/* Name & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Име на групата <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="Група по китара - напреднали"
                value={formData?.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e?.target.value })
                }
              />
            </div>

            <div>
              <label className="label">Предмет</label>
              <input
                type="text"
                className="input"
                placeholder="Китара, Абакус, Рисуване..."
                value={formData?.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e?.target.value })
                }
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Описание</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Кратко описание на групата..."
              value={formData?.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e?.target.value })
              }
            />
          </div>

          {/* Teacher & Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Учител</label>
              {loadingTeachers ? (
                <div className="input flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Зареждане...
                </div>
              ) : (
                <select
                  className="input"
                  value={formData?.teacherId}
                  onChange={(e) => handleTeacherChange(e?.target.value)}
                >
                  <option value="">Без учител</option>
                  {teachers?.map((teacher) => (
                    <option key={teacher?.id} value={teacher?.id}>
                      {teacher?.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="label">Ниво</label>
              <select
                className="input"
                value={formData?.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e?.target.value })
                }
              >
                <option value="">Без ниво</option>
                {GROUP_LEVEL_OPTIONS?.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price - BGN & EUR */}
          <div>
            <label className="label">
              Месечна цена <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0?.01"
                    className="input"
                    placeholder="0?.00"
                    value={formData?.price || ''}
                    onChange={(e) =>
                      handlePriceChange(Number(e?.target.value), 'BGN')
                    }
                  />
                  <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-700 flex items-center">
                    BGN
                  </div>
                </div>
              </div>

              <div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0?.01"
                    className="input"
                    placeholder="0?.00"
                    value={formData?.priceEUR || ''}
                    onChange={(e) =>
                      handlePriceChange(Number(e?.target.value), 'EUR')
                    }
                  />
                  <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-700 flex items-center">
                    EUR
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity & Current Students */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Капацитет (макс. ученици)</label>
              <input
                type="number"
                min="1"
                className="input"
                placeholder="напр. 12"
                value={formData?.capacity || ''}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e?.target.value ? Number(e?.target.value) : undefined })
                }
              />
            </div>

            <div>
              <label className="label">Текущ брой ученици</label>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="0"
                value={formData?.currentStudents || ''}
                onChange={(e) =>
                  setFormData({ ...formData, currentStudents: Number(e?.target.value) || 0 })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Автоматично обновяване при добавяне на ученици (скоро)
              </p>
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">График на занятията</label>
              <button
                type="button"
                onClick={addScheduleItem}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добави час
              </button>
            </div>

            {schedule?.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Няма добавени часове</p>
                <p className="text-sm text-gray-400 mt-1">Натиснете "Добави час" за да добавите график</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedule?.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Час {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeScheduleItem(index)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Ден</label>
                        <select
                          className="input input-sm"
                          value={item?.dayOfWeek}
                          onChange={(e) =>
                            updateScheduleItem(index, 'dayOfWeek', e?.target.value)
                          }
                        >
                          {DAYS_OF_WEEK_OPTIONS?.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Начало</label>
                        <input
                          type="time"
                          className="input input-sm"
                          value={item?.startTime}
                          onChange={(e) =>
                            updateScheduleItem(index, 'startTime', e?.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Край</label>
                        <input
                          type="time"
                          className="input input-sm"
                          value={item?.endTime}
                          onChange={(e) =>
                            updateScheduleItem(index, 'endTime', e?.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Локация</label>
                        <input
                          type="text"
                          className="input input-sm"
                          placeholder="Зала 1"
                          value={item?.location || ''}
                          onChange={(e) =>
                            updateScheduleItem(index, 'location', e?.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Дата на започване</label>
              <input
                type="date"
                className="input"
                value={
                  formData?.startDate instanceof Date
                    ? formData?.startDate?.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e?.target.value ? new Date(e?.target.value) : undefined })
                }
              />
            </div>

            <div>
              <label className="label">Дата на приключване</label>
              <input
                type="date"
                className="input"
                value={
                  formData?.endDate instanceof Date
                    ? formData?.endDate?.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e?.target.value ? new Date(e?.target.value) : undefined })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                За сезонни групи (напр. летен курс)
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Статус</label>
            <div className="flex gap-4">
              {GROUP_STATUS_OPTIONS?.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData?.status === status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: status })
                    }
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-gray-700">{GROUP_STATUS_LABELS[status]}</span>
                </label>
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
              disabled={addGroup?.isPending || updateGroup?.isPending}
              className="btn btn-primary flex-1"
            >
              {addGroup?.isPending || updateGroup?.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {group ? 'Запази промените' : 'Добави група'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
