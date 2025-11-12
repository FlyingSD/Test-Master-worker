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
  const expensesByCategory = expenses?.reduce((acc, expense) => {
    acc[expense?.category] = (acc[expense?.category] || 0) + expense?.amount
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
        backgroundColor: categories?.map((cat) => CATEGORY_COLORS[cat] || '#6B7280'),
        borderColor: categories?.map((cat) => CATEGORY_COLORS[cat] || '#6B7280'),
        borderWidth: 2,
      },
    ],
  }

  const total = amounts?.reduce((sum, val) => sum + val, 0)

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%', // Make it a donut chart
    plugins: {
      legend: {
        position: 'right' as const,
        onClick: (e: any, legendItem: any, legend: any) => {
          // Toggle dataset visibility
          const index = legendItem?.index
          const chart = legend?.chart
          const meta = chart?.getDatasetMeta(0)
          const segment = meta?.data[index]
          segment?.hidden = !segment?.hidden
          chart?.update()
        },
        onHover: (e: any) => {
          e?.native.target?.style.cursor = 'pointer'
        },
        onLeave: (e: any) => {
          e?.native.target?.style.cursor = 'default'
        },
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500' as any,
          },
          generateLabels: (chart: any) => {
            const data = chart?.data
            if (data?.labels.length && data?.datasets.length) {
              return data?.labels.map((label: string, i: number) => {
                const value = data?.datasets[0].data[i]
                const percentage = ((value / total) * 100).toFixed(1)
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data?.datasets[0].backgroundColor[i],
                  strokeStyle: data?.datasets[0].borderColor[i],
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                }
              })
            }
            return []
          },
        },
      },
      title: {
        display: true,
        text: 'Разходи по категория',
        font: {
          size: 18,
          weight: 'bold' as any,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: any) {
            const label = context?.label || ''
            const value = context?.parsed || 0
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${new Intl.NumberFormat('bg-BG', {
              style: 'currency',
              currency: 'BGN',
              minimumFractionDigits: 2,
            }).format(value)} (${percentage}%)`
          },
          footer: function () {
            return `Общо: ${new Intl.NumberFormat('bg-BG', {
              style: 'currency',
              currency: 'BGN',
              minimumFractionDigits: 2,
            }).format(total)}`
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true,
    },
  }

  if (categories?.length === 0) {
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
