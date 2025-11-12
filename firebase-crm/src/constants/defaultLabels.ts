/**
 * 🎯 SSOT (Single Source of Truth) - Default UI Labels
 *
 * Default labels for the entire application.
 * These are used as fallback when database settings don't exist yet.
 * Admins can override these via Settings > Labels Management.
 *
 * Benefits:
 * - Centralized label management
 * - Easy customization without code changes
 * - Future i18n/multi-language support
 * - Type-safe with autocomplete
 */

export const DEFAULT_LABELS = {
  // ============================================================================
  // NAVIGATION LABELS
  // ============================================================================
  navigation: {
    dashboard: 'Dashboard',
    students: 'Ученици',
    groups: 'Групи',
    homework: 'Домашни',
    parents: 'Родители',
    payments: 'Плащания',
    expenses: 'Разходи',
    inventory: 'Склад',
    attendance: 'Присъствия',
    events: 'Събития',
    discounts: 'Отстъпки',
    reports: 'Репорти',
    settings: 'Настройки',
    errors: '⚠️ Грешки',
    adminPanel: '👑 Admin Panel',
    myChildren: 'Моите деца',
  },

  // ============================================================================
  // PAGE TITLES & SUBTITLES
  // ============================================================================
  pages: {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Преглед на системата',
    },
    students: {
      title: 'Ученици',
      subtitle: 'Управление на ученици и техните профили',
    },
    groups: {
      title: 'Групи',
      subtitle: 'Управление на групи, класове и курсове',
    },
    homework: {
      title: 'Домашни',
      subtitle: 'Управление на домашни работи',
    },
    parents: {
      title: 'Родители',
      subtitle: 'Управление на родители и контакти',
    },
    payments: {
      title: 'Плащания',
      subtitle: 'Управление на плащания и фактури',
    },
    expenses: {
      title: 'Разходи',
      subtitle: 'Управление на разходи и фактури',
    },
    inventory: {
      title: 'Склад',
      subtitle: 'Управление на складови наличности',
    },
    attendance: {
      title: 'Присъствия',
      subtitle: 'Управление на присъствия и отсъствия',
    },
    events: {
      title: 'Събития',
      subtitle: 'Управление на календар и събития',
    },
    discounts: {
      title: 'Отстъпки',
      subtitle: 'Управление на отстъпки и промоции',
    },
    reports: {
      title: 'Репорти',
      subtitle: 'Финансови и аналитични репорти',
    },
    settings: {
      title: 'Настройки',
      subtitle: 'Системни настройки и конфигурация',
    },
    errors: {
      title: 'Грешки',
      subtitle: 'Мониторинг на системни грешки',
    },
    adminPanel: {
      title: 'Admin Panel',
      subtitle: 'Административни функции',
    },
    myChildren: {
      title: 'Моите деца',
      subtitle: 'Преглед на информация за всички деца',
    },
  },

  // ============================================================================
  // COMMON LABELS
  // ============================================================================
  common: {
    save: 'Запази',
    cancel: 'Отказ',
    delete: 'Изтрий',
    edit: 'Редактирай',
    add: 'Добави',
    search: 'Търсене',
    filter: 'Филтър',
    export: 'Експорт',
    import: 'Импорт',
    loading: 'Зареждане...',
    noResults: 'Няма резултати',
    confirm: 'Потвърди',
    back: 'Назад',
    next: 'Напред',
    previous: 'Предишна',
    close: 'Затвори',
    open: 'Отвори',
    select: 'Избери',
    selectAll: 'Избери всички',
    clear: 'Изчисти',
    reset: 'Нулирай',
    apply: 'Приложи',
    download: 'Изтегли',
    upload: 'Качи',
    view: 'Виж',
    viewDetails: 'Виж детайли',
    actions: 'Действия',
    status: 'Статус',
    date: 'Дата',
    time: 'Час',
    name: 'Име',
    email: 'Имейл',
    phone: 'Телефон',
    address: 'Адрес',
    notes: 'Бележки',
    description: 'Описание',
    total: 'Общо',
    subtotal: 'Междинна сума',
    amount: 'Сума',
    price: 'Цена',
    quantity: 'Количество',
    yes: 'Да',
    no: 'Не',
    active: 'Активен',
    inactive: 'Неактивен',
    all: 'Всички',
    none: 'Няма',
    other: 'Друго',
  },

  // ============================================================================
  // BUTTON LABELS
  // ============================================================================
  buttons: {
    addStudent: 'Добави ученик',
    addGroup: 'Добави група',
    addHomework: 'Добави домашна',
    addParent: 'Добави родител',
    addPayment: 'Добави плащане',
    addExpense: 'Добави разход',
    addEvent: 'Добави събитие',
    addDiscount: 'Добави отстъпка',
    editStudent: 'Редактиране на ученик',
    editGroup: 'Редактиране на група',
    editHomework: 'Редактиране на домашна',
    editParent: 'Редактиране на родител',
    editPayment: 'Редактиране на плащане',
    editExpense: 'Редактиране на разход',
    editEvent: 'Редактиране на събитие',
    editDiscount: 'Редактиране на отстъпка',
    deleteStudent: 'Изтрий ученик',
    deleteGroup: 'Изтрий група',
    deleteHomework: 'Изтрий домашна',
    deleteParent: 'Изтрий родител',
    deletePayment: 'Изтрий плащане',
    deleteExpense: 'Изтрий разход',
    deleteEvent: 'Изтрий събитие',
    deleteDiscount: 'Изтрий отстъпка',
    exportExcel: 'Експорт Excel',
    importCSV: 'CSV Import',
    generateReport: 'Генерирай репорт',
    signOut: 'Изход',
    signIn: 'Вход',
  },

  // ============================================================================
  // FORM LABELS
  // ============================================================================
  forms: {
    required: 'Задължително поле',
    optional: 'Незадължително',
    placeholder: {
      search: 'Търсене...',
      email: 'example@email?.com',
      phone: '+359...',
      name: 'Име и фамилия',
      notes: 'Допълнителна информация...',
      amount: '0?.00',
      date: 'Изберете дата',
      time: 'Изберете час',
      select: 'Изберете опция',
    },
    validation: {
      emailInvalid: 'Невалиден имейл адрес',
      phoneInvalid: 'Невалиден телефонен номер',
      requiredField: 'Това поле е задължително',
      minLength: 'Минимална дължина: {min} символа',
      maxLength: 'Максимална дължина: {max} символа',
      minValue: 'Минимална стойност: {min}',
      maxValue: 'Максимална стойност: {max}',
      passwordTooShort: 'Паролата трябва да е поне 6 символа',
    },
  },

  // ============================================================================
  // STATUS LABELS
  // ============================================================================
  status: {
    active: 'Активен',
    inactive: 'Неактивен',
    archived: 'Архивиран',
    pending: 'Чакащ',
    completed: 'Завършен',
    cancelled: 'Отменен',
    draft: 'Чернова',
    published: 'Публикуван',
    approved: 'Одобрен',
    rejected: 'Отхвърлен',
    paid: 'Платен',
    unpaid: 'Неплатен',
    overdue: 'Просрочен',
    present: 'Присъства',
    absent: 'Отсъства',
    late: 'Закъснял',
    excused: 'Извинено',
  },

  // ============================================================================
  // MESSAGE LABELS
  // ============================================================================
  messages: {
    success: {
      saved: 'Промените са запазени успешно',
      deleted: 'Записът е изтрит успешно',
      added: 'Записът е добавен успешно',
      updated: 'Записът е актуализиран успешно',
      imported: 'Данните са импортирани успешно',
      exported: 'Данните са експортирани успешно',
    },
    error: {
      generic: 'Възникна грешка. Моля, опитайте отново.',
      notFound: 'Записът не е намерен',
      unauthorized: 'Нямате права за това действие',
      networkError: 'Грешка в мрежата. Проверете връзката си.',
      validationError: 'Моля, проверете попълнените данни',
    },
    confirm: {
      delete: 'Сигурни ли сте, че искате да изтриете този запис?',
      cancel: 'Сигурни ли сте, че искате да отмените?',
      leave: 'Имате незапазени промени. Сигурни ли сте, че искате да напуснете?',
    },
    info: {
      noData: 'Няма данни за показване',
      loading: 'Зареждане на данни...',
      selectItem: 'Изберете елемент',
      comingSoon: 'Скоро...',
    },
  },

  // ============================================================================
  // TABLE COLUMN LABELS
  // ============================================================================
  tableColumns: {
    name: 'Име',
    email: 'Имейл',
    phone: 'Телефон',
    group: 'Група',
    status: 'Статус',
    date: 'Дата',
    amount: 'Сума',
    actions: 'Действия',
    teacher: 'Учител',
    subject: 'Предмет',
    schedule: 'График',
    capacity: 'Капацитет',
    students: 'Ученици',
    price: 'Цена',
    payment: 'Плащане',
    method: 'Метод',
    type: 'Тип',
    category: 'Категория',
    description: 'Описание',
    notes: 'Бележки',
    createdAt: 'Създаден на',
    updatedAt: 'Обновен на',
  },
} as const

// Type for the entire labels object
export type Labels = typeof DEFAULT_LABELS

// Type for each section
export type NavigationLabels = typeof DEFAULT_LABELS.navigation
export type PageLabels = typeof DEFAULT_LABELS.pages
export type CommonLabels = typeof DEFAULT_LABELS.common
export type ButtonLabels = typeof DEFAULT_LABELS.buttons
export type FormLabels = typeof DEFAULT_LABELS.forms
export type StatusLabels = typeof DEFAULT_LABELS.status
export type MessageLabels = typeof DEFAULT_LABELS.messages
export type TableColumnLabels = typeof DEFAULT_LABELS.tableColumns
