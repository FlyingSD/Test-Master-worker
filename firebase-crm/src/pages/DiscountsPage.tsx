import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Percent, Tag } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDiscounts, useDeleteDiscount } from '@/hooks/useDiscounts'
import { formatDate, formatCurrency } from '@/utils/formatters'
import DiscountModal from '@/components/DiscountModal'
import { Discount } from '@/types'

export default function DiscountsPage() {
  const { userData } = useAuth()

  // 🔒 SECURITY: Only teachers and admins can manage discounts
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  const { discounts, loading } = useDiscounts()
  const deleteDiscount = useDeleteDiscount()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)

  // Filter discounts
  const filteredDiscounts = discounts?.filter((discount) =>
    discount?.studentName.toLowerCase().includes(searchTerm?.toLowerCase())
  )

  // Active discounts
  const activeDiscounts = discounts?.filter(d => {
    const now = new Date()
    const endDate = d?.endDate instanceof Date ? d?.endDate : d?.endDate.toDate()
    return d?.isActive && endDate >= now
  })

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount)
    setIsModalOpen(true)
  }

  const handleDelete = async (discountId: string, studentName: string) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете отстъпката за ${studentName}?`)) {
      await deleteDiscount?.mutateAsync(discountId)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDiscount(null)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на отстъпки...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Отстъпки</h1>
          <p className="text-gray-600 mt-1">Управление на отстъпки за ученици</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Добави отстъпка
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-light rounded-xl">
              <Percent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Общо отстъпки</p>
              <p className="text-2xl font-bold text-gray-900">{discounts?.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Tag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Активни отстъпки</p>
              <p className="text-2xl font-bold text-gray-900">{activeDiscounts?.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Търсене по име на ученик..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target.value)}
          />
        </div>
      </div>

      {/* Discounts Table */}
      <div className="card overflow-hidden">
        {filteredDiscounts?.length === 0 ? (
          <div className="text-center py-12">
            <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени отстъпки
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като добавите първата си отстъпка'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Добави първа отстъпка
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Тип</th>
                  <th>Стойност</th>
                  <th>Период</th>
                  <th>Причина</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts?.map((discount) => {
                  const now = new Date()
                  const endDate = discount?.endDate instanceof Date
                    ? discount?.endDate
                    : discount?.endDate.toDate()
                  const isActive = discount?.isActive && endDate >= now

                  return (
                    <tr key={discount?.id}>
                      <td>
                        <p className="font-medium text-gray-900">
                          {discount?.studentName}
                        </p>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {discount?.type}
                        </span>
                      </td>
                      <td>
                        <div>
                          {discount?.type === 'Процент' ? (
                            <p className="font-medium text-accent">
                              {discount?.value}%
                            </p>
                          ) : (
                            <p className="font-medium text-accent">
                              {formatCurrency(discount?.value)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <p>{formatDate(discount?.startDate)}</p>
                          <p className="text-gray-500">до {formatDate(discount?.endDate)}</p>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {discount?.reason}
                        </p>
                      </td>
                      <td>
                        {isActive ? (
                          <span className="badge badge-success">
                            Активна
                          </span>
                        ) : (
                          <span className="badge badge-danger">
                            Изтекла
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(discount)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Редактиране"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(discount?.id, discount?.studentName)}
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

      {/* Discount Modal */}
      {isModalOpen && (
        <DiscountModal
          discount={editingDiscount}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
