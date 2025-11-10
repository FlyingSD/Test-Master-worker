# Светлинки CRM - Ръководство за разработка

## 📖 За разработчици

Това ръководство е за работа с кода на Светлинки CRM, включително използване на Claude Code за поправки и разширения.

---

## 🛠️ Технологичен стек

### Frontend
- **React 18** - UI библиотека
- **TypeScript 5.2** - Type safety
- **Vite 5.0** - Build tool
- **TailwindCSS 3.3** - Styling
- **React Router 6** - Routing
- **React Query (TanStack Query)** - Server state management
- **Zustand** - Client state management (if needed)

### Backend & Services
- **Firebase Authentication** - Потребителска автентикация
- **Firestore** - NoSQL database
- **Firebase Storage** - File storage (видео клипове)
- **Firebase Hosting** - Web hosting
- **Google Drive API** - Backups и експорти

### Libraries
- **date-fns** - Date manipulation
- **lucide-react** - Icons
- **react-hot-toast** - Notifications
- **react-big-calendar** - Calendar component
- **gapi-script** - Google Drive integration

---

## 📁 Структура на проекта

```
firebase-crm/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Layout.tsx   # Main layout с navigation
│   │   ├── *Modal.tsx   # Modal компоненти
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useStudents.ts
│   │   ├── useParents.ts
│   │   ├── useInventory.ts
│   │   ├── useInvoices.ts
│   │   └── ...
│   ├── lib/             # Configuration files
│   │   └── firebase.ts  # Firebase config
│   ├── pages/           # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── StudentsPage.tsx
│   │   ├── ParentsPage.tsx
│   │   ├── InventoryPage.tsx
│   │   └── ...
│   ├── types/           # TypeScript types
│   │   └── index.ts     # All type definitions
│   ├── utils/           # Utility functions
│   │   ├── formatters.ts
│   │   ├── permissions.ts
│   │   ├── googleDrive.ts
│   │   └── ...
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables (не се commit-ва)
├── firebase.json        # Firebase configuration
├── package.json         # Dependencies
└── vite.config.ts       # Vite configuration
```

---

## 🔧 Работа с VS Code и Claude Code

### Инсталация на Claude Code extension

1. Отворете VS Code
2. Отидете на Extensions (Ctrl + Shift + X)
3. Търсете "Claude Code"
4. Кликнете Install

### Използване на Claude Code

#### За нови функции:

1. Отворете Command Palette (Ctrl + Shift + P)
2. Напишете "Claude Code: New Chat"
3. Опишете какво искате да добавите:

```
Искам да добавя нова страница за експорт на данни към Excel.
Страницата трябва да има:
- Списък с налични експорти
- Бутон за нов експорт
- Филтри по дата
- Preview преди изтегляне
```

#### За поправки на бъгове:

1. Маркирайте кода с проблема
2. Натиснете Ctrl + Shift + P
3. "Claude Code: Fix this code"
4. Опишете проблема

#### За рефакторинг:

1. Маркирайте кода
2. Ctrl + Shift + P → "Claude Code: Refactor"
3. Опишете какво искате да промените

#### За добавяне на коментари и документация:

1. Маркирайте функция/компонент
2. Ctrl + Shift + P → "Claude Code: Add documentation"

### Примери за промпти за Claude Code

#### Добавяне на нова страница:

```markdown
Искам да добавя страница "Expenses" (Разходи) със следните функции:

1. Таблица с всички разходи с колони:
   - Дата
   - Категория (Наем, Ток, Вода, Заплати, и т.н.)
   - Сума
   - Описание
   - Документ номер

2. Модал за добавяне/редактиране на разход

3. Статистики в горната част:
   - Общо разходи за месеца
   - Разходи по категория
   - Най-голям разход

4. Филтри по:
   - Категория
   - Дата (от-до)

Моля създай:
- ExpensesPage.tsx
- useExpenses.ts hook
- ExpenseModal.tsx
- Добави Expense interface в types/index.ts
- Актуализирай App.tsx и Layout.tsx
```

#### Оптимизация на производителност:

```markdown
Забелязах че StudentsPage се зарежда бавно. Моля:

1. Анализирай кода и намери проблеми с производителността
2. Добави React.memo където е подходящо
3. Оптимизирай Firestore queries
4. Добави debouncing за search
5. Имплементирай pagination (20 ученика на страница)
```

#### Добавяне на тестове:

```markdown
Моля добави unit tests за useInventory hook:

1. Test за добавяне на артикул
2. Test за обновяване на наличност
3. Test за low stock alerts
4. Test за stock transactions
5. Mock Firebase calls

Използвай Jest и React Testing Library.
```

---

## 🔒 Permissions система

### Роли:

- **admin** - Пълен достъп (Kristian, Deni)
- **teacher** - Достъп до своите групи, може да добавя плащания
- **parent** - Вижда само своите деца

### Проверка на permissions:

```typescript
import { hasPermission, isAdmin } from '@/utils/permissions'

// Проверка за конкретно право
if (hasPermission(user.role, 'delete_students')) {
  // Show delete button
}

// Проверка за admin
if (isAdmin(user.role)) {
  // Show admin panel
}
```

### Добавяне на нов permission:

1. Добавете в `types/index.ts`:

```typescript
export type Permission =
  | 'view_dashboard'
  | 'view_students'
  // ... existing permissions
  | 'new_permission_name' // Добавете тук
```

2. Добавете в `ROLE_PERMISSIONS`:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // all permissions
    'new_permission_name',
  ],
  teacher: [
    // teacher permissions (ако е нужно)
  ],
  parent: [
    // parent permissions
  ],
}
```

---

## 📊 Firestore Collections Schema

### users
```typescript
{
  id: string (document ID = Auth UID)
  email: string
  name: string
  role: 'admin' | 'teacher' | 'parent'
  phone?: string
  isActive: boolean
  assignedGroups?: string[] // За teachers
  studentIds?: string[] // За parents
  createdAt: Timestamp
  lastLogin?: Timestamp
}
```

### students
```typescript
{
  id: string
  name: string
  group: string
  fee: number // BGN
  feeEUR: number
  dueDate: Timestamp
  status: 'active' | 'inactive'
  studyType: 'Групово' | 'Индивидуално'
  parentId: string
  notes?: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}
```

### parents
```typescript
{
  id: string
  name: string
  phone: string
  phone2?: string
  email?: string
  address?: string
  city?: string
  studentIds: string[]
  relationship?: 'Майка' | 'Баща' | 'Настойник' | 'Друго'
  paymentMethod?: 'Кеш' | 'ПОС' | 'Банков път' | 'Фактура'
  companyName?: string
  companyVAT?: string
  companyAddress?: string
  notes?: string
  videoUrls?: string[] // URLs from Firebase Storage
  createdAt: Timestamp
  updatedAt?: Timestamp
}
```

### inventory
```typescript
{
  id: string
  sku: string
  name: string
  category: 'Абакуси' | 'Учебници' | 'Тетрадки' | 'Материали' | 'Други'
  description?: string
  purchasePrice: number
  salePrice: number
  currentStock: number
  minimumStock: number
  location?: string
  supplier?: string
  lastRestockDate?: Timestamp
  imageUrl?: string
  isActive: boolean
  createdBy: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}
```

### stockTransactions
```typescript
{
  id: string
  inventoryItemId: string
  inventoryItemName: string
  type: 'IN' | 'OUT'
  quantity: number
  pricePerUnit: number
  totalPrice: number
  reason: 'Покупка от доставчик' | 'Продажба на ученик' | 'Брак' | 'Инвентаризация' | 'Друго'
  relatedStudentId?: string
  relatedPaymentId?: string
  relatedExpenseId?: string
  notes?: string
  createdBy: string
  createdAt: Timestamp
}
```

### invoices
```typescript
{
  id: string
  invoiceNumber: string // "0000001", "0000002"...
  type: 'Фактура' | 'Касова бележка' | 'Разписка'
  status: 'Чернова' | 'Издадена' | 'Анулирана'

  // Client
  clientType: 'Физическо лице' | 'Фирма'
  clientName: string
  clientAddress?: string
  clientVAT?: string
  clientPhone?: string
  clientEmail?: string

  // Related
  parentId?: string
  studentIds?: string[]
  relatedPaymentIds?: string[]

  // Items
  items: InvoiceItem[]

  // Amounts
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number

  // Payment
  paymentMethod: 'Кеш' | 'ПОС' | 'Банков път'
  isPaid: boolean
  paidAt?: Timestamp

  // Document
  issueDate: Timestamp
  dueDate?: Timestamp
  notes?: string
  qrCode?: string
  pdfUrl?: string

  createdBy: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}
```

---

## 🎨 Styling Guidelines

### TailwindCSS Utilities

Използваме предефинирани utility classes:

```typescript
// Buttons
className="btn btn-primary"
className="btn btn-secondary"
className="btn btn-ghost"

// Cards
className="card"

// Inputs
className="input"
className="label"

// Badges
className="badge badge-primary"
className="badge bg-green-100 text-green-800"

// Tables
className="table"
```

### Custom Classes (index.css)

```css
.btn { /* base button styles */ }
.btn-primary { /* primary button */ }
.card { /* card container */ }
.input { /* form input */ }
.table { /* table styles */ }
```

### Colors

- **Primary**: Светлинки theme color (#6D28D9 - purple)
- **Secondary**: Gray tones
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

---

## 🐛 Debugging

### React Developer Tools

1. Инсталирайте React DevTools extension
2. Отворете DevTools (F12)
3. Вижте React components tree
4. Inspect props и state

### Firebase Debuging

```typescript
// Enable Firebase debug mode
import { enableIndexedDbPersistence } from 'firebase/firestore'

// Add detailed logging
firebase.setLogLevel('debug')
```

### Common Issues

#### "Permission denied" в Firestore

- Проверете Security Rules
- Уверете се че user е authenticated
- Проверете дали user има правилна роля

#### Компонентът не се re-render-ва

- Проверете дали hook-ът използва `onSnapshot` (real-time)
- Уверете се че `queryClient.invalidateQueries()` се извиква след mutation

#### TypeScript грешки

```bash
# Regenerate types
npm run build

# Check for errors
npx tsc --noEmit
```

---

## 🚀 Deployment Workflow

### Development

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

### Staging

```bash
# Build for staging
npm run build

# Deploy to Firebase staging
firebase use staging
firebase deploy
```

### Production

```bash
# Build for production
npm run build

# Deploy to Firebase production
firebase use default
firebase deploy
```

---

## 📝 Git Workflow

### Branching Strategy

- `main` - Production branch
- `develop` - Development branch
- `claude/*` - Feature branches (auto-created by Claude Code)

### Commit Messages

Използвайте конвенционални commit съобщения:

```
feat: Add inventory management page
fix: Fix low stock alerts not showing
refactor: Optimize Firestore queries in useStudents
docs: Update SETUP.md with Google Drive setup
```

### Before Commit

```bash
# Check code style
npm run lint

# Build to check for errors
npm run build

# Run tests (if available)
npm test
```

---

## 🧪 Testing (Бъдещо)

### Unit Tests

```bash
npm run test
```

### E2E Tests (с Playwright)

```bash
npm run test:e2e
```

---

## 🔮 Бъдещи функции (Roadmap)

### Висок приоритет:
- [ ] **Expenses Page** - Управление на разходи
- [ ] **Attendance Tracking** - Система за отсъствия/присъствия
- [ ] **Settings Page** - Системни настройки
- [ ] **Add-ons система** - Plugin система за лесно разширяване

### Среден приоритет:
- [ ] **Bulk Operations** - Групови операции (bulk add, bulk edit)
- [ ] **Advanced Charts** - Графики с Chart.js/Recharts
- [ ] **Email Integration** - Автоматични имейли към родители
- [ ] **SMS Integration** - SMS известия

### Нисък приоритет:
- [ ] **Mobile App** - React Native версия
- [ ] **PWA Notifications** - Push notifications
- [ ] **НАП Integration** - Автоматично подаване в НАП
- [ ] **Multi-language** - Подръжка на английски език

---

## 📞 Контакт

За въпроси относно development:
- Kristian (Lead Developer & Admin)

За bug reports:
- Създайте issue в GitHub repository

---

🚀 **Happy Coding!**
