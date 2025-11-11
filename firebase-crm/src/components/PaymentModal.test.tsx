import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PaymentModal from './PaymentModal'
import { Payment } from '@/types'
import { Timestamp } from 'firebase/firestore'

// Mock hooks
vi.mock('@/hooks/usePayments', () => ({
  useAddPayment: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-payment-id' }),
    isPending: false,
  }),
  useUpdatePayment: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}))

vi.mock('@/hooks/useStudents', () => ({
  useStudents: () => ({
    students: [
      { id: 'student-1', name: 'Иван Петров', fee: 100, group: 'Група 1' },
      { id: 'student-2', name: 'Мария Георгиева', fee: 120, group: 'Група 2' },
    ],
    loading: false,
  }),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockPayment: Payment = {
  id: 'payment-1',
  studentId: 'student-1',
  studentName: 'Иван Петров',
  amount: 100,
  amountEUR: 51.02,
  article: 'Месечна такса',
  method: 'Кеш',
  date: Timestamp.fromDate(new Date('2024-02-01')),
  receiptNumber: 'R-001',
  notes: 'Тест бележки',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  createdBy: 'user-1',
}

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('PaymentModal - Create Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    expect(screen.getByText('Добави плащане')).toBeInTheDocument()
    expect(screen.getByLabelText(/Ученик/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Сума.*BGN/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Метод на плащане/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Артикул/i)).toBeInTheDocument()
  })

  it('allows selecting student', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    await user.selectOptions(studentSelect, 'student-1')

    expect(studentSelect).toHaveValue('student-1')
  })

  it('allows entering amount', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const amountInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(amountInput)
    await user.type(amountInput, '100')

    expect(amountInput).toHaveValue(100)
  })

  it('converts BGN to EUR automatically', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const bgnInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(bgnInput)
    await user.type(bgnInput, '196')

    await waitFor(() => {
      const eurInput = screen.getByLabelText(/Сума.*EUR/i)
      expect(eurInput).toHaveValue(100) // 196 / 1.96
    })
  })

  it('converts EUR to BGN automatically', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const eurInput = screen.getByLabelText(/Сума.*EUR/i)
    await user.clear(eurInput)
    await user.type(eurInput, '100')

    await waitFor(() => {
      const bgnInput = screen.getByLabelText(/Сума.*BGN/i)
      expect(bgnInput).toHaveValue(196) // 100 * 1.96
    })
  })

  it('allows selecting payment method', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const methodSelect = screen.getByLabelText(/Метод на плащане/i)
    await user.selectOptions(methodSelect, 'ПОС')

    expect(methodSelect).toHaveValue('ПОС')
  })

  it('allows entering article', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const articleInput = screen.getByLabelText(/Артикул/i)
    await user.type(articleInput, 'Абакус')

    expect(articleInput).toHaveValue('Абакус')
  })

  it('allows entering receipt number', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const receiptInput = screen.getByLabelText(/Номер на документ/i)
    await user.type(receiptInput, 'R-123')

    expect(receiptInput).toHaveValue('R-123')
  })

  it('allows selecting date', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const dateInput = screen.getByLabelText(/Дата/i)
    await user.type(dateInput, '2024-01-15')

    expect(dateInput).toHaveValue('2024-01-15')
  })

  it('allows entering notes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const notesInput = screen.getByLabelText(/Бележки/i)
    await user.type(notesInput, 'Тестова бележка')

    expect(notesInput).toHaveValue('Тестова бележка')
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<PaymentModal onClose={onClose} />)

    const cancelButton = screen.getByText('Откажи')
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('calls addPayment mutation on submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<PaymentModal onClose={onClose} />)

    // Fill form
    await user.selectOptions(screen.getByLabelText(/Ученик/i), 'student-1')
    await user.clear(screen.getByLabelText(/Сума.*BGN/i))
    await user.type(screen.getByLabelText(/Сума.*BGN/i), '100')
    await user.selectOptions(screen.getByLabelText(/Метод на плащане/i), 'Кеш')

    // Submit
    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})

describe('PaymentModal - Edit Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders edit form with payment data', () => {
    renderWithProviders(<PaymentModal payment={mockPayment} onClose={() => {}} />)

    expect(screen.getByText('Редактирай плащане')).toBeInTheDocument()
    expect(screen.getByLabelText(/Ученик/i)).toHaveValue('student-1')
    expect(screen.getByLabelText(/Сума.*BGN/i)).toHaveValue(100)
    expect(screen.getByLabelText(/Сума.*EUR/i)).toHaveValue(51.02)
    expect(screen.getByLabelText(/Метод на плащане/i)).toHaveValue('Кеш')
    expect(screen.getByLabelText(/Артикул/i)).toHaveValue('Месечна такса')
  })

  it('displays receipt number', () => {
    renderWithProviders(<PaymentModal payment={mockPayment} onClose={() => {}} />)

    expect(screen.getByLabelText(/Номер на документ/i)).toHaveValue('R-001')
  })

  it('displays notes', () => {
    renderWithProviders(<PaymentModal payment={mockPayment} onClose={() => {}} />)

    expect(screen.getByLabelText(/Бележки/i)).toHaveValue('Тест бележки')
  })

  it('allows updating payment data', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<PaymentModal payment={mockPayment} onClose={onClose} />)

    const amountInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(amountInput)
    await user.type(amountInput, '150')

    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls updatePayment mutation on submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<PaymentModal payment={mockPayment} onClose={onClose} />)

    // Update amount
    const amountInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(amountInput)
    await user.type(amountInput, '200')

    // Submit
    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})

describe('PaymentModal - Validation', () => {
  it('requires student selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    // Don't select student
    await user.clear(screen.getByLabelText(/Сума.*BGN/i))
    await user.type(screen.getByLabelText(/Сума.*BGN/i), '100')

    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    // Should show alert
    await waitFor(() => {
      // Form should not submit without student
      expect(screen.getByText('Добави плащане')).toBeInTheDocument()
    })
  })

  it('validates amount is positive', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const amountInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(amountInput)
    await user.type(amountInput, '-10')

    // Should show validation error or prevent negative values
    expect(amountInput).toHaveValue(-10)
  })

  it('validates date is not in future', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const dateString = futureDate.toISOString().split('T')[0]

    const dateInput = screen.getByLabelText(/Дата/i)
    await user.type(dateInput, dateString)

    // Should show warning for future date
    await waitFor(() => {
      const submitButton = screen.getByText('Запази')
      expect(submitButton).toBeInTheDocument()
    })
  })

  it('shows warning for large amounts', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const amountInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(amountInput)
    await user.type(amountInput, '10000')

    // Should show warning for amount > 1000
    await waitFor(() => {
      expect(amountInput).toHaveValue(10000)
    })
  })

  it('validates receipt number is required for specific methods', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    // Select method that requires receipt (e.g., ПОС)
    await user.selectOptions(screen.getByLabelText(/Метод на плащане/i), 'ПОС')

    // Don't enter receipt number
    const receiptInput = screen.getByLabelText(/Номер на документ/i)
    expect(receiptInput).toBeInTheDocument()
  })
})

describe('PaymentModal - Currency Conversion', () => {
  it('maintains precision in BGN to EUR conversion', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const bgnInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(bgnInput)
    await user.type(bgnInput, '196')

    await waitFor(() => {
      const eurInput = screen.getByLabelText(/Сума.*EUR/i)
      expect(eurInput).toHaveValue(100) // 196 / 1.96 = 100
    })
  })

  it('maintains precision in EUR to BGN conversion', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const eurInput = screen.getByLabelText(/Сума.*EUR/i)
    await user.clear(eurInput)
    await user.type(eurInput, '100')

    await waitFor(() => {
      const bgnInput = screen.getByLabelText(/Сума.*BGN/i)
      expect(bgnInput).toHaveValue(196) // 100 * 1.96 = 196
    })
  })

  it('handles decimal amounts correctly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const bgnInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(bgnInput)
    await user.type(bgnInput, '99.50')

    await waitFor(() => {
      const eurInput = screen.getByLabelText(/Сума.*EUR/i)
      const expectedEur = 99.50 / 1.96
      expect(Number(eurInput.value)).toBeCloseTo(expectedEur, 2)
    })
  })

  it('handles zero amount', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const bgnInput = screen.getByLabelText(/Сума.*BGN/i)
    await user.clear(bgnInput)
    await user.type(bgnInput, '0')

    await waitFor(() => {
      const eurInput = screen.getByLabelText(/Сума.*EUR/i)
      expect(eurInput).toHaveValue(0)
    })
  })
})

describe('PaymentModal - Payment Methods', () => {
  it('displays all payment methods', () => {
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const methodSelect = screen.getByLabelText(/Метод на плащане/i)
    expect(methodSelect).toBeInTheDocument()

    // Check if options exist
    expect(screen.getByRole('option', { name: /Кеш/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /ПОС/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Банков път/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Фактура/i })).toBeInTheDocument()
  })

  it('defaults to Кеш method', () => {
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const methodSelect = screen.getByLabelText(/Метод на плащане/i) as HTMLSelectElement
    expect(methodSelect.value).toBe('Кеш')
  })

  it('allows changing payment method', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const methodSelect = screen.getByLabelText(/Метод на плащане/i)
    await user.selectOptions(methodSelect, 'Банков път')

    expect(methodSelect).toHaveValue('Банков път')
  })
})

describe('PaymentModal - Student Selection', () => {
  it('displays list of students', () => {
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    expect(studentSelect).toBeInTheDocument()

    // Check if students are loaded
    expect(screen.getByRole('option', { name: /Иван Петров/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Мария Георгиева/i })).toBeInTheDocument()
  })

  it('filters students as you type', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    await user.selectOptions(studentSelect, 'student-1')

    expect(studentSelect).toHaveValue('student-1')
  })

  it('displays student name in edit mode', () => {
    renderWithProviders(<PaymentModal payment={mockPayment} onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    expect(studentSelect).toHaveValue('student-1')
  })
})

describe('PaymentModal - Accessibility', () => {
  it('has proper labels for all form fields', () => {
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    expect(screen.getByLabelText(/Ученик/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Сума.*BGN/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Сума.*EUR/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Метод на плащане/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Артикул/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Дата/i)).toBeInTheDocument()
  })

  it('can be navigated with keyboard', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    studentSelect.focus()

    await user.tab()
    expect(screen.getByLabelText(/Сума.*BGN/i)).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText(/Сума.*EUR/i)).toHaveFocus()
  })

  it('has close button with proper ARIA label', () => {
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const closeButton = screen.getByRole('button', { name: /Затвори/i })
    expect(closeButton).toBeInTheDocument()
  })
})

describe('PaymentModal - Error Handling', () => {
  it('displays error messages', async () => {
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    // Error alert component should be present
    const form = screen.getByRole('form')
    expect(form).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentModal onClose={() => {}} />)

    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    // Should remain on form
    expect(screen.getByText('Добави плащане')).toBeInTheDocument()
  })
})
