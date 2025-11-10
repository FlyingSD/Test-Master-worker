import * as XLSX from 'xlsx'
import { Student, Payment, Expense, Parent, Invoice, Attendance } from '@/types'
import { formatDate, formatCurrency } from './formatters'

export function exportStudentsToExcel(students: Student[]) {
  const data = students.map((student) => ({
    'Име': student.name,
    'Група': student.group,
    'Тип обучение': student.studyType,
    'Такса (BGN)': student.fee,
    'Такса (EUR)': student.feeEUR,
    'Падеж': formatDate(student.dueDate),
    'Статус': student.status === 'active' ? 'Активен' : 'Неактивен',
    'Бележки': student.notes || '',
    'Създаден': formatDate(student.createdAt),
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ученици')

  // Auto-size columns
  const maxWidth = 50
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map((row: any) => String(row[key] || '').length)
      ),
      maxWidth
    ),
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `Ученици_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

export function exportPaymentsToExcel(payments: Payment[]) {
  const data = payments.map((payment) => ({
    'Ученик': payment.studentName,
    'Сума (BGN)': payment.amount,
    'Сума (EUR)': payment.amountEUR,
    'Артикул': payment.item || 'Месечна такса',
    'Метод': payment.method,
    'Дата': formatDate(payment.date),
    'Документ №': payment.documentNumber || '',
    'Бележки': payment.notes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Плащания')

  // Add totals row
  const totals = {
    'Ученик': 'ОБЩО:',
    'Сума (BGN)': payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2),
    'Сума (EUR)': payments.reduce((sum, p) => sum + p.amountEUR, 0).toFixed(2),
  }
  XLSX.utils.sheet_add_json(ws, [totals], { origin: -1, skipHeader: true })

  // Auto-size columns
  const maxWidth = 40
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map((row: any) => String(row[key] || '').length)
      ),
      maxWidth
    ),
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `Плащания_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

export function exportExpensesToExcel(expenses: Expense[]) {
  const data = expenses.map((expense) => ({
    'Дата': formatDate(expense.date),
    'Категория': expense.category,
    'Сума (BGN)': expense.amount,
    'Описание': expense.description,
    'Фактура №': expense.receiptNumber || '',
    'Създаден от': expense.createdBy,
    'Бележки': expense.notes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Разходи')

  // Add totals row
  const totals = {
    'Дата': 'ОБЩО:',
    'Категория': '',
    'Сума (BGN)': expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2),
  }
  XLSX.utils.sheet_add_json(ws, [totals], { origin: -1, skipHeader: true })

  // Auto-size columns
  const maxWidth = 50
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map((row: any) => String(row[key] || '').length)
      ),
      maxWidth
    ),
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `Разходи_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

export function exportParentsToExcel(parents: Parent[]) {
  const data = parents.map((parent) => ({
    'Име': parent.name,
    'Телефон': parent.phone,
    'Втори телефон': parent.phone2 || '',
    'Имейл': parent.email || '',
    'Адрес': parent.address || '',
    'Град': parent.city || '',
    'Родство': parent.relationship || '',
    'Метод на плащане': parent.paymentMethod || '',
    'Фирма': parent.companyName || '',
    'ЕИК': parent.companyVAT || '',
    'Брой деца': parent.studentIds.length,
    'Бележки': parent.notes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Родители')

  // Auto-size columns
  const maxWidth = 50
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map((row: any) => String(row[key] || '').length)
      ),
      maxWidth
    ),
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `Родители_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

export function exportInvoicesToExcel(invoices: Invoice[]) {
  const data = invoices.map((invoice) => ({
    'Номер': invoice.invoiceNumber,
    'Тип': invoice.type,
    'Клиент': invoice.clientName,
    'ЕИК': invoice.clientVAT || '',
    'Дата': formatDate(invoice.issueDate),
    'Падеж': invoice.dueDate ? formatDate(invoice.dueDate) : '',
    'Сума без ДДС': invoice.subtotal.toFixed(2),
    'ДДС': invoice.vatAmount.toFixed(2),
    'Общо': invoice.total.toFixed(2),
    'Статус': invoice.isPaid ? 'Платена' : 'Неплатена',
    'Метод': invoice.paymentMethod,
    'Бележки': invoice.notes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Фактури')

  // Add totals row
  const totals = {
    'Номер': 'ОБЩО:',
    'Тип': '',
    'Клиент': '',
    'ЕИК': '',
    'Дата': '',
    'Падеж': '',
    'Сума без ДДС': invoices.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2),
    'ДДС': invoices.reduce((sum, i) => sum + i.vatAmount, 0).toFixed(2),
    'Общо': invoices.reduce((sum, i) => sum + i.total, 0).toFixed(2),
  }
  XLSX.utils.sheet_add_json(ws, [totals], { origin: -1, skipHeader: true })

  // Auto-size columns
  const maxWidth = 40
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map((row: any) => String(row[key] || '').length)
      ),
      maxWidth
    ),
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `Фактури_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

export function exportAttendanceToExcel(attendance: Attendance[]) {
  const data = attendance.map((record) => ({
    'Дата': formatDate(record.date),
    'Ученик': record.studentName,
    'Статус': record.status === 'present' ? 'Присъства'
            : record.status === 'absent' ? 'Отсъства'
            : record.status === 'late' ? 'Закъснение'
            : 'Извинен',
    'Бележки': record.notes || '',
    'Записано от': record.createdBy,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Присъствия')

  // Auto-size columns
  const maxWidth = 50
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map((row: any) => String(row[key] || '').length)
      ),
      maxWidth
    ),
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `Присъствия_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`)
}
