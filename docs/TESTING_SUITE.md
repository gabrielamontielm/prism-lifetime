# Test Suite Documentation

LifePrism uses **Vitest** as its primary test runner, paired with **React Testing Library** for component validation.

## 🧪 Running Tests

### Command Line
Run all tests once:
```bash
npm test
```

### Watch Mode
For continuous development:
```bash
npx vitest
```

## 📂 Test Organization

Tests are located in `src/__tests__/` and categorized by their target:

- **Logic Tests** (`*.test.ts`): Pure functions, math, and string utilities.
- **Hook Tests** (`*.test.tsx`): React hooks using `@testing-library/react-hooks`.
- **Component Tests** (`*.test.tsx`): UI interactions and rendering.
- **Security Tests** (`test/firestore.rules.test.ts`): Validation of Firestore security rules.

## 🏗️ Example: Utility Test

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn utility', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
  });
});
```

## 🛡️ Security Rule Testing

We use `@firebase/rules-unit-testing` to ensure that our "Zero-Trust" policy is actually enforced. 

To run rule tests:
1. Ensure the Firebase Emulator is running:
   ```bash
   firebase emulators:start --only firestore
   ```
2. Run the specific test:
   ```bash
   npx vitest test/firestore.rules.test.ts
   ```

## 🛠️ Best Practices
1. **Mocking External APIs**: Always mock Google Maps (`google.maps.*`) and Firebase calls to avoid network dependency.
2. **Snapshot Testing**: Use snapshots sparingly for UI components that change frequently.
3. **Behavior Over Implementation**: Focus tests on what the user sees/does, rather than component internals.
