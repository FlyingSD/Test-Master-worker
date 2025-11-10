# Светлинки CRM - Ръководство за инсталация

## 📋 Съдържание
1. [Предварителни изисквания](#предварителни-изисквания)
2. [Инсталация на проекта](#инсталация-на-проекта)
3. [Конфигурация на Firebase](#конфигурация-на-firebase)
4. [Конфигурация на Google Drive](#конфигурация-на-google-drive)
5. [Стартиране на приложението](#стартиране-на-приложението)
6. [Deployment на Firebase](#deployment-на-firebase)

---

## Предварителни изисквания

Преди да започнете, уверете се че имате инсталирани:

- **Node.js** версия 18+ ([Изтеглете от nodejs.org](https://nodejs.org/))
- **npm** (идва с Node.js)
- **Git** ([Изтеглете от git-scm.com](https://git-scm.com/))
- **Firebase CLI** - инсталирайте с: `npm install -g firebase-tools`
- **Текстов редактор** - препоръчваме VS Code

## Инсталация на проекта

### 1. Клониране на repository

```bash
git clone https://github.com/FlyingSD/Test-Master-worker.git
cd Test-Master-worker/firebase-crm
```

### 2. Инсталиране на зависимости

```bash
npm install
```

Това ще инсталира всички необходими пакети:
- React 18
- Firebase SDK
- TailwindCSS
- React Query
- И други...

## Конфигурация на Firebase

### 1. Създаване на Firebase проект

1. Отидете на [Firebase Console](https://console.firebase.google.com/)
2. Кликнете "Add project" (Добави проект)
3. Въведете име: "Svetlinki CRM"
4. Следвайте стъпките за създаване

### 2. Активиране на Authentication

1. В Firebase Console, отидете на **Authentication**
2. Кликнете **Get Started**
3. Активирайте **Email/Password** метод

### 3. Създаване на Firestore Database

1. Отидете на **Firestore Database**
2. Кликнете **Create database**
3. Изберете **Production mode**
4. Изберете локация (Europe-West)

### 4. Активиране на Storage

1. Отидете на **Storage**
2. Кликнете **Get Started**
3. Приемете условията

### 5. Конфигурационен файл

Конфигурацията вече е вградена в `src/lib/firebase.ts`. Ако искате да промените проекта:

1. Отидете на **Project Settings** (⚙️ икона)
2. Скролнете до **Your apps** → **Web apps**
3. Копирайте конфигурацията
4. Актуализирайте `src/lib/firebase.ts`

### 6. Firestore Security Rules

Приложете тези правила за сигурност в Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admin and teachers can access most collections
    match /{document=**} {
      allow read, write: if request.auth != null &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher');
    }

    // Parents can only read their own data
    match /students/{studentId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/students/$(studentId)).data.parentId == request.auth.uid;
    }
  }
}
```

### 7. Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their parent folders
    match /parents/{parentId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == parentId ||
         get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

## Конфигурация на Google Drive

### 1. Активиране на Google Drive API

1. Отидете на [Google Cloud Console](https://console.cloud.google.com/)
2. Изберете вашия Firebase проект
3. Отидете на **APIs & Services** → **Library**
4. Търсете "Google Drive API"
5. Кликнете **Enable**

### 2. Създаване на API ключ

1. Отидете на **APIs & Services** → **Credentials**
2. Кликнете **Create Credentials** → **API Key**
3. Копирайте ключа
4. (Опционално) Рестриктирайте ключа само за Google Drive API

### 3. Създаване на OAuth 2.0 Client ID

1. В **Credentials**, кликнете **Create Credentials** → **OAuth client ID**
2. Изберете **Web application**
3. Добавете **Authorized JavaScript origins**:
   - `http://localhost:5173` (за развитие)
   - `https://svetlinki-7911c.web.app` (за production)
4. Копирайте **Client ID**

### 4. Добавяне на credentials в .env файл

Създайте файл `.env` в `firebase-crm/` директорията:

```env
VITE_GOOGLE_DRIVE_API_KEY=your-api-key-here
VITE_GOOGLE_DRIVE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

⚠️ **ВАЖНО**: `.env` файлът НЕ трябва да се качва в GitHub!

## Стартиране на приложението

### Development режим

```bash
npm run dev
```

Приложението ще стартира на `http://localhost:5173`

### Build за production

```bash
npm run build
```

Това създава оптимизирана версия в `dist/` папката.

### Preview на build

```bash
npm run preview
```

## Deployment на Firebase

### 1. Login във Firebase

```bash
firebase login
```

### 2. Инициализиране (само първия път)

```bash
firebase init
```

Изберете:
- Hosting
- Use existing project: svetlinki-7911c
- Public directory: dist
- Single-page app: Yes
- GitHub integration: No

### 3. Deploy

```bash
npm run deploy
```

Или:

```bash
npm run build
firebase deploy
```

Вашето приложение ще бъде достъпно на: `https://svetlinki-7911c.web.app`

## Създаване на първия Admin акаунт

1. Регистрирайте се през UI-a
2. Отидете в Firebase Console → Authentication
3. Намерете вашия акаунт
4. Копирайте UID
5. Отидете в Firestore → `users` колекция
6. Намерете документа с този UID
7. Променете `role` от `parent` на `admin`

Готово! 🎉

## Често срещани проблеми

### Грешка: "Firebase not initialized"
- Проверете дали `firebase.ts` има правилната конфигурация
- Уверете се че сте активирали Authentication и Firestore

### Грешка: "Permission denied"
- Проверете Firestore Security Rules
- Уверете се че потребителят е authenticated

### Google Drive не работи
- Проверете дали API key и Client ID са правилни
- Уверете се че Google Drive API е активирано
- Добавете правилните Authorized JavaScript origins

### Build грешка
- Изтрийте `node_modules/` и `.vite/` папките
- Пуснете `npm install` отново
- Опитайте `npm run build` пак

## Подръжка

### Обновяване на зависимости

```bash
npm update
```

### Проверка за застарели пакети

```bash
npm outdated
```

## Следващи стъпки

- Прочетете [USAGE.md](./USAGE.md) за ръководство за ползване
- Прочетете [DEVELOPMENT.md](./DEVELOPMENT.md) за работа с Claude Code
- Конфигурирайте автоматични backups в Google Drive

---

За въпроси: Свържете се с Kristian (администратор)
