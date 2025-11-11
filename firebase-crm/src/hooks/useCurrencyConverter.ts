/**
 * 🔒 useCurrencyConverter Hook (HIGH #5 FIX)
 *
 * Reusable hook for BGN/EUR currency conversion
 * Eliminates duplication across PaymentModal, StudentModal, GroupModal
 *
 * @example
 * ```tsx
 * const { bgn, eur, setBgn, setEur, handleCurrencyChange } = useCurrencyConverter({
 *   initialBgn: 100,
 *   initialEur: 51
 * })
 *
 * <input value={bgn} onChange={(e) => handleCurrencyChange(Number(e.target.value), 'BGN')} />
 * <input value={eur} onChange={(e) => handleCurrencyChange(Number(e.target.value), 'EUR')} />
 * ```
 */

import { useState, useCallback, useEffect } from 'react'
import { bgnToEur, eurToBgn } from '@/utils/formatters'

export interface UseCurrencyConverterOptions {
  /** Initial BGN amount */
  initialBgn?: number
  /** Initial EUR amount */
  initialEur?: number
  /** Callback when values change */
  onChange?: (bgn: number, eur: number) => void
}

export interface UseCurrencyConverterReturn {
  /** Current BGN amount */
  bgn: number
  /** Current EUR amount */
  eur: number
  /** Set BGN amount directly */
  setBgn: (value: number) => void
  /** Set EUR amount directly */
  setEur: (value: number) => void
  /** Handle currency change from input (auto-converts other currency) */
  handleCurrencyChange: (value: number, currency: 'BGN' | 'EUR') => void
  /** Reset both values to initial or zero */
  reset: () => void
}

/**
 * Currency converter hook for BGN/EUR conversion
 *
 * @param options - Converter options
 * @returns Currency converter state and handlers
 */
export function useCurrencyConverter(
  options: UseCurrencyConverterOptions = {}
): UseCurrencyConverterReturn {
  const { initialBgn = 0, initialEur = 0, onChange } = options

  const [bgn, setBgnState] = useState<number>(initialBgn)
  const [eur, setEurState] = useState<number>(initialEur)

  // Update both values and trigger onChange
  const updateValues = useCallback(
    (newBgn: number, newEur: number) => {
      setBgnState(newBgn)
      setEurState(newEur)
      onChange?.(newBgn, newEur)
    },
    [onChange]
  )

  // Set BGN and auto-convert to EUR
  const setBgn = useCallback(
    (value: number) => {
      const convertedEur = bgnToEur(value)
      updateValues(value, convertedEur)
    },
    [updateValues]
  )

  // Set EUR and auto-convert to BGN
  const setEur = useCallback(
    (value: number) => {
      const convertedBgn = eurToBgn(value)
      updateValues(convertedBgn, value)
    },
    [updateValues]
  )

  // Handle currency change from input
  const handleCurrencyChange = useCallback(
    (value: number, currency: 'BGN' | 'EUR') => {
      if (currency === 'BGN') {
        setBgn(value)
      } else {
        setEur(value)
      }
    },
    [setBgn, setEur]
  )

  // Reset to initial values
  const reset = useCallback(() => {
    updateValues(initialBgn, initialEur)
  }, [initialBgn, initialEur, updateValues])

  // Update when initial values change (e.g., when editing existing record)
  useEffect(() => {
    setBgnState(initialBgn)
    setEurState(initialEur)
  }, [initialBgn, initialEur])

  return {
    bgn,
    eur,
    setBgn,
    setEur,
    handleCurrencyChange,
    reset,
  }
}
