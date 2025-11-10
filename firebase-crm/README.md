# 💡 Светлинки CRM

**Модерна система за управление на образователен център**

---

## 🎯 Какво е Светлинки CRM?

Светлинки CRM е цялостна система за управление на образователен център, специално разработена за центрове за ментална аритметика и извънкласно обучение. Системата предлага пълен набор от инструменти за управление на ученици, родители, плащания, събития, складова база и финансови репорти.

### ✨ Основни функции

- 👥 **Управление на ученици и родители**
- 💰 **Проследяване на плащания и приходи**
- 📦 **Складова база** с автоматично управление на наличности
- 📅 **Календар и събития** с визуален изглед
- 🎥 **Качване на видео** към профили на родители
- 📊 **Финансови репорти** и статистики
- 🔐 **Role-Based Access Control** (Admin, Teacher, Parent)
- ☁️ **Google Drive интеграция** за backups и експорти
- 📱 **Responsive дизайн** - работи на всички устройства

---

## 🚀 Бърз старт

### Изисквания

- Node.js 18+
- Firebase проект
- Google Cloud проект (за Google Drive)

### Инсталация

```bash
# Клониране на проекта
git clone https://github.com/FlyingSD/Test-Master-worker.git
cd Test-Master-worker/firebase-crm

# Инсталиране на зависимости
npm install

# Стартиране в development режим
npm run dev
```

Приложението ще стартира на: `http://localhost:5173`

📖 **За подробни инструкции**: Вижте [SETUP.md](./SETUP.md)

---

## 📚 Документация

- **[SETUP.md](./SETUP.md)** - Подробно ръководство за инсталация и конфигурация
- **[USAGE.md](./USAGE.md)** - Ръководство за ползване на системата
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - За разработчици, включително работа с Claude Code

---

## 🛠️ Технологии

### Frontend
- React 18 + TypeScript
- TailwindCSS
- Vite
- React Router
- React Query

### Backend & Services
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting
- Google Drive API

---

## 📋 Функционалности

### 👨‍🎓 Ученици
- Добавяне и редактиране на ученици
- Групиране (Група 1, Група 2, и т.н.)
- Месечни такси в BGN и EUR
- Статус (активен/неактивен)
- Групово или индивидуално обучение

### 👪 Родители
- Пълна контактна информация
- Връзки с множество деца
- Качване на видео клипове от събития
- Фирмена информация (за фактури)
- Предпочитан метод на плащане

### 💳 Плащания
- Проследяване на всички плащания
- Методи: Кеш, ПОС, Банков път, Фактура
- Автоматични изчисления
- Експорт в Excel

### 📦 Склад
- Управление на учебни материали
- SKU кодове
- Входни и продажни цени
- Известия за нисък запас
- Stock transactions (IN/OUT)

### 📅 Събития и календар
- Визуален календар (месечен/седмичен/дневен изглед)
- Типове: Урок, Събитие, Ваканция
- Групи и локации
- Бизнес описания

### 📊 Репорти
- Месечни и годишни репорти
- По ученик и по група
- Финансови анализи
- Експорт в Excel и PDF
- Автоматично качване в Google Drive

### 🔐 Admin Panel
- Управление на потребители и роли
- Системни настройки
- Audit log (журнал на промени)
- Експорт и импорт на данни
- Backup и restore

---

## 👥 Роли и Permissions

### 🔴 Admin (Администратор)
- Пълен достъп до всички функции
- Управление на потребители
- Системни настройки
- Експорт и backup

### 🔵 Teacher (Учител)
- Достъп до назначените групи
- Може да добавя плащания
- Създаване на събития
- Read-only отстъпки

### 🟢 Parent (Родител)
- Вижда само своите деца
- Преглед на плащания
- Преглед на събития
- Персонален dashboard

---

## 🚀 Deployment

### Production

```bash
# Build
npm run build

# Deploy to Firebase
npm run deploy
```

Live URL: `https://svetlinki-7911c.web.app`

### Staging

```bash
firebase use staging
npm run build
firebase deploy
```

---

## 🔒 Security

- Firebase Authentication за потребители
- Firestore Security Rules за достъп до данни
- Role-Based Access Control (RBAC)
- Firebase Storage Rules за файлове
- Environment variables за secrets

---

## 📦 Структура на проекта

```
firebase-crm/
├── src/
│   ├── components/     # React компоненти
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Page компоненти
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility функции
│   ├── lib/            # Config (Firebase)
│   └── App.tsx         # Main app
├── public/             # Static assets
├── docs/               # Документация
├── SETUP.md            # Setup инструкции
├── USAGE.md            # User guide
├── DEVELOPMENT.md      # Dev guide
└── package.json
```

---

## 🐛 Bug Reports & Feature Requests

За да докладвате бъг или да поискате нова функция:

1. Отидете на [GitHub Issues](https://github.com/FlyingSD/Test-Master-worker/issues)
2. Кликнете **"New Issue"**
3. Опишете проблема/функцията детайлно

---

## 🤝 Contributing

Приемаме contributions! За да допринесете:

1. Fork проекта
2. Създайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit промените (`git commit -m 'feat: Add amazing feature'`)
4. Push към branch (`git push origin feature/amazing-feature`)
5. Отворете Pull Request

---

## 📈 Roadmap

### В разработка
- [ ] Expenses Management
- [ ] Attendance Tracking
- [ ] Settings Page
- [ ] Add-ons система

### Планирани
- [ ] Bulk operations
- [ ] Advanced charts
- [ ] Email integration
- [ ] SMS notifications
- [ ] Mobile app
- [ ] НАП integration

---

## 📄 License

Този проект е private и е собственост на Светлинки.

---

## 👨‍💻 За разработчиците

### Разработено от
- **Kristian** - Lead Developer & System Admin

### Технологична подръжка
- Built with ❤️ using React, TypeScript, and Firebase
- Асистиран от Claude AI (Anthropic)

---

## 📞 Контакти

- **Website**: [svetlinki-7911c.web.app](https://svetlinki-7911c.web.app)
- **GitHub**: [FlyingSD/Test-Master-worker](https://github.com/FlyingSD/Test-Master-worker)

---

## 🙏 Благодарности

- Firebase за невероятната платформа
- Anthropic за Claude AI
- React и TypeScript communities
- Всички contributors

---

**🎓 Светлинки CRM - Модерна CRM система за образователни центрове**

*Version 1.0.0 - January 2025*
