import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Invoice } from '@/types'
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
