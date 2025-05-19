# @austa/validation

A comprehensive validation library for the AUSTA SuperApp ecosystem that provides standardized, type-safe validation utilities for use across all services and journeys.

## Overview

The `@austa/validation` package serves as the foundation for consistent data validation throughout the AUSTA SuperApp. It provides a unified approach to validation that ensures data integrity, improves error handling, and enhances the developer experience across all journeys. This package implements healthcare-specific validation patterns while supporting the unique requirements of each journey.

## Key Features

- **Type-safe validators** with TypeScript integration
- **Journey-specific validation rules** for health, care, and plan data
- **Composable validation functions** for complex validation scenarios
- **Integration with form libraries** (React Hook Form, Formik)
- **Schema-based validation** using Zod, Joi, and class-validator
- **Consistent error messages** across all validation types
- **Cross-journey validation** for shared data models
- **Performance-optimized validators** for client and server use

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

### Basic Import Patterns

```typescript
// Import specific validators
import { isValidEmail, isValidCPF, isValidPhone } from '@austa/validation';

// Import namespaced validators
import { StringValidators, DateValidators, NumberValidators } from '@austa/validation';

// Import schema validation utilities
import { createZodSchema, validateWithJoi, validateWithClassValidator } from '@austa/validation';

// Import journey-specific validators
import { HealthValidators, CareValidators, PlanValidators } from '@austa/validation';
```

### String Validation

```typescript
import { StringValidators, isValidEmail, isValidCPF } from '@austa/validation';

// Individual validators
const isValid = isValidEmail('user@example.com'); // true
const isValidBrazilianID = isValidCPF('123.456.789-09'); // validates CPF format and check digit

// Namespaced validators
const isValidPostalCode = StringValidators.isValidCEP('01310-200'); // true
const isValidName = StringValidators.isValidPersonName('João Silva', { allowAccents: true }); // true

// With custom options
const isValidPassword = StringValidators.isValidPassword('Abc123!@#', {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
}); // true

// Validation with error messages
const { isValid, errors } = StringValidators.validateWithErrors('user@example', {
  validators: ['email'],
  errorMessages: {
    email: 'Please enter a valid email address'
  }
});

// Output: { isValid: false, errors: ['Please enter a valid email address'] }
```

### Date Validation

```typescript
import { DateValidators } from '@austa/validation';

// Basic date validation
const isValid = DateValidators.isValidDate('2023-04-15'); // true

// Date range validation
const isInRange = DateValidators.isDateInRange('2023-04-15', {
  minDate: '2023-01-01',
  maxDate: '2023-12-31'
}); // true

// Age validation (for health journey)
const isAdult = DateValidators.isAdultAge('2000-01-01'); // true for someone born in 2000

// Business day validation (for appointment scheduling)
const isBusinessDay = DateValidators.isBusinessDay('2023-04-17', {
  holidays: ['2023-04-21'], // Good Friday
  excludeWeekends: true
}); // true if April 17, 2023 is a business day

// Date format validation
const isValidFormat = DateValidators.isValidDateFormat('15/04/2023', 'DD/MM/YYYY'); // true
```

### Number Validation

```typescript
import { NumberValidators } from '@austa/validation';

// Range validation
const isInRange = NumberValidators.isInRange(75, { min: 0, max: 100 }); // true

// Integer validation
const isInteger = NumberValidators.isInteger(42); // true

// Decimal precision validation
const hasValidPrecision = NumberValidators.hasValidPrecision(42.25, { maxDecimals: 2 }); // true

// Health-specific validation (e.g., blood pressure)
const isValidSystolic = NumberValidators.isValidSystolicPressure(120); // true
const isValidDiastolic = NumberValidators.isValidDiastolicPressure(80); // true

// Currency validation (for plan journey)
const isValidCurrency = NumberValidators.isValidCurrencyValue(1250.75, {
  currency: 'BRL',
  maxDecimals: 2
}); // true
```

### Object Validation

```typescript
import { ObjectValidators } from '@austa/validation';

const user = {
  name: 'João Silva',
  email: 'joao@example.com',
  age: 35,
  address: {
    street: 'Av. Paulista',
    city: 'São Paulo',
    postalCode: '01310-200'
  }
};

// Validate required fields
const hasRequiredFields = ObjectValidators.hasRequiredFields(user, ['name', 'email', 'age']); // true

// Validate nested object
const hasValidAddress = ObjectValidators.validateNested(user, 'address', (address) => {
  return ObjectValidators.hasRequiredFields(address, ['street', 'city', 'postalCode']);
}); // true

// Validate object against a shape
const isValidShape = ObjectValidators.matchesShape(user, {
  name: { type: 'string', required: true },
  email: { type: 'string', required: true, validator: 'email' },
  age: { type: 'number', required: true, min: 0, max: 120 },
  address: { type: 'object', required: true }
}); // true
```

### Schema Validation

```typescript
import { SchemaValidators, createZodSchema } from '@austa/validation';
import { z } from 'zod';

// Using Zod for schema validation
const UserSchema = createZodSchema({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(120).optional(),
  roles: z.array(z.string()).default(['user'])
});

type User = z.infer<typeof UserSchema>;

const validationResult = SchemaValidators.validateWithZod(
  { name: 'João Silva', email: 'joao@example.com', age: 35 },
  UserSchema
);

// Output: { success: true, data: { name: 'João Silva', email: 'joao@example.com', age: 35, roles: ['user'] } }

// Using Joi for schema validation
import Joi from 'joi';

const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  postalCode: Joi.string().pattern(/^\d{5}-\d{3}$/).required()
});

const joiValidationResult = SchemaValidators.validateWithJoi(
  { street: 'Av. Paulista', city: 'São Paulo', postalCode: '01310-200' },
  addressSchema
);

// Output: { success: true, data: { street: 'Av. Paulista', city: 'São Paulo', postalCode: '01310-200' } }

// Using class-validator for schema validation
import { IsEmail, MinLength, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';

class UserDTO {
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;
}

const classValidatorResult = SchemaValidators.validateWithClassValidator(
  { name: 'João Silva', email: 'joao@example.com', age: 35 },
  UserDTO
);

// Output: { success: true, data: { name: 'João Silva', email: 'joao@example.com', age: 35 } }
```

## Journey-Specific Validation

### Health Journey Validation

```typescript
import { HealthValidators } from '@austa/validation';

// Validate health metrics
const isValidBloodGlucose = HealthValidators.isValidBloodGlucose(95, { unit: 'mg/dL' }); // true
const isValidHeartRate = HealthValidators.isValidHeartRate(72); // true
const isValidBodyTemperature = HealthValidators.isValidBodyTemperature(36.8, { unit: 'celsius' }); // true

// Validate health goals
const isValidStepGoal = HealthValidators.isValidStepGoal(10000); // true
const isValidWeightGoal = HealthValidators.isValidWeightGoal(75, {
  currentWeight: 80,
  height: 175,
  timeframe: 90 // days
}); // validates if weight goal is healthy

// Validate device data
const isValidOxygenSaturation = HealthValidators.isValidOxygenSaturation(98); // true
const isValidRespiratoryRate = HealthValidators.isValidRespiratoryRate(16); // true
```

### Care Journey Validation

```typescript
import { CareValidators } from '@austa/validation';

// Validate appointment data
const isValidAppointmentTime = CareValidators.isValidAppointmentTime('2023-04-17T14:30:00', {
  businessHours: { start: '08:00', end: '18:00' },
  duration: 30 // minutes
}); // true

// Validate provider data
const isValidSpecialty = CareValidators.isValidMedicalSpecialty('Cardiologia'); // true
const isValidLicense = CareValidators.isValidCRM('12345/SP'); // validates Brazilian medical license

// Validate medication data
const isValidDosage = CareValidators.isValidMedicationDosage('10mg', {
  medication: 'Aspirin',
  patientWeight: 70
}); // validates if dosage is within safe range

// Validate symptom data
const isValidSymptomSeverity = CareValidators.isValidSymptomSeverity(3, { scale: 1, max: 5 }); // true
```

### Plan Journey Validation

```typescript
import { PlanValidators } from '@austa/validation';

// Validate insurance plan data
const isValidPlanCode = PlanValidators.isValidPlanCode('PREMIUM-2023-01'); // true
const isValidCoverageLevel = PlanValidators.isValidCoverageLevel('COMPREHENSIVE'); // true

// Validate claim data
const isValidClaimAmount = PlanValidators.isValidClaimAmount(1500.75, {
  service: 'CONSULTATION',
  coverageLimit: 2000
}); // true

const isValidClaimCode = PlanValidators.isValidClaimCode('CLM-2023-04-15-001'); // true

// Validate benefit data
const isValidBenefitUsage = PlanValidators.isValidBenefitUsage(3, {
  benefitType: 'THERAPY_SESSION',
  maxUsage: 10,
  period: 'MONTHLY'
}); // true
```

## Integration with Form Libraries

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createZodSchema, StringValidators } from '@austa/validation';
import { z } from 'zod';

// Create a schema using the validation utilities
const ContactFormSchema = createZodSchema({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().refine(StringValidators.isValidPhone, {
    message: 'Please enter a valid phone number'
  }),
  message: z.string().min(10).max(500)
});

type ContactFormData = z.infer<typeof ContactFormSchema>;

function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormSchema)
  });

  const onSubmit = (data: ContactFormData) => {
    // Submit form data
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" {...register('name')} />
        {errors.name && <span>{errors.name.message}</span>}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" {...register('email')} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      
      <div>
        <label htmlFor="phone">Phone</label>
        <input id="phone" {...register('phone')} />
        {errors.phone && <span>{errors.phone.message}</span>}
      </div>
      
      <div>
        <label htmlFor="message">Message</label>
        <textarea id="message" {...register('message')} />
        {errors.message && <span>{errors.message.message}</span>}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### API Validation Integration

```typescript
import { IsValidCPF, IsValidEmail } from '@austa/validation/decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

// Using class-validator decorators from @austa/validation
class CreateUserDto {
  @IsValidCPF({
    message: 'CPF inválido. Por favor, forneça um CPF válido.'
  })
  cpf: string;

  @IsValidEmail({
    message: 'Email inválido. Por favor, forneça um email válido.'
  })
  email: string;
}

@Controller('users')
export class UsersController {
  @Post()
  createUser(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    // Process validated user data
    return { success: true, message: 'User created successfully' };
  }
}
```

## Cross-Journey Validation

The validation package provides utilities for validating data that spans multiple journeys:

```typescript
import { CrossJourneyValidators } from '@austa/validation';

// Validate user data across journeys
const isValidUserProfile = CrossJourneyValidators.validateUserProfile({
  name: 'João Silva',
  email: 'joao@example.com',
  cpf: '123.456.789-09',
  healthMetrics: {
    weight: 75,
    height: 175
  },
  carePreferences: {
    preferredSpecialties: ['Cardiologia', 'Clínica Geral']
  },
  planDetails: {
    planCode: 'PREMIUM-2023-01',
    dependents: 2
  }
});

// Validate cross-journey events
const isValidEvent = CrossJourneyValidators.validateJourneyEvent({
  userId: '12345',
  eventType: 'APPOINTMENT_COMPLETED',
  journeySource: 'CARE',
  timestamp: '2023-04-15T15:30:00',
  data: {
    appointmentId: 'APT-2023-04-15-001',
    providerId: 'PROV-12345',
    specialty: 'Cardiologia'
  },
  targetJourneys: ['HEALTH', 'GAMIFICATION']
});
```

## Best Practices

### Validation Strategy

1. **Layer-Appropriate Validation**:
   - Validate at the UI layer for immediate user feedback
   - Validate at the API layer for security and data integrity
   - Validate at the service layer for business rules
   - Validate at the database layer for data consistency

2. **Consistent Error Messages**:
   - Use clear, user-friendly error messages
   - Maintain consistent error message format across all validators
   - Provide localized error messages when possible

3. **Performance Considerations**:
   - Use lightweight validators for client-side validation
   - Implement more comprehensive validation on the server
   - Cache validation results when appropriate

4. **Security Best Practices**:
   - Never trust client-side validation alone
   - Always validate sensitive data on the server
   - Implement rate limiting for validation-heavy endpoints

### Code Examples

#### Combining Validators

```typescript
import { combineValidators, StringValidators, DateValidators } from '@austa/validation';

// Create a composite validator
const isValidAppointmentRequest = combineValidators([
  { validator: (data) => StringValidators.isValidEmail(data.email), errorMessage: 'Invalid email' },
  { validator: (data) => DateValidators.isBusinessDay(data.date), errorMessage: 'Selected date is not a business day' },
  { validator: (data) => data.duration >= 15 && data.duration <= 60, errorMessage: 'Duration must be between 15 and 60 minutes' }
]);

// Use the composite validator
const result = isValidAppointmentRequest({
  email: 'patient@example.com',
  date: '2023-04-17',
  duration: 30
});

// Output: { isValid: true, errors: [] }
```

#### Creating Custom Validators

```typescript
import { createValidator } from '@austa/validation';

// Create a custom validator for Brazilian healthcare card numbers (CNS)
const isValidCNS = createValidator({
  name: 'isValidCNS',
  validator: (value: string) => {
    // CNS validation logic
    const cns = value.replace(/[^0-9]/g, '');
    if (cns.length !== 15) return false;
    
    // Implement the CNS validation algorithm
    // ...
    
    return true; // Return validation result
  },
  defaultErrorMessage: 'O número do Cartão Nacional de Saúde (CNS) é inválido'
});

// Use the custom validator
const result = isValidCNS('123456789012345');
```

## Troubleshooting

### Common Issues

#### Validation Not Working as Expected

**Problem**: Validators are not catching invalid data or are rejecting valid data.

**Solution**:
- Check if you're using the correct validator for your data type
- Verify that any options or parameters are correctly configured
- Use the debug mode to see detailed validation steps

```typescript
import { enableDebug, StringValidators } from '@austa/validation';

// Enable debug mode
enableDebug();

// Now validation will log detailed steps
const result = StringValidators.isValidCPF('123.456.789-09');
```

#### Integration Issues with Form Libraries

**Problem**: Validation errors are not properly displayed in form libraries.

**Solution**:
- Ensure you're using the correct resolver for your form library
- Check that schema types match your form data structure
- Verify error message formatting is compatible with your UI components

#### Performance Issues

**Problem**: Validation is causing performance bottlenecks.

**Solution**:
- Use the lightweight validators when possible
- Implement validation caching for expensive validators
- Consider deferring validation for non-critical fields

```typescript
import { createCachedValidator, StringValidators } from '@austa/validation';

// Create a cached version of an expensive validator
const cachedAddressValidator = createCachedValidator(StringValidators.isValidAddress, {
  maxCacheSize: 100, // Cache up to 100 results
  ttl: 3600000 // Cache results for 1 hour (in milliseconds)
});

// Use the cached validator
const result = cachedAddressValidator('Av. Paulista, 1000, São Paulo - SP');
```

## Contributing

When extending the validation package:

1. Follow the established patterns for validator creation
2. Include comprehensive tests for all validators
3. Document all validators with JSDoc comments
4. Maintain backward compatibility
5. Consider performance implications
6. Add examples to the README for new validators

## License

This package is part of the AUSTA SuperApp and is subject to the same license terms as the main project.