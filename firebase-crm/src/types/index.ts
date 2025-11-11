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
  studentCode: string // 🆕 Уникален код за свързване (6 символа: букви A-Z без O/I + цифри 2-9 без 0/1)
  name: string
  dateOfBirth?: Date | Timestamp // 🆕 Дата на раждане (за статистика, възраст, групиране)
  group: string // Група (напр. "Група 1", "Група 2")
  fee: number // Месечна такса в BGN
  feeEUR: number // Месечна такса в EUR
  dueDate: Date | Timestamp // Дата на падеж (кога се плаща месечната такса)
  status: 'active' | 'inactive' // Активен/Неактивен
  studyType: 'Групово' | 'Индивидуално' // Тип обучение
  parentIds: string[] // 🔄 Масив от ID-та на родители (може да има 2+ родители)
  notes?: string // Бележки
  createdBy: string // User ID на създателя (за ownership validation)
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
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

// Group interface - Classes/Courses management (Групи/Класове)
export interface Group {
  id: string
  name: string // Име на групата (напр. "Група по китара - напреднали")
  description?: string // Описание на групата
  teacherId?: string // ID на учителя
  teacherName?: string // Име на учителя (денормализирано)
  subject?: string // Предмет (напр. "Китара", "Абакус", "Рисуване")
  level?: 'Начинаещи' | 'Напреднали' | 'Експерти' | 'Смесено' // Ниво
  price: number // Месечна цена в BGN
  priceEUR?: number // Месечна цена в EUR
  capacity?: number // Максимален брой ученици
  currentStudents: number // Текущ брой ученици (денормализирано)

  // Schedule - График на занятията
  schedule?: {
    dayOfWeek: 'Понеделник' | 'Вторник' | 'Сряда' | 'Четвъртък' | 'Петък' | 'Събота' | 'Неделя'
    startTime: string // HH:MM формат (напр. "17:00")
    endTime: string // HH:MM формат (напр. "18:00")
    location?: string // Локация/зала
  }[]

  status: 'active' | 'inactive' | 'archived' // Статус на групата
  startDate?: Date | Timestamp // Дата на започване
  endDate?: Date | Timestamp // Дата на приключване (за сезонни групи)
  notes?: string // Бележки

  createdBy: string // User ID на създателя
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

// 🎯 Clean Code: Renamed from Payment to StudentPayment for clarity
// StudentPayment interface - Payments made by students/parents for courses
export interface StudentPayment {
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
  relatedStockTransactionId?: string // ID на складова транзакция (ако е продажба от склад)
  createdBy: string // User ID на този който го е добавил
  createdAt: Date | Timestamp
}

// @deprecated Use StudentPayment instead
export type Payment = StudentPayment

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

// 🎯 Clean Code: Renamed from Event to ClassEvent for clarity and to avoid conflicts with browser Event API
// ClassEvent interface - Scheduled classes, lessons, and school events
export interface ClassEvent {
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

// @deprecated Use ClassEvent instead (renamed to avoid conflict with browser Event API)
export type Event = ClassEvent

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

// Homework interface
export interface Homework {
  id: string
  studentId: string
  studentName: string
  title: string // Заглавие на домашното
  description: string // Описание какво трябва да се направи
  assignedDate: Date | Timestamp // Кога е дадено
  dueDate: Date | Timestamp // Краен срок
  status: 'assigned' | 'completed' | 'overdue' // Статус
  completedDate?: Date | Timestamp // Кога е завършено
  grade?: number // Оценка (опционално) 1-6 или 1-100
  teacherNotes?: string // Коментар от учител
  parentNotes?: string // Коментар от родител
  attachments?: string[] // URLs към файлове (ако има)
  createdBy: string // Teacher ID
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
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

// Payment Plan interface - За разсрочено плащане (вноски)
export interface PaymentPlan {
  id: string
  studentId: string
  studentName: string // Денормализирано
  totalAmount: number // Обща сума в BGN
  numberOfInstallments: number // Брой вноски
  frequency: 'weekly' | 'monthly' | 'custom' // Честота на вноските
  startDate: Date | Timestamp // Дата на първата вноска
  installments: Installment[] // Списък от вноски
  status: 'active' | 'completed' | 'cancelled' // Статус на плана
  description?: string // Описание (напр. "План за заплащане на такси")
  notes?: string // Бележки
  createdBy: string
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

// Installment interface - Вноска от payment plan
export interface Installment {
  installmentNumber: number // Номер на вноската (1, 2, 3...)
  dueDate: Date | Timestamp // Падеж на вноската
  amount: number // Сума в BGN
  status: 'pending' | 'paid' | 'overdue' // Статус на вноската
  paidDate?: Date | Timestamp // Кога е платена
  relatedPaymentId?: string // ID на свързано плащане
  notes?: string // Бележки
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
// Feature permissions - Control which features are accessible per role
export type FeatureName =
  | 'dashboard'
  | 'students'
  | 'groups'
  | 'homework'
  | 'parents'
  | 'payments'
  | 'expenses'
  | 'inventory'
  | 'attendance'
  | 'events'
  | 'discounts'
  | 'reports'
  | 'errors'
  | 'my-children'

export interface RoleFeaturePermissions {
  teacher: Record<FeatureName, boolean>
  parent: Record<FeatureName, boolean>
}

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
  featurePermissions?: RoleFeaturePermissions // Feature permissions per role
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
export type StudentFormValues = Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type ParentFormValues = Omit<Parent, 'id' | 'createdAt' | 'updatedAt' | 'studentIds'>
export type StudentPaymentFormValues = Omit<StudentPayment, 'id' | 'createdAt' | 'createdBy'>
export type ExpenseFormValues = Omit<Expense, 'id' | 'createdAt' | 'createdBy'>
export type ClassEventFormValues = Omit<ClassEvent, 'id' | 'createdAt' | 'createdBy'>
export type DiscountFormValues = Omit<Discount, 'id' | 'createdAt' | 'createdBy'>
export type HomeworkFormValues = Omit<Homework, 'id' | 'createdAt' | 'createdBy' | 'updatedAt'>
export type InventoryFormValues = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type StockTransactionFormValues = Omit<StockTransaction, 'id' | 'createdAt' | 'createdBy' | 'inventoryItemName'>
export type InvoiceFormValues = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type UserFormValues = Omit<UserProfile, 'id' | 'createdAt' | 'lastLogin'>

// @deprecated Use StudentPaymentFormValues instead
export type PaymentFormValues = StudentPaymentFormValues
// @deprecated Use ClassEventFormValues instead
export type EventFormValues = ClassEventFormValues
