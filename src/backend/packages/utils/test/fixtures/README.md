# Test Fixtures for @austa/utils

This directory contains standardized test fixtures for all utility functions in the `@austa/utils` package. These fixtures provide consistent, reusable test data to ensure reliable testing across unit, integration, and end-to-end tests.

## Overview

Test fixtures are organized by utility category, with each category having its own directory containing specialized fixture files. This structure ensures that test data is properly organized, easily discoverable, and maintainable as the codebase evolves.

## Directory Structure

```
fixtures/
├── array/              # Array utility fixtures
│   ├── basic-arrays.ts       # Common array types (empty, strings, numbers, objects)
│   ├── edge-case-arrays.ts   # Arrays with null, undefined, NaN values
│   ├── filter-arrays.ts      # Arrays for testing filter operations
│   ├── find-arrays.ts        # Arrays for testing find operations
│   ├── map-arrays.ts         # Arrays for testing map transformations
│   ├── reduce-arrays.ts      # Arrays for testing reduce operations
│   ├── sort-arrays.ts        # Arrays for testing sort operations
│   └── index.ts              # Barrel file exporting all array fixtures
├── date/               # Date utility fixtures
│   ├── calculation.ts        # Age calculation and relative time fixtures
│   ├── common-dates.ts       # Reusable date constants
│   ├── comparison.ts         # Date equality and range testing
│   ├── format.ts             # Date formatting with expected outputs
│   ├── journey.ts            # Journey-specific date formatting
│   ├── parse.ts              # Date string parsing fixtures
│   ├── range.ts              # Date range fixtures
│   ├── timezone.ts           # Timezone handling fixtures
│   ├── validation.ts         # Valid and invalid date representations
│   └── index.ts              # Barrel file exporting all date fixtures
├── env/                # Environment utility fixtures
├── http/               # HTTP utility fixtures
├── object/             # Object utility fixtures
├── string/             # String utility fixtures
├── type/               # Type utility fixtures
├── validation/         # Validation utility fixtures
│   ├── config-validation.fixtures.ts    # Service configuration validation
│   ├── cpf-validation.fixtures.ts       # Brazilian CPF validation
│   ├── date-validation.fixtures.ts      # Date format validation
│   ├── email-validation.fixtures.ts     # Email validation
│   ├── input-sanitization.fixtures.ts   # Security validation (XSS, injection)
│   ├── journey-validation.fixtures.ts   # Journey-specific validation
│   ├── password-validation.fixtures.ts  # Password strength validation
│   └── index.ts                         # Barrel file exporting all validation fixtures
└── index.ts            # Root barrel file exporting all fixtures
```

## Usage

### Importing Fixtures

All fixtures can be imported from a single entry point:

```typescript
// Import all fixtures
import * as fixtures from '@austa/utils/test/fixtures';

// Import specific category fixtures
import { arrayFixtures } from '@austa/utils/test/fixtures';

// Import specific fixtures directly
import { basicArrays } from '@austa/utils/test/fixtures/array';
```

### Using Fixtures in Tests

#### Unit Tests

```typescript
import { describe, it, expect } from 'jest';
import { findById } from '@austa/utils/array';
import { findArrays } from '@austa/utils/test/fixtures/array';

describe('findById', () => {
  it('should find an object by id property', () => {
    const { arrayWithIds, targetId, expectedObject } = findArrays.objectsWithIds;
    
    const result = findById(arrayWithIds, targetId);
    
    expect(result).toEqual(expectedObject);
  });
  
  it('should return undefined when id not found', () => {
    const { arrayWithIds, nonExistentId } = findArrays.objectsWithIds;
    
    const result = findById(arrayWithIds, nonExistentId);
    
    expect(result).toBeUndefined();
  });
});
```

#### Integration Tests

```typescript
import { describe, it, expect } from 'jest';
import { UserService } from '../services/user.service';
import { PrismaService } from '@austa/database';
import { validationFixtures } from '@austa/utils/test/fixtures';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;
  
  beforeEach(() => {
    prismaService = new PrismaService();
    userService = new UserService(prismaService);
  });
  
  describe('validateUserEmail', () => {
    it('should accept valid emails', async () => {
      // Use email validation fixtures
      const { validEmails } = validationFixtures.emailValidation;
      
      for (const email of validEmails) {
        const result = await userService.validateUserEmail(email);
        expect(result.isValid).toBe(true);
      }
    });
    
    it('should reject invalid emails', async () => {
      // Use email validation fixtures
      const { invalidEmails } = validationFixtures.emailValidation;
      
      for (const email of invalidEmails) {
        const result = await userService.validateUserEmail(email);
        expect(result.isValid).toBe(false);
      }
    });
  });
});
```

#### E2E Tests

```typescript
import { test, expect } from '@playwright/test';
import { dateFixtures } from '@austa/utils/test/fixtures';

test('appointment booking should validate date format', async ({ page }) => {
  await page.goto('/care/appointments/new');
  
  // Use date validation fixtures for testing form validation
  const { invalidDateFormats } = dateFixtures.validation;
  
  for (const invalidDate of invalidDateFormats) {
    await page.fill('[data-testid="appointment-date"]', invalidDate);
    await page.click('[data-testid="submit-button"]');
    
    // Check that validation error is displayed
    const errorMessage = await page.textContent('[data-testid="date-error"]');
    expect(errorMessage).toContain('Invalid date format');
  }
});
```

## Maintaining and Extending Fixtures

### Guidelines for Creating New Fixtures

1. **Organization**: Place fixtures in the appropriate category directory. Create a new directory if needed for a new utility category.

2. **Naming Conventions**:
   - Use descriptive names that clearly indicate the fixture's purpose
   - Follow the pattern: `[utility-type]-[specific-purpose].ts`
   - For validation fixtures, use the pattern: `[validation-type]-validation.fixtures.ts`

3. **TypeScript Typing**:
   - Define interfaces for all fixture data structures
   - Export typed constants to ensure type safety in tests
   - Use namespaced exports to prevent naming collisions

4. **Documentation**:
   - Add JSDoc comments to explain the purpose of each fixture
   - Include examples of how to use complex fixtures
   - Document any assumptions or edge cases

5. **Barrel Files**:
   - Update the category's `index.ts` to export new fixtures
   - Ensure the root `index.ts` exports the category if it's new

### Example: Creating a New Fixture File

```typescript
// src/backend/packages/utils/test/fixtures/string/email-templates.ts

/**
 * Test fixtures for email template string utilities.
 * Provides sample templates with variables and their expected outputs.
 */

// Define interfaces for the fixture data structure
export interface EmailTemplateFixture {
  template: string;
  variables: Record<string, string>;
  expectedResult: string;
}

export interface EmailTemplateFixtures {
  simpleTemplates: EmailTemplateFixture[];
  complexTemplates: EmailTemplateFixture[];
  invalidTemplates: {
    templates: string[];
    errorMessages: string[];
  };
}

// Export the fixtures with proper typing
export const emailTemplates: EmailTemplateFixtures = {
  simpleTemplates: [
    {
      template: 'Hello, {{name}}!',
      variables: { name: 'John' },
      expectedResult: 'Hello, John!',
    },
    // More examples...
  ],
  complexTemplates: [
    {
      template: 'Dear {{name}}, your appointment is on {{date}} at {{time}}.',
      variables: { name: 'Maria', date: '15/04/2023', time: '14:30' },
      expectedResult: 'Dear Maria, your appointment is on 15/04/2023 at 14:30.',
    },
    // More examples...
  ],
  invalidTemplates: {
    templates: [
      'Hello, {{name!',  // Missing closing bracket
      'Hello, name}}',   // Missing opening bracket
    ],
    errorMessages: [
      'Invalid template syntax: missing closing bracket',
      'Invalid template syntax: missing opening bracket',
    ],
  },
};
```

Then update the barrel file:

```typescript
// src/backend/packages/utils/test/fixtures/string/index.ts

export * from './email-templates';
export * from './formatting';
// Other exports...
```

## Best Practices

### Creating Reliable Test Cases

1. **Isolation**: Ensure fixtures don't depend on external state or other fixtures unless explicitly designed to test such dependencies.

2. **Deterministic Results**: Fixtures should produce consistent, predictable results. Avoid random data or time-dependent values unless specifically testing such scenarios.

3. **Comprehensive Coverage**: Include both common cases and edge cases in your fixtures to ensure thorough testing.

4. **Journey-Specific Considerations**: When creating fixtures for journey-specific utilities, ensure they reflect the unique requirements of each journey (Health, Care, Plan).

5. **Localization Support**: Include fixtures for both Portuguese (pt-BR) and English (en-US) where applicable, especially for date, currency, and text formatting utilities.

### Using Fixtures Effectively

1. **Reuse Over Duplication**: Always use existing fixtures when possible instead of creating inline test data.

2. **Parameterized Tests**: Use fixtures with parameterized tests to run the same test logic against multiple data sets.

3. **Descriptive Test Names**: Include information about which fixture is being used in the test name for better test documentation.

4. **Fixture Combinations**: Combine fixtures when testing interactions between different utilities.

5. **Snapshot Testing**: Use fixtures with snapshot testing for complex output validation.

## Contributing

When adding or modifying fixtures:

1. Ensure all fixtures follow the established patterns and conventions
2. Add comprehensive JSDoc comments to explain the fixture's purpose and usage
3. Update relevant barrel files to export new fixtures
4. Include examples of how to use complex fixtures in the fixture file's documentation
5. Consider adding tests for the fixtures themselves if they contain complex logic

## Related Documentation

- [Testing Strategy](../../docs/testing-strategy.md)
- [Utility Development Guide](../../docs/utility-development.md)
- [Journey-Specific Testing](../../../docs/journey-testing.md)