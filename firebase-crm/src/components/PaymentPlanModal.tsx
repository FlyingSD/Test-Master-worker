import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calendar as Cal } from 'lucide-react'
import { useAddPaymentPlan } from '@/hooks/usePaymentPlans'
import { useStudents } from '@/hooks/useStudents'
import { PaymentPlan, Installment } from '@/types'

interface PaymentPlanModalProps {
  isOpen: boolean
  onClose: () => void
  studentId?: string
}

export default function PaymentPlanModal({ isOpen, onClose, studentId }: PaymentPlanModalProps) {
  const { students } = useStudents()
  const addPaymentPlan = useAddPaymentPlan()

  const [formData, setFormData] = useState({
    studentId: studentId || '',
    totalAmount: 0,
    numberOfInstallments: 3,
    frequency: 'monthly' as 'weekly' | 'monthly' | 'custom',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  })

  const [installments, setInstallments] = useState<Installment[]>([])

  // Auto-generate installments when settings change
  useEffect(() => {
    if (formData.totalAmount > 0 && formData.numberOfInstallments > 0) {
      generateInstallments()
    }
  }, [formData.totalAmount, formData.numberOfInstallments, formData.startDate, formData.frequency])

  const generateInstallments = () => {
    const { totalAmount, numberOfInstallments, startDate, frequency } = formData
    const amountPerInstallment = totalAmount / numberOfInstallments
    const start = new Date(startDate)

    const newInstallments: Installment[] = []

    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(start)

      if (frequency === 'monthly') {
        dueDate.setMonth(start.getMonth() + i)
      } else if (frequency === 'weekly') {
        dueDate.setDate(start.getDate() + i * 7)
      }

      newInstallments.push({
        installmentNumber: i + 1,
        dueDate,
        amount: Math.round(amountPerInstallment * 100) / 100, // Round to 2 decimals
        status: 'pending',
        notes: '',
      })
    }

    setInstallments(newInstallments)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.studentId) {
      alert('Моля изберете ученик')
      return
    }

    const student = students.find((s) => s.id === formData.studentId)
    if (!student) {
      alert('Ученикът не е намерен')
      return
    }

    try {
      await addPaymentPlan.mutateAsync({
        studentId: formData.studentId,
        studentName: student.name,
        totalAmount: formData.totalAmount,
        numberOfInstallments: formData.numberOfInstallments,
        frequency: formData.frequency,
        startDate: new Date(formData.startDate),
        installments,
        status: 'active',
        description: formData.description || `План за ${formData.numberOfInstallments} вноски`,
        notes: formData.notes,
      } as Omit<PaymentPlan, 'id' | 'createdAt' | 'createdBy'>)

      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating payment plan:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      studentId: studentId || '',
      totalAmount: 0,
      numberOfInstallments: 3,
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
    })
    setInstallments([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Създай план за плащане</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ученик <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              required
              disabled={!!studentId}
            >
              <option value="">Избери ученик</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.group}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Обща сума (BGN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Брой вноски <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.numberOfInstallments}
                onChange={(e) =>
                  setFormData({ ...formData, numberOfInstallments: parseInt(e.target.value) || 1 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                min="1"
                max="24"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Честота <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: e.target.value as 'weekly' | 'monthly' | 'custom',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
              >
                <option value="weekly">Седмично</option>
                <option value="monthly">Месечно</option>
                <option value="custom">Персонализирано</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Начална дата <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="План за заплащане на такси..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Бележки</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              rows={2}
              placeholder="Допълнителна информация..."
            />
          </div>

          {/* Installments Preview */}
          {installments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Преглед на вноските ({installments.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {installments.map((inst) => (
                  <div
                    key={inst.installmentNumber}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {inst.installmentNumber}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Вноска #{inst.installmentNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          <Cal className="w-3 h-3 inline mr-1" />
                          {new Date(inst.dueDate).toLocaleDateString('bg-BG')}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-600">{inst.amount.toFixed(2)} лв</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={addPaymentPlan.isPending || installments.length === 0}
              className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addPaymentPlan.isPending ? 'Създаване...' : 'Създай план'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
