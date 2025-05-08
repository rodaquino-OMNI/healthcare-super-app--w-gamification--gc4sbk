# @austa/utils

A comprehensive utility library for the AUSTA SuperApp ecosystem that provides standardized, type-safe utility functions used across all microservices and frontend applications.

## Overview

The `@austa/utils` package serves as the foundation for common utility functions in the AUSTA SuperApp. By centralizing these utilities, it ensures consistency, reduces code duplication, and simplifies maintenance across all services. This package implements best practices for healthcare applications while supporting the unique requirements of each journey.

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

Import utilities directly from their respective categories:

```typescript
// Import specific utilities
import { formatDate, parseDate } from '@austa/utils/date';
import { isValidCPF } from '@austa/utils/string';
import { createHttpClient } from '@austa/utils/http';

// Or import from the main entry point
import { date, string, http } from '@austa/utils';
```

## Available Utilities

### Array Utilities (`@austa/utils/array`)

Utilities for array manipulation, transformation, filtering, and chunking.

```typescript
import { 
  chunk, 
  uniqueBy, 
  groupBy, 
  flattenDeep,
  mapByKey,
  indexBy,
  filterByProperties
} from '@austa/utils/array';

// Split an array into chunks of specified size
const items = [1, 2, 3, 4, 5, 6, 7, 8];
const chunkedItems = chunk(items, 3); 
// [[1, 2, 3], [4, 5, 6], [7, 8]]

// Filter array for unique elements by a key
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 1, name: 'Alice (duplicate)' }
];
const uniqueUsers = uniqueBy(users, 'id');
// [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]

// Group array elements by a key
const appointments = [
  { providerId: 1, date: '2023-01-01' },
  { providerId: 2, date: '2023-01-02' },
  { providerId: 1, date: '2023-01-03' }
];
const appointmentsByProvider = groupBy(appointments, 'providerId');
// {
//   '1': [{ providerId: 1, date: '2023-01-01' }, { providerId: 1, date: '2023-01-03' }],
//   '2': [{ providerId: 2, date: '2023-01-02' }]
// }
```

### Date Utilities (`@austa/utils/date`)

Utilities for date formatting, parsing, validation, comparison, and calculations.

```typescript
import { 
  formatDate, 
  parseDate, 
  isValidDate,
  calculateAge,
  getTimeAgo,
  getDateRange,
  formatJourneyDate
} from '@austa/utils/date';

// Format a date with localization support
const date = new Date('2023-01-15');
const formattedDate = formatDate(date, 'dd/MM/yyyy', 'pt-BR');
// '15/01/2023'

// Parse a date string into a Date object
const dateStr = '15/01/2023';
const parsedDate = parseDate(dateStr, 'dd/MM/yyyy', 'pt-BR');
// Date object for January 15, 2023

// Calculate age from birthdate
const birthdate = new Date('1990-05-10');
const age = calculateAge(birthdate);
// 33 (or current age based on execution date)

// Format date based on journey context
const appointmentDate = new Date('2023-03-20T14:30:00');
const formattedAppointment = formatJourneyDate(appointmentDate, 'care');
// '20 de março, 14:30' (formatted according to Care journey standards)
```

### HTTP Utilities (`@austa/utils/http`)

Utilities for making HTTP requests with security, retry logic, and proper error handling.

```typescript
import { 
  createHttpClient, 
  createSecureHttpClient,
  createInternalApiClient
} from '@austa/utils/http';

// Create a basic HTTP client
const httpClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// Create a secure HTTP client with SSRF protection
const secureClient = createSecureHttpClient({
  baseURL: 'https://external-api.com',
  timeout: 3000
});

// Create a client for internal service communication
const internalClient = createInternalApiClient({
  serviceName: 'health-service',
  journey: 'health',
  timeout: 2000
});

// Make a request
const fetchUserData = async (userId: string) => {
  try {
    const response = await httpClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    // Error handling
  }
};
```

### Validation Utilities (`@austa/utils/validation`)

Utilities for validating various data types and structures.

```typescript
import { 
  isValidCPF, 
  isValidEmail,
  isValidDate,
  validateObject,
  createSchema
} from '@austa/utils/validation';

// Validate a Brazilian CPF number
const cpf = '123.456.789-09';
const isValid = isValidCPF(cpf);
// false (invalid CPF)

// Validate an email address
const email = 'user@example.com';
const isEmailValid = isValidEmail(email);
// true

// Create and use a validation schema
const userSchema = createSchema({
  name: { type: 'string', required: true },
  email: { type: 'email', required: true },
  age: { type: 'number', min: 18 }
});

const validationResult = userSchema.validate({
  name: 'João Silva',
  email: 'joao@example.com',
  age: 25
});
// { valid: true, errors: [] }
```

### String Utilities (`@austa/utils/string`)

Utilities for string manipulation, formatting, and validation.

```typescript
import { 
  capitalizeFirstLetter, 
  truncate,
  isValidCPF
} from '@austa/utils/string';

// Capitalize the first letter of a string
const name = 'joão';
const capitalized = capitalizeFirstLetter(name);
// 'João'

// Truncate a string with ellipsis
const description = 'This is a very long description that needs to be truncated';
const truncated = truncate(description, 20);
// 'This is a very long...'

// Validate a Brazilian CPF number
const cpf = '123.456.789-09';
const isValid = isValidCPF(cpf);
// false (invalid CPF)
```

### Environment Utilities (`@austa/utils/env`)

Utilities for working with environment variables in a type-safe way.

```typescript
import { 
  getEnv, 
  getRequiredEnv,
  parseBoolean,
  parseNumber,
  parseArray,
  validateEnv
} from '@austa/utils/env';

// Get an environment variable with a default value
const apiUrl = getEnv('API_URL', 'https://default-api.example.com');

// Get a required environment variable (throws if missing)
const apiKey = getRequiredEnv('API_KEY');

// Parse environment variables to specific types
const isProduction = parseBoolean(process.env.PRODUCTION);
const port = parseNumber(process.env.PORT, 3000);
const allowedOrigins = parseArray(process.env.ALLOWED_ORIGINS);

// Validate environment variables at startup
validateEnv({
  required: ['DATABASE_URL', 'JWT_SECRET'],
  optional: {
    PORT: { type: 'number', default: 3000 },
    LOG_LEVEL: { type: 'string', default: 'info' }
  }
});
```

### Object Utilities (`@austa/utils/object`)

Utilities for object manipulation, comparison, merging, and cloning.

```typescript
import { 
  deepClone, 
  deepMerge,
  isEqual,
  pick,
  omit,
  mapValues
} from '@austa/utils/object';

// Create a deep clone of an object
const original = { user: { name: 'Alice', settings: { theme: 'dark' } } };
const clone = deepClone(original);
// Modifying clone.user.settings won't affect original

// Deep merge objects
const defaults = { theme: 'light', notifications: true };
const userSettings = { theme: 'dark' };
const mergedSettings = deepMerge(defaults, userSettings);
// { theme: 'dark', notifications: true }

// Check if objects are deeply equal
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { a: 1, b: { c: 2 } };
const areEqual = isEqual(obj1, obj2);
// true

// Pick specific properties from an object
const user = { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' };
const publicUser = pick(user, ['id', 'name']);
// { id: 1, name: 'Alice' }
```

### Type Utilities (`@austa/utils/type`)

Utilities for type checking, conversion, and assertions.

```typescript
import { 
  isString, 
  isNumber,
  isObject,
  isArray,
  toString,
  toNumber,
  assertType,
  assertNonEmpty
} from '@austa/utils/type';

// Type guards
const value: unknown = 'test';
if (isString(value)) {
  // TypeScript knows value is a string here
  console.log(value.toUpperCase());
}

// Type conversion with safety
const numStr = '123';
const num = toNumber(numStr); // 123
const invalidNum = toNumber('abc', 0); // 0 (default value)

// Type assertions (throws if condition fails)
function processUser(user: unknown) {
  assertType(user, isObject, 'User must be an object');
  assertNonEmpty(user.id, 'User ID is required');
  // Process user safely...
}
```

## API Reference

### Array Utilities

#### Transformation

- `flattenDeep<T>(array: Array<T | Array<T>>): T[]` - Recursively flattens nested arrays
- `mapByKey<T>(array: T[], key: keyof T): Record<string, T>` - Maps array to object using a key
- `indexBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T>` - Creates lookup object by key function
- `pluck<T, K extends keyof T>(array: T[], key: K): T[K][]` - Extracts a property from each object

#### Grouping

- `groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]>` - Groups array items by key
- `partitionBy<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]]` - Splits array into passing/failing groups
- `keyBy<T>(array: T[], key: keyof T): Record<string, T>` - Creates lookup object with specified keys

#### Filtering

- `uniqueBy<T>(array: T[], key: keyof T | ((item: T) => any)): T[]` - Filters for unique elements
- `filterByProperties<T>(array: T[], properties: Partial<T>): T[]` - Filters objects by property values
- `rejectByProperties<T>(array: T[], properties: Partial<T>): T[]` - Inverse of filterByProperties
- `differenceBy<T>(array: T[], values: T[], key: keyof T): T[]` - Compares arrays by key

#### Chunking

- `chunk<T>(array: T[], size: number): T[][]` - Splits array into chunks of specified size
- `chunkBySize<T>(array: T[], count: number): T[][]` - Splits array into a fixed number of chunks
- `chunkByPredicate<T>(array: T[], predicate: (item: T, index: number) => boolean): T[][]` - Chunks by predicate

### Date Utilities

#### Formatting

- `formatDate(date: Date, format?: string, locale?: string): string` - Formats date to string
- `formatTime(date: Date, format?: string, locale?: string): string` - Formats time to string
- `formatDateTime(date: Date, format?: string, locale?: string): string` - Formats date and time
- `formatDateRange(startDate: Date, endDate: Date, locale?: string): string` - Formats date range
- `formatRelativeDate(date: Date, locale?: string): string` - Formats as relative time (e.g., "2 days ago")

#### Parsing

- `parseDate(dateString: string, format?: string, locale?: string): Date` - Parses string to Date

#### Validation

- `isValidDate(date: unknown): boolean` - Checks if value is valid date

#### Comparison

- `isSameDay(date1: Date, date2: Date): boolean` - Checks if dates are same calendar day
- `isDateInRange(date: Date, startDate: Date, endDate: Date): boolean` - Checks if date is in range

#### Calculation

- `calculateAge(birthdate: Date): number` - Calculates age in years from birthdate
- `getTimeAgo(date: Date, locale?: string): string` - Generates human-readable relative time

#### Range

- `getDateRange(range: DateRangeType, referenceDate?: Date): [Date, Date]` - Gets predefined date range
- `getDatesBetween(startDate: Date, endDate: Date): Date[]` - Generates array of dates in range

#### Journey-specific

- `formatJourneyDate(date: Date, journey: JourneyType): string` - Formats date for specific journey

### HTTP Utilities

- `createHttpClient(config: HttpClientConfig): AxiosInstance` - Creates HTTP client with standard config
- `createSecureHttpClient(config: HttpClientConfig): AxiosInstance` - Creates HTTP client with SSRF protection
- `createInternalApiClient(config: InternalApiConfig): AxiosInstance` - Creates client for internal services

### Validation Utilities

#### String Validation

- `isValidCPF(cpf: string): boolean` - Validates Brazilian CPF number
- `isValidEmail(email: string): boolean` - Validates email address
- `isValidUrl(url: string): boolean` - Validates URL with SSRF protection

#### Number Validation

- `isInRange(value: number, min: number, max: number): boolean` - Checks if number is in range
- `isInteger(value: number): boolean` - Checks if number is an integer
- `isPositive(value: number): boolean` - Checks if number is positive

#### Date Validation

- `isValidDate(date: unknown): boolean` - Checks if value is valid date
- `isDateInRange(date: Date, startDate: Date, endDate: Date): boolean` - Checks if date is in range
- `isFutureDate(date: Date): boolean` - Checks if date is in the future
- `isPastDate(date: Date): boolean` - Checks if date is in the past

#### Object Validation

- `validateObject<T>(obj: unknown, schema: ObjectSchema<T>): ValidationResult<T>` - Validates object against schema
- `hasRequiredProperties<T>(obj: unknown, properties: Array<keyof T>): boolean` - Checks for required properties

#### Schema Validation

- `createSchema<T>(schema: SchemaDefinition<T>): ObjectSchema<T>` - Creates validation schema

### String Utilities

- `capitalizeFirstLetter(str: string): string` - Capitalizes first letter of string
- `truncate(str: string, maxLength: number, suffix?: string): string` - Truncates string with ellipsis
- `isValidCPF(cpf: string): boolean` - Validates Brazilian CPF number

### Environment Utilities

- `getEnv<T>(name: string, defaultValue?: T): T` - Gets environment variable with default
- `getRequiredEnv(name: string): string` - Gets required environment variable (throws if missing)
- `parseBoolean(value: string | undefined): boolean` - Parses string to boolean
- `parseNumber(value: string | undefined, defaultValue?: number): number` - Parses string to number
- `parseArray(value: string | undefined, separator?: string): string[]` - Parses string to array
- `parseJson<T>(value: string | undefined, defaultValue?: T): T` - Parses string to JSON object
- `validateEnv(schema: EnvSchema): EnvValidationResult` - Validates environment variables

### Object Utilities

- `deepClone<T>(obj: T): T` - Creates deep clone of object
- `deepMerge<T>(...objects: Partial<T>[]): T` - Deeply merges objects
- `isEqual(obj1: unknown, obj2: unknown): boolean` - Checks if objects are deeply equal
- `getDifferences(obj1: object, obj2: object): object` - Identifies differences between objects
- `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>` - Picks specified properties
- `omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>` - Omits specified properties
- `mapValues<T, R>(obj: Record<string, T>, fn: (value: T, key: string) => R): Record<string, R>` - Maps object values

### Type Utilities

#### Type Guards

- `isString(value: unknown): value is string` - Checks if value is string
- `isNumber(value: unknown): value is number` - Checks if value is number
- `isBoolean(value: unknown): value is boolean` - Checks if value is boolean
- `isObject(value: unknown): value is object` - Checks if value is object (not null, not array)
- `isArray<T>(value: unknown): value is T[]` - Checks if value is array
- `isFunction(value: unknown): value is Function` - Checks if value is function
- `isDate(value: unknown): value is Date` - Checks if value is Date object
- `isEmpty(value: unknown): boolean` - Checks if value is empty (null, undefined, '', [], {})

#### Type Conversion

- `toString(value: unknown, defaultValue?: string): string` - Converts value to string
- `toNumber(value: unknown, defaultValue?: number): number` - Converts value to number
- `toBoolean(value: unknown, defaultValue?: boolean): boolean` - Converts value to boolean
- `toArray<T>(value: T | T[]): T[]` - Ensures value is an array

#### Type Assertions

- `assertType<T>(value: unknown, guard: (value: unknown) => value is T, message?: string): asserts value is T` - Asserts type
- `assertNonEmpty<T>(value: T | null | undefined, message?: string): asserts value is T` - Asserts non-empty
- `assertNever(value: never, message?: string): never` - For exhaustive checks

## Best Practices

### Importing Utilities

For better tree-shaking and bundle size optimization, import only the specific utilities you need:

```typescript
// Preferred: Import specific utilities
import { formatDate, parseDate } from '@austa/utils/date';
import { isValidCPF } from '@austa/utils/string';

// Avoid: Importing entire categories unless needed
import { date, string } from '@austa/utils';
```

### Error Handling

Most utilities include built-in error handling, but you should still implement proper try/catch blocks for critical operations:

```typescript
import { parseJson } from '@austa/utils/env';

try {
  const config = parseJson(process.env.APP_CONFIG);
  // Use config safely
} catch (error) {
  // Handle parsing error
  console.error('Invalid APP_CONFIG format:', error);
  // Provide fallback or exit gracefully
}
```

### Journey-Specific Utilities

When working with journey-specific functionality, use the appropriate journey context:

```typescript
import { formatJourneyDate } from '@austa/utils/date';

// Format date according to Care journey standards
const appointmentDate = formatJourneyDate(new Date(), 'care');

// Format date according to Health journey standards
const healthMetricDate = formatJourneyDate(new Date(), 'health');
```

### Validation Chains

Combine validation utilities for complex validation scenarios:

```typescript
import { isString, isNonEmpty } from '@austa/utils/validation';

function validateUsername(username: unknown): boolean {
  return (
    isString(username) &&
    isNonEmpty(username) &&
    username.length >= 3 &&
    username.length <= 20
  );
}
```

## Integration with Other AUSTA Packages

### With @austa/interfaces

```typescript
import { HealthMetric } from '@austa/interfaces/health';
import { isObject, assertType } from '@austa/utils/type';
import { validateObject } from '@austa/utils/validation';

function processHealthMetric(data: unknown): HealthMetric {
  // Type guard approach
  if (!isObject(data)) {
    throw new Error('Invalid health metric data');
  }
  
  // Assertion approach (throws if invalid)
  assertType(data, isObject, 'Health metric must be an object');
  
  // Validation approach
  const validationResult = validateObject<HealthMetric>(data, healthMetricSchema);
  if (!validationResult.valid) {
    throw new Error(`Invalid health metric: ${validationResult.errors.join(', ')}`);
  }
  
  return data as HealthMetric;
}
```

### With @austa/journey-context

```typescript
import { useJourneyContext } from '@austa/journey-context';
import { formatJourneyDate } from '@austa/utils/date';

function AppointmentDisplay({ date }: { date: Date }) {
  const { journey } = useJourneyContext();
  
  // Format date based on current journey context
  const formattedDate = formatJourneyDate(date, journey);
  
  return <div>{formattedDate}</div>;
}
```

### With @austa/errors

```typescript
import { BusinessError } from '@austa/errors';
import { isValidCPF } from '@austa/utils/validation';

function validateUserDocument(cpf: string): void {
  if (!isValidCPF(cpf)) {
    throw new BusinessError(
      'Invalid CPF number provided',
      'USER_001',
      { field: 'cpf', value: cpf }
    );
  }
}
```

## Contributing

When extending the utils package:

1. Place new utilities in the appropriate category folder
2. Maintain backward compatibility
3. Include comprehensive tests for all new utilities
4. Document all public APIs with JSDoc comments
5. Update this README with examples for significant additions

## License

This package is part of the AUSTA SuperApp ecosystem and is subject to the same licensing terms as the main project.