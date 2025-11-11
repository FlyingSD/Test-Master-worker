# Testing Documentation

## Overview

This project uses a comprehensive testing infrastructure to ensure code quality, reliability, and maintainability.

## Testing Stack

- **Test Framework**: [Vitest](https://vitest.dev/) - Fast, Vite-native test runner
- **UI Testing**: [@testing-library/react](https://testing-library.com/react) - User-centric component testing
- **DOM Environment**: [jsdom](https://github.com/jsdom/jsdom) - Browser-like environment for Node.js
- **Mocking**: Vitest's built-in mocking capabilities
- **Coverage**: V8 coverage provider

## Project Structure

```
firebase-crm/
├── src/
│   ├── test/
│   │   └── setup.ts              # Global test setup and mocks
│   ├── utils/
│   │   ├── studentCode.test.ts   # Student code generation tests
│   │   ├── formatters.test.ts    # Formatter utility tests
│   │   └── permissions.test.ts   # RBAC permission tests
│   └── ...
├── vitest.config.ts              # Vitest configuration
└── TESTING.md                     # This file
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

This starts Vitest in watch mode - tests will re-run when files change.

### Run Tests Once (CI Mode)

```bash
npm run test:run
```

### Run Tests with UI

```bash
npm run test:ui
```

Opens an interactive UI to explore and debug tests.

### Run Tests with Coverage

```bash
npm run test:coverage
```

Generates coverage report in `coverage/` directory.

### View Coverage Report

```bash
# After running npm run test:coverage
npx vite preview --outDir coverage
```

## Writing Tests

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Place tests next to the code they test
- Example: `studentCode.ts` → `studentCode.test.ts`

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myFunction'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('')
    expect(myFunction(null)).toBe(null)
  })
})
```

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle clicks', () => {
    render(<MyComponent />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### Mocking Firebase

Firebase is automatically mocked in `src/test/setup.ts`. You can access mocks like this:

```typescript
import { vi } from 'vitest'
import { getDoc } from 'firebase/firestore'

// Mock specific function
vi.mocked(getDoc).mockResolvedValue({
  exists: () => true,
  data: () => ({ name: 'Test User' }),
})
```

### Testing Async Code

```typescript
import { describe, it, expect } from 'vitest'

describe('async function', () => {
  it('should resolve with data', async () => {
    const data = await fetchData()
    expect(data).toEqual({ id: 1, name: 'Test' })
  })

  it('should reject on error', async () => {
    await expect(fetchDataWithError()).rejects.toThrow('Error message')
  })
})
```

## Coverage Requirements

The project enforces minimum coverage thresholds:

- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

These thresholds are configured in `vitest.config.ts` and enforced in CI.

## Example Tests

### Unit Test: Student Code Generation

```typescript
// src/utils/studentCode.test.ts
describe('generateStudentCode', () => {
  it('should generate a 6-character code', () => {
    const code = generateStudentCode()
    expect(code).toHaveLength(6)
  })

  it('should not contain confusing characters', () => {
    const code = generateStudentCode()
    expect(code).not.toContain('O')
    expect(code).not.toContain('I')
    expect(code).not.toContain('0')
    expect(code).not.toContain('1')
  })
})
```

### Unit Test: Formatters

```typescript
// src/utils/formatters.test.ts
describe('formatCurrency', () => {
  it('should format numbers as Bulgarian currency', () => {
    expect(formatCurrency(100)).toBe('100,00 лв.')
    expect(formatCurrency(1234.56)).toBe('1 234,56 лв.')
  })

  it('should handle zero and negatives', () => {
    expect(formatCurrency(0)).toBe('0,00 лв.')
    expect(formatCurrency(-50)).toBe('-50,00 лв.')
  })
})
```

### Unit Test: Permissions

```typescript
// src/utils/permissions.test.ts
describe('canEditStudent', () => {
  it('should allow admin to edit any student', () => {
    const user = { role: 'admin', id: 'user1' }
    expect(canEditStudent(user, 'student1')).toBe(true)
  })

  it('should prevent parent from editing other students', () => {
    const user = { role: 'parent', id: 'user1' }
    expect(canEditStudent(user, 'student1')).toBe(false)
  })
})
```

## CI/CD Integration

Tests run automatically on every push via GitHub Actions (`.github/workflows/ci.yml`):

```yaml
- name: Run tests
  run: npm run test:run

- name: Run tests with coverage
  run: npm run test:coverage
```

The CI pipeline:
1. Runs ESLint for code quality
2. Runs Prettier for formatting checks
3. Runs TypeScript type checking
4. Runs all unit tests
5. Generates coverage report
6. Uploads coverage to Codecov (if configured)

## Debugging Tests

### Using VS Code

1. Install "Vitest" extension
2. Click the green play button next to any test
3. Set breakpoints in your code
4. Debug interactively

### Using Browser DevTools

```bash
npm run test:ui
```

Then open the URL shown and use browser DevTools.

### Console Logging

```typescript
it('should debug something', () => {
  const result = myFunction()
  console.log('Result:', result) // Will show in test output
  expect(result).toBe('expected')
})
```

## Best Practices

### ✅ DO

- Write tests for all new features
- Test edge cases and error paths
- Keep tests focused and isolated
- Use descriptive test names
- Mock external dependencies (Firebase, APIs)
- Test user behavior, not implementation details

### ❌ DON'T

- Test implementation details
- Write tests that depend on other tests
- Hard-code dates, times, or IDs
- Skip error handling tests
- Ignore failing tests
- Mock everything (test real logic when possible)

## Common Testing Patterns

### Testing Forms

```typescript
it('should submit form with valid data', async () => {
  render(<MyForm />)

  // Fill out form
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'John Doe' },
  })

  // Submit
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

  // Wait for async operations
  await waitFor(() => {
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })
})
```

### Testing API Calls

```typescript
it('should fetch and display data', async () => {
  // Mock API
  vi.mocked(fetchData).mockResolvedValue({ users: [] })

  render(<UserList />)

  // Wait for data to load
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  expect(screen.getByText('No users found')).toBeInTheDocument()
})
```

### Testing Error States

```typescript
it('should display error message on failure', async () => {
  // Mock error
  vi.mocked(fetchData).mockRejectedValue(new Error('Network error'))

  render(<UserList />)

  await waitFor(() => {
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })
})
```

## Test Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Utilities | 80%+ | 90%+ |
| Components | 60%+ | 75%+ |
| Hooks | 70%+ | 85%+ |
| Pages | 40%+ | 60%+ |

## Future Testing Enhancements

- [ ] E2E tests with Playwright/Cypress
- [ ] Visual regression testing with Chromatic
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Integration tests with real Firebase emulator

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mocking Firebase](https://firebase.google.com/docs/emulator-suite)

## Questions?

If you have questions about testing, please:
1. Check this documentation first
2. Review existing tests for examples
3. Ask in team chat/discussion

---

**Last Updated**: November 11, 2025
