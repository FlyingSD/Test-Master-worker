import { useState, useEffect } from 'react'
import { X, Save, Calendar, DollarSign } from 'lucide-react'
import { useAddExpense, useUpdateExpense } from '@/hooks/useExpenses'
import { Expense, ExpenseFormValues } from '@/types'
import { Timestamp } from 'firebase/firestore'

interface ExpenseModalProps {
  expense?: Expense | null
  onClose: () => void
}

export default function ExpenseModal({ expense, onClose }: ExpenseModalProps) {
  const addExpense = useAddExpense()
  const updateExpense = useUpdateExpense()

  const [formData, setFormData] = useState<ExpenseFormValues>({
    category: 'Материали',
    amount: 0,
    description: '',
    date: new Date(),
    receiptNumber: '',
  })

  // Load expense data if editing
  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: expense.date instanceof Timestamp
          ? expense.date.toDate()
          : expense.date,
        receiptNumber: expense.receiptNumber || '',
      })
    }
  }, [expense])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (expense) {
      // Update existing expense
      await updateExpense.mutateAsync({
        id: expense.id,
        data: formData,
      })
    } else {
      // Add new expense
      await addExpense.mutateAsync(formData)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {expense ? 'Редактиране на разход' : 'Добавяне на разход'}
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
          {/* Category */}
          <div>
            <label className="label">
              Категория <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="input"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as typeof formData.category,
                })
              }
            >
              <option value="Наем">Наем</option>
              <option value="Ток">Ток</option>
              <option value="Вода">Вода</option>
              <option value="Интернет">Интернет</option>
              <option value="Заплати">Заплати</option>
              <option value="Материали">Материали</option>
              <option value="Реклама">Реклама</option>
              <option value="Други">Други</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="label">
              Сума (BGN) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="input pl-10"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Описание <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              className="input min-h-[100px] resize-y"
              placeholder="Подробно описание на разхода..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Date */}
          <div>
            <label className="label">
              Дата <span className="text-red-500">*</span>
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
                onChange={(e) =>
                  setFormData({ ...formData, date: new Date(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Receipt Number */}
          <div>
            <label className="label">Номер на документ</label>
            <input
              type="text"
              className="input"
              placeholder="INV-001, БЛ-123, и т.н."
              value={formData.receiptNumber}
              onChange={(e) =>
                setFormData({ ...formData, receiptNumber: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Номер на фактура, касова бележка или друг документ
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
              disabled={addExpense.isPending || updateExpense.isPending}
              className="btn btn-primary flex-1"
            >
              {addExpense.isPending || updateExpense.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {expense ? 'Запази промените' : 'Добави разход'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
