import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useExpenses } from '@/hooks/useExpenses'

ChartJS.register(ArcElement, Tooltip, Legend)

const CATEGORY_COLORS: Record<string, string> = {
  'Наем': '#EF4444',
  'Ток': '#F59E0B',
  'Вода': '#3B82F6',
  'Интернет': '#8B5CF6',
  'Заплати': '#10B981',
  'Материали': '#EC4899',
  'Реклама': '#F97316',
  'Други': '#6B7280',
}

export default function ExpensesByCategoryChart() {
  const { expenses } = useExpenses()

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const categories = Object.keys(expensesByCategory)
  const amounts = Object.values(expensesByCategory)

  const data = {
    labels: categories,
    datasets: [
      {
        label: 'Разходи по категория',
        data: amounts,
        backgroundColor: categories.map((cat) => CATEGORY_COLORS[cat] || '#6B7280'),
        borderColor: categories.map((cat) => CATEGORY_COLORS[cat] || '#6B7280'),
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Разходи по категория',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = amounts.reduce((sum, val) => sum + val, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value.toFixed(2)} лв. (${percentage}%)`
          },
        },
      },
    },
  }

  if (categories.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center" style={{ height: '400px' }}>
        <p className="text-gray-500">Няма данни за разходи</p>
      </div>
    )
  }

  return (
    <div className="card p-6" style={{ height: '400px' }}>
      <Doughnut data={data} options={options} />
    </div>
  )
}
