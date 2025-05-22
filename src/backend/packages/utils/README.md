# @austa/utils

A comprehensive utility library for the AUSTA SuperApp ecosystem that provides standardized, type-safe utility functions used across all microservices and frontend applications.

## Overview

The `@austa/utils` package serves as the foundation for common operations in the AUSTA SuperApp, providing consistent implementations for string manipulation, date formatting, HTTP requests, validation, and more. By centralizing these utilities, we ensure consistent behavior, reduce code duplication, and simplify maintenance across all services.

This package is designed to work seamlessly with the journey-centered architecture of the AUSTA SuperApp, with specific utilities tailored for health, care, and plan journeys where appropriate.

## Installation

```bash
# npm
npm install @austa/utils

# yarn
yarn add @austa/utils

# pnpm
pnpm add @austa/utils
```

## Quick Start

```typescript
// Import specific utilities
import { formatDate } from '@austa/utils/date';
import { isValidCPF } from '@austa/utils/string';
import { createSecureHttpClient } from '@austa/utils/http';

// Or import from categories
import * as dateUtils from '@austa/utils/date';
import * as stringUtils from '@austa/utils/string';
import * as httpUtils from '@austa/utils/http';

// Example usage
const formattedDate = formatDate(new Date(), 'dd/MM/yyyy');
const isValid = isValidCPF('123.456.789-09');
const httpClient = createSecureHttpClient({ baseURL: 'https://api.example.com' });
```

## Available Utilities

### Array Utilities

Utilities for array manipulation, transformation, filtering, and grouping.

```typescript
import { chunk, uniqueBy, groupBy, flattenDeep } from '@austa/utils/array';

// Split array into chunks of size 2
const chunks = chunk([1, 2, 3, 4, 5, 6], 2);
// Result: [[1, 2], [3, 4], [5, 6]]

// Get unique objects by a key
const uniqueUsers = uniqueBy(
  [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 1, name: 'Alice (duplicate)' }
  ],
  'id'
);
// Result: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]

// Group objects by a key
const groupedByAge = groupBy(
  [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 30 }
  ],
  'age'
);
// Result: { '25': [{ name: 'Bob', age: 25 }], '30': [{ name: 'Alice', age: 30 }, { name: 'Charlie', age: 30 }] }

// Flatten nested arrays
const flattened = flattenDeep([1, [2, [3, [4]], 5]]);
// Result: [1, 2, 3, 4, 5]
```

### Date Utilities

Utilities for date formatting, parsing, comparison, and manipulation with support for Brazilian Portuguese localization.

```typescript
import {
  formatDate,
  parseDate,
  isDateInRange,
  calculateAge,
  getTimeAgo,
  formatJourneyDate
} from '@austa/utils/date';

// Format a date
const formatted = formatDate(new Date(), 'dd/MM/yyyy');
// Result: '22/05/2025'

// Parse a date string
const date = parseDate('22/05/2025', 'dd/MM/yyyy');

// Check if a date is in range
const isInRange = isDateInRange(
  new Date(),
  new Date('2025-01-01'),
  new Date('2025-12-31')
);

// Calculate age from birthdate
const age = calculateAge(new Date('1990-05-22'));

// Get relative time
const timeAgo = getTimeAgo(new Date('2025-05-20'), 'pt-BR');
// Result: '2 dias atrás'

// Format date based on journey context
const healthDate = formatJourneyDate(new Date(), 'health');
// Result: Format optimized for health journey
```

### HTTP Utilities

Utilities for making HTTP requests with built-in security, error handling, and retry mechanisms.

```typescript
import {
  createHttpClient,
  createSecureHttpClient,
  createInternalApiClient
} from '@austa/utils/http';

// Create a basic HTTP client
const httpClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// Create a secure HTTP client with SSRF protection
const secureClient = createSecureHttpClient({
  baseURL: 'https://api.external-service.com',
  timeout: 3000
});

// Create a client for internal service communication
const internalClient = createInternalApiClient({
  serviceName: 'health-service',
  journey: 'health'
});

// Make requests
async function fetchData() {
  try {
    const response = await httpClient.get('/users');
    return response.data;
  } catch (error) {
    // Error handling
  }
}
```

### String Utilities

Utilities for string manipulation, validation, and formatting.

```typescript
import {
  isValidCPF,
  capitalizeFirstLetter,
  truncate
} from '@austa/utils/string';

// Validate a Brazilian CPF
const isValid = isValidCPF('123.456.789-09');

// Capitalize first letter
const capitalized = capitalizeFirstLetter('hello world');
// Result: 'Hello world'

// Truncate a string
const truncated = truncate('This is a long text that will be truncated', 20);
// Result: 'This is a long text...'
```

### Validation Utilities

Utilities for data validation with support for schema-based validation, object validation, and common data types.

```typescript
import { createSchema, validateObject } from '@austa/utils/validation';
import { z } from 'zod';

// Create a validation schema
const userSchema = createSchema({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18)
});

// Validate an object against the schema
const validationResult = validateObject(
  { name: 'Alice', email: 'alice@example.com', age: 25 },
  userSchema
);

// Validate common data types
import {
  isValidCNPJ,
  isValidPhone,
  isValidPostalCode
} from '@austa/utils/validation';

const isCNPJValid = isValidCNPJ('12.345.678/0001-90');
const isPhoneValid = isValidPhone('+55 11 98765-4321');
const isPostalCodeValid = isValidPostalCode('01234-567');
```

### Environment Utilities

Utilities for working with environment variables, including type conversion, validation, and journey-specific configuration.

```typescript
import {
  getEnv,
  getRequiredEnv,
  parseBoolean,
  parseNumber,
  parseArray
} from '@austa/utils/env';

// Get environment variables with type conversion
const apiUrl = getEnv('API_URL', 'https://default-api.example.com');
const port = getEnv('PORT', '3000', parseNumber);
const isProduction = getEnv('NODE_ENV', 'development') === 'production';
const debug = getEnv('DEBUG', 'false', parseBoolean);
const allowedOrigins = getEnv('ALLOWED_ORIGINS', '', parseArray);

// Get required environment variables (throws if missing)
const databaseUrl = getRequiredEnv('DATABASE_URL');

// Get journey-specific environment variables
import { getJourneyEnv } from '@austa/utils/env';

const healthApiKey = getJourneyEnv('health', 'API_KEY');
const careApiKey = getJourneyEnv('care', 'API_KEY');
const planApiKey = getJourneyEnv('plan', 'API_KEY');
```

### Object Utilities

Utilities for object manipulation, comparison, merging, and cloning.

```typescript
import {
  deepClone,
  deepMerge,
  isEqual,
  pick,
  omit
} from '@austa/utils/object';

// Deep clone an object
const original = { user: { name: 'Alice', settings: { theme: 'dark' } } };
const clone = deepClone(original);

// Deep merge objects
const merged = deepMerge(
  { user: { name: 'Alice', age: 30 } },
  { user: { age: 31, settings: { theme: 'dark' } } }
);
// Result: { user: { name: 'Alice', age: 31, settings: { theme: 'dark' } } }

// Check if objects are equal
const areEqual = isEqual(
  { name: 'Alice', age: 30 },
  { age: 30, name: 'Alice' }
);
// Result: true

// Pick specific properties
const picked = pick({ name: 'Alice', age: 30, email: 'alice@example.com' }, ['name', 'email']);
// Result: { name: 'Alice', email: 'alice@example.com' }

// Omit specific properties
const omitted = omit({ name: 'Alice', age: 30, email: 'alice@example.com' }, ['age']);
// Result: { name: 'Alice', email: 'alice@example.com' }
```

### Type Utilities

Utilities for type checking, conversion, and assertions.

```typescript
import {
  isString,
  isNumber,
  isObject,
  isArray,
  assertType,
  convertToNumber
} from '@austa/utils/type';

// Type guards
const value: unknown = 'hello';

if (isString(value)) {
  // TypeScript knows value is a string here
  console.log(value.toUpperCase());
}

// Type assertions
try {
  assertType(value, isString, 'Value must be a string');
  // If we get here, TypeScript knows value is a string
} catch (error) {
  // Handle error
}

// Type conversion
const num = convertToNumber('123', 0); // Returns 123
const defaultNum = convertToNumber('not a number', 0); // Returns 0
```

## Best Practices

### Importing Utilities

Prefer importing specific utilities rather than entire categories to enable better tree-shaking:

```typescript
// Good: Import only what you need
import { formatDate, parseDate } from '@austa/utils/date';

// Avoid: Importing the entire category
import * as dateUtils from '@austa/utils/date';
```

### Error Handling

Most utilities include built-in error handling, but you should still handle potential exceptions:

```typescript
import { parseDate } from '@austa/utils/date';

try {
  const date = parseDate('invalid-date', 'yyyy-MM-dd');
} catch (error) {
  console.error('Failed to parse date:', error.message);
}
```

### Journey-Specific Utilities

When working with journey-specific features, use the appropriate journey context:

```typescript
import { formatJourneyDate } from '@austa/utils/date';
import { getJourneyEnv } from '@austa/utils/env';

// For health journey
const healthDate = formatJourneyDate(new Date(), 'health');
const healthConfig = getJourneyEnv('health', 'API_KEY');

// For care journey
const careDate = formatJourneyDate(new Date(), 'care');
const careConfig = getJourneyEnv('care', 'API_KEY');

// For plan journey
const planDate = formatJourneyDate(new Date(), 'plan');
const planConfig = getJourneyEnv('plan', 'API_KEY');
```

## Integration with Other AUSTA Packages

### With @austa/interfaces

```typescript
import { HealthMetric } from '@austa/interfaces/health';
import { isObject, assertType } from '@austa/utils/type';
import { validateObject } from '@austa/utils/validation';

function processHealthMetric(data: unknown): HealthMetric {
  // Validate that data is an object
  assertType(data, isObject, 'Health metric must be an object');
  
  // Validate against schema
  const validationResult = validateObject(data, healthMetricSchema);
  if (!validationResult.success) {
    throw new Error(`Invalid health metric: ${validationResult.error}`);
  }
  
  return data as HealthMetric;
}
```

### With @austa/errors

```typescript
import { BusinessError } from '@austa/errors';
import { isValidCPF } from '@austa/utils/string';

function validateUserCPF(cpf: string): void {
  if (!isValidCPF(cpf)) {
    throw new BusinessError(
      'Invalid CPF provided',
      'USER_001',
      { field: 'cpf', value: cpf }
    );
  }
}
```

### With @austa/events

```typescript
import { EventPublisher } from '@austa/events';
import { deepClone } from '@austa/utils/object';

class HealthMetricService {
  constructor(private eventPublisher: EventPublisher) {}
  
  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Store metric in database
    await this.metricRepository.save(metric);
    
    // Clone the metric to avoid mutation
    const eventPayload = deepClone(metric);
    
    // Publish event
    await this.eventPublisher.publish('health.metric.recorded', {
      userId,
      metric: eventPayload,
      timestamp: new Date()
    });
  }
}
```

## API Reference

For detailed API documentation of all utility functions, please refer to the TypeScript declaration files and JSDoc comments in the source code.

### Array Utilities

- **chunk**: Split an array into chunks of specified size
- **uniqueBy**: Filter an array for unique elements based on a key
- **groupBy**: Group array elements by a key or selector function
- **flattenDeep**: Recursively flatten nested arrays
- **filterByProperties**: Filter objects by property values
- **indexBy**: Generate lookup objects optimized for fast access by key
- **pluck**: Extract a specific property from each object in an array

### Date Utilities

- **formatDate**: Format a date to a string using specified format
- **parseDate**: Parse a string to a date using specified format
- **isDateInRange**: Check if a date is within a specified range
- **calculateAge**: Calculate age in years from a birthdate
- **getTimeAgo**: Generate human-readable relative time strings
- **formatJourneyDate**: Format date based on journey context
- **getDateRange**: Get predefined date ranges (today, yesterday, thisWeek, etc.)
- **getDatesBetween**: Generate an array of dates within a specific range
- **isValidDate**: Check if a value is a valid date

### HTTP Utilities

- **createHttpClient**: Create a basic HTTP client
- **createSecureHttpClient**: Create an HTTP client with SSRF protection
- **createInternalApiClient**: Create a client for internal service communication

### String Utilities

- **isValidCPF**: Validate a Brazilian CPF number
- **capitalizeFirstLetter**: Capitalize the first letter of a string
- **truncate**: Truncate a string to a specified length with ellipsis

### Validation Utilities

- **createSchema**: Create a validation schema using Zod
- **validateObject**: Validate an object against a schema
- **isValidCNPJ**: Validate a Brazilian CNPJ number
- **isValidPhone**: Validate a phone number
- **isValidPostalCode**: Validate a Brazilian postal code (CEP)

### Environment Utilities

- **getEnv**: Get an environment variable with optional type conversion
- **getRequiredEnv**: Get a required environment variable (throws if missing)
- **getJourneyEnv**: Get a journey-specific environment variable
- **parseBoolean**: Parse a string to a boolean
- **parseNumber**: Parse a string to a number
- **parseArray**: Parse a comma-separated string to an array

### Object Utilities

- **deepClone**: Create a deep copy of an object
- **deepMerge**: Merge objects deeply
- **isEqual**: Check if objects are deeply equal
- **pick**: Create a new object with selected properties
- **omit**: Create a new object without specified properties
- **mapValues**: Transform object values using a mapping function
- **filterKeys**: Create a new object with filtered keys

### Type Utilities

- **isString**: Check if a value is a string
- **isNumber**: Check if a value is a number
- **isObject**: Check if a value is an object
- **isArray**: Check if a value is an array
- **assertType**: Assert that a value is of a specific type
- **convertToNumber**: Convert a value to a number with fallback
- **convertToString**: Convert a value to a string with fallback
- **convertToBoolean**: Convert a value to a boolean with fallback

## Contributing

When extending the utilities package:

1. Keep functions focused on a single responsibility
2. Maintain backward compatibility
3. Include comprehensive tests with high coverage
4. Document all public APIs with JSDoc comments
5. Follow the established naming conventions
6. Add appropriate error handling

## License

Internal use only - AUSTA SuperApp