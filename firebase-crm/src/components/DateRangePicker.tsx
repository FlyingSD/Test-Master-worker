import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
  onClear: () => void
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: DateRangePickerProps) {
  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onStartDateChange(value ? new Date(value) : null)
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onEndDateChange(value ? new Date(value) : null)
  }

  const hasFilter = startDate || endDate

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <Calendar className="w-4 h-4 text-gray-500" />
        <input
          type="date"
          value={formatDateForInput(startDate)}
          onChange={handleStartChange}
          className="bg-transparent text-sm focus:outline-none w-32"
          placeholder="От дата"
        />
      </div>

      <span className="text-gray-500">—</span>

      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <Calendar className="w-4 h-4 text-gray-500" />
        <input
          type="date"
          value={formatDateForInput(endDate)}
          onChange={handleEndChange}
          className="bg-transparent text-sm focus:outline-none w-32"
          placeholder="До дата"
        />
      </div>

      {hasFilter && (
        <button
          onClick={onClear}
          className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
        >
          Изчисти
        </button>
      )}
    </div>
  )
}
