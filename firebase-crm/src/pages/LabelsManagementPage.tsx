import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Save, RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLabels, useUpdateLabels } from '@/hooks/useLabels'
import { DEFAULT_LABELS } from '@/constants/defaultLabels'

type SectionKey = keyof typeof DEFAULT_LABELS

export default function LabelsManagementPage() {
  const { userData, isAdmin } = useAuth()
  const { labels, loading } = useLabels()
  const { updateLabels, resetToDefaults, saving } = useUpdateLabels()

  const [searchTerm, setSearchTerm] = useState('')
  const [editedLabels, setEditedLabels] = useState<any>(labels)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['navigation', 'pages'])
  )
  const [hasChanges, setHasChanges] = useState(false)

  // 🔒 SECURITY: Only admins can access this page
  if (userData && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на етикети...</p>
        </div>
      </div>
    )
  }

  // Initialize editedLabels when labels load
  if (editedLabels === labels && labels !== DEFAULT_LABELS) {
    setEditedLabels(JSON.parse(JSON.stringify(labels)))
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded?.has(section)) {
      newExpanded?.delete(section)
    } else {
      newExpanded?.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleLabelChange = (path: string[], value: string) => {
    const newLabels = JSON.parse(JSON.stringify(editedLabels))
    let current = newLabels

    for (let i = 0; i < path?.length - 1; i++) {
      current = current[path[i]]
    }

    current[path[path?.length - 1]] = value
    setEditedLabels(newLabels)
    setHasChanges(true)
  }

  const handleSave = async () => {
    await updateLabels(editedLabels)
    setHasChanges(false)
  }

  const handleReset = async () => {
    if (
      window.confirm(
        'Сигурни ли сте, че искате да върнете всички етикети към стойностите по подразбиране?'
      )
    ) {
      await resetToDefaults()
      setEditedLabels(DEFAULT_LABELS)
      setHasChanges(false)
    }
  }

  const renderNestedObject = (obj: any, path: string[] = [], level: number = 0): JSX?.Element[] => {
    const elements: JSX?.Element[] = []

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key]
      const pathString = currentPath?.join('.')

      // Filter by search term
      if (
        searchTerm &&
        !key?.toLowerCase().includes(searchTerm?.toLowerCase()) &&
        !(typeof value === 'string' && value?.toLowerCase().includes(searchTerm?.toLowerCase()))
      ) {
        continue
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Render nested section
        const sectionKey = currentPath?.join('.')
        const isExpanded = expandedSections?.has(sectionKey)

        elements?.push(
          <div key={pathString} className="mb-4">
            <button
              onClick={() => toggleSection(sectionKey)}
              className="flex items-center gap-2 w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              )}
              <span className="font-semibold text-gray-900 capitalize">{key}</span>
              <span className="ml-auto text-sm text-gray-500">
                {Object.keys(value).length} етикети
              </span>
            </button>

            {isExpanded && (
              <div className="mt-2 ml-6 space-y-3">
                {renderNestedObject(value, currentPath, level + 1)}
              </div>
            )}
          </div>
        )
      } else if (typeof value === 'string') {
        // Render editable label
        const defaultValue = currentPath?.reduce(
          (obj, k) => obj?.[k],
          DEFAULT_LABELS as any
        )

        const isModified = value !== defaultValue

        elements?.push(
          <div key={pathString} className={`grid grid-cols-3 gap-4 items-start p-3 rounded-lg ${
            isModified ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'
          }`}>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key}
              </label>
              <p className="text-xs text-gray-500 break-all">{pathString}</p>
              {isModified && (
                <span className="inline-block mt-1 px-2 py-0?.5 bg-blue-500 text-white text-xs rounded">
                  Променен
                </span>
              )}
            </div>

            <div className="col-span-1">
              <label className="block text-xs text-gray-500 mb-1">По подразбиране</label>
              <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded border border-gray-200">
                {defaultValue || '—'}
              </p>
            </div>

            <div className="col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Текуща стойност</label>
              <input
                type="text"
                value={value}
                onChange={(e) => handleLabelChange(currentPath, e?.target.value)}
                className="input input-sm w-full"
                placeholder={defaultValue}
              />
            </div>
          </div>
        )
      }
    }

    return elements
  }

  const getSectionTitle = (key: SectionKey): string => {
    const titles: Record<SectionKey, string> = {
      navigation: '🧭 Навигация',
      pages: '📄 Заглавия на страници',
      common: '🔤 Общи етикети',
      buttons: '🔘 Бутони',
      forms: '📝 Форми',
      status: '📊 Статуси',
      messages: '💬 Съобщения',
      tableColumns: '📋 Колони в таблици',
    }
    return titles[key] || key
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление на етикети</h1>
          <p className="text-gray-600 mt-1">
            Персонализирайте текстовете в потребителския интерфейс
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="btn btn-ghost"
          >
            <RotateCcw className="w-5 h-5" />
            Нулирай
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Запазване...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Запази промените
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">💡</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Как работи?</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Променете текстовете в полетата "Текуща стойност"</li>
              <li>• Промените се виждат веднага след запазване за всички потребители</li>
              <li>• Можете да върнете всички етикети към стойностите по подразбиране с бутона "Нулирай"</li>
              <li>• Полетата с син фон са променени от стойностите по подразбиране</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Търсене по ключ или стойност..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target.value)}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {(Object.keys(DEFAULT_LABELS) as SectionKey[]).map((sectionKey) => {
          const section = editedLabels[sectionKey]
          const sectionPath = sectionKey
          const isExpanded = expandedSections?.has(sectionPath)

          return (
            <div key={sectionKey} className="card">
              <button
                onClick={() => toggleSection(sectionPath)}
                className="flex items-center gap-3 w-full text-left mb-4"
              >
                {isExpanded ? (
                  <ChevronDown className="w-6 h-6 text-primary" />
                ) : (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                )}
                <h2 className="text-xl font-bold text-gray-900">
                  {getSectionTitle(sectionKey)}
                </h2>
                <span className="ml-auto text-sm text-gray-500">
                  {typeof section === 'object'
                    ? Object.keys(section).length + ' етикети'
                    : ''}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-3">
                  {renderNestedObject(section, [sectionKey])}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save Button (sticky on scroll) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary shadow-2xl"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Запазване...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Запази промените
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
