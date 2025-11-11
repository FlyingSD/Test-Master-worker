import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useAddInvoice, useUpdateInvoice, useInvoiceNumber } from '@/hooks/useInvoices'
import { Invoice, InvoiceItem } from '@/types'
import { formatDate } from '@/utils/formatters'

interface InvoiceModalProps {
  invoice: Invoice | null
  onClose: () => void
}

interface InvoiceFormValues {
  type: 'Фактура' | 'Касова бележка' | 'Разписка'
  status: 'Чернова' | 'Издадена' | 'Анулирана'
  clientType: 'Физическо лице' | 'Фирма'
  clientName: string
  clientAddress: string
  clientVAT: string
  clientPhone: string
  clientEmail: string
  items: InvoiceItem[]
  vatRate: number
  paymentMethod: 'Кеш' | 'ПОС' | 'Банков път'
  issueDate: Date
  dueDate: Date | null
  notes: string
}

export default function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const addInvoice = useAddInvoice()
  const updateInvoice = useUpdateInvoice()
  const { data: nextInvoiceNumber } = useInvoiceNumber()

  const [formData, setFormData] = useState<InvoiceFormValues>({
    type: 'Фактура',
    status: 'Издадена',
    clientType: 'Физическо лице',
    clientName: '',
    clientAddress: '',
    clientVAT: '',
    clientPhone: '',
    clientEmail: '',
    items: [
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
    vatRate: 20,
    paymentMethod: 'Кеш',
    issueDate: new Date(),
    dueDate: null,
    notes: '',
  })

  useEffect(() => {
    if (invoice) {
      setFormData({
        type: invoice?.type,
        status: invoice?.status,
        clientType: invoice?.clientType,
        clientName: invoice?.clientName,
        clientAddress: invoice?.clientAddress || '',
        clientVAT: invoice?.clientVAT || '',
        clientPhone: invoice?.clientPhone || '',
        clientEmail: invoice?.clientEmail || '',
        items: invoice?.items,
        vatRate: invoice?.vatRate,
        paymentMethod: invoice?.paymentMethod,
        issueDate: invoice?.issueDate instanceof Date ? invoice?.issueDate : invoice?.issueDate.toDate(),
        dueDate: invoice?.dueDate
          ? invoice?.dueDate instanceof Date
            ? invoice?.dueDate
            : invoice?.dueDate.toDate()
          : null,
        notes: invoice?.notes || '',
      })
    }
  }, [invoice])

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData?.items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }

    setFormData({ ...formData, items: newItems })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData?.items,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    })
  }

  const removeItem = (index: number) => {
    if (formData?.items.length === 1) return
    const newItems = formData?.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotals = () => {
    const subtotal = formData?.items.reduce((sum, item) => sum + item?.total, 0)
    const vatAmount = (subtotal * formData?.vatRate) / 100
    const total = subtotal + vatAmount
    return { subtotal, vatAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    // Validation
    if (!formData?.clientName.trim()) {
      alert('Моля въведете име на клиент')
      return
    }

    if (formData?.items.some((item) => !item?.description.trim())) {
      alert('Моля попълнете описание на всички артикули')
      return
    }

    const { subtotal, vatAmount, total } = calculateTotals()

    const invoiceData = {
      ...formData,
      invoiceNumber: invoice?.invoiceNumber || nextInvoiceNumber || '0000001',
      subtotal,
      vatAmount,
      total,
      isPaid: false,
    }

    try {
      if (invoice) {
        await updateInvoice?.mutateAsync({
          id: invoice?.id,
          data: invoiceData,
        })
      } else {
        await addInvoice?.mutateAsync(invoiceData)
      }
      onClose()
    } catch (error) {
      console?.error('Error saving invoice:', error)
      alert('Грешка при запазване на документа')
    }
  }

  const { subtotal, vatAmount, total } = calculateTotals()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {invoice ? 'Редактиране на документ' : 'Нов документ'}
            </h2>
            {!invoice && nextInvoiceNumber && (
              <p className="text-sm text-gray-600 mt-1">Номер: {nextInvoiceNumber}</p>
            )}
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
          {/* Document Type & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Тип документ *</label>
              <select
                className="input"
                value={formData?.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e?.target.value as InvoiceFormValues['type'],
                  })
                }
                required
              >
                <option value="Фактура">Фактура</option>
                <option value="Касова бележка">Касова бележка</option>
                <option value="Разписка">Разписка</option>
              </select>
            </div>

            <div>
              <label className="label">Статус</label>
              <select
                className="input"
                value={formData?.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e?.target.value as InvoiceFormValues['status'],
                  })
                }
              >
                <option value="Чернова">Чернова</option>
                <option value="Издадена">Издадена</option>
                <option value="Анулирана">Анулирана</option>
              </select>
            </div>

            <div>
              <label className="label">Тип клиент</label>
              <select
                className="input"
                value={formData?.clientType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clientType: e?.target.value as InvoiceFormValues['clientType'],
                  })
                }
              >
                <option value="Физическо лице">Физическо лице</option>
                <option value="Фирма">Фирма</option>
              </select>
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Информация за клиент</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  {formData?.clientType === 'Фирма' ? 'Име на фирма' : 'Име и фамилия'} *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData?.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e?.target.value })}
                  required
                />
              </div>

              {formData?.clientType === 'Фирма' && (
                <div>
                  <label className="label">ЕИК/БУЛСТАТ</label>
                  <input
                    type="text"
                    className="input"
                    value={formData?.clientVAT}
                    onChange={(e) => setFormData({ ...formData, clientVAT: e?.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="label">Адрес</label>
                <input
                  type="text"
                  className="input"
                  value={formData?.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e?.target.value })}
                />
              </div>

              <div>
                <label className="label">Телефон</label>
                <input
                  type="tel"
                  className="input"
                  value={formData?.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e?.target.value })}
                />
              </div>

              <div>
                <label className="label">Имейл</label>
                <input
                  type="email"
                  className="input"
                  value={formData?.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e?.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Артикули</h3>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-ghost text-sm"
              >
                <Plus className="w-4 h-4" />
                Добави артикул
              </button>
            </div>

            <div className="space-y-3">
              {formData?.items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <label className="label text-xs">Описание *</label>
                      <input
                        type="text"
                        className="input"
                        value={item?.description}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e?.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="label text-xs">Количество</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="input"
                        value={item?.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseFloat(e?.target.value) || 1)
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="label text-xs">Ед. цена (BGN)</label>
                      <input
                        type="number"
                        min="0"
                        step="0?.01"
                        className="input"
                        value={item?.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', parseFloat(e?.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="label text-xs">Стойност</label>
                      <input
                        type="text"
                        className="input bg-gray-50"
                        value={item?.total.toFixed(2)}
                        readOnly
                      />
                    </div>

                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={formData?.items.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Сума без ДДС:</span>
              <span className="font-medium">{subtotal?.toFixed(2)} лв.</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ДДС ({formData?.vatRate}%):</span>
              <span className="font-medium">{vatAmount?.toFixed(2)} лв.</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>ОБЩО:</span>
              <span className="text-primary">{total?.toFixed(2)} лв.</span>
            </div>
          </div>

          {/* Payment & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Метод на плащане</label>
              <select
                className="input"
                value={formData?.paymentMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethod: e?.target.value as InvoiceFormValues['paymentMethod'],
                  })
                }
              >
                <option value="Кеш">Кеш</option>
                <option value="ПОС">ПОС</option>
                <option value="Банков път">Банков път</option>
              </select>
            </div>

            <div>
              <label className="label">Дата на издаване</label>
              <input
                type="date"
                className="input"
                value={formatDate(formData?.issueDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  setFormData({ ...formData, issueDate: new Date(e?.target.value) })
                }
              />
            </div>

            <div>
              <label className="label">Падеж (опционално)</label>
              <input
                type="date"
                className="input"
                value={formData?.dueDate ? formatDate(formData?.dueDate, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dueDate: e?.target.value ? new Date(e?.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          {/* VAT Rate */}
          <div>
            <label className="label">ДДС ставка (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="input"
              value={formData?.vatRate}
              onChange={(e) =>
                setFormData({ ...formData, vatRate: parseFloat(e?.target.value) || 0 })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Стандартна ставка за България: 20%
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Бележки (опционално)</label>
            <textarea
              className="input"
              rows={3}
              value={formData?.notes}
              onChange={(e) => setFormData({ ...formData, notes: e?.target.value })}
              placeholder="Допълнителна информация..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
              Отказ
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={addInvoice?.isPending || updateInvoice?.isPending}
            >
              {addInvoice?.isPending || updateInvoice?.isPending
                ? 'Записване...'
                : invoice
                ? 'Запази промените'
                : 'Създай документ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
