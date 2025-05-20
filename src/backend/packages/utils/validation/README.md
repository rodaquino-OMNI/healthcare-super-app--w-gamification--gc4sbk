# @austa/utils/validation

A comprehensive validation library for the AUSTA SuperApp ecosystem that provides standardized, type-safe validation utilities for ensuring data integrity across all microservices and frontend applications.

## Overview

The `@austa/utils/validation` module serves as the foundation for consistent data validation throughout the AUSTA SuperApp. It provides a unified approach to validating user inputs, API payloads, configuration values, and database records. By centralizing validation logic, it ensures consistency, reduces code duplication, and simplifies maintenance across all services while supporting the unique requirements of each journey.

## Key Features

### String Validation (`@austa/utils/validation/string`)

Provides utilities for validating string values with support for:

- Length constraints (min, max, exact)
- Pattern matching (regex, predefined patterns)
- Format validation (email, URL, phone number)
- Content restrictions (alphanumeric, numeric only)
- Sanitization functions (trim, normalize)

### Number Validation (`@austa/utils/validation/number`)

Utilities for validating numeric values:

- Range validation (min, max, between)
- Type checking (integer, float, positive, negative)
- Precision validation (decimal places)
- Special value handling (NaN, Infinity)
- Unit-specific validation (percentage, currency)

### Date Validation (`@austa/utils/validation/date`)

Functions for validating date and time values:

- Range validation (before, after, between)
- Format validation (ISO, custom formats)
- Relative date validation (past, future, today)
- Duration and interval validation
- Timezone-aware validation

### Object Validation (`@austa/utils/validation/object`)

Utilities for validating complex object structures:

- Property existence validation
- Nested property validation
- Type checking for properties
- Structure validation
- Deep equality checking

### Schema Validation (`@austa/utils/validation/schema`)

Integration with schema validation libraries:

- Zod schema validation
- Yup schema validation
- Joi schema validation
- Class-validator integration
- Custom schema definition

## Installation

```bash
# npm
npm install @austa/utils

# yarn
yarn add @austa/utils

# pnpm
pnpm add @austa/utils
```

## Usage

### Basic Validation

```typescript
import { string, number, date, object } from '@austa/utils/validation';

// String validation
const isValidEmail = string.isEmail('user@example.com'); // true
const isValidPhone = string.isPhoneNumber('+5511987654321', 'BR'); // true

// Number validation
const isInRange = number.isBetween(25, 18, 65); // true
const isValidPercentage = number.isPercentage(85.5); // true

// Date validation
const isValidDate = date.isISODate('2023-05-15'); // true
const isFutureDate = date.isFuture('2025-12-31'); // true

// Object validation
const user = { id: 123, name: 'John', email: 'john@example.com' };
const hasRequiredProps = object.hasProperties(user, ['id', 'name', 'email']); // true
```

### Schema Validation with Zod

```typescript
import { schema } from '@austa/utils/validation';
import { z } from 'zod';

// Define a schema
const userSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().min(18).optional(),
});

// Validate data against schema
const userData = { id: 123, name: 'John', email: 'john@example.com' };
const result = schema.validateWithZod(userData, userSchema);

if (result.success) {
  // Data is valid, use result.data
  console.log('Valid user:', result.data);
} else {
  // Data is invalid, handle errors
  console.error('Validation errors:', result.errors);
}
```

### Integration with NestJS

```typescript
import { Injectable } from '@nestjs/common';
import { string, object } from '@austa/utils/validation';
import { ValidationError } from '@austa/errors';

@Injectable()
export class UserService {
  async createUser(userData: any): Promise<User> {
    // Validate required fields
    if (!object.hasProperties(userData, ['name', 'email'])) {
      throw new ValidationError('Missing required fields', 'USER_001');
    }
    
    // Validate email format
    if (!string.isEmail(userData.email)) {
      throw new ValidationError('Invalid email format', 'USER_002', {
        field: 'email'
      });
    }
    
    // Continue with user creation
    // ...
  }
}
```

### Integration with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schema } from '@austa/utils/validation';
import { z } from 'zod';

// Define a schema for the form
const appointmentSchema = z.object({
  patientName: z.string().min(2, 'Name must have at least 2 characters'),
  appointmentDate: z.string().refine(
    (date) => schema.date.isFuture(date),
    { message: 'Appointment date must be in the future' }
  ),
  providerId: z.string().uuid('Invalid provider ID'),
  notes: z.string().optional(),
});

// Use the schema with React Hook Form
function AppointmentForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(appointmentSchema)
  });
  
  const onSubmit = (data) => {
    // Form data is already validated
    console.log('Valid appointment data:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Journey-Specific Validation

The validation library supports journey-specific validation rules while maintaining a consistent API:

### Health Journey Validation

```typescript
import { health } from '@austa/utils/validation/journey';

// Validate health metrics
const isValidBloodPressure = health.isValidBloodPressure('120/80'); // true
const isValidGlucoseLevel = health.isValidGlucoseLevel(95, 'mg/dL'); // true

// Validate health goals
const isValidStepGoal = health.isValidStepGoal(10000); // true
```

### Care Journey Validation

```typescript
import { care } from '@austa/utils/validation/journey';

// Validate appointment data
const isValidAppointmentTime = care.isValidAppointmentTime('2023-06-15T14:30:00', 'telemedicine'); // true

// Validate provider information
const isValidSpecialty = care.isValidSpecialty('cardiology'); // true
```

### Plan Journey Validation

```typescript
import { plan } from '@austa/utils/validation/journey';

// Validate insurance information
const isValidPolicyNumber = plan.isValidPolicyNumber('POL-123456789'); // true

// Validate claim data
const isValidClaimAmount = plan.isValidClaimAmount(1250.75, 'BRL'); // true
```

## Cross-Journey Validation

For validation that spans multiple journeys, use the cross-journey validators:

```typescript
import { crossJourney } from '@austa/utils/validation/journey';

// Validate user profile data used across journeys
const isValidUserProfile = crossJourney.isValidUserProfile({
  name: 'Maria Silva',
  birthDate: '1985-03-22',
  gender: 'female',
  contactInfo: {
    email: 'maria@example.com',
    phone: '+5511987654321'
  }
}); // true

// Validate notification preferences across journeys
const isValidNotificationPrefs = crossJourney.isValidNotificationPreferences({
  email: true,
  push: true,
  sms: false,
  journeyPreferences: {
    health: ['achievements', 'reminders'],
    care: ['appointments', 'prescriptions'],
    plan: ['claims', 'coverage']
  }
}); // true
```

## Best Practices

### Consistent Error Handling

Use the `@austa/errors` package with validation functions for consistent error handling:

```typescript
import { string } from '@austa/utils/validation';
import { ValidationError } from '@austa/errors';

function validateUsername(username: string): void {
  if (!string.isAlphanumeric(username)) {
    throw new ValidationError(
      'Username must contain only letters and numbers',
      'AUTH_001',
      { field: 'username' }
    );
  }
  
  if (!string.isLengthBetween(username, 3, 20)) {
    throw new ValidationError(
      'Username must be between 3 and 20 characters',
      'AUTH_002',
      { field: 'username', min: 3, max: 20 }
    );
  }
}
```

### Composing Validators

Combine multiple validators for complex validation rules:

```typescript
import { string, date } from '@austa/utils/validation';

function isValidPasswordResetToken(token: string): boolean {
  return (
    string.isUUID(token) && // Must be a valid UUID
    string.isLengthEqual(token, 36) && // Must be exactly 36 characters
    date.isWithinPast(token.split('-')[0], { hours: 24 }) // First segment contains timestamp, must be within 24 hours
  );
}
```

### Performance Optimization

For performance-critical code paths, use the optimized validators:

```typescript
import { optimized } from '@austa/utils/validation';

// Process large batches of data with optimized validators
const results = largeDataset.filter(item => {
  return optimized.string.isEmail(item.email);
});
```

## Troubleshooting

### Common Issues

1. **Incorrect Import Paths**

   Ensure you're using the correct import paths for validators:

   ```typescript
   // Correct imports
   import { string } from '@austa/utils/validation';
   import { isEmail } from '@austa/utils/validation/string';
   
   // Incorrect imports
   import { string } from '@austa/utils'; // Too general
   import { isEmail } from '@austa/validation'; // Wrong package
   ```

2. **Type Compatibility Issues**

   Make sure you're passing the correct types to validation functions:

   ```typescript
   import { number } from '@austa/utils/validation';
   
   // Correct usage
   const isValid = number.isPositive(42); // true
   
   // Incorrect usage - string passed to number validator
   const isInvalid = number.isPositive('42'); // Type error
   ```

3. **Custom Validation Logic**

   For complex validation requirements, create custom validators using the base utilities:

   ```typescript
   import { string, date } from '@austa/utils/validation';
   
   function isValidBrazilianID(id: string): boolean {
     // Custom validation logic for Brazilian IDs (CPF/CNPJ)
     return string.isNumeric(id) && 
            (id.length === 11 || id.length === 14) &&
            // Additional CPF/CNPJ validation algorithm
            validateBrazilianIDChecksum(id);
   }
   ```

## Contributing

When extending the validation module:

1. Follow the established patterns for validator implementation
2. Include comprehensive unit tests for all validators
3. Document all public APIs with JSDoc comments
4. Maintain backward compatibility
5. Consider performance implications for frequently used validators

### Adding New Validators

1. Create or update the appropriate validator file (e.g., `string.validator.ts`)
2. Implement the validator function with proper typing
3. Add unit tests in the corresponding test file
4. Update the barrel exports in `index.ts`
5. Document the new validator in this README

## Technologies

- TypeScript 5.3.3+
- Zod 3.22.4+
- Yup 1.3.3+
- Joi 17.12.2+
- class-validator 0.14.1+

## License

Internal use only - AUSTA SuperApp