import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { usePayments } from '@/hooks/usePayments'
import { useExpenses } from '@/hooks/useExpenses'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function RevenueExpensesChart() {
  const { payments } = usePayments()
  const { expenses } = useExpenses()

  // Get last 6 months data
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    return {
      label: format(date, 'MMM yyyy'),
      start: startOfMonth(date),
      end: endOfMonth(date),
    }
  })

  const revenueData = months?.map((month) => {
    const monthPayments = payments?.filter((payment) => {
      const paymentDate =
        payment?.date instanceof Date ? payment?.date : payment?.date.toDate()
      return paymentDate >= month?.start && paymentDate <= month?.end
    })
    return monthPayments?.reduce((sum, payment) => sum + payment?.amount, 0)
  })

  const expenseData = months?.map((month) => {
    const monthExpenses = expenses?.filter((expense) => {
      const expenseDate =
        expense?.date instanceof Date ? expense?.date : expense?.date.toDate()
      return expenseDate >= month?.start && expenseDate <= month?.end
    })
    return monthExpenses?.reduce((sum, expense) => sum + expense?.amount, 0)
  })

  const profitData = revenueData?.map((revenue, index) => revenue - expenseData[index])

  const data = {
    labels: months?.map((m) => m?.label),
    datasets: [
      {
        label: 'Приходи',
        data: revenueData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0?.4,
      },
      {
        label: 'Разходи',
        data: expenseData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0?.4,
      },
      {
        label: 'Печалба',
        data: profitData,
        borderColor: 'rgb(109, 40, 217)',
        backgroundColor: 'rgba(109, 40, 217, 0.1)',
        fill: true,
        tension: 0?.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        onClick: (e: any, legendItem: any, legend: any) => {
          // Default click behavior (toggle dataset visibility)
          const index = legendItem?.datasetIndex
          const chart = legend?.chart
          const meta = chart?.getDatasetMeta(index)
          meta?.hidden = !meta?.hidden
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
        },
      },
      title: {
        display: true,
        text: 'Приходи vs Разходи (последни 6 месеца)',
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
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            let label = context?.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context?.parsed.y !== null) {
              label += new Intl.NumberFormat('bg-BG', {
                style: 'currency',
                currency: 'BGN',
                minimumFractionDigits: 2,
              }).format(context?.parsed.y)
            }
            return label
          },
          footer: function (tooltipItems: any[]) {
            const revenueIndex = 0
            const expenseIndex = 1
            const revenue = tooltipItems?.find(item => item?.datasetIndex === revenueIndex)?.parsed?.y || 0
            const expense = tooltipItems?.find(item => item?.datasetIndex === expenseIndex)?.parsed?.y || 0
            const profit = revenue - expense
            return `Нетна печалба: ${new Intl.NumberFormat('bg-BG', {
              style: 'currency',
              currency: 'BGN',
              minimumFractionDigits: 2,
            }).format(profit)}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return new Intl.NumberFormat('bg-BG', {
              style: 'currency',
              currency: 'BGN',
              minimumFractionDigits: 0,
            }).format(value)
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
    hover: {
      mode: 'index' as const,
      intersect: false,
    },
  }

  return (
    <div className="card p-6" style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  )
}
