import { useState, useRef, DragEvent } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  value?: string // Current image URL
  onChange: (url: string | undefined) => void
  storagePath: string // Path in Firebase Storage (e.g., 'logos/school-logo')
  label?: string
  description?: string
  maxSizeMB?: number
  acceptedFormats?: string[]
}

/**
 * ImageUpload Component with Drag & Drop
 *
 * Features:
 * - Drag & drop file upload
 * - Click to upload
 * - Image preview
 * - File size validation
 * - Format validation
 * - Delete functionality
 * - Firebase Storage integration
 */
export default function ImageUpload({
  value,
  onChange,
  storagePath,
  label = 'Изображение',
  description = 'Drag & drop или кликнете за качване',
  maxSizeMB = 2,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storage = getStorage()

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Невалиден формат. Разрешени: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `Файлът е твърде голям. Максимум: ${maxSizeMB}MB`
    }

    return null
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setError(null)

    // Validate
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    setUploading(true)
    try {
      // Create storage reference
      const storageRef = ref(storage, storagePath)

      // Upload file
      await uploadBytes(storageRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Update parent component
      onChange(downloadURL)

      toast.success('Изображението беше качено успешно!')
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Грешка при качване на изображението')
      toast.error('Грешка при качване на изображението')
    } finally {
      setUploading(false)
    }
  }

  // Handle file delete
  const handleDelete = async () => {
    if (!value) return

    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, storagePath)
      await deleteObject(storageRef)

      // Update parent component
      onChange(undefined)

      toast.success('Изображението беше изтрито')
    } catch (error) {
      console.error('Error deleting image:', error)
      // If file doesn't exist, still clear the URL
      onChange(undefined)
      toast.success('Изображението беше изтрито')
    }
  }

  // Handle drag events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // Trigger file input click
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Upload Area */}
      {!value ? (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${dragActive
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={uploading}
          />

          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Качване...</p>
              </>
            ) : (
              <>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} до {maxSizeMB}MB
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Drag overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-primary/10 rounded-xl flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-lg px-6 py-3 shadow-lg">
                <p className="text-primary font-medium">Пуснете файла тук</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Preview
        <div className="relative group">
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-contain bg-gray-50"
            />
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="
              absolute top-2 right-2
              p-2 bg-red-500 text-white rounded-lg
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              hover:bg-red-600
            "
            title="Изтрий изображението"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image icon overlay */}
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Натиснете DELETE за промяна</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
