import emailjs from '@emailjs/browser'
import { Student, Parent, Invoice } from '@/types'
import { formatDate, formatCurrency } from './formatters'

// EmailJS configuration
// To use this, you need to:
// 1. Create an account at https://www?.emailjs.com/
// 2. Create an email service
// 3. Create email templates
// 4. Add your credentials to .env file:
//    VITE_EMAILJS_SERVICE_ID=your_service_id
//    VITE_EMAILJS_PUBLIC_KEY=your_public_key

const SERVICE_ID = import?.meta.env?.VITE_EMAILJS_SERVICE_ID || ''
const PUBLIC_KEY = import?.meta.env?.VITE_EMAILJS_PUBLIC_KEY || ''

// Initialize EmailJS
export function initEmailJS() {
  if (PUBLIC_KEY) {
    emailjs?.init(PUBLIC_KEY)
  }
}

// Check if email service is configured
export function isEmailConfigured(): boolean {
  return Boolean(SERVICE_ID && PUBLIC_KEY)
}

// Send payment reminder email
export async function sendPaymentReminderEmail(
  student: Student,
  parent: Parent
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console?.warn('EmailJS is not configured')
    return false
  }

  if (!parent?.email) {
    console?.warn('Parent does not have an email address')
    return false
  }

  const TEMPLATE_ID = 'payment_reminder' // Create this template in EmailJS

  const templateParams = {
    to_email: parent?.email,
    to_name: parent?.name,
    student_name: student?.name,
    amount: formatCurrency(student?.fee),
    due_date: formatDate(student?.dueDate),
    school_name: 'Svetlinki',
  }

  try {
    await emailjs?.send(SERVICE_ID, TEMPLATE_ID, templateParams)
    console?.log('Payment reminder email sent successfully')
    return true
  } catch (error) {
    console?.error('Failed to send payment reminder email:', error)
    return false
  }
}

// Send invoice email
export async function sendInvoiceEmail(
  invoice: Invoice,
  recipientEmail: string,
  recipientName: string
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console?.warn('EmailJS is not configured')
    return false
  }

  const TEMPLATE_ID = 'invoice_notification' // Create this template in EmailJS

  const templateParams = {
    to_email: recipientEmail,
    to_name: recipientName,
    invoice_number: invoice?.invoiceNumber,
    invoice_type: invoice?.type,
    invoice_date: formatDate(invoice?.issueDate),
    total_amount: formatCurrency(invoice?.total),
    payment_method: invoice?.paymentMethod,
    school_name: 'Svetlinki',
  }

  try {
    await emailjs?.send(SERVICE_ID, TEMPLATE_ID, templateParams)
    console?.log('Invoice email sent successfully')
    return true
  } catch (error) {
    console?.error('Failed to send invoice email:', error)
    return false
  }
}

// Send bulk payment reminders
export async function sendBulkPaymentReminders(
  studentsWithParents: Array<{ student: Student; parent: Parent }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const { student, parent } of studentsWithParents) {
    const success = await sendPaymentReminderEmail(student, parent)
    if (success) {
      sent++
    } else {
      failed++
    }
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return { sent, failed }
}

// Send welcome email to new parent
export async function sendWelcomeEmail(
  parent: Parent
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console?.warn('EmailJS is not configured')
    return false
  }

  if (!parent?.email) {
    console?.warn('Parent does not have an email address')
    return false
  }

  const TEMPLATE_ID = 'welcome_email' // Create this template in EmailJS

  const templateParams = {
    to_email: parent?.email,
    to_name: parent?.name,
    school_name: 'Svetlinki',
  }

  try {
    await emailjs?.send(SERVICE_ID, TEMPLATE_ID, templateParams)
    console?.log('Welcome email sent successfully')
    return true
  } catch (error) {
    console?.error('Failed to send welcome email:', error)
    return false
  }
}
