import { useState, useEffect } from 'react'
import { X, Save, Calendar } from 'lucide-react'
import { useAddStudent, useUpdateStudent } from '@/hooks/useStudents'
import { useGroups } from '@/hooks/useGroups'
import { Student, StudentFormValues } from '@/types'
import { bgnToEur, eurToBgn } from '@/utils/formatters'
import { Timestamp } from 'firebase/firestore'
import { STUDENT_STATUS, STUDY_TYPES, STUDY_TYPE_OPTIONS, STUDENT_STATUS_LABELS, CURRENCY } from '@/constants/appConstants'

interface StudentModalProps {
  student?: Student | null
  onClose: () => void
}

export default function StudentModal({ student, onClose }: StudentModalProps) {
  const addStudent = useAddStudent()
  const updateStudent = useUpdateStudent()
  const { groups, loading: loadingGroups } = useGroups()

  const [formData, setFormData] = useState<StudentFormValues>({
    name: '',
    group: '',
    fee: 0,
    feeEUR: 0,
    dueDate: new Date(),
    status: STUDENT_STATUS.ACTIVE,
    studyType: STUDY_TYPES.GROUP,
    parentId: '',
    notes: '',
  })

  const [currencyInput, setCurrencyInput] = useState<'BGN' | 'EUR'>('BGN')
  const [customGroup, setCustomGroup] = useState(false)

  // Load student data if editing
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        group: student.group,
        fee: student.fee,
        feeEUR: student.feeEUR,
        dueDate: student.dueDate instanceof Timestamp
          ? student.dueDate.toDate()
          : student.dueDate,
        status: student.status,
        studyType: student.studyType,
        parentId: student.parentId,
        notes: student.notes || '',
      })
    }
  }, [student])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (student) {
      // Update existing student
      await updateStudent.mutateAsync({
        id: student.id,
        data: formData,
      })
    } else {
      // Add new student
      await addStudent.mutateAsync(formData)
    }

    onClose()
  }

  const handleFeeChange = (value: number, currency: 'BGN' | 'EUR') => {
    if (currency === 'BGN') {
      setFormData({
        ...formData,
        fee: value,
        feeEUR: bgnToEur(value),
      })
    } else {
      setFormData({
        ...formData,
        feeEUR: value,
        fee: eurToBgn(value),
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {student ? 'Редактиране на ученик' : 'Добавяне на ученик'}
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
          {/* Name */}
          <div>
            <label className="label">
              Име и фамилия <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input"
              placeholder="Иван Петров"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Group & Study Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Група <span className="text-red-500">*</span>
              </label>
              {loadingGroups ? (
                <div className="input flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Зареждане на групи...
                </div>
              ) : (
                <>
                  <select
                    required={!customGroup}
                    className="input"
                    value={customGroup ? '__custom__' : formData.group}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setCustomGroup(true)
                        setFormData({ ...formData, group: '' })
                      } else {
                        setCustomGroup(false)
                        setFormData({ ...formData, group: e.target.value })
                      }
                    }}
                  >
                    <option value="">Изберете група</option>
                    {groups
                      .filter(g => g.status === 'active')
                      .map((group) => (
                        <option key={group.id} value={group.name}>
                          {group.name} {group.subject ? `(${group.subject})` : ''}
                        </option>
                      ))}
                    <option value="__custom__">➕ Нова група (въведете име)</option>
                  </select>
                  {customGroup && (
                    <input
                      type="text"
                      required
                      className="input mt-2"
                      placeholder="Име на нова група..."
                      value={formData.group}
                      onChange={(e) =>
                        setFormData({ ...formData, group: e.target.value })
                      }
                    />
                  )}
                </>
              )}
            </div>

            <div>
              <label className="label">
                Тип обучение <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input"
                value={formData.studyType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    studyType: e.target.value as typeof STUDY_TYPES[keyof typeof STUDY_TYPES],
                  })
                }
              >
                {STUDY_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fee - BGN & EUR */}
          <div>
            <label className="label">
              Месечна такса <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={formData.fee || ''}
                    onChange={(e) =>
                      handleFeeChange(Number(e.target.value), 'BGN')
                    }
                    onFocus={() => setCurrencyInput('BGN')}
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
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={formData.feeEUR || ''}
                    onChange={(e) =>
                      handleFeeChange(Number(e.target.value), 'EUR')
                    }
                    onFocus={() => setCurrencyInput('EUR')}
                  />
                  <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-700 flex items-center">
                    EUR
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Промените в една валута автоматично обновяват другата (курс: 1 EUR = {CURRENCY.BGN_TO_EUR_RATE} BGN)
            </p>
          </div>

          {/* Due Date */}
          <div>
            <label className="label">
              Дата на падеж <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                required
                className="input pl-10"
                value={
                  formData.dueDate instanceof Date
                    ? formData.dueDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: new Date(e.target.value) })
                }
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Датата когато трябва да се плаща месечната такса
            </p>
          </div>

          {/* Parent ID */}
          <div>
            <label className="label">ID на родител (временно)</label>
            <input
              type="text"
              className="input"
              placeholder="parent_123"
              value={formData.parentId}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              По-късно ще има dropdown с родители
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="label">Статус</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={STUDENT_STATUS.ACTIVE}
                  checked={formData.status === STUDENT_STATUS.ACTIVE}
                  onChange={(e) =>
                    setFormData({ ...formData, status: STUDENT_STATUS.ACTIVE })
                  }
                  className="w-4 h-4 text-primary"
                />
                <span className="text-gray-700">{STUDENT_STATUS_LABELS[STUDENT_STATUS.ACTIVE]}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={STUDENT_STATUS.INACTIVE}
                  checked={formData.status === STUDENT_STATUS.INACTIVE}
                  onChange={(e) =>
                    setFormData({ ...formData, status: STUDENT_STATUS.INACTIVE })
                  }
                  className="w-4 h-4 text-primary"
                />
                <span className="text-gray-700">{STUDENT_STATUS_LABELS[STUDENT_STATUS.INACTIVE]}</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Бележки</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Допълнителна информация..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
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
              disabled={addStudent.isPending || updateStudent.isPending}
              className="btn btn-primary flex-1"
            >
              {addStudent.isPending || updateStudent.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {student ? 'Запази промените' : 'Добави ученик'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
