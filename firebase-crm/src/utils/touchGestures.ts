/**
 * 📱 Touch Gestures & Haptic Feedback Utilities
 *
 * Provides touch gesture detection and haptic feedback for mobile UX
 * - Swipe detection (left/right)
 * - Haptic feedback
 * - Touch target size helpers
 *
 * @module utils/touchGestures
 */

/**
 * Swipe direction enum
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null

/**
 * Swipe configuration options
 */
export interface SwipeConfig {
  /** Minimum distance (px) to trigger swipe */
  minDistance?: number
  /** Maximum time (ms) for swipe */
  maxTime?: number
  /** Enable haptic feedback on swipe */
  enableHaptic?: boolean
}

/**
 * Touch point coordinates
 */
interface TouchPoint {
  x: number
  y: number
  time: number
}

/**
 * Swipe event handlers
 */
export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

/**
 * Default swipe configuration
 */
const DEFAULT_CONFIG: Required<SwipeConfig> = {
  minDistance: 60, // 60px minimum swipe distance
  maxTime: 300, // 300ms maximum swipe time
  enableHaptic: true,
}

/**
 * Haptic feedback patterns
 */
export const HAPTIC_PATTERNS = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [30, 50, 30],
  error: [50, 100, 50],
  tap: [5],
  swipe: [15],
} as const

/**
 * Trigger haptic feedback if available
 * Uses Vibration API for mobile devices
 *
 * @param pattern Vibration pattern name or custom array
 *
 * @example
 * triggerHaptic('success') // Success pattern
 * triggerHaptic([100, 50, 100]) // Custom pattern
 */
export function triggerHaptic(
  pattern: keyof typeof HAPTIC_PATTERNS | number[] = 'light'
): void {
  if (!navigator.vibrate) return

  const vibrationPattern = Array.isArray(pattern)
    ? pattern
    : HAPTIC_PATTERNS[pattern]

  try {
    navigator.vibrate(vibrationPattern)
  } catch (error) {
    console.debug('Haptic feedback not supported:', error)
  }
}

/**
 * Detect swipe gesture from touch events
 *
 * @param handlers Swipe event handlers
 * @param config Swipe configuration options
 * @returns Touch event handlers for React
 *
 * @example
 * const swipeHandlers = useSwipe({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 * })
 *
 * <div {...swipeHandlers}>Swipeable content</div>
 */
export function createSwipeHandlers(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  let touchStart: TouchPoint | null = null
  let touchEnd: TouchPoint | null = null

  const handleTouchStart = (e: TouchEvent) => {
    touchEnd = null
    touchStart = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    touchEnd = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const xDiff = touchStart.x - touchEnd.x
    const yDiff = touchStart.y - touchEnd.y
    const timeDiff = touchEnd.time - touchStart.time

    // Check if swipe time is within limit
    if (timeDiff > cfg.maxTime) return

    // Determine primary direction (horizontal or vertical)
    const isHorizontal = Math.abs(xDiff) > Math.abs(yDiff)

    if (isHorizontal) {
      // Horizontal swipe
      if (Math.abs(xDiff) < cfg.minDistance) return

      if (xDiff > 0) {
        // Swipe left
        if (cfg.enableHaptic) triggerHaptic('swipe')
        handlers.onSwipeLeft?.()
      } else {
        // Swipe right
        if (cfg.enableHaptic) triggerHaptic('swipe')
        handlers.onSwipeRight?.()
      }
    } else {
      // Vertical swipe
      if (Math.abs(yDiff) < cfg.minDistance) return

      if (yDiff > 0) {
        // Swipe up
        if (cfg.enableHaptic) triggerHaptic('swipe')
        handlers.onSwipeUp?.()
      } else {
        // Swipe down
        if (cfg.enableHaptic) triggerHaptic('swipe')
        handlers.onSwipeDown?.()
      }
    }

    // Reset
    touchStart = null
    touchEnd = null
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}

/**
 * Check if touch target meets minimum size requirements
 * Recommended minimum: 44x44px (Apple) or 48x48px (Google Material)
 *
 * @param width Target width in pixels
 * @param height Target height in pixels
 * @param standard 'apple' (44px) or 'material' (48px)
 * @returns True if target meets minimum size
 */
export function isTouchTargetSizeValid(
  width: number,
  height: number,
  standard: 'apple' | 'material' = 'apple'
): boolean {
  const minSize = standard === 'apple' ? 44 : 48
  return width >= minSize && height >= minSize
}

/**
 * Get CSS class for touch-friendly sizing
 * Ensures minimum 44x44px touch targets
 *
 * @returns Tailwind CSS classes for touch-friendly sizing
 */
export function getTouchTargetClass(): string {
  return 'min-w-[44px] min-h-[44px] flex items-center justify-center'
}

/**
 * Prevent iOS overscroll/bounce effect on specific elements
 *
 * @param element HTML element to prevent overscroll
 */
export function preventOverscroll(element: HTMLElement): void {
  let startY = 0

  element.addEventListener(
    'touchstart',
    (e) => {
      startY = e.touches[0].pageY
    },
    { passive: false }
  )

  element.addEventListener(
    'touchmove',
    (e) => {
      const y = e.touches[0].pageY
      const scrollTop = element.scrollTop
      const scrollHeight = element.scrollHeight
      const offsetHeight = element.offsetHeight

      // Prevent scroll if at boundaries
      if (
        (y > startY && scrollTop === 0) ||
        (y < startY && scrollTop + offsetHeight >= scrollHeight)
      ) {
        e.preventDefault()
      }
    },
    { passive: false }
  )
}
