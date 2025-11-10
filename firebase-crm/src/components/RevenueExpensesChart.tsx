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

  const revenueData = months.map((month) => {
    const monthPayments = payments.filter((payment) => {
      const paymentDate =
        payment.date instanceof Date ? payment.date : payment.date.toDate()
      return paymentDate >= month.start && paymentDate <= month.end
    })
    return monthPayments.reduce((sum, payment) => sum + payment.amount, 0)
  })

  const expenseData = months.map((month) => {
    const monthExpenses = expenses.filter((expense) => {
      const expenseDate =
        expense.date instanceof Date ? expense.date : expense.date.toDate()
      return expenseDate >= month.start && expenseDate <= month.end
    })
    return monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  })

  const profitData = revenueData.map((revenue, index) => revenue - expenseData[index])

  const data = {
    labels: months.map((m) => m.label),
    datasets: [
      {
        label: 'Приходи',
        data: revenueData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Разходи',
        data: expenseData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Печалба',
        data: profitData,
        borderColor: 'rgb(109, 40, 217)',
        backgroundColor: 'rgba(109, 40, 217, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Приходи vs Разходи (последни 6 месеца)',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + ' лв.'
            }
            return label
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return value + ' лв.'
          },
        },
      },
    },
  }

  return (
    <div className="card p-6" style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  )
}
