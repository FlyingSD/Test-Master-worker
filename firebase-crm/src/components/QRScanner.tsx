/**
 * QR Scanner Component
 * Scans QR codes using device camera with fallback for manual entry
 */

import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { Camera, X, Keyboard } from 'lucide-react'
import { extractStudentCodeFromUrl } from '@/utils/qrCode'
import { normalizeStudentCode, isValidStudentCode } from '@/utils/studentCode'

interface QRScannerProps {
  onScan: (studentCode: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  // Initialize QR Scanner
  useEffect(() => {
    if (mode === 'camera' && videoRef?.current && !scannerRef?.current) {
      const scanner = new QrScanner(
        videoRef?.current,
        (result) => {
          // Extract student code from scanned URL
          const code = extractStudentCodeFromUrl(result?.data)
          if (code && isValidStudentCode(code)) {
            scanner?.stop()
            onScan(code)
          } else {
            setError('Невалиден QR код. Моля, опитайте отново.')
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      scannerRef?.current = scanner

      // Start scanning
      scanner
        .start()
        .then(() => {
          setIsScanning(true)
          setError(null)
        })
        .catch((err) => {
          console?.error('Camera error:', err)
          setError('Грешка при достъп до камерата. Използвайте ръчно въвеждане.')
          setMode('manual')
        })
    }

    // Cleanup
    return () => {
      if (scannerRef?.current) {
        scannerRef?.current.stop()
        scannerRef?.current.destroy()
        scannerRef?.current = null
      }
    }
  }, [mode, onScan])

  // Handle manual code submission
  const handleManualSubmit = (e: React?.FormEvent) => {
    e?.preventDefault()
    const normalized = normalizeStudentCode(manualCode)

    if (!isValidStudentCode(normalized)) {
      setError('Невалиден код. Кодът трябва да съдържа 6 символа.')
      return
    }

    onScan(normalized)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {mode === 'camera' ? 'Сканирайте QR Код' : 'Въведете Код'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="p-4 flex gap-2">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              mode === 'camera'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-5 h-5" />
            Камера
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              mode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Keyboard className="w-5 h-5" />
            Ръчно
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {mode === 'camera' ? (
            <div>
              <video
                ref={videoRef}
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '400px' }}
              />
              {isScanning && (
                <p className="text-center text-sm text-gray-600 mt-3">
                  Насочете камерата към QR кода
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Код на ученик
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e?.target.value?.toUpperCase())
                    setError(null)
                  }}
                  placeholder="K8M2B6"
                  maxLength={7} // 6 chars + 1 optional space
                  className="input text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Въведете 6-символния код от формуляра
                </p>
              </div>
              <button type="submit" className="btn-primary w-full">
                Свържи Дете
              </button>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
