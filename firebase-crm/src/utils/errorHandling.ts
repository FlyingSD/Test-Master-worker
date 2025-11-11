/**
 * Error Handling Utilities
 *
 * Standardized error handling patterns for consistent logging and user feedback.
 * Provides reusable handlers for mutations, async operations, and error reporting.
 */

import toast from 'react-hot-toast'
import { getErrorMessage } from './errorMessages'

/**
 * Standard error handler for React Query mutations
 * Logs error to console and displays toast notification
 *
 * @param operation - Description of the operation that failed (e.g., 'adding payment')
 * @param errorMessage - User-facing error message to display
 * @returns Error handler function for use in onError callback
 *
 * @example
 * ```ts
 * useMutation({
 *   mutationFn: async (data) => { ... },
 *   onSuccess: () => toast.success('Success!'),
 *   onError: createMutationErrorHandler('adding payment', ERROR_MESSAGES.ADD_PAYMENT_ERROR)
 * })
 * ```
 */
export function createMutationErrorHandler(
  operation: string,
  errorMessage: string
): (error: Error) => void {
  return (error: Error) => {
    console.error(`Error ${operation}:`, error)
    const errorMsg = getErrorMessage(error)
    toast.error(`${errorMessage}: ${errorMsg.message}`)
  }
}

/**
 * Standard error handler for async operations with try-catch
 * Logs error, displays toast, and optionally executes callback
 *
 * @param error - Error object
 * @param operation - Description of the operation that failed
 * @param userMessage - User-facing error message (optional)
 * @param onError - Optional callback to execute after logging
 *
 * @example
 * ```ts
 * try {
 *   await someAsyncOperation()
 * } catch (error) {
 *   handleAsyncError(error, 'fetching data', 'Failed to load data', () => {
 *     setLoading(false)
 *   })
 * }
 * ```
 */
export function handleAsyncError(
  error: unknown,
  operation: string,
  userMessage?: string,
  onError?: () => void
): void {
  console.error(`Error ${operation}:`, error)

  const errorMsg = getErrorMessage(error)

  if (userMessage) {
    toast.error(`${userMessage}: ${errorMsg.message}`)
  } else {
    toast.error(errorMsg.message)
  }

  if (onError) {
    onError()
  }
}

/**
 * Error handler for realtime listeners (onSnapshot)
 * Standardizes error handling for Firestore subscriptions
 *
 * @param operation - Description of what data was being fetched
 * @param errorMessage - User-facing error message
 * @param setError - State setter for error state (optional)
 * @param setLoading - State setter for loading state (optional)
 * @returns Error callback function for onSnapshot
 *
 * @example
 * ```ts
 * onSnapshot(
 *   query,
 *   (snapshot) => { ... },
 *   createSnapshotErrorHandler(
 *     'fetching students',
 *     'Failed to load students',
 *     setError,
 *     setLoading
 *   )
 * )
 * ```
 */
export function createSnapshotErrorHandler(
  operation: string,
  errorMessage: string,
  setError?: (error: Error | null) => void,
  setLoading?: (loading: boolean) => void
): (error: Error) => void {
  return (err: Error) => {
    console.error(`Error ${operation}:`, err)

    if (setError) {
      setError(err)
    }

    if (setLoading) {
      setLoading(false)
    }

    const errorMsg = getErrorMessage(err)
    toast.error(`${errorMessage}: ${errorMsg.message}`)
  }
}

/**
 * Log error without showing user notification
 * Useful for non-critical errors or errors that don't need user attention
 *
 * @param error - Error object
 * @param operation - Description of the operation
 * @param context - Additional context for debugging (optional)
 *
 * @example
 * ```ts
 * try {
 *   // Optional analytics tracking
 * } catch (error) {
 *   logError(error, 'tracking analytics', { userId: user.id })
 * }
 * ```
 */
export function logError(
  error: unknown,
  operation: string,
  context?: Record<string, any>
): void {
  if (context) {
    console.error(`Error ${operation}:`, error, 'Context:', context)
  } else {
    console.error(`Error ${operation}:`, error)
  }
}

/**
 * Wrap async function with error handling
 * Returns null on error and logs/displays error message
 *
 * @param fn - Async function to execute
 * @param operation - Description of operation for error logging
 * @param userMessage - User-facing error message (optional)
 * @returns Result or null if error occurred
 *
 * @example
 * ```ts
 * const result = await withErrorHandling(
 *   async () => await fetchUserData(userId),
 *   'fetching user data',
 *   'Failed to load user'
 * )
 *
 * if (result) {
 *   setUser(result)
 * }
 * ```
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  operation: string,
  userMessage?: string
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleAsyncError(error, operation, userMessage)
    return null
  }
}

/**
 * Error boundary helper for component error handling
 * Formats error for display and logs to console
 *
 * @param error - Error object
 * @param errorInfo - React error info with component stack
 * @param fallbackMessage - Message to show user (optional)
 *
 * @example
 * ```tsx
 * class ErrorBoundary extends React.Component {
 *   componentDidCatch(error, errorInfo) {
 *     handleComponentError(error, errorInfo, 'Something went wrong')
 *   }
 * }
 * ```
 */
export function handleComponentError(
  error: Error,
  errorInfo: { componentStack: string },
  fallbackMessage = 'An unexpected error occurred'
): void {
  console.error('Component error:', error)
  console.error('Component stack:', errorInfo.componentStack)

  const errorMsg = getErrorMessage(error)
  toast.error(`${fallbackMessage}: ${errorMsg.message}`)
}

/**
 * Type guard for error objects
 * Helps with error handling in catch blocks
 *
 * @param error - Unknown error value
 * @returns true if error is an Error object
 *
 * @example
 * ```ts
 * try {
 *   await operation()
 * } catch (error) {
 *   if (isError(error)) {
 *     console.log(error.message)
 *   }
 * }
 * ```
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Extract error message from unknown error type
 * Safely handles various error formats
 *
 * @param error - Unknown error value
 * @returns Error message string
 *
 * @example
 * ```ts
 * try {
 *   await operation()
 * } catch (error) {
 *   const message = getErrorString(error)
 *   console.log(message) // Always returns a string
 * }
 * ```
 */
export function getErrorString(error: unknown): string {
  if (isError(error)) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message)
  }

  return 'An unknown error occurred'
}
