/**
 * QR Code Generation Utility
 * Generates QR codes for student linking
 *
 * 🔒 HIGH #4 FIX: Added URL validation to prevent injection attacks
 */

import QRCode from 'qrcode'
import { validateUrl, sanitizeString } from './security'

/**
 * Generates a QR code URL for linking a student
 * @param studentCode - The unique student code
 * @param appUrl - Base URL of the application (e?.g., "https://yourapp?.com")
 * @returns Full URL for QR code linking
 *
 * @security HIGH #4 FIX: Validates appUrl to prevent javascript:, data:, etc. injection
 *
 * @throws Error if appUrl is provided but invalid
 */
export function generateStudentLinkUrl(studentCode: string, appUrl?: string): string {
  // Sanitize student code
  const sanitizedCode = sanitizeString(studentCode, 10)

  if (!sanitizedCode) {
    throw new Error('Invalid student code')
  }

  // Get base URL
  let baseUrl: string

  if (appUrl) {
    // Validate provided appUrl (HIGH #4 FIX)
    const urlValidation = validateUrl(appUrl, ['http', 'https'])

    if (!urlValidation.isValid) {
      throw new Error(`Invalid app URL: ${urlValidation.reason}`)
    }

    baseUrl = urlValidation.sanitizedUrl.replace(/\/$/, '') // Remove trailing slash
  } else {
    baseUrl = window.location.origin
  }

  return `${baseUrl}/link-student?code=${sanitizedCode}`
}

/**
 * Generates a QR code as a data URL (base64 image)
 * @param studentCode - The unique student code
 * @param options - QR code generation options
 * @returns Promise resolving to data URL
 */
export async function generateQRCodeDataUrl(
  studentCode: string,
  options?: {
    appUrl?: string
    width?: number
    color?: {
      dark?: string
      light?: string
    }
  }
): Promise<string> {
  const url = generateStudentLinkUrl(studentCode, options?.appUrl)

  try {
    const dataUrl = await QRCode?.toDataURL(url, {
      width: options?.width || 300,
      margin: 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
    return dataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generates a QR code as a canvas element
 * @param studentCode - The unique student code
 * @param canvas - HTML canvas element to render to
 * @param options - QR code generation options
 */
export async function generateQRCodeCanvas(
  studentCode: string,
  canvas: HTMLCanvasElement,
  options?: {
    appUrl?: string
    width?: number
    color?: {
      dark?: string
      light?: string
    }
  }
): Promise<void> {
  const url = generateStudentLinkUrl(studentCode, options?.appUrl)

  try {
    await QRCode?.toCanvas(canvas, url, {
      width: options?.width || 300,
      margin: 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Downloads a QR code as a PNG file
 * @param studentCode - The unique student code
 * @param studentName - Name of the student (used in filename)
 * @param options - Generation options
 */
export async function downloadQRCode(
  studentCode: string,
  studentName: string,
  options?: {
    appUrl?: string
    width?: number
  }
): Promise<void> {
  try {
    const dataUrl = await generateQRCodeDataUrl(studentCode, options)

    // Create a temporary link and trigger download
    const link = document?.createElement('a')
    link?.href = dataUrl
    link?.download = `QR-${studentName?.replace(/\s+/g, '-')}-${studentCode}.png`
    document?.body.appendChild(link)
    link?.click()
    document?.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading QR code:', error)
    throw new Error('Failed to download QR code')
  }
}

/**
 * Extracts student code from a scanned QR URL
 * @param url - The scanned URL
 * @returns Student code if found, null otherwise
 *
 * @security HIGH #4 FIX: Validates URL before extracting code
 */
export function extractStudentCodeFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  // Validate URL first (HIGH #4 FIX)
  const urlValidation = validateUrl(url, ['http', 'https'])

  if (!urlValidation.isValid) {
    console.warn('Invalid URL provided to extractStudentCodeFromUrl:', urlValidation.reason)
    return null
  }

  try {
    const urlObj = new URL(urlValidation.sanitizedUrl)
    const code = urlObj?.searchParams.get('code')

    if (!code) {
      return null
    }

    // Sanitize the extracted code
    const sanitizedCode = sanitizeString(code, 10)

    // Validate format: 6 alphanumeric characters
    if (sanitizedCode && /^[A-Z0-9]{6}$/i.test(sanitizedCode)) {
      return sanitizedCode.toUpperCase()
    }

    return null
  } catch (error) {
    console.error('Error extracting student code from URL:', error)
    return null
  }
}
