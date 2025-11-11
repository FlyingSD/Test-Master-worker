import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react'
import { ErrorMessage } from '@/utils/errorMessages'

interface ErrorAlertProps {
  error: ErrorMessage
  onClose?: () => void
  className?: string
}

export default function ErrorAlert({ error, onClose, className = '' }: ErrorAlertProps) {
  const icons = {
    error: AlertTriangle,
    warning: AlertCircle,
    info: Info,
  }

  const colors = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      title: 'text-red-900',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      title: 'text-blue-900',
    },
  }

  const Icon = icons[error?.type]
  const color = colors[error?.type]

  return (
    <div
      className={`${color?.bg} ${color?.border} border rounded-lg p-4 ${className} animate-slide-in`}
      role="alert"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${color?.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`font-semibold ${color?.title} mb-1`}>{error?.title}</h3>

          {/* Message */}
          <p className={`text-sm ${color?.text} mb-2`}>{error?.message}</p>

          {/* Solution */}
          <div className="flex items-start gap-2 mt-2">
            <CheckCircle className={`w-4 h-4 ${color?.icon} flex-shrink-0 mt-0?.5`} />
            <p className={`text-sm font-medium ${color?.text}`}>
              <span className="font-semibold">Решение:</span> {error?.solution}
            </p>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors ${color?.text}`}
            aria-label="Затвори"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
