import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle, Package, DollarSign, History } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useInventory, useDeleteInventoryItem, useInventoryStats, useLowStockItems } from '@/hooks/useInventory'
import { formatCurrency } from '@/utils/formatters'
import { InventoryItem } from '@/types'
import InventoryModal from '@/components/InventoryModal'
import StockTransactionModal from '@/components/StockTransactionModal'

export default function InventoryPage() {
  const { userData } = useAuth()

  // 🔒 SECURITY: Only teachers and admins can manage inventory
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  const { inventory, loading } = useInventory()
  const deleteItem = useDeleteInventoryItem()
  const stats = useInventoryStats()
  const { lowStockItems } = useLowStockItems()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [stockModalType, setStockModalType] = useState<'IN' | 'OUT'>('IN')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(inventory.map((item) => item.category)))

  // Filter inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesActive = item.isActive

    return matchesSearch && matchesCategory && matchesActive
  })

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (itemId: string, itemName: string) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете ${itemName}?`)) {
      await deleteItem.mutateAsync(itemId)
    }
  }

  const handleAddStock = (item: InventoryItem) => {
    setSelectedItem(item)
    setStockModalType('IN')
    setIsStockModalOpen(true)
  }

  const handleRemoveStock = (item: InventoryItem) => {
    setSelectedItem(item)
    setStockModalType('OUT')
    setIsStockModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleCloseStockModal = () => {
    setIsStockModalOpen(false)
    setSelectedItem(null)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) {
      return { color: 'text-red-600 bg-red-50', text: 'Изчерпан' }
    } else if (item.currentStock <= item.minimumStock) {
      return { color: 'text-orange-600 bg-orange-50', text: 'Нисък запас' }
    } else {
      return { color: 'text-green-600 bg-green-50', text: 'В наличност' }
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на склада...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Складова база</h1>
          <p className="text-gray-600 mt-1">
            Управление на учебни материали и инвентар
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Добави артикул
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-light rounded-xl">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Общо артикули</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Обща стойност</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Нисък запас</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Изчерпани</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="card border-l-4 border-orange-500 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Внимание: {lowStockItems.length} артикула с нисък запас
              </h3>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <span key={item.id} className="badge bg-white text-orange-700 border border-orange-300">
                    {item.name} ({item.currentStock} бр.)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Търсене по име или SKU код..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`btn ${
                categoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Всички ({inventory.filter((i) => i.isActive).length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`btn ${
                  categoryFilter === category ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                {category} ({inventory.filter((i) => i.category === category && i.isActive).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени артикули
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като добавите първия артикул'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави първи артикул
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th>Категория</th>
                  <th>Наличност</th>
                  <th>Мин. запас</th>
                  <th>Цени</th>
                  <th>Обща стойност</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item)
                  const totalValue = item.currentStock * item.purchasePrice

                  return (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900">
                          {item.currentStock} бр.
                        </p>
                      </td>
                      <td>
                        <p className="text-gray-600">{item.minimumStock} бр.</p>
                      </td>
                      <td>
                        <div className="text-sm">
                          <p className="text-gray-600">
                            Вх: {formatCurrency(item.purchasePrice)}
                          </p>
                          <p className="text-gray-900 font-medium">
                            Прод: {formatCurrency(item.salePrice)}
                          </p>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium">
                          {formatCurrency(totalValue)}
                        </p>
                      </td>
                      <td>
                        <span className={`badge ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddStock(item)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Добави наличност"
                          >
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => handleRemoveStock(item)}
                            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Премахни наличност"
                          >
                            <TrendingDown className="w-4 h-4 text-orange-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Редактиране"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Изтриване"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Modal */}
      {isModalOpen && (
        <InventoryModal
          item={editingItem}
          onClose={handleCloseModal}
        />
      )}

      {/* Stock Transaction Modal */}
      {isStockModalOpen && selectedItem && (
        <StockTransactionModal
          item={selectedItem}
          type={stockModalType}
          onClose={handleCloseStockModal}
        />
      )}
    </div>
  )
}
