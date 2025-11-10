import { useState, useEffect } from 'react'
import { X, Save, Package } from 'lucide-react'
import { useAddInventoryItem, useUpdateInventoryItem } from '@/hooks/useInventory'
import { useAuth } from '@/hooks/useAuth'
import { InventoryItem, InventoryFormValues } from '@/types'

interface InventoryModalProps {
  item?: InventoryItem | null
  onClose: () => void
}

export default function InventoryModal({ item, onClose }: InventoryModalProps) {
  const { user } = useAuth()
  const addItem = useAddInventoryItem()
  const updateItem = useUpdateInventoryItem()

  const [formData, setFormData] = useState<InventoryFormValues>({
    sku: '',
    name: '',
    category: 'Абакуси',
    description: '',
    purchasePrice: 0,
    salePrice: 0,
    currentStock: 0,
    minimumStock: 5,
    location: '',
    supplier: '',
    isActive: true,
  })

  // Load item data if editing
  useEffect(() => {
    if (item) {
      setFormData({
        sku: item.sku,
        name: item.name,
        category: item.category,
        description: item.description || '',
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        location: item.location || '',
        supplier: item.supplier || '',
        isActive: item.isActive,
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      return
    }

    if (item) {
      // Update existing item (don't update currentStock here, use stock transactions)
      const { currentStock, ...updateData } = formData
      await updateItem.mutateAsync({
        id: item.id,
        data: updateData,
      })
    } else {
      // Add new item
      await addItem.mutateAsync({
        data: formData,
        userId: user.id,
      })
    }

    onClose()
  }

  const calculateProfit = () => {
    const profit = formData.salePrice - formData.purchasePrice
    const profitPercent = formData.purchasePrice > 0
      ? ((profit / formData.purchasePrice) * 100).toFixed(1)
      : '0'
    return { profit, profitPercent }
  }

  const { profit, profitPercent } = calculateProfit()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? 'Редактиране на артикул' : 'Добавяне на артикул'}
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
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Име на артикул <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="Абакус 13 реда"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">
                SKU код <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="ABA-001"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Уникален складов код
              </p>
            </div>
          </div>

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
              <option value="Абакуси">Абакуси</option>
              <option value="Учебници">Учебници</option>
              <option value="Тетрадки">Тетрадки</option>
              <option value="Материали">Материали</option>
              <option value="Други">Други</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">Описание</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Подробно описание на артикула..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Входна цена (BGN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="input"
                placeholder="0.00"
                value={formData.purchasePrice || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchasePrice: Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Продажна цена (BGN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="input"
                placeholder="0.00"
                value={formData.salePrice || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salePrice: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Profit Calculation */}
          {formData.purchasePrice > 0 && formData.salePrice > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Печалба:</span>{' '}
                {profit.toFixed(2)} BGN ({profitPercent}%)
              </p>
            </div>
          )}

          {/* Stock Levels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                {item ? 'Текуща наличност (само за преглед)' : 'Начална наличност'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                className="input"
                placeholder="0"
                value={formData.currentStock || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentStock: Number(e.target.value),
                  })
                }
                disabled={!!item} // Disable if editing
              />
              {item && (
                <p className="text-xs text-gray-500 mt-1">
                  Използвайте бутоните "+" и "-" за промяна на наличността
                </p>
              )}
            </div>

            <div>
              <label className="label">
                Минимален запас <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                className="input"
                placeholder="5"
                value={formData.minimumStock || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumStock: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Известие при достигане на този брой
              </p>
            </div>
          </div>

          {/* Location & Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Локация в склада</label>
              <input
                type="text"
                className="input"
                placeholder="Рафт А-3"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">Доставчик</label>
              <input
                type="text"
                className="input"
                placeholder="Име на доставчик"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
              />
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-gray-700">Артикулът е активен</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Неактивните артикули не се показват в списъка
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
              disabled={addItem.isPending || updateItem.isPending}
              className="btn btn-primary flex-1"
            >
              {addItem.isPending || updateItem.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {item ? 'Запази промените' : 'Добави артикул'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
