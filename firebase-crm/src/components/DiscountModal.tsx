import { useState, useEffect } from 'react'
import { X, Save, Calendar, Percent } from 'lucide-react'
import { useAddDiscount, useUpdateDiscount } from '@/hooks/useDiscounts'
import { useStudents } from '@/hooks/useStudents'
import { Discount, DiscountFormValues } from '@/types'
import { Timestamp } from 'firebase/firestore'

interface DiscountModalProps {
  discount?: Discount | null
  onClose: () => void
}

export default function DiscountModal({ discount, onClose }: DiscountModalProps) {
  const addDiscount = useAddDiscount()
  const updateDiscount = useUpdateDiscount()
  const { students } = useStudents()

  const [formData, setFormData] = useState<DiscountFormValues>({
    studentId: '',
    studentName: '',
    type: 'Процент',
    value: 0,
    reason: '',
    startDate: new Date(),
    endDate: new Date(Date?.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    isActive: true,
  })

  // Load discount data if editing
  useEffect(() => {
    if (discount) {
      setFormData({
        studentId: discount?.studentId,
        studentName: discount?.studentName,
        type: discount?.type,
        value: discount?.value,
        reason: discount?.reason,
        startDate: discount?.startDate instanceof Timestamp
          ? discount?.startDate.toDate()
          : discount?.startDate,
        endDate: discount?.endDate instanceof Timestamp
          ? discount?.endDate.toDate()
          : discount?.endDate,
        isActive: discount?.isActive,
      })
    }
  }, [discount])

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    // Get student name from selected student
    const selectedStudent = students?.find((s) => s?.id === formData?.studentId)
    if (!selectedStudent && !discount) {
      alert('Моля изберете ученик')
      return
    }

    const dataToSubmit = {
      ...formData,
      studentName: selectedStudent?.name || formData?.studentName,
    }

    if (discount) {
      // Update existing discount
      await updateDiscount?.mutateAsync({
        id: discount?.id,
        data: dataToSubmit,
      })
    } else {
      // Add new discount
      await addDiscount?.mutateAsync(dataToSubmit)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {discount ? 'Редактиране на отстъпка' : 'Добавяне на отстъпка'}
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
          {/* Student Selection */}
          <div>
            <label className="label">
              Ученик <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="input"
              value={formData?.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e?.target.value })
              }
              disabled={!!discount} // Can't change student when editing
            >
              <option value="">Избери ученик</option>
              {students
                .filter((s) => s?.status === 'active')
                .map((student) => (
                  <option key={student?.id} value={student?.id}>
                    {student?.name} - {student?.group}
                  </option>
                ))}
            </select>
          </div>

          {/* Type & Value */}
          <div>
            <label className="label">
              Тип на отстъпка <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData?.type === 'Процент'
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="Процент"
                  checked={formData?.type === 'Процент'}
                  onChange={(e) =>
                    setFormData({ ...formData, type: 'Процент' })
                  }
                  className="sr-only"
                />
                <Percent className="w-5 h-5" />
                <span className="font-medium">Процент</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData?.type === 'Фиксирана сума'
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="Фиксирана сума"
                  checked={formData?.type === 'Фиксирана сума'}
                  onChange={(e) =>
                    setFormData({ ...formData, type: 'Фиксирана сума' })
                  }
                  className="sr-only"
                />
                <span className="font-medium">Фиксирана сума</span>
              </label>
            </div>

            <div className="relative">
              <input
                type="number"
                required
                min="0"
                step={formData?.type === 'Процент' ? '1' : '0?.01'}
                max={formData?.type === 'Процент' ? '100' : undefined}
                className="input pr-16"
                placeholder={formData?.type === 'Процент' ? '10' : '50?.00'}
                value={formData?.value || ''}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e?.target.value) })
                }
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 font-medium text-gray-600">
                {formData?.type === 'Процент' ? '%' : 'лв.'}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData?.type === 'Процент'
                ? 'Процент от месечната такса (0-100%)'
                : 'Фиксирана сума в лева'}
            </p>
          </div>

          {/* Start & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Начална дата <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  required
                  className="input pl-10"
                  value={
                    formData?.startDate instanceof Date
                      ? formData?.startDate?.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: new Date(e?.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">
                Крайна дата <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  required
                  className="input pl-10"
                  value={
                    formData?.endDate instanceof Date
                      ? formData?.endDate?.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: new Date(e?.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="label">
              Причина <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              className="input min-h-[80px] resize-y"
              placeholder="Многодетно семейство, Промоция за нов ученик, и т.н."
              value={formData?.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e?.target.value })
              }
            />
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData?.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e?.target.checked })
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="font-medium text-gray-700">
                Отстъпката е активна
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              Деактивирайте ако искате временно да спрете отстъпката
            </p>
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
              disabled={addDiscount?.isPending || updateDiscount?.isPending}
              className="btn btn-primary flex-1"
            >
              {addDiscount?.isPending || updateDiscount?.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {discount ? 'Запази промените' : 'Добави отстъпка'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
