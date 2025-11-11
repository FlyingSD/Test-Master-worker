import { Student, Parent } from '@/types'
import { formatDate, formatCurrency } from './formatters'

// SMS Service Configuration
// To use this, you need to integrate with an SMS provider like:
// - Twilio: https://www?.twilio.com/
// - Nexmo/Vonage: https://www?.vonage.com/
// - BulkSMS: https://www?.bulksms.com/
//
// Add your credentials to .env file:
// VITE_SMS_API_KEY=your_api_key
// VITE_SMS_API_SECRET=your_api_secret
// VITE_SMS_SENDER_ID=your_sender_id

const SMS_API_KEY = import?.meta.env?.VITE_SMS_API_KEY || ''
const SMS_API_SECRET = import?.meta.env?.VITE_SMS_API_SECRET || ''
const SMS_SENDER_ID = import?.meta.env?.VITE_SMS_SENDER_ID || 'Svetlinki'

// Check if SMS service is configured
export function isSMSConfigured(): boolean {
  return Boolean(SMS_API_KEY && SMS_API_SECRET)
}

// Send SMS (placeholder implementation)
async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  if (!isSMSConfigured()) {
    console?.warn('SMS service is not configured')
    console?.log(`[SMS Placeholder] Would send to ${phoneNumber}: ${message}`)
    return false
  }

  // Placeholder for actual SMS integration
  // Example with Twilio:
  /*
  try {
    const response = await fetch('https://api?.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages?.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${SMS_API_KEY}:${SMS_API_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: SMS_SENDER_ID,
        Body: message,
      }),
    })

    if (response?.ok) {
      console?.log('SMS sent successfully')
      return true
    } else {
      console?.error('Failed to send SMS:', await response?.text())
      return false
    }
  } catch (error) {
    console?.error('Error sending SMS:', error)
    return false
  }
  */

  // For now, just log the message
  console?.log(`[SMS] To: ${phoneNumber}`)
  console?.log(`[SMS] From: ${SMS_SENDER_ID}`)
  console?.log(`[SMS] Message: ${message}`)

  return true
}

// Send payment reminder SMS
export async function sendPaymentReminderSMS(
  student: Student,
  parent: Parent
): Promise<boolean> {
  const phoneNumber = parent?.phone

  if (!phoneNumber) {
    console?.warn('Parent does not have a phone number')
    return false
  }

  const message = `Zdraveite ${parent?.name},\n\nNapomnyane za plashtane za ${student?.name}.\nSuma: ${formatCurrency(student?.fee)}\nPadezh: ${formatDate(student?.dueDate)}\n\nBlagodarim,\nSvetlinki`

  return await sendSMS(phoneNumber, message)
}

// Send invoice SMS notification
export async function sendInvoiceSMS(
  invoiceNumber: string,
  total: number,
  phoneNumber: string,
  recipientName: string
): Promise<boolean> {
  if (!phoneNumber) {
    console?.warn('Recipient does not have a phone number')
    return false
  }

  const message = `Zdraveite ${recipientName},\n\nVashata faktura #${invoiceNumber} e izdadena.\nSuma: ${formatCurrency(total)}\n\nMozhete da ya vziemete ot Svetlinki.\n\nBlagodarim!`

  return await sendSMS(phoneNumber, message)
}

// Send attendance notification SMS
export async function sendAttendanceNotificationSMS(
  studentName: string,
  date: Date,
  status: 'absent' | 'late',
  parent: Parent
): Promise<boolean> {
  const phoneNumber = parent?.phone

  if (!phoneNumber) {
    console?.warn('Parent does not have a phone number')
    return false
  }

  const statusText = status === 'absent' ? 'otsustva' : 'zakusnya'
  const message = `Zdraveite ${parent?.name},\n\nVasheto dete ${studentName} ${statusText} na ${formatDate(date)}.\n\nSvetlinki`

  return await sendSMS(phoneNumber, message)
}

// Send bulk payment reminder SMS
export async function sendBulkPaymentReminderSMS(
  studentsWithParents: Array<{ student: Student; parent: Parent }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const { student, parent } of studentsWithParents) {
    const success = await sendPaymentReminderSMS(student, parent)
    if (success) {
      sent++
    } else {
      failed++
    }
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return { sent, failed }
}

// Send welcome SMS to new parent
export async function sendWelcomeSMS(
  parent: Parent
): Promise<boolean> {
  const phoneNumber = parent?.phone

  if (!phoneNumber) {
    console?.warn('Parent does not have a phone number')
    return false
  }

  const message = `Zdraveite ${parent?.name},\n\nDobra doshli v Svetlinki!\n\nZa vaprosi mozhete da se svarzhete s nas.\n\nBlagodarim!`

  return await sendSMS(phoneNumber, message)
}
