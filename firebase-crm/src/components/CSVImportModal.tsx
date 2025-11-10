import { useState } from 'react'
import { X, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { parseCSVFile, downloadCSVTemplate, ImportResult } from '@/utils/csvImport'
import { useBulkAddStudents } from '@/hooks/useStudents'

interface CSVImportModalProps {
  onClose: () => void
}

export default function CSVImportModal({ onClose }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)

  const bulkAddStudents = useBulkAddStudents()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setImportResult(null)
    } else {
      alert('Моля изберете CSV файл')
    }
  }

  const handlePreview = async () => {
    if (!file) return

    setImporting(true)
    try {
      const result = await parseCSVFile(file)
      setImportResult(result)
    } catch (error) {
      alert('Грешка при четене на файла')
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!importResult || importResult.success.length === 0) return

    setImporting(true)
    try {
      await bulkAddStudents.mutateAsync(importResult.success)
      alert(`Успешно импортирани ${importResult.success.length} ученици!`)
      onClose()
    } catch (error) {
      alert('Грешка при импортиране на ученици')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">CSV Import на ученици</h2>
            <p className="text-sm text-gray-600 mt-1">
              Качете CSV файл с данни за ученици
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Инструкции:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Изтеглете шаблон файла по-долу</li>
              <li>Попълнете данните в Excel/Google Sheets</li>
              <li>Запазете като CSV файл</li>
              <li>Качете тук за импортиране</li>
            </ol>
          </div>

          {/* Download Template */}
          <div>
            <button
              onClick={downloadCSVTemplate}
              className="btn btn-ghost w-full"
            >
              <Download className="w-5 h-5" />
              Изтегли шаблон CSV
            </button>
          </div>

          {/* File Upload */}
          <div>
            <label className="label">Избери CSV файл *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-700 font-medium">
                  {file ? file.name : 'Кликнете за избор на файл'}
                </p>
                <p className="text-sm text-gray-500 mt-1">CSV файл до 5MB</p>
              </label>
            </div>
          </div>

          {/* Preview Button */}
          {file && !importResult && (
            <button
              onClick={handlePreview}
              disabled={importing}
              className="btn btn-primary w-full"
            >
              {importing ? 'Обработване...' : 'Преглед на данните'}
            </button>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              {/* Success */}
              {importResult.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">
                      Валидни записи: {importResult.success.length}
                    </h3>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-green-800 space-y-1">
                      {importResult.success.slice(0, 5).map((student, idx) => (
                        <li key={idx}>
                          ✓ {student.name} - {student.group}
                        </li>
                      ))}
                      {importResult.success.length > 5 && (
                        <li className="font-medium">
                          ... и още {importResult.success.length - 5}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">
                      Грешки: {importResult.errors.length}
                    </h3>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-800 space-y-2">
                      {importResult.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>
                          Ред {error.row}: {error.error}
                        </li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li className="font-medium">
                          ... и още {importResult.errors.length - 5} грешки
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Import Button */}
              {importResult.success.length > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn btn-primary w-full"
                >
                  {importing
                    ? 'Импортиране...'
                    : `Импортирай ${importResult.success.length} ученици`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
