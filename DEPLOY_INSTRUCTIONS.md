# 🚀 Инструкции за Автоматичен Deploy към Firebase

GitHub Actions workflow-ът е готов! Сега само трябва да добавиш Firebase ключ в GitHub и всеки push автоматично ще deploy-ва приложението.

## 📋 Стъпка 1: Генерирай Firebase Service Account ключ

1. Отвори Firebase Console: https://console.firebase.google.com/
2. Избери проект **svetlinki-7911c**
3. Кликни на **иконката със зъбчо (Settings)** до "Project Overview" → **Project settings**
4. Отиди на таб **Service accounts**
5. Кликни бутона **Generate new private key**
6. Потвърди с **Generate key**
7. Ще се свали JSON файл (запази го добре, не го споделяй с никого!)

## 📋 Стъпка 2: Добави ключа в GitHub Secrets

1. Отвори GitHub repository: https://github.com/FlyingSD/Test-Master-worker
2. Кликни на **Settings** (горе в менюто)
3. В лявото меню избери **Secrets and variables** → **Actions**
4. Кликни бутона **New repository secret**
5. Попълни:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Secret**: Отвори свалената JSON файл с Notepad и копирай **цялото съдържание** (от { до })
6. Кликни **Add secret**

## ✅ Готово! Автоматичният Deploy е активен

След като добавиш Secret-а:
- Всеки **push** към `main` или `claude/check-main-branch-011CV3Lnnrw3t9xuEbbBdp8p` branch-ове
- Автоматично ще:
  1. Инсталира dependencies
  2. Build-ва проекта (`npm run build`)
  3. Deploy-ва към Firebase Hosting
  4. Приложението ще е достъпно на https://svetlinki-7911c.web.app

## 🔍 Как да проверя дали работи?

1. След като добавиш Secret-а, отвори: https://github.com/FlyingSD/Test-Master-worker/actions
2. Ще видиш workflow-а **"Deploy to Firebase Hosting"** да се изпълнява
3. Зелен checkmark ✅ = успешен deploy
4. Червен X ❌ = грешка (кликни за детайли)

## 🛠️ Алтернатива: Ръчен Deploy от компютъра

Ако искаш да deploy-ваш ръчно (без GitHub Actions):

```powershell
cd C:\Users\denit\Desktop\Test-Master-worker-LATEST\firebase-crm

# Изтегли последния код
git pull origin claude/check-main-branch-011CV3Lnnrw3t9xuEbbBdp8p

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

---

**Въпроси?** Питай ме! 😊
