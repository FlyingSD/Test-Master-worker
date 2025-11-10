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

// Parent interface - Enhanced for full contact management
export interface Parent {
  id: string
  name: string
  email?: string
  phone: string
  phone2?: string // Втори телефон
  address?: string
  city?: string
  studentIds: string[] // IDs на децата
  relationship?: 'Майка' | 'Баща' | 'Настойник' | 'Друго' // Родство
  paymentMethod?: 'Кеш' | 'ПОС' | 'Банков път' | 'Фактура' // Предпочитан метод на плащане
  companyName?: string // Име на фирма (ако плаща фирма)
  companyVAT?: string // ЕИК/БУЛСТАТ на фирма
  companyAddress?: string // Адрес на фирма за фактури
  notes?: string // Бележки
  videoUrls?: string[] // URLs към качени видео клипове от Firebase Storage
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

// Inventory Item interface - За складова база
export interface InventoryItem {
  id: string
  sku: string // Складов код (напр. "ABA-001")
  name: string // Име на артикула (напр. "Абакус 13 реда")
  category: 'Абакуси' | 'Учебници' | 'Тетрадки' | 'Материали' | 'Други'
  description?: string
  purchasePrice: number // Входна цена в BGN
  salePrice: number // Продажна цена в BGN
  currentStock: number // Текущо количество на склад
  minimumStock: number // Минимално количество (за автоматични известия)
  location?: string // Локация в склада (напр. "Рафт А-3")
  supplier?: string // Доставчик
  lastRestockDate?: Date | Timestamp // Последно зареждане
  imageUrl?: string // Снимка на артикула
  isActive: boolean // Активен/Неактивен
  createdBy: string
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

// Stock Transaction interface - За движения на склада
export interface StockTransaction {
  id: string
  inventoryItemId: string
  inventoryItemName: string // Денормализирано
  type: 'IN' | 'OUT' // Вход/Изход
  quantity: number
  pricePerUnit: number // Цена за единица
  totalPrice: number // Обща стойност
  reason: 'Покупка от доставчик' | 'Продажба на ученик' | 'Брак' | 'Инвентаризация' | 'Друго'
  relatedStudentId?: string // ID на ученик (ако е продажба)
  relatedPaymentId?: string // ID на плащане (ако е продажба)
  relatedExpenseId?: string // ID на разход (ако е покупка)
  notes?: string
  createdBy: string
  createdAt: Date | Timestamp
}

// Invoice interface - За фактури и касови бележки (НАП-съвместими)
export interface Invoice {
  id: string
  invoiceNumber: string // Уникален номер (напр. "0000001")
  type: 'Фактура' | 'Касова бележка' | 'Разписка' // Тип документ
  status: 'Чернова' | 'Издадена' | 'Анулирана'

  // Client info
  clientType: 'Физическо лице' | 'Фирма'
  clientName: string
  clientAddress?: string
  clientVAT?: string // ЕИК/БУЛСТАТ за фирми
  clientPhone?: string
  clientEmail?: string

  // Related entities
  parentId?: string // ID на родител
  studentIds?: string[] // IDs на ученици
  relatedPaymentIds?: string[] // IDs на свързани плащания

  // Invoice items
  items: InvoiceItem[]

  // Amounts
  subtotal: number // Сума без ДДС
  vatRate: number // % ДДС (обикновено 20% в България)
  vatAmount: number // Сума на ДДС
  total: number // Обща сума с ДДС

  // Payment info
  paymentMethod: 'Кеш' | 'ПОС' | 'Банков път'
  isPaid: boolean
  paidAt?: Date | Timestamp

  // Document info
  issueDate: Date | Timestamp // Дата на издаване
  dueDate?: Date | Timestamp // Падеж (за фактури)
  notes?: string
  qrCode?: string // QR код за НАП проверка
  pdfUrl?: string // URL към генериран PDF

  createdBy: string
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

// Invoice Item interface - Ред от фактура
export interface InvoiceItem {
  description: string // Описание на услугата/стоката
  quantity: number
  unitPrice: number // Единична цена
  total: number // Обща стойност (quantity * unitPrice)
  inventoryItemId?: string // ID на артикул от склада (опционално)
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
  entity: 'student' | 'payment' | 'expense' | 'event' | 'discount' | 'parent' | 'inventory' | 'invoice'
  entityId: string
  description: string
  timestamp: Date | Timestamp
}

// Permission types
export type Permission =
  | 'view_dashboard'
  | 'view_students'
  | 'create_students'
  | 'edit_students'
  | 'delete_students'
  | 'view_payments'
  | 'create_payments'
  | 'edit_payments'
  | 'delete_payments'
  | 'view_expenses'
  | 'create_expenses'
  | 'edit_expenses'
  | 'delete_expenses'
  | 'view_events'
  | 'create_events'
  | 'edit_events'
  | 'delete_events'
  | 'view_discounts'
  | 'create_discounts'
  | 'edit_discounts'
  | 'delete_discounts'
  | 'view_parents'
  | 'create_parents'
  | 'edit_parents'
  | 'delete_parents'
  | 'view_inventory'
  | 'create_inventory'
  | 'edit_inventory'
  | 'delete_inventory'
  | 'view_invoices'
  | 'create_invoices'
  | 'edit_invoices'
  | 'delete_invoices'
  | 'view_reports'
  | 'export_data'
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'view_settings'
  | 'edit_settings'
  | 'view_audit_log'
  | 'access_admin_panel'

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_students',
    'create_students',
    'edit_students',
    'delete_students',
    'view_payments',
    'create_payments',
    'edit_payments',
    'delete_payments',
    'view_expenses',
    'create_expenses',
    'edit_expenses',
    'delete_expenses',
    'view_events',
    'create_events',
    'edit_events',
    'delete_events',
    'view_discounts',
    'create_discounts',
    'edit_discounts',
    'delete_discounts',
    'view_parents',
    'create_parents',
    'edit_parents',
    'delete_parents',
    'view_inventory',
    'create_inventory',
    'edit_inventory',
    'delete_inventory',
    'view_invoices',
    'create_invoices',
    'edit_invoices',
    'delete_invoices',
    'view_reports',
    'export_data',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'view_settings',
    'edit_settings',
    'view_audit_log',
    'access_admin_panel',
  ],
  teacher: [
    'view_dashboard',
    'view_students',
    'edit_students', // Може да редактира САМО своите групи
    'view_payments',
    'create_payments',
    'view_events',
    'create_events',
    'edit_events',
    'view_discounts', // Read-only
    'view_parents', // Read-only за своите групи
  ],
  parent: [
    'view_dashboard', // Персонален dashboard
    'view_students', // САМО своите деца
    'view_payments', // САМО за своите деца
    'view_events', // Read-only
  ],
}

// System Settings interface
export interface SystemSettings {
  id: string
  schoolName: string
  schoolEmail: string
  schoolPhone: string
  schoolAddress: string
  currency: 'BGN' | 'EUR'
  timezone: string
  language: 'bg' | 'en'
  emailNotifications: boolean
  smsNotifications: boolean
  theme: 'light' | 'dark'
  updatedBy: string
  updatedAt: Date | Timestamp
}

// User with extended info (for admin panel)
export interface UserProfile extends User {
  isActive: boolean
  assignedGroups?: string[] // За учители - кои групи преподават
  studentIds?: string[] // За родители - кои са децата им
}

// Form values for creating/editing
export type StudentFormValues = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
export type ParentFormValues = Omit<Parent, 'id' | 'createdAt' | 'updatedAt' | 'studentIds'>
export type PaymentFormValues = Omit<Payment, 'id' | 'createdAt' | 'createdBy' | 'studentName'>
export type ExpenseFormValues = Omit<Expense, 'id' | 'createdAt' | 'createdBy'>
export type EventFormValues = Omit<Event, 'id' | 'createdAt' | 'createdBy'>
export type DiscountFormValues = Omit<Discount, 'id' | 'createdAt' | 'createdBy' | 'studentName'>
export type InventoryFormValues = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type StockTransactionFormValues = Omit<StockTransaction, 'id' | 'createdAt' | 'createdBy' | 'inventoryItemName'>
export type InvoiceFormValues = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type UserFormValues = Omit<UserProfile, 'id' | 'createdAt' | 'lastLogin'>
