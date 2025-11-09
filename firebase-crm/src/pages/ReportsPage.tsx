import { useState } from 'react'
import { FileText, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react'
import { usePayments } from '@/hooks/usePayments'
import { useExpenses } from '@/hooks/useExpenses'
import { formatCurrency } from '@/utils/formatters'

export default function ReportsPage() {
  const { payments } = usePayments()
  const { expenses } = useExpenses()

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Calculate monthly data
  const monthlyData = []
  const monthNames = [
    'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
    'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
  ]

  for (let month = 0; month < 12; month++) {
    // Filter payments for this month
    const monthPayments = payments.filter(p => {
      const date = p.date instanceof Date ? p.date : p.date.toDate()
      return date.getFullYear() === selectedYear && date.getMonth() === month
    })

    // Filter expenses for this month
    const monthExpenses = expenses.filter(e => {
      const date = e.date instanceof Date ? e.date : e.date.toDate()
      return date.getFullYear() === selectedYear && date.getMonth() === month
    })

    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0)
    const expense = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const profit = revenue - expense

    monthlyData.push({
      month: monthNames[month],
      monthIndex: month,
      revenue,
      expense,
      profit,
      paymentsCount: monthPayments.length,
      expensesCount: monthExpenses.length,
    })
  }

  // Calculate yearly totals
  const yearlyRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0)
  const yearlyExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0)
  const yearlyProfit = yearlyRevenue - yearlyExpense

  // Available years
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Репорти</h1>
          <p className="text-gray-600 mt-1">Финансови отчети и анализи</p>
        </div>
        <div className="flex gap-3">
          <select
            className="input"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year} година</option>
            ))}
          </select>
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Годишни приходи</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(yearlyRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Годишни разходи</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(yearlyExpense)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${yearlyProfit >= 0 ? 'bg-primary-light' : 'bg-red-50'}`}>
              <TrendingUp className={`w-6 h-6 ${yearlyProfit >= 0 ? 'text-primary' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Годишна печалба</p>
              <p className={`text-2xl font-bold ${yearlyProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                {formatCurrency(yearlyProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="p-2 bg-primary-light rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Месечен отчет за {selectedYear} г.
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Месец</th>
                <th>Приходи</th>
                <th>Брой плащания</th>
                <th>Разходи</th>
                <th>Брой разходи</th>
                <th>Печалба</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((data) => (
                <tr key={data.monthIndex}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{data.month}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data.revenue)}
                    </span>
                  </td>
                  <td>
                    <span className="text-gray-600">{data.paymentsCount}</span>
                  </td>
                  <td>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data.expense)}
                    </span>
                  </td>
                  <td>
                    <span className="text-gray-600">{data.expensesCount}</span>
                  </td>
                  <td>
                    <span className={`font-bold ${data.profit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                      {formatCurrency(data.profit)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td>ОБЩО</td>
                <td className="text-green-600">{formatCurrency(yearlyRevenue)}</td>
                <td>{payments.filter(p => {
                  const date = p.date instanceof Date ? p.date : p.date.toDate()
                  return date.getFullYear() === selectedYear
                }).length}</td>
                <td className="text-red-600">{formatCurrency(yearlyExpense)}</td>
                <td>{expenses.filter(e => {
                  const date = e.date instanceof Date ? e.date : e.date.toDate()
                  return date.getFullYear() === selectedYear
                }).length}</td>
                <td className={yearlyProfit >= 0 ? 'text-primary' : 'text-red-600'}>
                  {formatCurrency(yearlyProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Среден месечен приход</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(yearlyRevenue / 12)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Среден месечен разход</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(yearlyExpense / 12)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Най-печеливш месец</p>
          <p className="text-xl font-bold text-primary">
            {monthlyData.reduce((max, m) => m.profit > max.profit ? m : max, monthlyData[0]).month}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Profit margin</p>
          <p className="text-xl font-bold text-gray-900">
            {yearlyRevenue > 0 ? ((yearlyProfit / yearlyRevenue) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </div>

      {/* Info Note */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Как да използваш репортите
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Избери година от dropdown менюто</li>
              <li>• Виж месечното разпределение на приходи и разходи</li>
              <li>• Проследи тенденциите и планирай бюджета</li>
              <li>• Експортирай данните (скоро)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
