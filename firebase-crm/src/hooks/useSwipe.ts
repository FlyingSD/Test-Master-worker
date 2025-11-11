/**
 * 📱 useSwipe Hook
 *
 * React hook for detecting swipe gestures on touch devices
 * Provides touch event handlers and swipe direction detection
 *
 * @module hooks/useSwipe
 */

import { useCallback, useRef } from 'react'
import { createSwipeHandlers, type SwipeHandlers, type SwipeConfig } from '@/utils/touchGestures'

/**
 * Hook for detecting swipe gestures
 *
 * @param handlers Swipe event handlers
 * @param config Swipe configuration options
 * @returns Touch event handlers for React elements
 *
 * @example
 * function MyComponent() {
 *   const swipeHandlers = useSwipe({
 *     onSwipeLeft: () => console?.log('Swiped left!'),
 *     onSwipeRight: () => console?.log('Swiped right!'),
 *   })
 *
 *   return <div {...swipeHandlers}>Swipe me!</div>
 * }
 */
export function useSwipe(handlers: SwipeHandlers, config?: SwipeConfig) {
  const handlersRef = useRef(handlers)
  const configRef = useRef(config)

  // Update refs when handlers change
  handlersRef?.current = handlers
  configRef?.current = config

  // Create stable event handlers
  const swipeHandlers = useCallback(() => {
    return createSwipeHandlers(handlersRef?.current, configRef?.current)
  }, [])()

  // Convert to React synthetic events
  return {
    onTouchStart: useCallback((e: React?.TouchEvent) => {
      swipeHandlers?.onTouchStart(e?.nativeEvent)
    }, [swipeHandlers]),
    onTouchMove: useCallback((e: React?.TouchEvent) => {
      swipeHandlers?.onTouchMove(e?.nativeEvent)
    }, [swipeHandlers]),
    onTouchEnd: useCallback(() => {
      swipeHandlers?.onTouchEnd()
    }, [swipeHandlers]),
  }
}
