# 🌟 Светлинки CRM - Firebase Edition

Modern Customer Relationship Management система за образователни центрове, изградена с React, TypeScript и Firebase.

## ✨ Основни Функционалности

- 👥 **Управление на ученици** - Пълен профил с родители, плащания, присъствия
- 💰 **Плащания и Финанси** - Проследяване на месечни такси, отстъпки, разходи
- 📅 **Wydarzenia и Класове** - Календар с уроци и събития
- 📊 **Reports и Анализи** - Приходи, разходи, статистики
- 🔐 **Multi-user система** - Администратори, учители, родители
- 📱 **Responsive дизайн** - Работи перфектно на телефон и таблет
- ⚡ **Real-time sync** - Моментално обновяване на данните
- 🌐 **Offline-first** - Работи без интернет

## 🚀 Технологии

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Functions, Storage)
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Icons**: Lucide React

## 📦 Инсталация

### 1. Клониране на проекта

\`\`\`bash
git clone https://github.com/FlyingSD/Firebase.git
cd Firebase
\`\`\`

### 2. Инсталиране на dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Firebase Setup

1. Създай проект в [Firebase Console](https://console.firebase.google.com/)
2. Активирай следните услуги:
   - **Authentication** (Email/Password и Google)
   - **Firestore Database**
   - **Storage**
   - **Functions** (optional)
3. Копирай `.env.example` към `.env` и попълни данните:

\`\`\`bash
cp .env.example .env
\`\`\`

4. Добави Firebase credentials в `.env` файла

### 4. Firestore Security Rules

Копирай и постави в Firebase Console > Firestore Database > Rules:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Students collection
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'teacher']);
    }

    // All other collections similar permissions
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
\`\`\`

### 5. Стартиране на Dev Server

\`\`\`bash
npm run dev
\`\`\`

Приложението ще се отвори на `http://localhost:3000`

## 📁 Структура на Проекта

\`\`\`
firebase-crm/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── pages/          # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── StudentsPage.tsx
│   │   ├── PaymentsPage.tsx
│   │   └── ...
│   ├── hooks/          # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useStudents.ts
│   │   └── ...
│   ├── lib/            # Libraries and utilities
│   │   └── firebase.ts
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/          # Helper functions
│   ├── styles/         # Global styles
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── index.html          # HTML template
└── package.json
\`\`\`

## 🎯 Използване

### Първоначално Setup

1. **Създай Admin акаунт**:
   - Регистрирай се през login страницата
   - В Firestore manually промени `role` на `admin` за твоя user document

2. **Добави първи ученик**:
   - Отвори "Ученици" страницата
   - Кликни "Добави ученик"
   - Попълни данните

3. **Направи първо плащане**:
   - Отвори профила на ученика
   - Секция "Плащания" > "Добави плащане"

## 🔐 User Roles

- **Admin**: Пълен достъп до всичко
- **Teacher**: Може да вижда/редактира ученици, присъствия, оценки
- **Parent**: Може да вижда само данните на своите деца

## 📊 Firestore Collections

\`\`\`
- users/           # User accounts
- students/        # Student profiles
- parents/         # Parent contacts
- payments/        # Payment records
- expenses/        # Expense tracking
- events/          # Classes and events
- attendance/      # Attendance records
- discounts/       # Active discounts
- reports/         # Generated reports
\`\`\`

## 🚢 Deployment

### Вариант 1: Firebase Hosting

\`\`\`bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
\`\`\`

### Вариант 2: Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Вариант 3: Netlify

\`\`\`bash
npm run build
# Upload dist/ folder to Netlify
\`\`\`

## 🛠️ Development

### Стартиране на dev server с hot reload

\`\`\`bash
npm run dev
\`\`\`

### Build за production

\`\`\`bash
npm run build
\`\`\`

### Preview production build

\`\`\`bash
npm run preview
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## 🐛 Troubleshooting

### Firestore permissions denied
- Провери дали си логнат
- Провери Security Rules в Firebase Console

### Build грешки
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Offline mode не работи
- Провери дали `enableIndexedDbPersistence` е enable-нат в `firebase.ts`

## 📝 TODO

- [ ] Mobile app (React Native)
- [ ] Email notifications при просрочени плащания
- [ ] QR code check-in система
- [ ] Parent portal mobile view
- [ ] Excel export за reports
- [ ] WhatsApp/Viber интеграции

## 📄 License

MIT License - free to use and modify

## 👨‍💻 Author

Създадено за Светлинки educational center

---

**Забележка**: Това е модерна версия на оригиналната Google Apps Script CRM система, мигрирана към Firebase за по-добра производителност и скалируемост.
