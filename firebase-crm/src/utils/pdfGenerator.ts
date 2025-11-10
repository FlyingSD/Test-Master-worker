import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Invoice, Payment, Student } from '@/types'
import { formatDate, formatCurrency } from './formatters'

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF()

  // Add Bulgarian font support (using default font for now)
  doc.setFont('helvetica')

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.type, 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`No ${invoice.invoiceNumber}`, 105, 30, { align: 'center' })
  doc.text(`Data: ${formatDate(invoice.issueDate)}`, 105, 37, { align: 'center' })

  // School/Company Information (Left)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Izdatel:', 20, 50)

  doc.setFont('helvetica', 'normal')
  doc.text('Svetlinki CRM', 20, 56)
  doc.text('Sofia, Bulgaria', 20, 62)
  // Add more company details if available

  // Client Information (Right)
  doc.setFont('helvetica', 'bold')
  doc.text('Klient:', 120, 50)

  doc.setFont('helvetica', 'normal')
  const clientInfo = [
    invoice.clientName,
    invoice.clientAddress || '',
    invoice.clientVAT ? `EIK/BULSTAT: ${invoice.clientVAT}` : '',
    invoice.clientPhone ? `Tel: ${invoice.clientPhone}` : '',
  ].filter(Boolean)

  let yOffset = 56
  clientInfo.forEach((line) => {
    doc.text(line, 120, yOffset)
    yOffset += 6
  })

  // Items Table
  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total),
  ])

  autoTable(doc, {
    startY: 90,
    head: [['Opisanie', 'Kolichestvo', 'Ed. tsena', 'Stoynost']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [109, 40, 217], // Primary color
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  })

  // Get the final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || 90

  // Totals
  doc.setFont('helvetica', 'normal')
  const totalsX = 140
  let totalsY = finalY + 15

  doc.text('Suma bez DDS:', totalsX, totalsY)
  doc.text(formatCurrency(invoice.subtotal), 190, totalsY, { align: 'right' })

  totalsY += 7
  doc.text(`DDS (${invoice.vatRate}%):`, totalsX, totalsY)
  doc.text(formatCurrency(invoice.vatAmount), 190, totalsY, { align: 'right' })

  totalsY += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('OBSHO:', totalsX, totalsY)
  doc.text(formatCurrency(invoice.total) + ' lv.', 190, totalsY, { align: 'right' })

  // Payment Info
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  totalsY += 15
  doc.text(`Metod na plashtane: ${invoice.paymentMethod}`, 20, totalsY)
  doc.text(`Status: ${invoice.isPaid ? 'Platena' : 'Neplatena'}`, 20, totalsY + 7)

  if (invoice.dueDate) {
    doc.text(`Padezh: ${formatDate(invoice.dueDate)}`, 20, totalsY + 14)
  }

  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'italic')
    doc.text('Belezhki:', 20, totalsY + 25)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(invoice.notes, 170)
    doc.text(splitNotes, 20, totalsY + 32)
  }

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Generiran: ${formatDate(new Date())}`,
    105,
    280,
    { align: 'center' }
  )

  // Save the PDF
  doc.save(`${invoice.type}_${invoice.invoiceNumber}.pdf`)
}

/**
 * Generates a payment receipt PDF for parents
 * Simple receipt format with payment details
 *
 * @param payment - Payment record
 * @param student - Student information
 */
export function generatePaymentReceipt(payment: Payment, student: Student) {
  const doc = new jsPDF()

  // Add Bulgarian font support
  doc.setFont('helvetica')

  // Header with logo/icon
  doc.setFillColor(109, 40, 217) // Primary color
  doc.rect(0, 0, 210, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('💡 Светлинки', 105, 15, { align: 'center' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('КВИТАНЦИЯ ЗА ПЛАЩАНЕ', 105, 25, { align: 'center' })

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Receipt number and date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Номер: ${payment.receiptNumber || payment.id.substring(0, 8).toUpperCase()}`, 20, 45)
  const paymentDate = payment.date instanceof Date ? payment.date : payment.date?.toDate?.() || new Date()
  doc.text(`Дата: ${formatDate(paymentDate)}`, 150, 45)

  // Student info section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Информация за ученик:', 20, 60)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Име: ${student.name}`, 20, 68)
  doc.text(`Група: ${student.group}`, 20, 75)
  doc.text(`Тип обучение: ${student.studyType || 'Стандартно'}`, 20, 82)

  // Payment details box
  doc.setDrawColor(109, 40, 217)
  doc.setLineWidth(0.5)
  doc.rect(15, 95, 180, 50)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Детайли на плащането:', 20, 105)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Артикул:', 20, 115)
  doc.text(payment.article || 'Месечна такса', 70, 115)

  doc.text('Сума:', 20, 125)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(34, 197, 94) // Green color
  doc.text(formatCurrency(payment.amount) + ' лв.', 70, 125)

  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Метод:', 20, 135)
  doc.text(payment.method, 70, 135)

  // Notes section
  if (payment.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Бележки:', 20, 160)

    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(payment.notes, 170)
    doc.text(splitNotes, 20, 168)
  }

  // Thank you message
  const thankYouY = payment.notes ? 190 : 170
  doc.setFillColor(240, 240, 240)
  doc.rect(15, thankYouY, 180, 20, 'F')

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text('Благодарим за вашето доверие! 🎓', 105, thankYouY + 10, { align: 'center' })
  doc.text('Образователен център "Светлинки"', 105, thankYouY + 16, { align: 'center' })

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Генериран: ${formatDate(new Date())} | www.svetlinki.bg`,
    105,
    280,
    { align: 'center' }
  )

  // Save the PDF
  const fileName = `Kvitancia_${student.name.replace(/\s+/g, '_')}_${formatDate(paymentDate).replace(/\./g, '-')}.pdf`
  doc.save(fileName)
}
