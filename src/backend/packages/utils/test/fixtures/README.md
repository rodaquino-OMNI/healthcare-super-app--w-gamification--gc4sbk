# Test Fixtures for @austa/utils

This directory contains a comprehensive collection of test fixtures for the `@austa/utils` package, organized by utility category. These fixtures provide standardized test data for unit, integration, and end-to-end tests across the AUSTA SuperApp ecosystem.

## Overview

Test fixtures are essential for creating reliable, consistent, and maintainable tests. The fixtures in this directory serve several key purposes:

- **Consistency**: Provide standardized test data across all tests that use the utils package
- **Reusability**: Reduce duplication by centralizing common test scenarios
- **Maintainability**: Simplify updates when utility functions change by centralizing test data
- **Discoverability**: Organize fixtures logically to make them easy to find and use
- **Type Safety**: Ensure all fixtures have proper TypeScript typing for improved developer experience

## Directory Structure

Fixtures are organized by utility category, with each category having its own subdirectory:

```
fixtures/
├── README.md           # This documentation file
├── index.ts            # Main barrel file that exports all fixtures
├── array/              # Array utility fixtures
│   ├── index.ts        # Barrel file for array fixtures
│   ├── basic-arrays.ts # Basic array test data
│   ├── filter-arrays.ts # Fixtures for array filtering
│   └── ...
├── date/               # Date utility fixtures
│   ├── index.ts        # Barrel file for date fixtures
│   ├── format.ts       # Date formatting fixtures
│   ├── parse.ts        # Date parsing fixtures
│   └── ...
├── validation/         # Validation utility fixtures
│   ├── index.ts        # Barrel file for validation fixtures
│   ├── email-validation.fixtures.ts # Email validation fixtures
│   ├── cpf-validation.fixtures.ts   # CPF validation fixtures
│   └── ...
└── ...
```

Each subdirectory contains:

1. An `index.ts` barrel file that exports all fixtures from that category
2. Individual fixture files for specific utility functions or test scenarios
3. TypeScript interfaces and types for the fixtures

## Importing Fixtures

Fixtures can be imported in several ways, depending on your needs:

### Import All Fixtures

To import all fixtures from a specific category:

```typescript
// Import all array fixtures
import * as arrayFixtures from '@austa/utils/test/fixtures/array';

// Use a specific fixture
const { basicStringArray } = arrayFixtures;
```

### Import Specific Fixtures

To import specific fixtures directly:

```typescript
// Import specific fixtures
import { validEmails, invalidEmails } from '@austa/utils/test/fixtures/validation/email-validation.fixtures';
import { formatDateFixtures } from '@austa/utils/test/fixtures/date/format';
```

### Import via Main Barrel File

For convenience, you can import from the main barrel file:

```typescript
// Import from main barrel file
import { validEmails, formatDateFixtures, basicStringArray } from '@austa/utils/test/fixtures';
```

## Usage Examples

### Unit Tests

```typescript
import { describe, it, expect } from 'jest';
import { isValidEmail } from '@austa/utils/validation';
import { validEmails, invalidEmails } from '@austa/utils/test/fixtures/validation/email-validation.fixtures';

describe('isValidEmail', () => {
  it('should return true for valid email addresses', () => {
    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('should return false for invalid email addresses', () => {
    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'jest';
import { UserService } from '@austa/auth/users';
import { validEmails, invalidEmails } from '@austa/utils/test/fixtures/validation/email-validation.fixtures';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should create users with valid emails', async () => {
    // Test with a sample of valid emails
    const testEmail = validEmails[0];
    const user = await userService.createUser({
      email: testEmail,
      name: 'Test User',
      password: 'Password123!'
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
  });

  it('should reject users with invalid emails', async () => {
    // Test with a sample of invalid emails
    const testEmail = invalidEmails[0];
    await expect(
      userService.createUser({
        email: testEmail,
        name: 'Test User',
        password: 'Password123!'
      })
    ).rejects.toThrow();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';
import { validEmails, invalidEmails } from '@austa/utils/test/fixtures/validation/email-validation.fixtures';

test('should validate email during registration', async ({ page }) => {
  await page.goto('/register');
  
  // Test with invalid email
  await page.fill('input[name="email"]', invalidEmails[0]);
  await page.click('button[type="submit"]');
  await expect(page.locator('.error-message')).toBeVisible();
  
  // Test with valid email
  await page.fill('input[name="email"]', validEmails[0]);
  await page.click('button[type="submit"]');
  await expect(page.locator('.error-message')).not.toBeVisible();
});
```

## Journey-Specific Fixtures

Many fixtures are organized by journey context (Health, Care, Plan) to support the journey-centered architecture of the AUSTA SuperApp:

```typescript
import { healthJourneyValidation, careJourneyValidation, planJourneyValidation } 
  from '@austa/utils/test/fixtures/validation/journey-validation.fixtures';

// Test health journey-specific validation
expect(isValidHealthMetric(healthJourneyValidation.validMetrics[0])).toBe(true);

// Test care journey-specific validation
expect(isValidAppointment(careJourneyValidation.validAppointments[0])).toBe(true);

// Test plan journey-specific validation
expect(isValidClaim(planJourneyValidation.validClaims[0])).toBe(true);
```

## Maintaining and Extending Fixtures

### Adding New Fixtures

When adding new utility functions to the `@austa/utils` package, follow these steps to create corresponding test fixtures:

1. Identify the appropriate category for your fixtures (or create a new one if needed)
2. Create a new fixture file in the relevant subdirectory
3. Export your fixtures with proper TypeScript typing
4. Add your exports to the category's `index.ts` barrel file
5. Update the main `index.ts` barrel file if you created a new category

### Example: Adding New Fixtures

```typescript
// src/backend/packages/utils/test/fixtures/string/case-conversion.fixtures.ts

export interface CaseConversionFixture {
  input: string;
  camelCase: string;
  snakeCase: string;
  kebabCase: string;
  pascalCase: string;
}

export const caseConversionFixtures: CaseConversionFixture[] = [
  {
    input: 'hello world',
    camelCase: 'helloWorld',
    snakeCase: 'hello_world',
    kebabCase: 'hello-world',
    pascalCase: 'HelloWorld'
  },
  {
    input: 'user profile data',
    camelCase: 'userProfileData',
    snakeCase: 'user_profile_data',
    kebabCase: 'user-profile-data',
    pascalCase: 'UserProfileData'
  },
  // Add more fixtures as needed
];
```

Then update the barrel file:

```typescript
// src/backend/packages/utils/test/fixtures/string/index.ts

export * from './case-conversion.fixtures';
// Export other string fixtures
```

### Best Practices for Creating Fixtures

1. **Comprehensive Coverage**: Include both common cases and edge cases
2. **Type Safety**: Always define TypeScript interfaces for your fixtures
3. **Documentation**: Add JSDoc comments to explain the purpose of each fixture
4. **Immutability**: Use `const` and `readonly` to prevent accidental modification
5. **Naming Conventions**: Use descriptive names that indicate the fixture's purpose
6. **Organization**: Group related fixtures together in logical categories
7. **Reusability**: Design fixtures to be usable across multiple test scenarios
8. **Journey Awareness**: Create journey-specific fixtures when appropriate

## Creating Reliable Test Cases

When using these fixtures in your tests, follow these best practices:

1. **Isolation**: Each test should be independent and not rely on the state of other tests
2. **Deterministic**: Tests should produce the same results every time they run
3. **Focused**: Each test should verify a single aspect of functionality
4. **Readable**: Test names and assertions should clearly communicate their purpose
5. **Maintainable**: Use fixtures to reduce duplication and improve maintainability

### Example: Creating Isolated Tests

```typescript
import { describe, it, expect } from 'jest';
import { formatDate } from '@austa/utils/date';
import { formatDateFixtures } from '@austa/utils/test/fixtures/date/format';

describe('formatDate', () => {
  // Use a separate test for each format pattern
  formatDateFixtures.forEach(fixture => {
    it(`should format date correctly with pattern: ${fixture.pattern}`, () => {
      const result = formatDate(fixture.input, fixture.pattern, fixture.locale);
      expect(result).toBe(fixture.expected);
    });
  });

  // Add specific tests for edge cases
  it('should handle null input by returning empty string', () => {
    expect(formatDate(null, 'yyyy-MM-dd')).toBe('');
  });
});
```

## Contributing

When contributing new fixtures or updating existing ones:

1. Ensure your fixtures follow the organization and naming conventions in this document
2. Add comprehensive JSDoc comments to explain the purpose and usage of your fixtures
3. Include both common cases and edge cases in your fixtures
4. Update this README.md if you add new categories or significant features
5. Write tests that verify your fixtures work correctly with the corresponding utility functions

## Related Documentation

- [Testing Strategy](../../README.md): Overview of the testing approach for the utils package
- [Utils Package Documentation](../../../README.md): Documentation for the utils package
- [AUSTA SuperApp Architecture](../../../../../docs/architecture.md): Overview of the SuperApp architecture