# @austa/validation

A comprehensive validation library for the AUSTA SuperApp ecosystem that provides standardized validation utilities, schema definitions, and integration patterns for consistent data validation across all services and journeys.

## Overview

The `@austa/validation` package serves as the foundation for data validation throughout the AUSTA SuperApp. It provides a unified approach to validation that ensures data integrity, improves error handling, and enhances the user experience across all journeys. This package implements best practices for healthcare application validation while supporting the unique requirements of each journey.

## Key Features

### Type-Safe Validators

Provides strongly-typed validation functions with consistent error handling:

- String validators (email, phone, document numbers, etc.)
- Numeric validators (ranges, integers, decimals, etc.)
- Date validators (ranges, formats, relative dates)
- Object validators (shape validation, required fields)
- Array validators (length, item validation, uniqueness)

### Schema Validation

Integrates multiple schema validation libraries with consistent interfaces:

- Zod schemas for runtime type validation with TypeScript inference
- Joi schemas for complex server-side validation
- Class-validator decorators for NestJS integration
- Yup schemas for React Hook Form integration

### Journey-Specific Validation

Provides specialized validators for each journey context:

- Health journey validators (medical IDs, health metrics)
- Care journey validators (appointment scheduling, provider credentials)
- Plan journey validators (insurance IDs, claim formats)

### Cross-Cutting Validation

Implements validation for common cross-journey concerns:

- User identity validation
- Authentication and authorization validation
- Internationalization-aware validation
- Accessibility compliance validation

## Installation

```bash
# npm
npm install @austa/validation

# yarn
yarn add @austa/validation

# pnpm
pnpm add @austa/validation
```

## Usage

### Basic Validation

Import and use individual validators for simple validation needs:

```typescript
import { StringValidators, DateValidators, NumberValidators } from '@austa/validation';

// String validation
const isValidEmail = StringValidators.isEmail('user@example.com'); // true
const isValidCPF = StringValidators.isCPF('123.456.789-00'); // false (invalid format)

// Date validation
const isValidDateRange = DateValidators.isInRange(
  new Date('2023-01-15'), 
  new Date('2023-01-01'), 
  new Date('2023-01-31')
); // true

// Number validation
const isValidAge = NumberValidators.isInRange(25, 0, 120); // true
```

### Schema Validation with Zod

Use Zod for TypeScript-integrated schema validation:

```typescript
import { SchemaValidators } from '@austa/validation';

// Define a schema for a health metric
const healthMetricSchema = SchemaValidators.zod.object({
  userId: SchemaValidators.zod.string().uuid(),
  metricType: SchemaValidators.zod.enum(['HEART_RATE', 'BLOOD_PRESSURE', 'GLUCOSE', 'WEIGHT']),
  value: SchemaValidators.zod.number().positive(),
  unit: SchemaValidators.zod.string(),
  timestamp: SchemaValidators.zod.date(),
  deviceId: SchemaValidators.zod.string().optional(),
});

// Type inference from schema
type HealthMetric = SchemaValidators.zod.infer<typeof healthMetricSchema>;

// Validate data against schema
try {
  const validatedData = healthMetricSchema.parse(inputData);
  // validatedData is typed as HealthMetric
  saveHealthMetric(validatedData);
} catch (error) {
  // Structured error handling
  const formattedErrors = SchemaValidators.formatZodError(error);
  console.error('Validation failed:', formattedErrors);
}
```

### NestJS Integration

Integrate with NestJS validation pipes and decorators:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiValidation } from '@austa/validation/nestjs';
import { AppointmentDto } from './dto/appointment.dto';

@Controller('appointments')
export class AppointmentController {
  @Post()
  @ApiValidation.ValidateBody(AppointmentDto)
  async createAppointment(@Body() appointmentData: AppointmentDto) {
    // Body is validated against AppointmentDto
    return this.appointmentService.create(appointmentData);
  }
}

// In appointment.dto.ts
import { IsString, IsDate, IsUUID, IsOptional } from '@austa/validation/decorators';

export class AppointmentDto {
  @IsUUID()
  providerId: string;
  
  @IsUUID()
  patientId: string;
  
  @IsDate()
  appointmentDate: Date;
  
  @IsString()
  @IsOptional()
  notes?: string;
}
```

### React Hook Form Integration

Use with React Hook Form for frontend validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormValidators } from '@austa/validation/react';

// Define form schema
const loginSchema = FormValidators.zod.object({
  email: FormValidators.zod.string()
    .email('Please enter a valid email address')
    .nonempty('Email is required'),
  password: FormValidators.zod.string()
    .min(8, 'Password must be at least 8 characters')
    .nonempty('Password is required'),
});

type LoginFormValues = FormValidators.zod.infer<typeof loginSchema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    // Form data is validated
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" {...register('email')} />
        {errors.email && <p>{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register('password')} />
        {errors.password && <p>{errors.password.message}</p>}
      </div>
      <button type="submit">Login</button>
    </form>
  );
}
```

### Journey-Specific Validation

Use specialized validators for journey-specific data:

```typescript
import { HealthValidators, CareValidators, PlanValidators } from '@austa/validation/journey';

// Health journey validation
const isValidBloodPressure = HealthValidators.isValidBloodPressureReading('120/80'); // true
const isValidGlucose = HealthValidators.isValidGlucoseLevel(95, 'mg/dL'); // true

// Care journey validation
const isValidProviderCode = CareValidators.isValidProviderIdentifier('CRM-12345-SP'); // true
const isValidAppointmentSlot = CareValidators.isValidTimeSlot('2023-05-15T14:30:00Z', 30); // true

// Plan journey validation
const isValidPlanCode = PlanValidators.isValidInsurancePlanCode('AUSTA-PREMIUM-2023'); // true
const isValidClaimCode = PlanValidators.isValidClaimNumber('CLM-2023-123456'); // true
```

### Cross-Journey Validation

Validate data that spans multiple journeys:

```typescript
import { CrossJourneyValidators } from '@austa/validation/cross-journey';

// Validate user permissions across journeys
const canAccessHealthAndCare = CrossJourneyValidators.hasJourneyPermissions(
  userPermissions,
  ['health.read', 'care.read']
); // true/false

// Validate event data that affects multiple journeys
const isValidCrossJourneyEvent = CrossJourneyValidators.validateEventSchema(
  eventData,
  'APPOINTMENT_COMPLETED' // Event that affects both Care and Gamification
); // true/false
```

## API Reference

### String Validators

| Validator | Description | Example |
|-----------|-------------|--------|
| `isEmail(value: string)` | Validates email format | `isEmail('user@example.com')` |
| `isPhone(value: string)` | Validates phone number format | `isPhone('+5511999999999')` |
| `isCPF(value: string)` | Validates Brazilian CPF format and check digit | `isCPF('123.456.789-00')` |
| `isCNPJ(value: string)` | Validates Brazilian CNPJ format and check digit | `isCNPJ('12.345.678/0001-90')` |
| `isPostalCode(value: string)` | Validates Brazilian postal code (CEP) | `isPostalCode('12345-678')` |
| `isURL(value: string)` | Validates URL format | `isURL('https://example.com')` |
| `isStrongPassword(value: string)` | Validates password strength | `isStrongPassword('P@ssw0rd123!')` |
| `matches(value: string, pattern: RegExp)` | Validates string against pattern | `matches('ABC123', /^[A-Z0-9]+$/)` |
| `isLength(value: string, min: number, max?: number)` | Validates string length | `isLength('test', 2, 10)` |

### Number Validators

| Validator | Description | Example |
|-----------|-------------|--------|
| `isInteger(value: number)` | Validates integer | `isInteger(42)` |
| `isFloat(value: number)` | Validates float | `isFloat(42.5)` |
| `isInRange(value: number, min: number, max: number)` | Validates number in range | `isInRange(25, 0, 100)` |
| `isPositive(value: number)` | Validates positive number | `isPositive(42)` |
| `isNegative(value: number)` | Validates negative number | `isNegative(-42)` |
| `isZero(value: number)` | Validates zero | `isZero(0)` |
| `isPercentage(value: number)` | Validates percentage (0-100) | `isPercentage(75)` |

### Date Validators

| Validator | Description | Example |
|-----------|-------------|--------|
| `isDate(value: any)` | Validates date object | `isDate(new Date())` |
| `isISOString(value: string)` | Validates ISO date string | `isISOString('2023-01-15T12:30:00Z')` |
| `isInRange(value: Date, min: Date, max: Date)` | Validates date in range | `isInRange(date, minDate, maxDate)` |
| `isFuture(value: Date)` | Validates future date | `isFuture(tomorrow)` |
| `isPast(value: Date)` | Validates past date | `isPast(yesterday)` |
| `isToday(value: Date)` | Validates today's date | `isToday(new Date())` |
| `isWeekday(value: Date)` | Validates weekday | `isWeekday(monday)` |
| `isWeekend(value: Date)` | Validates weekend | `isWeekend(saturday)` |

### Object Validators

| Validator | Description | Example |
|-----------|-------------|--------|
| `hasKeys(obj: object, keys: string[])` | Validates object has keys | `hasKeys(obj, ['id', 'name'])` |
| `isShape(obj: object, shape: object)` | Validates object shape | `isShape(obj, { id: 'string', age: 'number' })` |
| `isNotEmpty(obj: object)` | Validates non-empty object | `isNotEmpty({})` |
| `isDeepEqual(obj1: object, obj2: object)` | Validates objects are equal | `isDeepEqual(obj1, obj2)` |

### Schema Validators

The schema validators provide integrations with popular validation libraries:

- `SchemaValidators.zod` - Zod schema validation
- `SchemaValidators.joi` - Joi schema validation
- `SchemaValidators.yup` - Yup schema validation
- `SchemaValidators.classValidator` - Class-validator decorators

## Journey-Specific Validation

### Health Journey

Validators specific to health data and metrics:

- Blood pressure readings
- Glucose levels
- Heart rate ranges
- BMI calculations
- Medical record identifiers
- Device connection validation

### Care Journey

Validators specific to healthcare providers and appointments:

- Provider credentials and identifiers
- Appointment scheduling constraints
- Telemedicine session validation
- Medication identifiers and dosages
- Treatment plan validation

### Plan Journey

Validators specific to insurance plans and claims:

- Insurance plan codes and coverage
- Claim submission formats
- Document validation
- Benefit eligibility validation
- Payment and reimbursement validation

## Best Practices

### Consistent Error Handling

Use the provided error formatting utilities to ensure consistent error messages:

```typescript
import { ValidationError, formatValidationError } from '@austa/validation/errors';

try {
  // Validation logic
  if (!isValid) {
    throw new ValidationError('Invalid data', 'VALIDATION_001', {
      field: 'email',
      value: inputValue,
    });
  }
} catch (error) {
  const formattedError = formatValidationError(error);
  // Handle formatted error
}
```

### Combining Validators

Combine multiple validators for complex validation scenarios:

```typescript
import { StringValidators, createValidator } from '@austa/validation';

// Create a custom validator that combines multiple checks
const isValidUsername = createValidator((value: string) => {
  return (
    typeof value === 'string' &&
    StringValidators.isLength(value, 3, 20) &&
    StringValidators.matches(value, /^[a-zA-Z0-9_]+$/)
  );
}, 'Invalid username. Must be 3-20 characters and contain only letters, numbers, and underscores.');

// Use the combined validator
const isValid = isValidUsername('user_123'); // true
```

### Frontend Form Validation

For React applications, use the form validation helpers:

```typescript
import { useFormValidation } from '@austa/validation/react';

function RegistrationForm() {
  const { schema, resolver } = useFormValidation({
    email: {
      required: 'Email is required',
      email: 'Please enter a valid email',
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 8,
        message: 'Password must be at least 8 characters',
      },
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        message: 'Password must include uppercase, lowercase, and numbers',
      },
    },
  });

  const { register, handleSubmit, errors } = useForm({
    resolver,
  });

  // Form implementation
}
```

### Backend API Validation

For NestJS applications, use the provided validation pipes and decorators:

```typescript
import { ValidationPipe } from '@austa/validation/nestjs';

// In your main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorFormatter: (errors) => {
      // Custom error formatting for consistent API responses
      return {
        statusCode: 400,
        message: 'Validation failed',
        errors: errors.map(err => ({
          field: err.property,
          message: Object.values(err.constraints)[0],
        })),
      };
    },
  }));
  
  await app.listen(3000);
}
```

## Troubleshooting

### Common Validation Issues

#### Issue: Inconsistent Date Validation

**Problem**: Date validation behaves differently across services.

**Solution**: Always use the DateValidators from this package instead of direct Date object manipulation:

```typescript
// Incorrect
const isValid = new Date(dateString) !== 'Invalid Date';

// Correct
import { DateValidators } from '@austa/validation';
const isValid = DateValidators.isValidDateString(dateString);
```

#### Issue: Schema Validation Errors Not Properly Formatted

**Problem**: Schema validation errors are difficult to interpret or inconsistent.

**Solution**: Use the provided error formatters for each schema validation library:

```typescript
import { SchemaValidators } from '@austa/validation';

try {
  zodSchema.parse(data);
} catch (error) {
  // Convert Zod errors to a consistent format
  const formattedErrors = SchemaValidators.formatZodError(error);
  // formattedErrors = [{ path: 'email', message: 'Invalid email' }, ...]
}
```

#### Issue: Validation Not Working with Non-English Characters

**Problem**: Validators fail with accented characters or non-Latin scripts.

**Solution**: Use the internationalization-aware validators:

```typescript
import { I18nValidators } from '@austa/validation/i18n';

// Supports accented characters and international formats
const isValid = I18nValidators.isName('João da Silva'); // true
```

## Contributing

When extending the validation package:

1. Follow the established patterns for validator implementation
2. Include comprehensive tests for all validators
3. Document all public APIs with JSDoc comments
4. Ensure backward compatibility
5. Add examples to this README for new validators

## License

This package is part of the AUSTA SuperApp and is subject to the same licensing terms as the main project.