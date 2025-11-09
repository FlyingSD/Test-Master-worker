import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  AlertCircle,
  CreditCard,
  Activity,
} from 'lucide-react'

export default function DashboardPage() {
  // TODO: Replace with real data from Firestore
  const stats = [
    {
      name: 'Общи приходи',
      value: '0 лв.',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Общи разходи',
      value: '0 лв.',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Печалба',
      value: '0 лв.',
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary-light',
    },
    {
      name: 'Активни ученици',
      value: '0',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Добре дошли в Светлинки CRM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card card-hover">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-light rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Днешни уроци</h2>
          </div>
          <div className="space-y-3">
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма уроци за днес</p>
            </div>
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Просрочени плащания
            </h2>
          </div>
          <div className="space-y-3">
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма просрочени плащания</p>
            </div>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Предстоящи плащания
            </h2>
          </div>
          <div className="space-y-3">
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма предстоящи плащания</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Последна активност
          </h2>
        </div>
        <div className="space-y-3">
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Няма активност за показване</p>
            <p className="text-sm mt-2">
              Започнете като добавите ученици, плащания или събития
            </p>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="card bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🚀 Първи стъпки
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="font-semibold">Добавете ученици</h3>
            </div>
            <p className="text-sm text-gray-600">
              Започнете със създаването на профили на вашите ученици
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="font-semibold">Въведете плащания</h3>
            </div>
            <p className="text-sm text-gray-600">
              Проследявайте месечните такси и плащания
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="font-semibold">Създайте събития</h3>
            </div>
            <p className="text-sm text-gray-600">
              Организирайте уроци и специални събития
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
