import { useState } from 'react'
import {
  Shield,
  Users,
  Settings,
  FileText,
  Download,
  Activity,
  Database,
  Bell,
  Lock,
  BarChart3,
  UserPlus,
  Search,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/permissions'
import { Navigate } from 'react-router-dom'

export default function AdminPanelPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'audit' | 'export'>('users')

  // Protect admin panel - only admins can access
  if (!user || !isAdmin(user.role)) {
    return <Navigate to="/" replace />
  }

  const tabs = [
    { id: 'users' as const, name: 'Потребители', icon: Users },
    { id: 'settings' as const, name: 'Настройки', icon: Settings },
    { id: 'audit' as const, name: 'Audit Log', icon: Activity },
    { id: 'export' as const, name: 'Експорт данни', icon: Download },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Пълен контрол върху системата</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="stat-card flex-row gap-3 min-w-[140px]">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">База данни</div>
              <div className="text-xl font-bold">Активна</div>
            </div>
          </div>
          <div className="stat-card flex-row gap-3 min-w-[140px]">
            <Lock className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Сигурност</div>
              <div className="text-xl font-bold text-green-600">OK</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition-all
                ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'audit' && <AuditLogTab />}
        {activeTab === 'export' && <ExportTab />}
      </div>
    </div>
  )
}

// ============================================
// USERS TAB - User Management
// ============================================
function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // TODO: Replace with actual hook
  const users = [
    { id: '1', name: 'Кристиан Тимневски', email: 'kristian@svetlinki.bg', role: 'admin' as const, isActive: true },
    { id: '2', name: 'Мария Петрова', email: 'maria@svetlinki.bg', role: 'teacher' as const, isActive: true },
    { id: '3', name: 'Иван Георгиев', email: 'ivan@email.com', role: 'parent' as const, isActive: true },
  ]

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Търси потребител..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <UserPlus className="w-5 h-5" />
          Добави потребител
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Име</th>
              <th>Email</th>
              <th>Роля</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span
                    className={`badge ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'teacher'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.role === 'admin' ? '👑 Admin' : user.role === 'teacher' ? '👨‍🏫 Учител' : '👨‍👩‍👧 Родител'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {user.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost text-sm">Редактирай</button>
                    <button className="btn btn-ghost text-sm text-red-600">Деактивирай</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600">Общо потребители</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Администратори</div>
          <div className="text-2xl font-bold text-red-600">{users.filter((u) => u.role === 'admin').length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Учители</div>
          <div className="text-2xl font-bold text-blue-600">{users.filter((u) => u.role === 'teacher').length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Родители</div>
          <div className="text-2xl font-bold text-green-600">{users.filter((u) => u.role === 'parent').length}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SETTINGS TAB - System Settings
// ============================================
function SettingsTab() {
  const [settings, setSettings] = useState({
    schoolName: 'Светлинки',
    schoolEmail: 'info@svetlinki.bg',
    schoolPhone: '+359 888 123 456',
    schoolAddress: 'гр. София, ул. Примерна 123',
    currency: 'BGN',
    timezone: 'Europe/Sofia',
    language: 'bg',
    emailNotifications: true,
    smsNotifications: false,
  })

  const handleSave = () => {
    // TODO: Implement save
    alert('Настройките са запазени!')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Основна информация</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Име на центъра</label>
            <input
              type="text"
              value={settings.schoolName}
              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={settings.schoolEmail}
              onChange={(e) => setSettings({ ...settings, schoolEmail: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Телефон</label>
            <input
              type="tel"
              value={settings.schoolPhone}
              onChange={(e) => setSettings({ ...settings, schoolPhone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Адрес</label>
            <input
              type="text"
              value={settings.schoolAddress}
              onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Регионални настройки</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Валута</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="input"
            >
              <option value="BGN">BGN (лв)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="label">Език</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="input"
            >
              <option value="bg">Български</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Известия</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              className="w-5 h-5 text-primary rounded"
            />
            <div>
              <div className="font-medium">Email известия</div>
              <div className="text-sm text-gray-600">Получавай email при важни събития</div>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
              className="w-5 h-5 text-primary rounded"
            />
            <div>
              <div className="font-medium">SMS известия</div>
              <div className="text-sm text-gray-600">Получавай SMS при важни събития</div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn btn-primary">
          <Settings className="w-5 h-5" />
          Запази настройките
        </button>
      </div>
    </div>
  )
}

// ============================================
// AUDIT LOG TAB
// ============================================
function AuditLogTab() {
  // TODO: Replace with actual data
  const logs = [
    {
      id: '1',
      user: 'Кристиан Тимневски',
      action: 'Създаде ученик',
      entity: 'Георги Иванов',
      timestamp: new Date(),
    },
    {
      id: '2',
      user: 'Мария Петрова',
      action: 'Добави плащане',
      entity: '80 лв - Георги Иванов',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      user: 'Кристиан Тимневски',
      action: 'Редактира отстъпка',
      entity: 'Мария Петкова - 10%',
      timestamp: new Date(Date.now() - 7200000),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-0 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold">История на промените</h3>
          <p className="text-sm text-gray-600">Пълен запис на всички действия в системата</p>
        </div>

        <div className="divide-y">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-semibold">
                    {log.user[0]}
                  </div>
                  <div>
                    <div className="font-medium">{log.user}</div>
                    <div className="text-sm text-gray-600">
                      {log.action} <span className="font-medium">{log.entity}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {log.timestamp.toLocaleString('bg-BG', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// EXPORT TAB - Data Export
// ============================================
function ExportTab() {
  const exportOptions = [
    {
      title: 'Ученици',
      description: 'Експортирай всички ученици в Excel',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Плащания',
      description: 'Експортирай всички плащания в Excel',
      icon: BarChart3,
      color: 'green',
    },
    {
      title: 'Финансов отчет',
      description: 'Пълен финансов отчет (PDF)',
      icon: FileText,
      color: 'purple',
    },
    {
      title: 'Пълен backup',
      description: 'Всички данни в JSON формат',
      icon: Database,
      color: 'red',
    },
  ]

  const handleExport = (type: string) => {
    alert(`Експортиране на ${type}... (TODO: Implement)`)
  }

  return (
    <div className="space-y-6">
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900">Експорт на данни</h4>
            <p className="text-sm text-blue-700">
              Изтеглете всички данни от системата в различни формати. Експортираните файлове съдържат актуални данни към момента на
              изтегляне.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {exportOptions.map((option) => (
          <div key={option.title} className="card hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleExport(option.title)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 bg-${option.color}-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <option.icon className={`w-6 h-6 text-${option.color}-600`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{option.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
