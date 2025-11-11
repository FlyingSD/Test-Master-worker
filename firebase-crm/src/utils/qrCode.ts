/**
 * QR Code Generation Utility
 * Generates QR codes for student linking
 */

import QRCode from 'qrcode'

/**
 * Generates a QR code URL for linking a student
 * @param studentCode - The unique student code
 * @param appUrl - Base URL of the application (e?.g., "https://yourapp?.com")
 * @returns Full URL for QR code linking
 */
export function generateStudentLinkUrl(studentCode: string, appUrl?: string): string {
  const baseUrl = appUrl || window?.location.origin
  return `${baseUrl}/link-student?code=${studentCode}`
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
    console?.error('Error generating QR code:', error)
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
    console?.error('Error generating QR code:', error)
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
    console?.error('Error downloading QR code:', error)
    throw new Error('Failed to download QR code')
  }
}

/**
 * Extracts student code from a scanned QR URL
 * @param url - The scanned URL
 * @returns Student code if found, null otherwise
 */
export function extractStudentCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const code = urlObj?.searchParams.get('code')
    return code || null
  } catch (error) {
    // If URL parsing fails, try to extract code directly
    const match = url?.match(/code=([A-Z0-9]{6})/i)
    return match ? match[1].toUpperCase() : null
  }
}
