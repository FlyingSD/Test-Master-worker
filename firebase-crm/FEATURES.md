# 📋 Svetlinki CRM - Пълен списък на функционалностите

## 🎯 Преглед

Svetlinki CRM е comprehensive система за управление на образователен център с 20+ основни features и 50+ под-функционалности.

**Последна актуализация:** 10 ноември 2024
**Версия:** 2.0 (с Error Handling & Advanced Validation)

---

## 📊 **Dashboard (Начална страница)**

**Route:** `/`

### Функции:
- **Real-time статистики:**
  - Общи приходи (BGN + EUR)
  - Месечни разходи
  - Активни ученици
  - Просрочени плащания

- **Интерактивни графики:**
  - Line Chart: Приходи vs Разходи (последните 6 месеца)
  - Doughnut Chart: Разходи по категория

- **Бързи действия:**
  - Добави ученик
  - Добави плащане
  - Експорт на данни

**Технологии:** Chart.js, React Query, Real-time Firestore listeners

---

## 👥 **Управление на Ученици**

**Route:** `/students`

### CRUD Операции:
- ✅ Създаване на ученик
- ✅ Редактиране на данни
- ✅ Изтриване на ученик
- ✅ Преглед на детайли

### Функционалности:
- **Bulk CSV Import** - Масово добавяне от CSV файл
  - Drag & drop интерфейс
  - Template download
  - Validation с error reporting
  - Preview преди import

- **Групиране:**
  - Група 1, Група 2, Група 3, и т.н.
  - Филтриране по група

- **Тип обучение:**
  - Абакус
  - Ментална аритметика
  - Скоростно четене

- **Такси:**
  - Месечна такса в BGN
  - Автоматичен конвертор BGN ↔ EUR (курс 1.96)
  - Дата на падеж

- **Статус:**
  - Активен / Неактивен
  - Филтриране по статус

- **Експорт:**
  - Excel export с auto-sized колони
  - Включва всички филтрирани данни

- **Pagination:**
  - 20 ученика на страница
  - Desktop: Пълна навигация с номера
  - Mobile: Prev/Next бутони

**Технологии:** Papa Parse (CSV), XLSX, React Query mutations

---

## 👨‍👩‍👧 **Управление на Родители**

**Route:** `/parents`

### CRUD Операции:
- ✅ Добавяне на родител
- ✅ Редактиране на профил
- ✅ Изтриване
- ✅ Детайлен преглед

### Информация:
- **Основни данни:**
  - Име и фамилия
  - Телефон (2 номера)
  - Email адрес
  - Адрес и град

- **Фирмена информация** (опционално):
  - Име на фирма
  - ЕИК/БУЛСТАТ
  - Адрес за фактури

- **Свързване с ученици:**
  - Множество деца към един родител
  - Преглед на деца в профила

- **Видео клипове:**
  - Upload на видео от събития
  - Firebase Storage интеграция
  - Лимит: 100MB на файл

### Експорт & Pagination:
- ✅ Excel export
- ✅ Pagination (20 на страница)
- ✅ Търсене по име, телефон, email

---

## 💰 **Плащания**

**Route:** `/payments`

### CRUD Операции:
- ✅ Добавяне на плащане
- ✅ Редактиране
- ✅ Изтриване
- ✅ Преглед на история

### Функционалности:

#### **Bulk Payments:**
- Добавяне на плащания за множество ученици наведнъж
- Multi-select с checkboxes
- Select All / Deselect All
- Real-time калкулация на общата сума

#### **Методи на плащане:**
- Кеш
- ПОС
- Банков път
- Фактура

#### **Артикули:**
- Месечна такса (празно поле)
- Абакус
- Учебна тетрадка
- Други

#### **Валути:**
- BGN (основна)
- EUR (автоматичен конвертор)
- Real-time синхронизация при промяна

#### **Филтриране:**
- По ученик (търсене)
- По метод на плащане
- По артикул
- **Date Range Filter** - От дата до дата (нов!)

#### **Валидация:**
- ✅ Сума > 0 (блокира submit)
- ⚠️ Предупреждение за суми > 1000 лв
- ⚠️ Currency mismatch detection (BGN vs EUR)
- ⚠️ Дата в бъдещето (блокира submit)
- ⚠️ Стари дати (> 2 години)

#### **Експорт:**
- Excel export с детайли
- Филтрирани данни

#### **Pagination:**
- 20 плащания на страница

**Технологии:** React Query, Real-time validation, ErrorAlert component

---

## 📉 **Разходи (Expenses)**

**Route:** `/expenses`

### CRUD Операции:
- ✅ Добавяне на разход
- ✅ Редактиране
- ✅ Изтриване
- ✅ Преглед

### Категории:
- Наем
- Ток
- Вода
- Интернет
- Заплати
- Материали
- Реклама
- Други

### Функционалности:
- **Филтриране:**
  - По категория (button tabs)
  - Търсене по описание/номер
  - **Date Range Filter** (нов!)

- **Информация:**
  - Дата на разход
  - Описание
  - Сума (BGN)
  - Номер на документ/фактура
  - Бележки

- **Статистики:**
  - Общо разходи
  - Брой разходи
  - Най-голям разход
  - Топ категория

- **Експорт:**
  - Excel export

- **Pagination:**
  - 20 разхода на страница

---

## 📅 **Присъствия (Attendance)**

**Route:** `/attendance`

### Функционалности:
- **Бързо отбелязване:**
  - Присъствал ✅
  - Отсъствал ❌
  - Закъснял ⏰

- **Групова работа:**
  - Филтриране по група
  - Bulk операции за цяла група
  - Запазване на всички наведнъж

- **История:**
  - Преглед на минали присъствия
  - Филтриране по дата

- **Експорт:**
  - Excel export с attendance records

---

## 📦 **Склад (Inventory)**

**Route:** `/inventory`

### Функционалности:
- **Артикули:**
  - Име на артикул
  - SKU код
  - Категория
  - Налично количество
  - Цена за продажба

- **Транзакции:**
  - Вход на стока (покупка)
  - Изход на стока (продажба)
  - Проследяване на количества
  - История на движенията

- **Алерти:**
  - Low stock warnings
  - Automatic quantity updates

---

## 🧾 **Фактури (Invoices)**

**Route:** `/invoices` (в Reports)

### Функционалности:
- **Типове документи:**
  - Фактура
  - Касова бележка
  - Разписка

- **Генериране:**
  - Автоматична номерация
  - Множество артикули
  - ДДС 20% (Bulgarian VAT)
  - Subtotal, VAT amount, Total

- **Клиентска информация:**
  - Име
  - Адрес
  - ЕИК/БУЛСТАТ

- **PDF Export:**
  - Професионално форматиран PDF
  - Bulgarian language
  - Правилно форматиране на суми
  - Download функция

- **Статуси:**
  - Чернова
  - Издадена
  - Платена
  - Анулирана

**Технологии:** jsPDF, jspdf-autotable

---

## ⚙️ **Настройки (Settings)**

**Route:** `/settings`

### Конфигурация:
- **Информация за училището:**
  - Име
  - Адрес
  - Телефон
  - Email
  - Website
  - ЕИК/БУЛСТАТ

- **Регионални настройки:**
  - Валута (BGN/EUR)
  - Език (BG/EN)
  - Timezone

- **Известия:**
  - Email notifications (toggle)
  - SMS notifications (toggle)

- **Тема:**
  - Светла (Light)
  - Тъмна (Dark)

**Storage:** Firestore `/settings/system`

---

## ⚠️ **Error Dashboard** (НОВ!)

**Route:** `/errors`

### Автоматични проверки:

#### **Грешки (Критични):**
- Липсващи задължителни данни
- Невалидни суми
- Невалидни дати

#### **Предупреждения:**
- 📅 **Просрочени плащания** - Активни ученици с изтекъл падеж
- 💰 **Големи суми** - Плащания > 1000 лв (възможна грешка в нулите)
- 💱 **Currency mismatch** - BGN не съответства на EUR
- 📄 **Липсващи документи** - Плащания без receipt number (ПОС, банка, фактура)

#### **Информация:**
- 🧾 **Разходи без документ** - Препоръка за добавяне на фактура

### Features:
- **Real-time проверка** на всички данни
- **Филтриране:**
  - Всички проблеми
  - Само грешки
  - Само предупреждения
  - Само информация

- **За всеки проблем:**
  - Заглавие с описание
  - Конкретни детайли
  - ✅ **Решение** - Какво да направите

- **Статистики:**
  - Общо проблеми
  - Брой грешки
  - Брой предупреждения
  - Брой info

- **Refresh бутон** за нова проверка

**Технологии:** Custom validation logic, ErrorMessage helper

---

## 🔐 **Admin Panel**

**Route:** `/admin`

**Достъп:** Само администратори

### Функционалности:
- User management
- Role assignment
- System configuration
- Database backup/restore
- Activity logs

---

## 🌐 **Global Features**

### **Error Handling System** (НОВ!)

#### **ErrorBoundary:**
- Хваща всички React грешки
- User-friendly recovery screen
- Бутони: Презареди / Home
- Специфични решения според грешката:
  - Permission denied → "Влезте или свържете се с admin"
  - Network error → "Проверете интернет"
  - Firebase error → "Презаредете страницата"

#### **Form Validation:**
- **Real-time проверка** докато въвеждате
- **Visual feedback:**
  - 🔴 Червени карти за errors (блокират submit)
  - 🟡 Жълти карти за warnings (алертират)
  - 🔵 Сини карти за info

- **Validation rules:**
  - Required fields
  - Amount validation (> 0, not too large)
  - Date validation (not future, not too old)
  - Email format
  - Phone format
  - Currency consistency

#### **Toast Notifications:**
- Success: Зелено съобщение (3s)
- Error: Червено съобщение (4s)
- Долу-дясно positioning

### **Export Capabilities:**

#### **Excel Export:**
- Всички таблици имат Excel export
- Auto-sized колони
- Bulgarian headers
- Totals rows where applicable
- Експортира само филтрираните данни

**Libraries:** XLSX

#### **PDF Generation:**
- Фактури с професионално форматиране
- Bulgarian language support
- Auto-calculated totals
- ДДС 20%

**Libraries:** jsPDF, jspdf-autotable

#### **CSV Import:**
- Bulk import на ученици
- Drag & drop интерфейс
- Template download
- Validation със specific error messages
- Preview преди import

**Libraries:** Papa Parse

### **Email Integration:**
- **EmailJS** ready
- Templates за:
  - Payment reminders
  - Invoice notifications
  - Bulk emails

**Изисква конфигурация:** Service ID, Template ID, Public Key

### **SMS Integration:**
- **Placeholder** готов за Twilio/Nexmo
- Структура за:
  - Payment reminders
  - Event notifications
  - Bulk SMS

**Изисква конфигурация:** Twilio credentials

### **Pagination:**
- Всички списъци: 20 items/page
- **Desktop:** Full page numbers с ellipsis (1 ... 5 6 7 ... 20)
- **Mobile:** Simple Prev/Next бутони
- Persistent page при филтриране

### **Date Range Filters:**
- **Locations:** Payments, Expenses
- Start date + End date
- Clear button
- Visual feedback
- Respects end of day (23:59:59)

### **Animations:**
- `fadeIn` - плавно появяване
- `slideIn` - от ляво
- `slideUp` - от долу
- `scaleIn` - zoom in
- `bounceIn` - bounce effect
- `stagger-fade-in` - поредно появяване на list items
- `pulse` - loading states
- `shimmer` - skeleton loaders

### **Mobile Responsive:**
- Touch-optimized (min 44px touch targets)
- Responsive tables
- Mobile navigation
- Stack layouts
- iOS safe area insets
- Prevent zoom on inputs

---

## 🔒 **Authentication & Security**

### **Authentication:**
- Firebase Authentication
- Email/Password login
- Protected routes
- Persistent sessions

### **Authorization:**
- **Roles:**
  - Admin - Пълен достъп
  - Teacher - Ограничен достъп
  - Parent - Само свои данни

- **Role-based UI** - Различен интерфейс според роля

### **Security Rules:**
- Firestore security rules
- Row-level security
- Input validation
- XSS protection

---

## 📊 **Data Structure**

### **Firestore Collections:**

```
/students
/parents
/payments
/expenses
/attendance
/inventory
/invoices
/settings
/users
/events
/discounts
```

### **Real-time Updates:**
- Всички данни се обновяват instant
- onSnapshot listeners
- Automatic UI refresh
- No manual refresh needed

---

## 🚀 **Performance**

### **Optimization:**
- React Query caching
- useMemo hooks за pagination
- Lazy loading на компоненти
- Optimistic UI updates
- Debounced search

### **Bundle Size:**
- Total: 1.5MB (gzip: 422KB)
- CSS: 40KB (gzip: 7KB)
- Build time: ~12 seconds

---

## 📱 **Browser Support**

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🛠️ **Tech Stack**

### **Frontend:**
- React 18
- TypeScript
- TailwindCSS
- Vite
- React Router 6
- React Query (TanStack Query)

### **Backend & Services:**
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting

### **Libraries:**
- Chart.js + react-chartjs-2 (charts)
- XLSX (Excel export)
- jsPDF + jspdf-autotable (PDF)
- Papa Parse (CSV import)
- EmailJS (email)
- Lucide React (icons)
- React Hot Toast (notifications)

---

## 📈 **Statistics**

- **20+** major features
- **50+** sub-features
- **15+** pages/routes
- **30+** components
- **95%** TypeScript coverage
- **2329** modules
- **12s** build time

---

## 🎯 **Coming Soon** (Optional)

Функции които могат да се добавят в бъдеще:

- 📊 Advanced reports с custom date ranges
- 📧 Automated email campaigns
- 📱 Mobile app (React Native)
- 🔔 Push notifications
- 💬 Internal messaging system
- 📅 Advanced calendar с drag & drop
- 🎓 Student portal
- 👪 Parent portal
- 📊 Advanced analytics
- 🌍 Multi-language support
- 🎨 Theme customization
- 📤 More export formats (CSV, JSON)
- ☁️ Google Drive auto-backup
- 🔐 Two-factor authentication
- 📞 НАП интеграция (Bulgarian tax)

---

## 📞 **Support**

**Documentation:**
- [README.md](./README.md) - Overview
- [SETUP.md](./SETUP.md) - Installation
- [USAGE.md](./USAGE.md) - User guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Developer guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment

**Repository:** https://github.com/FlyingSD/Test-Master-worker

---

**Last Updated:** November 10, 2024
**Version:** 2.0 (with comprehensive error handling)
