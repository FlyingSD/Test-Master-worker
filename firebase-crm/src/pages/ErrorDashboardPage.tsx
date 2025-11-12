import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertTriangle, AlertCircle, Info, RefreshCw, CheckCircle, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudents } from '@/hooks/useStudents'
import { usePayments } from '@/hooks/usePayments'
import { useExpenses } from '@/hooks/useExpenses'
import { checkDataConsistency, DataIssue } from '@/utils/errorMessages'

export default function ErrorDashboardPage() {
  const { userData } = useAuth()

  // 🔒 SECURITY: Only teachers and admins can view error dashboard
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  const { students, loading: studentsLoading } = useStudents()
  const { payments, loading: paymentsLoading } = usePayments()
  const { expenses, loading: expensesLoading } = useExpenses()

  const [issues, setIssues] = useState<DataIssue[]>([])
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentsLoading && !paymentsLoading && !expensesLoading) {
      setLoading(true)
      const foundIssues = checkDataConsistency(students, payments, expenses)
      setIssues(foundIssues)
      setLoading(false)
    }
  }, [students, payments, expenses, studentsLoading, paymentsLoading, expensesLoading])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      const foundIssues = checkDataConsistency(students, payments, expenses)
      setIssues(foundIssues)
      setLoading(false)
    }, 500)
  }

  const filteredIssues = filter === 'all'
    ? issues
    : issues?.filter((issue) => issue?.type === filter)

  const errorCount = issues?.filter((i) => i?.type === 'error').length
  const warningCount = issues?.filter((i) => i?.type === 'warning').length
  const infoCount = issues?.filter((i) => i?.type === 'info').length

  const getIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getColorClasses = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          title: 'text-red-900',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          title: 'text-yellow-900',
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          title: 'text-blue-900',
        }
    }
  }

  if (loading || studentsLoading || paymentsLoading || expensesLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка за грешки и несъответствия...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Грешки и предупреждения</h1>
          <p className="text-gray-600 mt-1">
            Проверка за несъответствия и проблеми в данните
          </p>
        </div>
        <button onClick={handleRefresh} className="btn btn-primary" disabled={loading}>
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Опресни
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Общо проблеми</p>
              <p className="text-2xl font-bold text-gray-900">{issues?.length}</p>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('error')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Грешки</p>
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('warning')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Предупреждения</p>
              <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('info')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Информация</p>
              <p className="text-2xl font-bold text-blue-600">{infoCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Всички ({issues?.length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`btn ${filter === 'error' ? 'btn-danger' : 'btn-ghost'}`}
          >
            Грешки ({errorCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`btn ${filter === 'warning' ? 'btn-secondary' : 'btn-ghost'}`}
          >
            Предупреждения ({warningCount})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`btn ${filter === 'info' ? 'btn-ghost' : 'btn-ghost'}`}
          >
            Информация ({infoCount})
          </button>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues?.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'Няма открити проблеми!' : `Няма ${filter === 'error' ? 'грешки' : filter === 'warning' ? 'предупреждения' : 'информационни съобщения'}`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Всички данни са коректни и няма несъответствия.'
              : 'Пробвайте друг филтър за да видите други проблеми.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues?.map((issue) => {
            const colors = getColorClasses(issue?.type)
            return (
              <div
                key={issue?.id}
                className={`${colors?.bg} ${colors?.border} border rounded-lg p-4 animate-slide-up`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 pt-0?.5">{getIcon(issue?.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className={`font-semibold ${colors?.title} mb-1`}>{issue?.title}</h3>

                    {/* Description */}
                    <p className={`text-sm ${colors?.text} mb-2`}>{issue?.description}</p>

                    {/* Solution */}
                    <div className="flex items-start gap-2 mt-2 p-3 bg-white/50 rounded-lg">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${issue?.type === 'error' ? 'text-red-600' : issue?.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
                      <div>
                        <p className={`text-sm font-semibold ${colors?.text} mb-1`}>
                          Решение:
                        </p>
                        <p className={`text-sm ${colors?.text}`}>{issue?.solution}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Как работи проверката?</h3>
            <p className="text-sm text-blue-800">
              Системата автоматично проверява данните за:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
              <li>Просрочени плащания на активни ученици</li>
              <li>Плащания без номер на документ (ПОС, банков път, фактура)</li>
              <li>Разходи без фискален документ</li>
              <li>Необичайно големи суми (възможни грешки)</li>
              <li>Несъответствия между BGN и EUR</li>
            </ul>
            <p className="text-sm text-blue-800 mt-2">
              Кликнете "Опресни" за да стартирате нова проверка след промени в данните.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
