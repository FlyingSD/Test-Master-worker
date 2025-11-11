# 🛡️ Code Guardian Agent - TypeScript/React Edition

Intelligent code analysis and auto-fixing agent for TypeScript/React/Firebase projects.

## 🎯 Features

### ✅ **Security Analysis**
- Detects XSS vulnerabilities (`dangerouslySetInnerHTML`, `innerHTML`)
- Identifies dangerous operations (`eval`, `document.write`)
- Checks for unsafe JSON parsing
- Validates localStorage/sessionStorage usage

### ⚡ **Performance Detection**
- Empty dependency arrays in `useEffect`
- State updates inside loops/map
- Heavy operations in render cycles
- Unnecessary re-renders

### 🔍 **Memory Leak Detection**
- `useEffect` without cleanup functions
- `setInterval`/`setTimeout` without cleanup
- Event listeners without removal
- Unsubscribed subscriptions

### ⚛️ **React Rules Validation**
- Hooks usage rules (no hooks in conditions/loops)
- Missing `key` props in lists
- Direct state/props mutation
- Component naming conventions

### 🔥 **Firebase Best Practices**
- Firestore security checks
- Authentication validation
- Query optimization (composite indexes)
- Missing auth checks before database operations

### 🔧 **Auto-Fix Capabilities**
- Add `key` props to list items
- Add optional chaining (`?.`) for null safety
- Fix TypeScript type errors (where possible)
- Add cleanup functions to `useEffect`

---

## 📦 Installation

Already installed! Dependencies:
```json
{
  "typescript": "^5.9.3",
  "tsx": "^4.20.6",
  "glob": "^11.0.3",
  "@types/node": "^24.10.0"
}
```

---

## 🚀 Usage

### **Run Analysis**
```bash
npm run guardian
```

### **Watch Mode** (auto-analyze on file changes)
```bash
npm run guardian:watch
```

### **Generate Report**
```bash
npm run guardian
# Report saved to: code-guardian-report.json
```

---

## 📊 Output Example

```
🔍 Starting Code Guardian analysis...

📄 src/components/StudentModal.tsx
   Issues: 3
   ✅ Auto-fixed: 1
   🔴 [security] Line 145: Potential XSS vulnerability
      💡 Use safe alternatives instead of dangerouslySetInnerHTML

📄 src/hooks/useAuth.ts
   Issues: 1
   🔴 [firebase_auth_checks] Line 67: useAuth without user check
      💡 Check if user is authenticated before accessing userData

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Analysis Complete
   Total files: 87
   Total issues: 12
   Critical issues: 3
   Auto-fixed: 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Report saved to: code-guardian-report.json
```

---

## 🔍 What It Checks

### **Security Issues** 🔴 Critical
- XSS vulnerabilities
- Code injection risks
- Unsafe deserialization
- Missing input validation

### **React Issues** 🟡 High
- Hooks rules violations
- Missing keys in lists
- Direct state mutation
- Improper lifecycle usage

### **Firebase Issues** 🟡 High
- Missing auth checks
- Unoptimized queries
- Security rule violations
- Missing error handling

### **Performance Issues** 🟠 Medium
- Unnecessary re-renders
- Heavy operations in loops
- Missing memoization
- Large bundle sizes

### **Type Safety** 🔵 Low
- TypeScript type errors
- Missing null checks
- Type mismatches
- Missing optional chaining

---

## 🛠️ Auto-Fix Examples

### Before:
```tsx
// Missing key prop
{students.map(student => (
  <div>{student.name}</div>
))}

// Missing null check
const name = user.profile.name

// Missing cleanup
useEffect(() => {
  const interval = setInterval(() => {
    fetchData()
  }, 1000)
}, [])
```

### After Auto-Fix:
```tsx
// Added key prop
{students.map((student, index) => (
  <div key={index}>{student.name}</div>
))}

// Added optional chaining
const name = user?.profile?.name

// Added cleanup function
useEffect(() => {
  const interval = setInterval(() => {
    fetchData()
  }, 1000)

  return () => clearInterval(interval)
}, [])
```

---

## 📋 Report Format

```json
{
  "timestamp": "2024-11-11T10:30:00.000Z",
  "projectRoot": "/home/user/firebase-crm",
  "files": [
    {
      "file": "src/components/StudentModal.tsx",
      "issues": 3,
      "critical": 1,
      "components": 1,
      "hooks": 2,
      "imports": 15
    }
  ],
  "summary": {
    "totalFiles": 87,
    "totalIssues": 12,
    "criticalIssues": 3
  }
}
```

---

## 🎯 Integration with CI/CD

Add to GitHub Actions:

```yaml
name: Code Guardian

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run guardian
      - name: Check for critical issues
        run: |
          if grep -q '"criticalIssues": [1-9]' code-guardian-report.json; then
            echo "❌ Critical issues found!"
            exit 1
          fi
```

---

## 🔧 Configuration

Create `code-guardian.config.json`:

```json
{
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/*.test.ts"
  ],
  "autoFix": true,
  "severity": {
    "security": "critical",
    "performance": "high",
    "style": "low"
  },
  "rules": {
    "react-hooks-deps": true,
    "firebase-auth-check": true,
    "null-safety": true
  }
}
```

---

## 📚 Best Practices

1. **Run before commits** - Use as pre-commit hook
2. **Fix critical issues immediately** - Don't ignore security warnings
3. **Review auto-fixes** - Always review changes before committing
4. **Add to CI/CD** - Prevent bad code from merging
5. **Regular scans** - Run weekly full project scans

---

## 🤝 Contributing

To add new rules:

1. Edit `loadCriticalPatterns()` in `code-guardian.ts`
2. Add regex pattern for detection
3. Add fix suggestion in `getSuggestion()`
4. Add auto-fix logic in `applyFix()`

---

## 📝 License

MIT License - Part of Svetlinki CRM

---

**Created with ❤️ for code quality and developer happiness!**
