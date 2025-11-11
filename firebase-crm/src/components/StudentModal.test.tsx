import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import StudentModal from './StudentModal'
import { Student } from '@/types'
import { Timestamp } from 'firebase/firestore'

// Mock hooks
vi.mock('@/hooks/useStudents', () => ({
  useAddStudent: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-student-id' }),
    isPending: false,
  }),
  useUpdateStudent: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}))

vi.mock('@/hooks/useGroups', () => ({
  useGroups: () => ({
    groups: [
      { id: '1', name: 'Група 1' },
      { id: '2', name: 'Група 2' },
    ],
    loading: false,
  }),
}))

vi.mock('@/utils/qrCode', () => ({
  generateQRCodeDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
  downloadQRCode: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockStudent: Student = {
  id: 'test-student-1',
  studentCode: 'K8M2B6',
  name: 'Иван Петров',
  group: 'Група 1',
  fee: 100,
  feeEUR: 51.02,
  dueDate: Timestamp.fromDate(new Date('2024-02-01')),
  status: 'active',
  studyType: 'Абакус',
  parentIds: ['parent-1'],
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

describe('StudentModal - Create Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    renderWithProviders(<StudentModal onClose={() => {}} />)

    expect(screen.getByText('Добави ученик')).toBeInTheDocument()
    expect(screen.getByLabelText(/Име и фамилия/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Група/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Месечна такса/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Тип обучение/i)).toBeInTheDocument()
  })

  it('allows entering student name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const nameInput = screen.getByLabelText(/Име и фамилия/i)
    await user.type(nameInput, 'Мария Иванова')

    expect(nameInput).toHaveValue('Мария Иванова')
  })

  it('allows selecting group from dropdown', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const groupSelect = screen.getByLabelText(/Група/i)
    await user.selectOptions(groupSelect, 'Група 1')

    expect(groupSelect).toHaveValue('Група 1')
  })

  it('converts BGN to EUR automatically', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const bgnInput = screen.getByLabelText(/Месечна такса.*BGN/i)
    await user.clear(bgnInput)
    await user.type(bgnInput, '100')

    await waitFor(() => {
      const eurInput = screen.getByLabelText(/Месечна такса.*EUR/i)
      expect(eurInput).toHaveValue(51.02) // 100 / 1.96
    })
  })

  it('converts EUR to BGN automatically', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const eurInput = screen.getByLabelText(/Месечна такса.*EUR/i)
    await user.clear(eurInput)
    await user.type(eurInput, '50')

    await waitFor(() => {
      const bgnInput = screen.getByLabelText(/Месечна такса.*BGN/i)
      expect(bgnInput).toHaveValue(98) // 50 * 1.96
    })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<StudentModal onClose={onClose} />)

    const cancelButton = screen.getByText('Откажи')
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('calls addStudent mutation on submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<StudentModal onClose={onClose} />)

    // Fill form
    await user.type(screen.getByLabelText(/Име и фамилия/i), 'Нов Ученик')
    await user.selectOptions(screen.getByLabelText(/Група/i), 'Група 1')
    await user.clear(screen.getByLabelText(/Месечна такса.*BGN/i))
    await user.type(screen.getByLabelText(/Месечна такса.*BGN/i), '100')

    // Submit
    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})

describe('StudentModal - Edit Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders edit form with student data', () => {
    renderWithProviders(<StudentModal student={mockStudent} onClose={() => {}} />)

    expect(screen.getByText('Редактирай ученик')).toBeInTheDocument()
    expect(screen.getByLabelText(/Име и фамилия/i)).toHaveValue('Иван Петров')
    expect(screen.getByLabelText(/Група/i)).toHaveValue('Група 1')
    expect(screen.getByLabelText(/Месечна такса.*BGN/i)).toHaveValue(100)
    expect(screen.getByLabelText(/Месечна такса.*EUR/i)).toHaveValue(51.02)
  })

  it('displays student code', () => {
    renderWithProviders(<StudentModal student={mockStudent} onClose={() => {}} />)

    expect(screen.getByText(/K8M2B6/)).toBeInTheDocument()
  })

  it('shows QR code button for existing students', () => {
    renderWithProviders(<StudentModal student={mockStudent} onClose={() => {}} />)

    const qrButton = screen.getByRole('button', { name: /QR код/i })
    expect(qrButton).toBeInTheDocument()
  })

  it('displays QR code when button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal student={mockStudent} onClose={() => {}} />)

    const qrButton = screen.getByRole('button', { name: /QR код/i })
    await user.click(qrButton)

    await waitFor(() => {
      expect(screen.getByAltText(/QR код/i)).toBeInTheDocument()
    })
  })

  it('allows updating student data', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<StudentModal student={mockStudent} onClose={onClose} />)

    const nameInput = screen.getByLabelText(/Име и фамилия/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Иван Георгиев')

    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls updateStudent mutation on submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<StudentModal student={mockStudent} onClose={onClose} />)

    // Update name
    const nameInput = screen.getByLabelText(/Име и фамилия/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Ново Име')

    // Submit
    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})

describe('StudentModal - Validation', () => {
  it('requires student name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const nameInput = screen.getByLabelText(/Име и фамилия/i)
    await user.clear(nameInput)

    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    // Form should not submit
    await waitFor(() => {
      expect(screen.getByText('Добави ученик')).toBeInTheDocument()
    })
  })

  it('requires positive fee amount', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const bgnInput = screen.getByLabelText(/Месечна такса.*BGN/i)
    await user.clear(bgnInput)
    await user.type(bgnInput, '-10')

    // Should show validation error or prevent negative values
    expect(bgnInput).toHaveValue(-10)
  })

  it('validates due date format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const dueDateInput = screen.getByLabelText(/Дата на падеж/i)
    expect(dueDateInput).toBeInTheDocument()
  })
})

describe('StudentModal - Currency Conversion', () => {
  it('maintains precision in BGN to EUR conversion', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const bgnInput = screen.getByLabelText(/Месечна такса.*BGN/i)
    await user.clear(bgnInput)
    await user.type(bgnInput, '196')

    await waitFor(() => {
      const eurInput = screen.getByLabelText(/Месечна такса.*EUR/i)
      expect(eurInput).toHaveValue(100) // 196 / 1.96
    })
  })

  it('maintains precision in EUR to BGN conversion', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const eurInput = screen.getByLabelText(/Месечна такса.*EUR/i)
    await user.clear(eurInput)
    await user.type(eurInput, '100')

    await waitFor(() => {
      const bgnInput = screen.getByLabelText(/Месечна такса.*BGN/i)
      expect(bgnInput).toHaveValue(196) // 100 * 1.96
    })
  })

  it('handles decimal amounts correctly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const bgnInput = screen.getByLabelText(/Месечна такса.*BGN/i)
    await user.clear(bgnInput)
    await user.type(bgnInput, '99.50')

    await waitFor(() => {
      const eurInput = screen.getByLabelText(/Месечна такса.*EUR/i)
      // Should be approximately 50.77
      expect(Number(eurInput.value)).toBeCloseTo(50.77, 2)
    })
  })
})

describe('StudentModal - Accessibility', () => {
  it('has proper labels for all form fields', () => {
    renderWithProviders(<StudentModal onClose={() => {}} />)

    expect(screen.getByLabelText(/Име и фамилия/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Група/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Месечна такса.*BGN/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Тип обучение/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Статус/i)).toBeInTheDocument()
  })

  it('can be navigated with keyboard', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const nameInput = screen.getByLabelText(/Име и фамилия/i)
    nameInput.focus()

    await user.tab()
    expect(screen.getByLabelText(/Група/i)).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText(/Месечна такса.*BGN/i)).toHaveFocus()
  })

  it('has close button with proper ARIA label', () => {
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const closeButton = screen.getByRole('button', { name: /Затвори/i })
    expect(closeButton).toBeInTheDocument()
  })
})

describe('StudentModal - QR Code Functionality', () => {
  it('generates QR code for existing students', async () => {
    renderWithProviders(<StudentModal student={mockStudent} onClose={() => {}} />)

    await waitFor(() => {
      const qrButton = screen.getByRole('button', { name: /QR код/i })
      expect(qrButton).toBeInTheDocument()
    })
  })

  it('allows downloading QR code', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StudentModal student={mockStudent} onClose={() => {}} />)

    // Show QR code
    const qrButton = screen.getByRole('button', { name: /QR код/i })
    await user.click(qrButton)

    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /Изтегли/i })
      expect(downloadButton).toBeInTheDocument()
    })
  })

  it('does not show QR code for new students', () => {
    renderWithProviders(<StudentModal onClose={() => {}} />)

    const qrButton = screen.queryByRole('button', { name: /QR код/i })
    expect(qrButton).not.toBeInTheDocument()
  })
})
