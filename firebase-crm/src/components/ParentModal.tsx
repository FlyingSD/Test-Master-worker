import { useState, useEffect } from 'react'
import { X, Save, User, Phone, Mail, Building2, MapPin } from 'lucide-react'
import { useAddParent, useUpdateParent } from '@/hooks/useParents'
import { Parent, ParentFormValues } from '@/types'

interface ParentModalProps {
  parent?: Parent | null
  onClose: () => void
}

export default function ParentModal({ parent, onClose }: ParentModalProps) {
  const addParent = useAddParent()
  const updateParent = useUpdateParent()

  const [formData, setFormData] = useState<ParentFormValues>({
    name: '',
    phone: '',
    phone2: '',
    email: '',
    address: '',
    city: '',
    relationship: undefined,
    paymentMethod: undefined,
    companyName: '',
    companyVAT: '',
    companyAddress: '',
    notes: '',
  })

  const [showCompanyFields, setShowCompanyFields] = useState(false)

  // Load parent data if editing
  useEffect(() => {
    if (parent) {
      setFormData({
        name: parent.name,
        phone: parent.phone,
        phone2: parent.phone2 || '',
        email: parent.email || '',
        address: parent.address || '',
        city: parent.city || '',
        relationship: parent.relationship,
        paymentMethod: parent.paymentMethod,
        companyName: parent.companyName || '',
        companyVAT: parent.companyVAT || '',
        companyAddress: parent.companyAddress || '',
        notes: parent.notes || '',
      })
      setShowCompanyFields(!!(parent.companyName || parent.companyVAT || parent.companyAddress))
    }
  }, [parent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (parent) {
      // Update existing parent
      await updateParent.mutateAsync({
        id: parent.id,
        data: formData,
      })
    } else {
      // Add new parent
      await addParent.mutateAsync(formData)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {parent ? 'Редактиране на родител' : 'Добавяне на родител'}
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
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Основна информация
            </h3>

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

            {/* Relationship */}
            <div>
              <label className="label">Родство</label>
              <select
                className="input"
                value={formData.relationship || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    relationship: e.target.value as typeof formData.relationship,
                  })
                }
              >
                <option value="">Изберете...</option>
                <option value="Майка">Майка</option>
                <option value="Баща">Баща</option>
                <option value="Настойник">Настойник</option>
                <option value="Друго">Друго</option>
              </select>
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Контактна информация
            </h3>

            {/* Phone Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Телефон <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  className="input"
                  placeholder="+359 888 123 456"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="label">Втори телефон</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+359 888 123 456"
                  value={formData.phone2}
                  onChange={(e) =>
                    setFormData({ ...formData, phone2: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Имейл</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="ivan.petrov@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="label">Адрес</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="ул. Цар Борис III №15"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label">Град</label>
                <input
                  type="text"
                  className="input"
                  placeholder="София"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Payment Preferences */}
          <div>
            <label className="label">Предпочитан метод на плащане</label>
            <select
              className="input"
              value={formData.paymentMethod || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentMethod: e.target.value as typeof formData.paymentMethod,
                })
              }
            >
              <option value="">Изберете...</option>
              <option value="Кеш">Кеш</option>
              <option value="ПОС">ПОС</option>
              <option value="Банков път">Банков път</option>
              <option value="Фактура">Фактура</option>
            </select>
          </div>

          {/* Company Info Section (Collapsible) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Фирмена информация (опционално)
              </h3>
              <button
                type="button"
                onClick={() => setShowCompanyFields(!showCompanyFields)}
                className="text-sm text-primary hover:underline"
              >
                {showCompanyFields ? 'Скрий' : 'Покажи'}
              </button>
            </div>

            {showCompanyFields && (
              <div className="space-y-4 pl-7 border-l-2 border-primary-light">
                {/* Company Name */}
                <div>
                  <label className="label">Име на фирма</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ООД Пример"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>

                {/* Company VAT */}
                <div>
                  <label className="label">ЕИК/БУЛСТАТ</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="123456789"
                    value={formData.companyVAT}
                    onChange={(e) =>
                      setFormData({ ...formData, companyVAT: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    За издаване на фактури
                  </p>
                </div>

                {/* Company Address */}
                <div>
                  <label className="label">Адрес за фактури</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="гр. София, ул. Бизнес №1"
                    value={formData.companyAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, companyAddress: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Бележки</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Допълнителна информация, предпочитания, специални условия..."
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
              disabled={addParent.isPending || updateParent.isPending}
              className="btn btn-primary flex-1"
            >
              {addParent.isPending || updateParent.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {parent ? 'Запази промените' : 'Добави родител'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
