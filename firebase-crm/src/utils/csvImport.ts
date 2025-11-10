import Papa from 'papaparse'
import { Student } from '@/types'
import { Timestamp } from 'firebase/firestore'

export interface CSVStudentRow {
  name: string
  group: string
  studyType: string
  fee: string
  feeEUR: string
  dueDate: string
  status: string
  notes?: string
}

export interface ImportResult {
  success: Student[]
  errors: Array<{ row: number; error: string; data: any }>
}

export function parseCSVFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importResult: ImportResult = {
          success: [],
          errors: [],
        }

        results.data.forEach((row: any, index: number) => {
          try {
            // Validate required fields
            if (!row.name || !row.group || !row.studyType) {
              importResult.errors.push({
                row: index + 1,
                error: 'Missing required fields (name, group, studyType)',
                data: row,
              })
              return
            }

            // Parse fees
            const fee = parseFloat(row.fee) || 0
            const feeEUR = parseFloat(row.feeEUR) || 0

            // Parse due date
            let dueDate: Date
            try {
              dueDate = new Date(row.dueDate)
              if (isNaN(dueDate.getTime())) {
                throw new Error('Invalid date')
              }
            } catch {
              dueDate = new Date()
              dueDate.setMonth(dueDate.getMonth() + 1)
            }

            // Validate status
            const status = row.status === 'inactive' ? 'inactive' : 'active'

            // Create student object
            const student: Omit<Student, 'id' | 'createdAt' | 'createdBy'> = {
              name: row.name.trim(),
              group: row.group.trim(),
              studyType: row.studyType.trim(),
              fee,
              feeEUR,
              dueDate: Timestamp.fromDate(dueDate),
              status,
              notes: row.notes?.trim() || '',
            }

            importResult.success.push(student as Student)
          } catch (error) {
            importResult.errors.push({
              row: index + 1,
              error: error instanceof Error ? error.message : 'Unknown error',
              data: row,
            })
          }
        })

        resolve(importResult)
      },
      error: (error) => {
        resolve({
          success: [],
          errors: [{ row: 0, error: error.message, data: null }],
        })
      },
    })
  })
}

export function generateCSVTemplate(): string {
  const headers = [
    'name',
    'group',
    'studyType',
    'fee',
    'feeEUR',
    'dueDate',
    'status',
    'notes',
  ]

  const exampleRows = [
    [
      'Иван Петров',
      'Група А',
      'Математика',
      '100',
      '50',
      '2025-12-01',
      'active',
      'Пример бележка',
    ],
    [
      'Мария Георгиева',
      'Група Б',
      'Английски',
      '120',
      '60',
      '2025-12-15',
      'active',
      '',
    ],
  ]

  const csv = [headers.join(','), ...exampleRows.map((row) => row.join(','))].join('\n')

  return csv
}

export function downloadCSVTemplate() {
  const csv = generateCSVTemplate()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'students_import_template.csv'
  link.click()
}
