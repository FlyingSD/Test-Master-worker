import { useState, useEffect } from 'react'
import { X, Save, Calendar } from 'lucide-react'
import { useAddPayment, useUpdatePayment } from '@/hooks/usePayments'
import { useStudents } from '@/hooks/useStudents'
import { Payment, PaymentFormValues } from '@/types'
import { bgnToEur, eurToBgn } from '@/utils/formatters'
import { Timestamp } from 'firebase/firestore'
import ErrorAlert from '@/components/ErrorAlert'
import { ValidationErrors, ErrorMessage } from '@/utils/errorMessages'

interface PaymentModalProps {
  payment?: Payment | null
  onClose: () => void
}

export default function PaymentModal({ payment, onClose }: PaymentModalProps) {
  const addPayment = useAddPayment()
  const updatePayment = useUpdatePayment()
  const { students } = useStudents()

  const [formData, setFormData] = useState<PaymentFormValues>({
    studentId: '',
    studentName: '',
    amount: 0,
    amountEUR: 0,
    article: '',
    method: 'Кеш',
    date: new Date(),
    notes: '',
    receiptNumber: '',
  })

  const [currencyInput, setCurrencyInput] = useState<'BGN' | 'EUR'>('BGN')
  const [warnings, setWarnings] = useState<ErrorMessage[]>([])
  const [errors, setErrors] = useState<ErrorMessage[]>([])

  // Load payment data if editing
  useEffect(() => {
    if (payment) {
      setFormData({
        studentId: payment.studentId,
        studentName: payment.studentName,
        amount: payment.amount,
        amountEUR: payment.amountEUR || 0,
        article: payment.article,
        method: payment.method,
        date: payment.date instanceof Timestamp
          ? payment.date.toDate()
          : payment.date,
        notes: payment.notes || '',
        receiptNumber: payment.receiptNumber || '',
      })
    }
  }, [payment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get student name from selected student
    const selectedStudent = students.find((s) => s.id === formData.studentId)
    if (!selectedStudent && !payment) {
      alert('Моля изберете ученик')
      return
    }

    const dataToSubmit = {
      ...formData,
      studentName: selectedStudent?.name || formData.studentName,
    }

    if (payment) {
      // Update existing payment
      await updatePayment.mutateAsync({
        id: payment.id,
        data: dataToSubmit,
      })
    } else {
      // Add new payment
      await addPayment.mutateAsync(dataToSubmit)
    }

    onClose()
  }

  const handleAmountChange = (value: number, currency: 'BGN' | 'EUR') => {
    let newFormData
    if (currency === 'BGN') {
      newFormData = {
        ...formData,
        amount: value,
        amountEUR: bgnToEur(value),
      }
    } else {
      newFormData = {
        ...formData,
        amountEUR: value,
        amount: eurToBgn(value),
      }
    }
    setFormData(newFormData)
    validateForm(newFormData)
  }

  // Validate form data and show warnings/errors
  const validateForm = (data: PaymentFormValues) => {
    const newWarnings: ErrorMessage[] = []
    const newErrors: ErrorMessage[] = []

    // Check amount
    if (data.amount <= 0) {
      newErrors.push(ValidationErrors.AMOUNT_ZERO)
    } else if (data.amount > 1000) {
      newWarnings.push(ValidationErrors.AMOUNT_TOO_LARGE)
    }

    // Check currency mismatch
    if (data.amount && data.amountEUR) {
      const expectedEUR = data.amount / 1.96
      const difference = Math.abs(data.amountEUR - expectedEUR)
      if (difference > 0.5) {
        newWarnings.push({
          ...ValidationErrors.CURRENCY_MISMATCH,
          solution: `Очакваната стойност в EUR е ${expectedEUR.toFixed(2)}. Коригирайте сумите`,
        })
      }
    }

    // Check date
    if (data.date) {
      const date = data.date instanceof Date ? data.date : new Date(data.date)
      if (date > new Date()) {
        newErrors.push(ValidationErrors.DATE_FUTURE)
      }

      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      if (date < twoYearsAgo) {
        newWarnings.push(ValidationErrors.DATE_TOO_OLD)
      }
    }

    setWarnings(newWarnings)
    setErrors(newErrors)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {payment ? 'Редактиране на плащане' : 'Добавяне на плащане'}
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
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <ErrorAlert
                  key={`error-${index}`}
                  error={error}
                  onClose={() => setErrors(errors.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <ErrorAlert
                  key={`warning-${index}`}
                  error={warning}
                  onClose={() => setWarnings(warnings.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          )}

          {/* Student Selection */}
          <div>
            <label className="label">
              Ученик <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="input"
              value={formData.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e.target.value })
              }
              disabled={!!payment} // Can't change student when editing
            >
              <option value="">Избери ученик</option>
              {students
                .filter((s) => s.status === 'active')
                .map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.group}
                  </option>
                ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="label">
              Дата на плащане <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                required
                className="input pl-10"
                value={
                  formData.date instanceof Date
                    ? formData.date.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const newFormData = { ...formData, date: new Date(e.target.value) }
                  setFormData(newFormData)
                  validateForm(newFormData)
                }}
              />
            </div>
          </div>

          {/* Amount - BGN & EUR */}
          <div>
            <label className="label">
              Сума <span className="text-red-500">*</span>
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
                    value={formData.amount || ''}
                    onChange={(e) =>
                      handleAmountChange(Number(e.target.value), 'BGN')
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
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={formData.amountEUR || ''}
                    onChange={(e) =>
                      handleAmountChange(Number(e.target.value), 'EUR')
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
              💡 Промените в една валута автоматично обновяват другата
            </p>
          </div>

          {/* Article */}
          <div>
            <label className="label">Артикул</label>
            <select
              className="input"
              value={formData.article}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  article: e.target.value as '' | 'Абакус' | 'Учебна тетрадка' | 'Други',
                })
              }
            >
              <option value="">Месечна такса</option>
              <option value="Абакус">Абакус</option>
              <option value="Учебна тетрадка">Учебна тетрадка</option>
              <option value="Други">Други</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Оставете празно за месечна такса
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="label">
              Метод на плащане <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Кеш', 'ПОС', 'Банков път', 'Фактура'].map((method) => (
                <label
                  key={method}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.method === method
                      ? 'border-primary bg-primary-light'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={method}
                    checked={formData.method === method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        method: e.target.value as 'Кеш' | 'ПОС' | 'Банков път' | 'Фактура',
                      })
                    }
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Receipt Number */}
          <div>
            <label className="label">Номер на документ / фактура</label>
            <input
              type="text"
              className="input"
              placeholder="INV-2024-001"
              value={formData.receiptNumber}
              onChange={(e) =>
                setFormData({ ...formData, receiptNumber: e.target.value })
              }
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Бележки</label>
            <textarea
              className="input min-h-[80px] resize-y"
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
              disabled={addPayment.isPending || updatePayment.isPending || errors.length > 0}
              className="btn btn-primary flex-1"
            >
              {addPayment.isPending || updatePayment.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {payment ? 'Запази промените' : 'Добави плащане'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
