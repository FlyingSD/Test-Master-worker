import { useState, useEffect } from 'react'
import { X, Save, Calendar, BookOpen, User, FileText } from 'lucide-react'
import { useAddHomework, useUpdateHomework } from '@/hooks/useHomework'
import { useStudents } from '@/hooks/useStudents'
import { useAuth } from '@/hooks/useAuth'
import { Homework, HomeworkFormValues } from '@/types'
import ErrorAlert from '@/components/ErrorAlert'
import { Timestamp } from 'firebase/firestore'
import { ErrorMessage } from '@/utils/errorMessages'

/**
 * HomeworkModal Component
 *
 * ARCHITECTURE PRINCIPLES APPLIED:
 * - SSOT: Uses centralized constants for homework statuses
 * - PoLP: Only Teachers/Admins can create homework (enforced by hooks)
 * - SoC: Separated validation, submission, and rendering logic
 * - DRY: Reuses existing modal patterns from codebase
 * - Clean Code: Clear naming, logical grouping, comments
 * - Loose Coupling: Uses hooks instead of direct Firestore calls
 * - RBAC: Role-based permissions checked in hooks
 */

// SSOT: Homework status options (Single Source of Truth)
const HOMEWORK_STATUS_OPTIONS = ['assigned', 'completed', 'overdue'] as const

interface HomeworkModalProps {
  homework?: Homework | null
  studentId?: string // Pre-select student if provided
  onClose: () => void
}

export default function HomeworkModal({
  homework,
  studentId: initialStudentId,
  onClose
}: HomeworkModalProps) {
  // ============================================================================
  // HOOKS & STATE MANAGEMENT
  // ============================================================================

  const { userData, isAdmin, isTeacher } = useAuth()
  const addHomework = useAddHomework()
  const updateHomework = useUpdateHomework()
  const { students } = useStudents()

  // Form state
  const [formData, setFormData] = useState<HomeworkFormValues>({
    studentId: initialStudentId || '',
    studentName: '',
    title: '',
    description: '',
    assignedDate: new Date(),
    dueDate: new Date(Date?.now() + 7 * 24 * 60 * 60 * 1000), // +7 days default
    status: 'assigned',
    completedDate: undefined,
    grade: undefined,
    teacherNotes: '',
    parentNotes: '',
  })

  // Validation state
  const [errors, setErrors] = useState<ErrorMessage[]>([])
  const [warnings, setWarnings] = useState<ErrorMessage[]>([])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load existing homework data for editing
   * Handles Timestamp to Date conversion (Firebase compatibility)
   */
  useEffect(() => {
    if (homework) {
      setFormData({
        studentId: homework?.studentId,
        studentName: homework?.studentName,
        title: homework?.title,
        description: homework?.description,
        assignedDate: homework?.assignedDate instanceof Timestamp
          ? homework?.assignedDate.toDate()
          : homework?.assignedDate,
        dueDate: homework?.dueDate instanceof Timestamp
          ? homework?.dueDate.toDate()
          : homework?.dueDate,
        status: homework?.status,
        completedDate: homework?.completedDate instanceof Timestamp
          ? homework?.completedDate.toDate()
          : homework?.completedDate,
        grade: homework?.grade,
        teacherNotes: homework?.teacherNotes || '',
        parentNotes: homework?.parentNotes || '',
      })
    }
  }, [homework])

  /**
   * Pre-select student if studentId is provided
   */
  useEffect(() => {
    if (initialStudentId && students?.length > 0 && !homework) {
      const student = students?.find(s => s?.id === initialStudentId)
      if (student) {
        setFormData(prev => ({
          ...prev,
          studentId: student?.id,
          studentName: student?.name,
        }))
      }
    }
  }, [initialStudentId, students, homework])

  // ============================================================================
  // VALIDATION LOGIC (SoC: Separated Concern)
  // ============================================================================

  /**
   * Validates homework form data
   *
   * VALIDATION RULES:
   * - Due date must be after assigned date (ERROR)
   * - Due date > 30 days away (WARNING)
   * - Grade must be 1-6 if provided (ERROR)
   */
  const validateForm = (data: HomeworkFormValues) => {
    const newErrors: ErrorMessage[] = []
    const newWarnings: ErrorMessage[] = []

    // RULE 1: Due date validation
    if (data?.dueDate <= data?.assignedDate) {
      newErrors?.push({
        type: 'error',
        title: 'Невалидна крайна дата',
        message: 'Крайната дата трябва да е след датата на задаване',
        solution: 'Изберете дата след датата на задаване',
      })
    }

    // RULE 2: Far future due date warning
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow?.setDate(thirtyDaysFromNow?.getDate() + 30)
    if (data?.dueDate > thirtyDaysFromNow) {
      newWarnings?.push({
        type: 'warning',
        title: 'Далечна крайна дата',
        message: 'Крайната дата е повече от 30 дни напред',
        solution: 'Проверете дали това е правилно',
      })
    }

    // RULE 3: Grade validation (Bulgarian system: 1-6)
    if (data?.grade !== undefined && (data?.grade < 1 || data?.grade > 6)) {
      newErrors?.push({
        type: 'error',
        title: 'Невалидна оценка',
        message: 'Оценката трябва да е между 1 и 6',
        solution: 'Въведете оценка от 1 до 6 (Български 6-бален)',
      })
    }

    // RULE 4: Assigned date in past warning
    const yesterday = new Date()
    yesterday?.setDate(yesterday?.getDate() - 1)
    if (data?.assignedDate < yesterday) {
      newWarnings?.push({
        type: 'warning',
        title: 'Стара дата на задаване',
        message: 'Датата на задаване е в миналото',
        solution: 'Проверете дали това е правилно',
      })
    }

    setErrors(newErrors)
    setWarnings(newWarnings)

    return newErrors?.length === 0 // Return true if no errors
  }

  // ============================================================================
  // FORM HANDLERS (SoC: Event Handling Logic)
  // ============================================================================

  /**
   * Handle student selection
   * Populates studentName from selected student (denormalization)
   */
  const handleStudentChange = (studentId: string) => {
    const selectedStudent = students?.find(s => s?.id === studentId)
    const newFormData = {
      ...formData,
      studentId,
      studentName: selectedStudent?.name || '',
    }
    setFormData(newFormData)
  }

  /**
   * Handle date changes with validation
   */
  const handleDateChange = (field: 'assignedDate' | 'dueDate', value: string) => {
    const newFormData = {
      ...formData,
      [field]: new Date(value),
    }
    setFormData(newFormData)
    validateForm(newFormData) // Re-validate on date change
  }

  /**
   * Handle grade input with validation
   */
  const handleGradeChange = (value: string) => {
    const grade = value === '' ? undefined : Number(value)
    const newFormData = {
      ...formData,
      grade,
    }
    setFormData(newFormData)
    validateForm(newFormData) // Re-validate on grade change
  }

  // ============================================================================
  // FORM SUBMISSION (SoC: Business Logic)
  // ============================================================================

  /**
   * Handle form submission
   *
   * WORKFLOW:
   * 1. Validate form
   * 2. Check student selection
   * 3. Determine CREATE vs UPDATE mode
   * 4. Submit via hooks (with automatic PoLP enforcement)
   * 5. Close modal on success
   */
  const handleSubmit = async (e: React?.FormEvent) => {
    e?.preventDefault()

    // Step 1: Validate
    const isValid = validateForm(formData)
    if (!isValid || errors?.length > 0) {
      return // Block submission if validation errors exist
    }

    // Step 2: Check student selection
    const selectedStudent = students?.find(s => s?.id === formData?.studentId)
    if (!selectedStudent && !homework) {
      alert('Моля изберете ученик')
      return
    }

    // Step 3: Prepare data for submission
    const dataToSubmit = {
      ...formData,
      studentName: selectedStudent?.name || formData?.studentName,
    }

    try {
      // Step 4: Submit (CREATE vs UPDATE)
      if (homework) {
        // UPDATE MODE
        await updateHomework?.mutateAsync({
          id: homework?.id,
          data: dataToSubmit,
        })
      } else {
        // CREATE MODE
        await addHomework?.mutateAsync(dataToSubmit)
      }

      // Step 5: Close modal on success
      onClose()
    } catch (error) {
      // Error handling is done automatically by hooks (toast notifications)
      console?.error('Homework submission error:', error)
    }
  }

  // ============================================================================
  // PERMISSION CHECK (PoLP: Principle of Least Privilege)
  // ============================================================================

  // Only Teachers and Admins can create/edit homework
  if (!isAdmin && !isTeacher) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Няма достъп</h2>
          <p className="text-gray-700 mb-6">
            Само учители и администратори могат да създават домашни.
          </p>
          <button onClick={onClose} className="btn btn-primary w-full">
            Затвори
          </button>
        </div>
      </div>
    )
  }

  // Get active students only (filtered)
  const activeStudents = students?.filter(s => s?.status === 'active')

  // ============================================================================
  // RENDER (SoC: UI Layer)
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">

        {/* ========== HEADER ========== */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {homework ? 'Редактирай домашно' : 'Задай домашно'}
              </h2>
              <p className="text-sm text-gray-500">
                {homework ? 'Промени данните за домашното' : 'Добави ново домашно за ученик'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Затвори"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ========== FORM ========== */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ========== ERROR/WARNING ALERTS ========== */}
          {errors?.length > 0 && (
            <div className="space-y-2">
              {errors?.map((error, index) => (
                <ErrorAlert
                  key={`error-${index}`}
                  error={error}
                  onClose={() => setErrors(errors?.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          )}

          {warnings?.length > 0 && (
            <div className="space-y-2">
              {warnings?.map((warning, index) => (
                <ErrorAlert
                  key={`warning-${index}`}
                  error={warning}
                  onClose={() => setWarnings(warnings?.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          )}

          {/* ========== STUDENT SELECTION ========== */}
          <div>
            <label className="label">
              <User className="w-4 h-4 inline mr-2" />
              Ученик <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="input"
              value={formData?.studentId}
              onChange={(e) => handleStudentChange(e?.target.value)}
              disabled={!!homework} // Cannot change student when editing
            >
              <option value="">Избери ученик</option>
              {activeStudents?.map((student) => (
                <option key={student?.id} value={student?.id}>
                  {student?.name} - {student?.group}
                </option>
              ))}
            </select>
            {homework && (
              <p className="text-sm text-gray-500 mt-1">
                Ученикът не може да бъде променен след създаване
              </p>
            )}
          </div>

          {/* ========== HOMEWORK TITLE ========== */}
          <div>
            <label className="label">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Заглавие <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input"
              placeholder="Глава 5: Алгебра"
              value={formData?.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e?.target.value })
              }
            />
          </div>

          {/* ========== DESCRIPTION ========== */}
          <div>
            <label className="label">
              <FileText className="w-4 h-4 inline mr-2" />
              Описание <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              className="input min-h-[120px] resize-y"
              placeholder="Какво трябва да направят учениците? Включи конкретни инструкции..."
              value={formData?.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e?.target.value })
              }
            />
          </div>

          {/* ========== DATES GRID ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ASSIGNED DATE */}
            <div>
              <label className="label">
                <Calendar className="w-4 h-4 inline mr-2" />
                Дата на задаване <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="input"
                value={
                  formData?.assignedDate instanceof Date
                    ? formData?.assignedDate?.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => handleDateChange('assignedDate', e?.target.value)}
              />
            </div>

            {/* DUE DATE */}
            <div>
              <label className="label">
                <Calendar className="w-4 h-4 inline mr-2" />
                Краен срок <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="input"
                value={
                  formData?.dueDate instanceof Date
                    ? formData?.dueDate?.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => handleDateChange('dueDate', e?.target.value)}
              />
            </div>
          </div>

          {/* ========== STATUS & GRADE GRID ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STATUS */}
            <div>
              <label className="label">Статус</label>
              <select
                className="input"
                value={formData?.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e?.target.value as HomeworkFormValues['status'],
                  })
                }
              >
                {HOMEWORK_STATUS_OPTIONS?.map((status) => (
                  <option key={status} value={status}>
                    {status === 'assigned' && 'Зададено'}
                    {status === 'completed' && 'Завършено'}
                    {status === 'overdue' && 'Просрочено'}
                  </option>
                ))}
              </select>
            </div>

            {/* GRADE (Optional) */}
            <div>
              <label className="label">
                Оценка (1-6)
                <span className="text-gray-400 text-xs ml-2">(Опционално)</span>
              </label>
              <input
                type="number"
                min="1"
                max="6"
                step="1"
                className="input"
                placeholder="Оценка 1-6"
                value={formData?.grade || ''}
                onChange={(e) => handleGradeChange(e?.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Български 6-бален: Слаб (2) до Отличен (6)
              </p>
            </div>
          </div>

          {/* ========== TEACHER NOTES ========== */}
          <div>
            <label className="label">Бележки на учителя</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Обратна връзка, забележки за оценяването, наблюдения..."
              value={formData?.teacherNotes}
              onChange={(e) =>
                setFormData({ ...formData, teacherNotes: e?.target.value })
              }
            />
          </div>

          {/* ========== PARENT NOTES ========== */}
          <div>
            <label className="label">Бележки за родителите</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Опционални бележки за родителите относно домашното..."
              value={formData?.parentNotes}
              onChange={(e) =>
                setFormData({ ...formData, parentNotes: e?.target.value })
              }
            />
          </div>

          {/* ========== ACTION BUTTONS ========== */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={
                addHomework?.isPending ||
                updateHomework?.isPending ||
                errors?.length > 0
              }
              className="btn btn-primary flex-1"
            >
              {addHomework?.isPending || updateHomework?.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Запазва се...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {homework ? 'Запази промени' : 'Задай домашно'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
