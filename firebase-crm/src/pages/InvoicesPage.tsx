import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, FileText, DollarSign, CheckCircle, XCircle, Printer, FileDown, Download } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useInvoices, useDeleteInvoice, useInvoiceStats, useMarkInvoicePaid } from '@/hooks/useInvoices'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { exportInvoicesToExcel } from '@/utils/excelExport'
import { generateInvoicePDF } from '@/utils/pdfGenerator'
import { usePagination } from '@/hooks/usePagination'
import { Invoice } from '@/types'
import InvoiceModal from '@/components/InvoiceModal'
import Pagination from '@/components/Pagination'

export default function InvoicesPage() {
  const { userData, isAdmin } = useAuth()
  const { invoices, loading } = useInvoices()
  const deleteInvoice = useDeleteInvoice()
  const markPaid = useMarkInvoicePaid()
  const stats = useInvoiceStats()

  // 🔒 SECURITY: Only teachers and admins can issue invoices and payment documents
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  // Filter invoices
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      invoice?.invoiceNumber.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      invoice?.clientName.toLowerCase().includes(searchTerm?.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && invoice?.isPaid) ||
      (statusFilter === 'unpaid' && !invoice?.isPaid && invoice?.status !== 'Анулирана') ||
      (statusFilter === 'cancelled' && invoice?.status === 'Анулирана')

    return matchesSearch && matchesStatus
  })

  // Pagination
  const {
    paginatedItems: paginatedInvoices,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    totalItems,
  } = usePagination(filteredInvoices, 20)

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setIsModalOpen(true)
  }

  const handleDelete = async (invoiceId: string, invoiceNumber: string) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете ${invoiceNumber}?`)) {
      await deleteInvoice?.mutateAsync(invoiceId)
    }
  }

  const handleMarkPaid = async (invoiceId: string) => {
    await markPaid?.mutateAsync(invoiceId)
  }

  const handlePrint = (invoice: Invoice) => {
    // Simple print for now - can be enhanced with PDF generation
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow?.document.write(`
      <html>
        <head>
          <title>${invoice?.type} ${invoice?.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f4f4f4; }
            .totals { text-align: right; margin-top: 20px; }
            .totals p { margin: 5px 0; font-size: 16px; }
            .totals .total { font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${invoice?.type}</h1>
            <p>№ ${invoice?.invoiceNumber}</p>
            <p>Дата: ${formatDate(invoice?.issueDate)}</p>
          </div>

          <div class="info">
            <h3>Клиент:</h3>
            <p><strong>${invoice?.clientName}</strong></p>
            ${invoice?.clientAddress ? `<p>${invoice?.clientAddress}</p>` : ''}
            ${invoice?.clientVAT ? `<p>ЕИК/БУЛСТАТ: ${invoice?.clientVAT}</p>` : ''}
            ${invoice?.clientPhone ? `<p>Тел: ${invoice?.clientPhone}</p>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Описание</th>
                <th>Количество</th>
                <th>Ед. цена</th>
                <th>Стойност</th>
              </tr>
            </thead>
            <tbody>
              ${invoice?.items.map(item => `
                <tr>
                  <td>${item?.description}</td>
                  <td>${item?.quantity}</td>
                  <td>${formatCurrency(item?.unitPrice)}</td>
                  <td>${formatCurrency(item?.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <p>Сума без ДДС: ${formatCurrency(invoice?.subtotal)}</p>
            <p>ДДС (${invoice?.vatRate}%): ${formatCurrency(invoice?.vatAmount)}</p>
            <p class="total">ОБЩО: ${formatCurrency(invoice?.total)}</p>
            <p><strong>Метод на плащане:</strong> ${invoice?.paymentMethod}</p>
            <p><strong>Статус:</strong> ${invoice?.isPaid ? 'Платена' : 'Неплатена'}</p>
          </div>

          ${invoice?.notes ? `<p style="margin-top: 30px;"><strong>Бележки:</strong> ${invoice?.notes}</p>` : ''}

          <script>window.print(); window.onafterprint = () => window.close();</script>
        </body>
      </html>
    `)
    printWindow?.document.close()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingInvoice(null)
  }

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice?.status === 'Анулирана') {
      return <span className="badge bg-gray-100 text-gray-800">Анулирана</span>
    }
    if (invoice?.isPaid) {
      return <span className="badge bg-green-100 text-green-800">Платена</span>
    }
    return <span className="badge bg-orange-100 text-orange-800">Неплатена</span>
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на фактури...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Фактури и Разписки</h1>
          <p className="text-gray-600 mt-1">
            Управление на документи за плащания
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportInvoicesToExcel(filteredInvoices)}
            className="btn btn-ghost"
            disabled={filteredInvoices?.length === 0}
          >
            <FileDown className="w-5 h-5" />
            Експорт Excel
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Нов документ
          </button>
        </div>
      </div>

      {/* Stats - Only admins see financial statistics */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-xl">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Общо документи</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalInvoices}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Платени</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.paidInvoices}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Общо приходи</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Чакащи плащане</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.pendingRevenue)}
                </p>
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
              placeholder="Търсене по номер или клиент..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Всички ({invoices?.length || 0})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`btn ${statusFilter === 'paid' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Платени ({stats?.paidInvoices})
            </button>
            <button
              onClick={() => setStatusFilter('unpaid')}
              className={`btn ${statusFilter === 'unpaid' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Неплатени ({stats?.unpaidInvoices})
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        {filteredInvoices?.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма намерени документи
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Опитайте с друг критерий за търсене'
                : 'Започнете като създадете първия документ'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Създай първи документ
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
              <thead>
                <tr>
                  <th>Номер</th>
                  <th>Тип</th>
                  <th>Клиент</th>
                  <th>Дата</th>
                  <th>Сума</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices?.map((invoice) => (
                  <tr key={invoice?.id}>
                    <td>
                      <p className="font-bold text-primary">{invoice?.invoiceNumber}</p>
                    </td>
                    <td>
                      <span className="badge badge-primary">{invoice?.type}</span>
                    </td>
                    <td>
                      <p className="font-medium">{invoice?.clientName}</p>
                      {invoice?.clientVAT && (
                        <p className="text-xs text-gray-500">ЕИК: {invoice?.clientVAT}</p>
                      )}
                    </td>
                    <td>{formatDate(invoice?.issueDate)}</td>
                    <td>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(invoice?.total)}
                      </p>
                    </td>
                    <td>{getStatusBadge(invoice)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateInvoicePDF(invoice)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Изтегли PDF"
                        >
                          <Download className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handlePrint(invoice)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Принтиране"
                        >
                          <Printer className="w-4 h-4 text-gray-600" />
                        </button>
                        {!invoice?.isPaid && invoice?.status !== 'Анулирана' && (
                          <button
                            onClick={() => handleMarkPaid(invoice?.id)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Маркирай като платена"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(invoice)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Редактиране"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(invoice?.id, invoice?.invoiceNumber)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Изтриване"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
          </>
        )}
      </div>

      {/* Invoice Modal */}
      {isModalOpen && (
        <InvoiceModal
          invoice={editingInvoice}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
