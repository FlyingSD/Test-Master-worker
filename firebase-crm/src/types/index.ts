import { Timestamp } from 'firebase/firestore'

// User roles
export type UserRole = 'admin' | 'teacher' | 'parent'

// User interface
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  createdAt: Date | Timestamp
  lastLogin?: Date | Timestamp
}

// Student interface
export interface Student {
  id: string
  name: string
  group: string // Група (напр. "Група 1", "Група 2")
  fee: number // Месечна такса в BGN
  feeEUR: number // Месечна такса в EUR
  dueDate: Date | Timestamp // Дата на падеж (кога се плаща месечната такса)
  status: 'active' | 'inactive' // Активен/Неактивен
  studyType: 'Групово' | 'Индивидуално' // Тип обучение
  parentId: string // ID на родителя
  notes?: string // Бележки
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

// Parent interface
export interface Parent {
  id: string
  name: string
  email?: string
  phone: string
  address?: string
  city?: string
  studentIds: string[] // IDs на децата
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

// Payment interface
export interface Payment {
  id: string
  studentId: string
  studentName: string // Денормализирано за по-бързи queries
  amount: number // Сума в BGN
  amountEUR?: number // Сума в EUR (ако е платено в EUR)
  article: '' | 'Абакус' | 'Учебна тетрадка' | 'Други' // Артикул
  method: 'Кеш' | 'ПОС' | 'Банков път' | 'Фактура' // Метод на плащане
  date: Date | Timestamp // Дата на плащане
  notes?: string // Бележки
  receiptNumber?: string // Номер на фактура/документ
  createdBy: string // User ID на този който го е добавил
  createdAt: Date | Timestamp
}

// Expense interface
export interface Expense {
  id: string
  category: 'Наем' | 'Ток' | 'Вода' | 'Интернет' | 'Заплати' | 'Материали' | 'Реклама' | 'Други'
  amount: number // Сума в BGN
  description: string
  date: Date | Timestamp
  receiptNumber?: string
  createdBy: string
  createdAt: Date | Timestamp
}

// Event interface (за уроци и събития)
export interface Event {
  id: string
  title: string // Име на урока/събитието
  group?: string // Група (ако е урок)
  type: 'Урок' | 'Събитие' | 'Ваканция' | 'Друго'
  businessDescription?: string // НОВО: Бизнес описание (напр. "Expo 2026")
  startTime: Date | Timestamp
  endTime: Date | Timestamp
  location?: string
  teacherId?: string // ID на учителя
  studentIds?: string[] // IDs на учениците (ако е специален урок)
  notes?: string
  color?: string // Цвят в календара
  createdBy: string
  createdAt: Date | Timestamp
}

// Attendance interface
export interface Attendance {
  id: string
  studentId: string
  studentName: string
  eventId: string // ID на урока
  date: Date | Timestamp
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  createdBy: string
  createdAt: Date | Timestamp
}

// Discount interface
export interface Discount {
  id: string
  studentId: string
  studentName: string
  type: 'Процент' | 'Фиксирана сума'
  value: number // % или фиксирана стойност в BGN
  reason: string // Причина за отстъпката
  startDate: Date | Timestamp
  endDate: Date | Timestamp
  isActive: boolean
  createdBy: string
  createdAt: Date | Timestamp
}

// Report interface
export interface Report {
  id: string
  type: 'Месечен' | 'Годишен' | 'По ученик' | 'По група' | 'Финансов'
  title: string
  dateFrom: Date | Timestamp
  dateTo: Date | Timestamp
  data: any // JSON data за репорта
  fileUrl?: string // URL към генериран PDF/Excel file
  createdBy: string
  createdAt: Date | Timestamp
}

// Grade interface (оценки)
export interface Grade {
  id: string
  studentId: string
  studentName: string
  subject?: string // Предмет/тема
  grade: number | string // Оценка
  date: Date | Timestamp
  notes?: string
  createdBy: string
  createdAt: Date | Timestamp
}

// Dashboard Stats interface
export interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  profit: number
  activeStudents: number
  totalStudents: number
  overduePayments: number
  upcomingPayments: number
  todayClasses: number
}

// Activity Log interface (за история на промените)
export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: 'create' | 'update' | 'delete'
  entity: 'student' | 'payment' | 'expense' | 'event' | 'discount' | 'parent'
  entityId: string
  description: string
  timestamp: Date | Timestamp
}

// Form values for creating/editing
export type StudentFormValues = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
export type ParentFormValues = Omit<Parent, 'id' | 'createdAt' | 'updatedAt' | 'studentIds'>
export type PaymentFormValues = Omit<Payment, 'id' | 'createdAt' | 'createdBy' | 'studentName'>
export type ExpenseFormValues = Omit<Expense, 'id' | 'createdAt' | 'createdBy'>
export type EventFormValues = Omit<Event, 'id' | 'createdAt' | 'createdBy'>
export type DiscountFormValues = Omit<Discount, 'id' | 'createdAt' | 'createdBy' | 'studentName'>
