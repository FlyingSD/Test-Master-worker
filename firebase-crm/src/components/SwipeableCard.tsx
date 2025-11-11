/**
 * 📱 SwipeableCard Component
 *
 * A card component with swipe gesture support for mobile actions
 * - Swipe left: reveals delete action (red)
 * - Swipe right: reveals edit/view action (blue)
 * - Haptic feedback on swipe
 * - Smooth animations
 *
 * @module components/SwipeableCard
 */

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Trash2, Edit, Eye } from 'lucide-react'
import { triggerHaptic } from '@/utils/touchGestures'

export interface SwipeableCardProps {
  /** Card content */
  children: ReactNode
  /** Enable swipe actions */
  enableSwipe?: boolean
  /** Show edit action on right swipe */
  onEdit?: () => void
  /** Show view action on right swipe (alternative to edit) */
  onView?: () => void
  /** Show delete action on left swipe */
  onDelete?: () => void
  /** Custom class name */
  className?: string
  /** Minimum swipe distance to reveal actions (px) */
  swipeThreshold?: number
  /** Minimum swipe distance to trigger action (px) */
  actionThreshold?: number
}

/**
 * Swipeable card with gesture support
 *
 * @example
 * <SwipeableCard
 *   onEdit={() => handleEdit(item)}
 *   onDelete={() => handleDelete(item)}
 * >
 *   <div>Card content</div>
 * </SwipeableCard>
 */
export default function SwipeableCard({
  children,
  enableSwipe = true,
  onEdit,
  onView,
  onDelete,
  className = '',
  swipeThreshold = 60,
  actionThreshold = 120,
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [actionRevealed, setActionRevealed] = useState<'edit' | 'delete' | null>(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasRightAction = !!(onEdit || onView)
  const hasLeftAction = !!onDelete

  // Reset on mount/unmount
  useEffect(() => {
    return () => {
      setOffsetX(0)
      setIsDragging(false)
      setActionRevealed(null)
    }
  }, [])

  const handleTouchStart = (e: React?.TouchEvent) => {
    if (!enableSwipe) return
    startX?.current = e?.touches[0].clientX
    currentX?.current = startX?.current
    setIsDragging(true)
  }

  const handleTouchMove = (e: React?.TouchEvent) => {
    if (!enableSwipe || !isDragging) return

    currentX?.current = e?.touches[0].clientX
    const diff = currentX?.current - startX?.current

    // Only allow swipe if actions are available in that direction
    if (diff > 0 && !hasRightAction) return
    if (diff < 0 && !hasLeftAction) return

    // Limit swipe distance
    const maxSwipe = 150
    const limitedDiff = Math?.max(-maxSwipe, Math?.min(maxSwipe, diff))

    setOffsetX(limitedDiff)

    // Reveal action indicators
    if (limitedDiff > swipeThreshold) {
      setActionRevealed('edit')
    } else if (limitedDiff < -swipeThreshold) {
      setActionRevealed('delete')
    } else {
      setActionRevealed(null)
    }
  }

  const handleTouchEnd = () => {
    if (!enableSwipe || !isDragging) return

    setIsDragging(false)
    const diff = currentX?.current - startX?.current

    // Trigger action if threshold met
    if (diff > actionThreshold && hasRightAction) {
      triggerHaptic('success')
      if (onEdit) {
        onEdit()
      } else if (onView) {
        onView()
      }
    } else if (diff < -actionThreshold && hasLeftAction) {
      triggerHaptic('warning')
      onDelete?.()
    } else if (Math?.abs(diff) > swipeThreshold / 2) {
      // Give feedback but reset
      triggerHaptic('light')
    }

    // Reset position
    setOffsetX(0)
    setActionRevealed(null)
  }

  // Handle click outside to reset
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef?.current && !containerRef?.current.contains(e?.target as Node)) {
        setOffsetX(0)
        setActionRevealed(null)
      }
    }

    document?.addEventListener('mousedown', handleClickOutside)
    document?.addEventListener('touchstart', handleClickOutside)

    return () => {
      document?.removeEventListener('mousedown', handleClickOutside)
      document?.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  if (!enableSwipe) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left action (Delete) - shown when swiping left */}
      {hasLeftAction && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-red-500 transition-opacity ${
            actionRevealed === 'delete' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: '150px' }}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            <Trash2 className="w-6 h-6" />
            <span className="text-xs font-medium">Изтрий</span>
          </div>
        </div>
      )}

      {/* Right action (Edit/View) - shown when swiping right */}
      {hasRightAction && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-blue-500 transition-opacity ${
            actionRevealed === 'edit' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: '150px' }}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            {onEdit ? (
              <>
                <Edit className="w-6 h-6" />
                <span className="text-xs font-medium">Редактирай</span>
              </>
            ) : (
              <>
                <Eye className="w-6 h-6" />
                <span className="text-xs font-medium">Виж</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        className={`relative bg-white transition-transform ${
          isDragging ? 'duration-0' : 'duration-300'
        }`}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
