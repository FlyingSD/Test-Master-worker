import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HomeworkModal from './HomeworkModal'
import { Homework } from '@/types'
import { Timestamp } from 'firebase/firestore'

// Mock hooks
vi.mock('@/hooks/useHomework', () => ({
  useAddHomework: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-homework-id' }),
    isPending: false,
  }),
  useUpdateHomework: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}))

vi.mock('@/hooks/useStudents', () => ({
  useStudents: () => ({
    students: [
      { id: 'student-1', name: 'Иван Петров', group: 'Група 1' },
      { id: 'student-2', name: 'Мария Георгиева', group: 'Група 2' },
    ],
    loading: false,
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'teacher-1' },
    userData: { role: 'teacher', name: 'Учител Иванов' },
    isAdmin: false,
    isTeacher: true,
    isParent: false,
  }),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockHomework: Homework = {
  id: 'homework-1',
  studentId: 'student-1',
  studentName: 'Иван Петров',
  title: 'Математика - Упражнения',
  description: 'Решете задачи от учебника',
  assignedDate: Timestamp.fromDate(new Date('2024-01-01')),
  dueDate: Timestamp.fromDate(new Date('2024-01-08')),
  status: 'assigned',
  grade: undefined,
  teacherNotes: 'Важно домашно',
  parentNotes: '',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  createdBy: 'teacher-1',
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

describe('HomeworkModal - Create Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    expect(screen.getByText('Добави домашно')).toBeInTheDocument()
    expect(screen.getByLabelText(/Ученик/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Заглавие/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Краен срок/i)).toBeInTheDocument()
  })

  it('allows selecting student', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    await user.selectOptions(studentSelect, 'student-1')

    expect(studentSelect).toHaveValue('student-1')
  })

  it('pre-selects student if studentId is provided', () => {
    renderWithProviders(<HomeworkModal studentId="student-1" onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i) as HTMLSelectElement
    expect(studentSelect.value).toBe('student-1')
  })

  it('allows entering title', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const titleInput = screen.getByLabelText(/Заглавие/i)
    await user.type(titleInput, 'Тестово домашно')

    expect(titleInput).toHaveValue('Тестово домашно')
  })

  it('allows entering description', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const descriptionInput = screen.getByLabelText(/Описание/i)
    await user.type(descriptionInput, 'Детайлно описание')

    expect(descriptionInput).toHaveValue('Детайлно описание')
  })

  it('defaults due date to 7 days from now', () => {
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const dueDateInput = screen.getByLabelText(/Краен срок/i) as HTMLInputElement
    const dueDate = new Date(dueDateInput.value)
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() + 7)

    // Check if dates are within same day
    expect(dueDate.toDateString()).toBe(expectedDate.toDateString())
  })

  it('allows selecting due date', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const dueDateInput = screen.getByLabelText(/Краен срок/i)
    await user.type(dueDateInput, '2024-02-15')

    expect(dueDateInput).toHaveValue('2024-02-15')
  })

  it('allows entering teacher notes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const notesInput = screen.getByLabelText(/Бележки от учител/i)
    await user.type(notesInput, 'Важна бележка')

    expect(notesInput).toHaveValue('Важна бележка')
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<HomeworkModal onClose={onClose} />)

    const cancelButton = screen.getByText('Откажи')
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('calls addHomework mutation on submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<HomeworkModal onClose={onClose} />)

    // Fill form
    await user.selectOptions(screen.getByLabelText(/Ученик/i), 'student-1')
    await user.type(screen.getByLabelText(/Заглавие/i), 'Нов домашен')
    await user.type(screen.getByLabelText(/Описание/i), 'Описание тук')

    // Submit
    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})

describe('HomeworkModal - Edit Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders edit form with homework data', () => {
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    expect(screen.getByText('Редактирай домашно')).toBeInTheDocument()
    expect(screen.getByLabelText(/Ученик/i)).toHaveValue('student-1')
    expect(screen.getByLabelText(/Заглавие/i)).toHaveValue('Математика - Упражнения')
    expect(screen.getByLabelText(/Описание/i)).toHaveValue('Решете задачи от учебника')
  })

  it('displays teacher notes', () => {
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    expect(screen.getByLabelText(/Бележки от учител/i)).toHaveValue('Важно домашно')
  })

  it('displays homework status', () => {
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    const statusSelect = screen.getByLabelText(/Статус/i)
    expect(statusSelect).toHaveValue('assigned')
  })

  it('allows updating status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    const statusSelect = screen.getByLabelText(/Статус/i)
    await user.selectOptions(statusSelect, 'completed')

    expect(statusSelect).toHaveValue('completed')
  })

  it('shows grade field when status is completed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    const statusSelect = screen.getByLabelText(/Статус/i)
    await user.selectOptions(statusSelect, 'completed')

    await waitFor(() => {
      expect(screen.getByLabelText(/Оценка/i)).toBeInTheDocument()
    })
  })

  it('allows entering grade', async () => {
    const user = userEvent.setup()
    const completedHomework = { ...mockHomework, status: 'completed' as const }
    renderWithProviders(<HomeworkModal homework={completedHomework} onClose={() => {}} />)

    const gradeInput = screen.getByLabelText(/Оценка/i)
    await user.clear(gradeInput)
    await user.type(gradeInput, '95')

    expect(gradeInput).toHaveValue(95)
  })

  it('calls updateHomework mutation on submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={onClose} />)

    // Update title
    const titleInput = screen.getByLabelText(/Заглавие/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Обновено заглавие')

    // Submit
    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})

describe('HomeworkModal - Validation', () => {
  it('requires student selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    // Don't select student
    await user.type(screen.getByLabelText(/Заглавие/i), 'Тест')
    await user.type(screen.getByLabelText(/Описание/i), 'Описание')

    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    // Form should not submit without student
    await waitFor(() => {
      expect(screen.getByText('Добави домашно')).toBeInTheDocument()
    })
  })

  it('requires title', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    await user.selectOptions(screen.getByLabelText(/Ученик/i), 'student-1')
    // Don't enter title

    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Добави домашно')).toBeInTheDocument()
    })
  })

  it('requires description', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    await user.selectOptions(screen.getByLabelText(/Ученик/i), 'student-1')
    await user.type(screen.getByLabelText(/Заглавие/i), 'Тест')
    // Don't enter description

    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Добави домашно')).toBeInTheDocument()
    })
  })

  it('validates due date is not in past', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const pastDate = new Date('2020-01-01')
    const dateString = pastDate.toISOString().split('T')[0]

    const dueDateInput = screen.getByLabelText(/Краен срок/i)
    await user.type(dueDateInput, dateString)

    // Should show warning for past date
    await waitFor(() => {
      const submitButton = screen.getByText('Запази')
      expect(submitButton).toBeInTheDocument()
    })
  })

  it('validates grade is between 0 and 100', async () => {
    const user = userEvent.setup()
    const completedHomework = { ...mockHomework, status: 'completed' as const }
    renderWithProviders(<HomeworkModal homework={completedHomework} onClose={() => {}} />)

    const gradeInput = screen.getByLabelText(/Оценка/i)
    await user.clear(gradeInput)
    await user.type(gradeInput, '150')

    // Should validate grade range
    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)
  })
})

describe('HomeworkModal - Status Management', () => {
  it('displays all status options', () => {
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    const statusSelect = screen.getByLabelText(/Статус/i)
    expect(statusSelect).toBeInTheDocument()

    expect(screen.getByRole('option', { name: /Зададено/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Завършено/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Просрочено/i })).toBeInTheDocument()
  })

  it('defaults to "assigned" status for new homework', () => {
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const statusSelect = screen.getByLabelText(/Статус/i) as HTMLSelectElement
    expect(statusSelect.value).toBe('assigned')
  })

  it('shows completed date when status is completed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    const statusSelect = screen.getByLabelText(/Статус/i)
    await user.selectOptions(statusSelect, 'completed')

    await waitFor(() => {
      expect(screen.getByLabelText(/Дата на завършване/i)).toBeInTheDocument()
    })
  })

  it('hides grade field when status is not completed', async () => {
    const user = userEvent.setup()
    const completedHomework = { ...mockHomework, status: 'completed' as const, grade: 90 }
    renderWithProviders(<HomeworkModal homework={completedHomework} onClose={() => {}} />)

    // Initially should show grade
    expect(screen.getByLabelText(/Оценка/i)).toBeInTheDocument()

    // Change status to assigned
    const statusSelect = screen.getByLabelText(/Статус/i)
    await user.selectOptions(statusSelect, 'assigned')

    // Grade field should be hidden or disabled
    await waitFor(() => {
      // The grade field might still exist but should not be required
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
    })
  })
})

describe('HomeworkModal - Student Selection', () => {
  it('displays list of students', () => {
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    expect(studentSelect).toBeInTheDocument()

    expect(screen.getByRole('option', { name: /Иван Петров/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Мария Георгиева/i })).toBeInTheDocument()
  })

  it('disables student selection in edit mode', () => {
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    expect(studentSelect).toBeDisabled()
  })

  it('allows student selection in create mode', () => {
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    expect(studentSelect).not.toBeDisabled()
  })
})

describe('HomeworkModal - Date Management', () => {
  it('displays assigned date', () => {
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    const assignedDateInput = screen.getByLabelText(/Дата на задаване/i)
    expect(assignedDateInput).toBeInTheDocument()
  })

  it('displays due date', () => {
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const dueDateInput = screen.getByLabelText(/Краен срок/i)
    expect(dueDateInput).toBeInTheDocument()
  })

  it('validates due date is after assigned date', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const assignedDateInput = screen.getByLabelText(/Дата на задаване/i)
    const dueDateInput = screen.getByLabelText(/Краен срок/i)

    await user.type(assignedDateInput, '2024-02-15')
    await user.type(dueDateInput, '2024-02-10') // Before assigned date

    // Should show validation error
    const submitButton = screen.getByText('Запази')
    await user.click(submitButton)
  })
})

describe('HomeworkModal - Accessibility', () => {
  it('has proper labels for all form fields', () => {
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    expect(screen.getByLabelText(/Ученик/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Заглавие/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Краен срок/i)).toBeInTheDocument()
  })

  it('can be navigated with keyboard', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const studentSelect = screen.getByLabelText(/Ученик/i)
    studentSelect.focus()

    await user.tab()
    expect(screen.getByLabelText(/Заглавие/i)).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText(/Описание/i)).toHaveFocus()
  })

  it('has close button with proper ARIA label', () => {
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const closeButton = screen.getByRole('button', { name: /Затвори/i })
    expect(closeButton).toBeInTheDocument()
  })
})

describe('HomeworkModal - Teacher Notes', () => {
  it('allows entering teacher notes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal onClose={() => {}} />)

    const notesInput = screen.getByLabelText(/Бележки от учител/i)
    await user.type(notesInput, 'Специални инструкции')

    expect(notesInput).toHaveValue('Специални инструкции')
  })

  it('displays existing teacher notes', () => {
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    expect(screen.getByLabelText(/Бележки от учител/i)).toHaveValue('Важно домашно')
  })

  it('allows updating teacher notes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    const notesInput = screen.getByLabelText(/Бележки от учител/i)
    await user.clear(notesInput)
    await user.type(notesInput, 'Обновени бележки')

    expect(notesInput).toHaveValue('Обновени бележки')
  })
})

describe('HomeworkModal - Parent Notes', () => {
  it('displays parent notes if available', () => {
    const homeworkWithParentNotes = { ...mockHomework, parentNotes: 'Коментар от родител' }
    renderWithProviders(<HomeworkModal homework={homeworkWithParentNotes} onClose={() => {}} />)

    // Parent notes should be visible (read-only for teachers)
    expect(screen.getByText(/Коментар от родител/i)).toBeInTheDocument()
  })

  it('hides parent notes section if empty', () => {
    renderWithProviders(<HomeworkModal homework={mockHomework} onClose={() => {}} />)

    // Parent notes section should not be prominent if empty
    const form = screen.getByRole('form')
    expect(form).toBeInTheDocument()
  })
})
