import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Save, Settings, Building2, Globe, Bell, Palette, Shield, Key, Users, Languages, ArrowRight } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { SystemSettings, RoleFeaturePermissions, FeatureName } from '@/types'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const defaultFeaturePermissions: RoleFeaturePermissions = {
    teacher: {
      dashboard: true,
      students: true,
      groups: true,
      homework: true,
      parents: true,
      payments: true,
      expenses: false,
      inventory: true,
      attendance: true,
      events: true,
      discounts: true,
      reports: false,
      errors: true,
      'my-children': false,
    },
    parent: {
      dashboard: true,
      students: false,
      groups: false,
      homework: false,
      parents: false,
      payments: true,
      expenses: false,
      inventory: false,
      attendance: false,
      events: true,
      discounts: false,
      reports: false,
      errors: false,
      'my-children': true,
    },
  }

  const [settings, setSettings] = useState<Partial<SystemSettings>>({
    schoolName: 'Светлинки',
    schoolEmail: '',
    schoolPhone: '',
    schoolAddress: '',
    currency: 'BGN',
    timezone: 'Europe/Sofia',
    language: 'bg',
    emailNotifications: true,
    smsNotifications: false,
    theme: 'light',
    featurePermissions: defaultFeaturePermissions,
  })

  // 🔒 SECURITY: Only admins can access system settings
  if (userData?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'system')
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setSettings(docSnap.data() as SystemSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Грешка при зареждане на настройки')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const docRef = doc(db, 'settings', 'system')
      await setDoc(docRef, {
        ...settings,
        updatedBy: user.id,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      toast.success('Настройките бяха запазени успешно!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Грешка при запазване на настройки')
    } finally {
      setSaving(false)
    }
  }

  // Feature permission helpers
  const featureLabels: Record<FeatureName, string> = {
    dashboard: 'Dashboard',
    students: 'Ученици',
    groups: 'Групи',
    homework: 'Домашни',
    parents: 'Родители',
    payments: 'Плащания',
    expenses: 'Разходи',
    inventory: 'Склад',
    attendance: 'Присъствия',
    events: 'Събития',
    discounts: 'Отстъпки',
    reports: 'Репорти',
    errors: '⚠️ Грешки',
    'my-children': 'Моите деца',
  }

  const toggleFeature = (role: 'teacher' | 'parent', feature: FeatureName) => {
    setSettings({
      ...settings,
      featurePermissions: {
        ...settings.featurePermissions!,
        [role]: {
          ...settings.featurePermissions![role],
          [feature]: !settings.featurePermissions![role][feature],
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Зареждане на настройки...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
          <p className="text-gray-600 mt-1">
            Конфигурация на системата
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Information */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-light rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Информация за училището</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Име на училището</label>
              <input
                type="text"
                className="input"
                placeholder="Светлинки"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Имейл</label>
              <input
                type="email"
                className="input"
                placeholder="info@svetlinki.com"
                value={settings.schoolEmail}
                onChange={(e) => setSettings({ ...settings, schoolEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Телефон</label>
              <input
                type="tel"
                className="input"
                placeholder="+359 888 123 456"
                value={settings.schoolPhone}
                onChange={(e) => setSettings({ ...settings, schoolPhone: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Адрес</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="гр. София, ул. Примерна №1"
                value={settings.schoolAddress}
                onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Регионални настройки</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Валута</label>
              <select
                className="input"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value as 'BGN' | 'EUR' })}
              >
                <option value="BGN">BGN (Български лев)</option>
                <option value="EUR">EUR (Евро)</option>
              </select>
            </div>

            <div>
              <label className="label">Часова зона</label>
              <select
                className="input"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value="Europe/Sofia">Europe/Sofia (GMT+2)</option>
                <option value="Europe/Athens">Europe/Athens (GMT+2)</option>
                <option value="Europe/Bucharest">Europe/Bucharest (GMT+2)</option>
              </select>
            </div>

            <div>
              <label className="label">Език</label>
              <select
                className="input"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value as 'bg' | 'en' })}
              >
                <option value="bg">Български</option>
                <option value="en">English</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                В момента системата поддържа само български език
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Нотификации</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email нотификации</p>
                <p className="text-sm text-gray-600">Получавайте имейли за важни събития</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">SMS нотификации</p>
                <p className="text-sm text-gray-600">Получавайте SMS за спешни случаи</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Забележка:</strong> Email и SMS интеграциите трябва да бъдат конфигурирани отделно в Admin Panel.
              </p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Външен вид</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Тема</label>
              <select
                className="input"
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
              >
                <option value="light">Светла</option>
                <option value="dark">Тъмна</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Тъмната тема все още не е имплементирана
              </p>
            </div>

            <div className="p-4 bg-primary-light border border-primary rounded-lg">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">Съвет</p>
                  <p className="text-sm text-gray-700">
                    Запазете настройките с бутона "Запази промените" в горния десен ъгъл.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based Feature Permissions */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Key className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Разрешения по роли</h2>
            <p className="text-sm text-gray-600">
              Управлявайте кои функции са достъпни за учители и родители
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teacher Permissions */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Учители</h3>
              <span className="text-xs text-gray-500 ml-auto">
                {Object.values(settings.featurePermissions?.teacher || {}).filter(Boolean).length} включени
              </span>
            </div>
            <div className="space-y-2">
              {(Object.keys(settings.featurePermissions?.teacher || {}) as FeatureName[]).map((feature) => {
                const isEnabled = settings.featurePermissions?.teacher[feature]
                return (
                  <div key={feature} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-sm text-gray-700">{featureLabels[feature]}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isEnabled}
                        onChange={() => toggleFeature('teacher', feature)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Parent Permissions */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Родители</h3>
              <span className="text-xs text-gray-500 ml-auto">
                {Object.values(settings.featurePermissions?.parent || {}).filter(Boolean).length} включени
              </span>
            </div>
            <div className="space-y-2">
              {(Object.keys(settings.featurePermissions?.parent || {}) as FeatureName[]).map((feature) => {
                const isEnabled = settings.featurePermissions?.parent[feature]
                return (
                  <div key={feature} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-sm text-gray-700">{featureLabels[feature]}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isEnabled}
                        onChange={() => toggleFeature('parent', feature)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Забележка:</strong> Администраторите винаги имат достъп до всички функции.
            Промените влизат в сила веднага след запазване и logout/login на потребителите.
          </p>
        </div>
      </div>

      {/* Labels Management */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Languages className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Управление на етикети</h2>
            <p className="text-sm text-gray-600">
              Персонализирайте текстовете в потребителския интерфейс
            </p>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Промяна на текстове в интерфейса</h3>
              <p className="text-sm text-gray-700 mb-3">
                Можете да промените всички текстове в системата - заглавия на страници, бутони, съобщения и навигация.
                Промените се виждат веднага за всички потребители.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Навигация (Dashboard, Ученици, Групи, и т.н.)</li>
                <li>• Заглавия и описания на страници</li>
                <li>• Бутони и форми</li>
                <li>• Съобщения и статуси</li>
              </ul>
              <Link
                to="/labels"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Отвори Editor
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hidden md:block text-6xl">
              🏷️
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Съвет:</strong> Използвайте тази функция за да адаптирате езика на системата към вашите нужди
            или да добавите термини специфични за вашата институция.
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-50 rounded-lg">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Сигурност и permissions</h3>
            <p className="text-sm text-gray-600 mb-3">
              Само администратори могат да променят системните настройки. Всички промени се записват в Audit Log.
            </p>
            <p className="text-xs text-gray-500">
              Последна промяна: {settings.updatedBy ? `от ${settings.updatedBy}` : 'никога'}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button (Mobile) */}
      <div className="block md:hidden">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full"
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
  )
}
