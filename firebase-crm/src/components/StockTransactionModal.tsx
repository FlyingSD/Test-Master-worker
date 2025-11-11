import { useState } from 'react'
import { X, Save, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { useAddStockTransaction } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import { InventoryItem, StockTransactionFormValues } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface StockTransactionModalProps {
  item: InventoryItem
  type: 'IN' | 'OUT'
  onClose: () => void
}

export default function StockTransactionModal({ item, type, onClose }: StockTransactionModalProps) {
  const { user } = useAuth()
  const addTransaction = useAddStockTransaction()

  const [formData, setFormData] = useState<StockTransactionFormValues>({
    inventoryItemId: item?.id,
    type: type,
    quantity: 1,
    pricePerUnit: type === 'IN' ? item?.purchasePrice : item?.salePrice,
    reason: type === 'IN' ? 'Покупка от доставчик' : 'Продажба на ученик',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    if (!user) {
      return
    }

    // Validation: Check if OUT quantity exceeds current stock
    if (type === 'OUT' && formData?.quantity > item?.currentStock) {
      alert(`Недостатъчна наличност! Налично: ${item?.currentStock} бр.`)
      return
    }

    await addTransaction?.mutateAsync({
      data: formData,
      inventoryItem: item,
    })

    onClose()
  }

  const totalPrice = formData?.quantity * formData?.pricePerUnit
  const newStock = type === 'IN'
    ? item?.currentStock + formData?.quantity
    : item?.currentStock - formData?.quantity

  const isLowStock = newStock <= item?.minimumStock
  const isOutOfStock = newStock === 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {type === 'IN' ? (
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {type === 'IN' ? 'Добавяне на наличност' : 'Изписване от склад'}
              </h2>
              <p className="text-sm text-gray-600">{item?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Stock Info */}
          <div className="card bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Текуща наличност</p>
                <p className="text-2xl font-bold text-gray-900">
                  {item?.currentStock} бр.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">След операцията</p>
                <p className={`text-2xl font-bold ${
                  isOutOfStock ? 'text-red-600' :
                  isLowStock ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {newStock} бр.
                </p>
              </div>
            </div>
          </div>

          {/* Warning for low stock */}
          {(isLowStock || isOutOfStock) && type === 'OUT' && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
              isOutOfStock
                ? 'bg-red-50 border-red-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0?.5 ${
                isOutOfStock ? 'text-red-600' : 'text-orange-600'
              }`} />
              <div className="flex-1">
                <p className={`font-semibold ${
                  isOutOfStock ? 'text-red-900' : 'text-orange-900'
                }`}>
                  {isOutOfStock ? 'Внимание: Артикулът ще се изчерпи!' : 'Внимание: Нисък запас!'}
                </p>
                <p className={`text-sm ${
                  isOutOfStock ? 'text-red-700' : 'text-orange-700'
                }`}>
                  {isOutOfStock
                    ? 'След тази операция артикулът няма да е наличен.'
                    : `Минималният запас е ${item?.minimumStock} бр.`}
                </p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="label">
              Количество <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max={type === 'OUT' ? item?.currentStock : undefined}
              className="input"
              placeholder="0"
              value={formData?.quantity || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: Number(e?.target.value),
                })
              }
            />
            {type === 'OUT' && (
              <p className="text-xs text-gray-500 mt-1">
                Максимум: {item?.currentStock} бр.
              </p>
            )}
          </div>

          {/* Price Per Unit */}
          <div>
            <label className="label">
              Цена за единица (BGN) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0?.01"
              className="input"
              placeholder="0?.00"
              value={formData?.pricePerUnit || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricePerUnit: Number(e?.target.value),
                })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Предложена: {formatCurrency(type === 'IN' ? item?.purchasePrice : item?.salePrice)}
            </p>
          </div>

          {/* Total Price */}
          <div className="card bg-primary-light">
            <div className="flex items-center justify-between">
              <p className="text-gray-700 font-medium">Обща стойност</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totalPrice)}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="label">
              Причина <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="input"
              value={formData?.reason}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reason: e?.target.value as typeof formData?.reason,
                })
              }
            >
              {type === 'IN' ? (
                <>
                  <option value="Покупка от доставчик">Покупка от доставчик</option>
                  <option value="Инвентаризация">Инвентаризация</option>
                  <option value="Друго">Друго</option>
                </>
              ) : (
                <>
                  <option value="Продажба на ученик">Продажба на ученик</option>
                  <option value="Брак">Брак</option>
                  <option value="Инвентаризация">Инвентаризация</option>
                  <option value="Друго">Друго</option>
                </>
              )}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Бележки</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Допълнителна информация..."
              value={formData?.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e?.target.value })
              }
            />
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Обобщение</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Операция:</span>
                <span className="font-medium">
                  {type === 'IN' ? 'Добавяне (+)' : 'Изписване (-)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Количество:</span>
                <span className="font-medium">{formData?.quantity} бр.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Текуща наличност:</span>
                <span className="font-medium">{item?.currentStock} бр.</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-semibold">Нова наличност:</span>
                <span className="font-bold text-lg">{newStock} бр.</span>
              </div>
            </div>
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
              disabled={addTransaction?.isPending}
              className={`btn flex-1 ${
                type === 'IN' ? 'btn-primary bg-green-600 hover:bg-green-700' : 'btn-primary bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {addTransaction?.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {type === 'IN' ? 'Добави наличност' : 'Изпиши от склада'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
