import { useState, useMemo, memo } from 'react'
import { X, DollarSign, CheckCircle } from 'lucide-react'
import { useStudents } from '@/hooks/useStudents'
import { useBulkAddPayments } from '@/hooks/usePayments'
import { formatCurrency } from '@/utils/formatters'
import { PAYMENT_METHODS, STUDENT_STATUS } from '@/constants/appConstants'

interface BulkPaymentModalProps {
  onClose: () => void
}

function BulkPaymentModal({ onClose }: BulkPaymentModalProps) {
  const { students } = useStudents()
  const bulkAddPayments = useBulkAddPayments()

  // PERFORMANCE FIX: Memoize activeStudents filter to prevent re-computation on every render
  const activeStudents = useMemo(
    () => students?.filter((s) => s?.status === STUDENT_STATUS?.ACTIVE) || [],
    [students]
  )

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState<number>(0)
  const [amountEUR, setAmountEUR] = useState<number>(0)
  const [item, setItem] = useState('Месечна такса')
  const [method, setMethod] = useState<typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]>(PAYMENT_METHODS?.CASH)
  const [date, setDate] = useState(new Date())
  const [notes, setNotes] = useState('')

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds)
    if (newSelected?.has(studentId)) {
      newSelected?.delete(studentId)
    } else {
      newSelected?.add(studentId)
    }
    setSelectedStudentIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedStudentIds?.size === activeStudents?.length) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(activeStudents?.map((s) => s?.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    if (selectedStudentIds?.size === 0) {
      alert('Моля изберете поне един ученик')
      return
    }

    if (amount <= 0) {
      alert('Моля въведете валидна сума')
      return
    }

    const selectedStudents = activeStudents?.filter((s) => selectedStudentIds?.has(s?.id))

    const paymentsToAdd = selectedStudents?.map((student) => ({
      studentId: student?.id,
      studentName: student?.name,
      amount,
      amountEUR,
      item,
      method,
      date,
      notes,
      documentNumber: '',
    }))

    try {
      await bulkAddPayments?.mutateAsync(paymentsToAdd)
      onClose()
    } catch (error) {
      console.error('Error adding bulk payments:', error)
      alert('Грешка при добавяне на плащания')
    }
  }

  const totalAmount = amount * selectedStudentIds?.size

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Групово плащане</h2>
            <p className="text-sm text-gray-600 mt-1">
              Добавете плащане за множество ученици наведнъж
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Детайли на плащането</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Артикул *</label>
                <input
                  type="text"
                  className="input"
                  value={item}
                  onChange={(e) => setItem(e?.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Метод на плащане</label>
                <select
                  className="input"
                  value={method}
                  onChange={(e) => setMethod(e?.target.value as typeof method)}
                >
                  <option value="Кеш">Кеш</option>
                  <option value="ПОС">ПОС</option>
                  <option value="Банков път">Банков път</option>
                </select>
              </div>

              <div>
                <label className="label">Сума (BGN) *</label>
                <input
                  type="number"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e?.target.value) || 0)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="label">Сума (EUR)</label>
                <input
                  type="number"
                  className="input"
                  value={amountEUR}
                  onChange={(e) => setAmountEUR(parseFloat(e?.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="label">Дата</label>
                <input
                  type="date"
                  className="input"
                  value={date?.toISOString().split('T')[0]}
                  onChange={(e) => setDate(new Date(e?.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="label">Бележки (опционално)</label>
              <textarea
                className="input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e?.target.value)}
                placeholder="Допълнителна информация..."
              />
            </div>
          </div>

          {/* Student Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Избор на ученици ({selectedStudentIds?.size} от {activeStudents?.length})
              </h3>
              <button
                type="button"
                onClick={handleSelectAll}
                className="btn btn-ghost text-sm"
              >
                {selectedStudentIds?.size === activeStudents?.length
                  ? 'Премахни всички'
                  : 'Избери всички'}
              </button>
            </div>

            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {activeStudents?.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Няма активни ученици</p>
                </div>
              ) : (
                <div className="divide-y">
                  {activeStudents?.map((student) => {
                    const isSelected = selectedStudentIds?.has(student?.id)
                    return (
                      <label
                        key={student?.id}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleStudent(student?.id)}
                          className="w-5 h-5 text-primary rounded focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{student?.name}</p>
                          <p className="text-sm text-gray-600">
                            {student?.group} • Такса: {formatCurrency(student?.fee)}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedStudentIds?.size > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Брой ученици:</span>
                <span className="font-medium">{selectedStudentIds?.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Сума на ученик:</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>ОБЩО:</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
              Отказ
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={bulkAddPayments?.isPending || selectedStudentIds?.size === 0}
            >
              {bulkAddPayments?.isPending
                ? 'Записване...'
                : `Добави ${selectedStudentIds?.size} плащания`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// PERFORMANCE FIX: Wrap in React.memo to prevent unnecessary re-renders
export default memo(BulkPaymentModal)
