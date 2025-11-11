/**
 * 🔒 ModalWrapper - Accessible Modal Component (CRITICAL #9 FIX)
 *
 * Provides a fully accessible modal wrapper with:
 * - ARIA roles and labels (role="dialog", aria-labelledby, aria-describedby)
 * - Focus trap (focus stays within modal)
 * - Escape key handling (closes modal)
 * - Focus return (returns focus to trigger element)
 * - Backdrop click to close
 * - Prevent body scroll when open
 *
 * @wcag WCAG 2.1 Level AA compliance for dialogs
 */

import { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'

export interface ModalWrapperProps {
  /** Modal open state */
  isOpen: boolean

  /** Callback when modal should close */
  onClose: () => void

  /** Modal title (used for aria-labelledby) */
  title: string

  /** Optional description (used for aria-describedby) */
  description?: string

  /** Modal content */
  children: ReactNode

  /** Maximum width class (default: max-w-2xl) */
  maxWidth?: string

  /** Whether clicking backdrop closes modal (default: true) */
  closeOnBackdropClick?: boolean

  /** Whether escape key closes modal (default: true) */
  closeOnEscape?: boolean

  /** Optional footer content */
  footer?: ReactNode
}

/**
 * ModalWrapper Component
 *
 * @example
 * ```tsx
 * function MyModal({ isOpen, onClose }) {
 *   return (
 *     <ModalWrapper
 *       isOpen={isOpen}
 *       onClose={onClose}
 *       title="Add Payment"
 *       description="Enter payment details below"
 *     >
 *       <form>...</form>
 *     </ModalWrapper>
 *   )
 * }
 * ```
 */
export default function ModalWrapper({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-2xl',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  footer,
}: ModalWrapperProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const titleId = useRef(`modal-title-${Math.random().toString(36).substring(7)}`)
  const descriptionId = useRef(`modal-desc-${Math.random().toString(36).substring(7)}`)

  // ============================================================================
  // ACCESSIBILITY: Focus Management
  // ============================================================================

  useEffect(() => {
    if (!isOpen) return

    // Store the currently focused element to return focus later
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the modal container
    modalRef.current?.focus()

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflow = ''

      // Return focus to the element that opened the modal
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  // ============================================================================
  // ACCESSIBILITY: Keyboard Navigation
  // ============================================================================

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close modal on Escape key
      if (closeOnEscape && event.key === 'Escape') {
        onClose()
        return
      }

      // Focus trap: Tab key navigation
      if (event.key === 'Tab') {
        if (!modalRef.current) return

        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // Tab forward from last element -> focus first element
        if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }

        // Shift+Tab backward from first element -> focus last element
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, closeOnEscape])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={description ? descriptionId.current : undefined}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-scale-in focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 id={titleId.current} className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
            {description && (
              <p id={descriptionId.current} className="text-sm text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
