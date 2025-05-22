# @austa/errors

A comprehensive error handling framework for the AUSTA SuperApp ecosystem that provides standardized error classification, consistent error handling patterns, and journey-specific error responses.

## Overview

The `@austa/errors` package serves as the foundation for error handling across the AUSTA SuperApp. It provides a structured approach to error management with journey-specific error types, consistent error response formats, and integration with logging and monitoring systems. This package ensures that errors are properly categorized, logged, and presented to users in a friendly manner, enhancing both developer experience and user satisfaction.

## Key Features

- **Journey-Specific Error Classification**: Categorize errors by journey (Health, Care, Plan) for better context and handling
- **Standardized Error Hierarchy**: Consistent error types across all services
- **Error Code System**: Unique error codes for precise error identification and documentation
- **Integration with Logging**: Seamless integration with the `@austa/logging` package
- **Client-Friendly Error Responses**: Formatted error responses with appropriate context
- **Internationalization Support**: Error messages with i18n capabilities
- **Validation Error Handling**: Built-in support for validation errors with field-level details
- **HTTP Status Mapping**: Automatic mapping of error types to appropriate HTTP status codes

## Installation

```bash
# npm
npm install @austa/errors

# yarn
yarn add @austa/errors
```

## Usage

### Basic Error Classes

The package provides several base error classes that can be extended or used directly:

```typescript
import { 
  ApplicationError,
  ValidationError,
  BusinessError,
  TechnicalError,
  ExternalServiceError,
  AuthorizationError,
  NotFoundError
} from '@austa/errors';

// Basic error with code and metadata
throw new ApplicationError('Something went wrong', 'ERR_001', { 
  contextData: 'Additional information' 
});

// Validation error with field information
throw new ValidationError('Invalid input', 'VAL_001', { 
  field: 'email',
  reason: 'Must be a valid email address' 
});

// Business logic error
throw new BusinessError('Operation not allowed in current state', 'BUS_001');

// Technical/system error
throw new TechnicalError('Database connection failed', 'TECH_001');

// External service error
throw new ExternalServiceError('Payment gateway unavailable', 'EXT_001', {
  service: 'PaymentProvider',
  status: 503
});

// Authorization error
throw new AuthorizationError('Insufficient permissions', 'AUTH_001', {
  requiredPermission: 'admin:write'
});

// Not found error
throw new NotFoundError('User not found', 'NF_001', {
  entity: 'User',
  id: '123'
});
```

### Journey-Specific Error Classes

The package provides journey-specific error classes for Health, Care, and Plan journeys:

```typescript
import { 
  HealthJourneyError,
  CareJourneyError,
  PlanJourneyError 
} from '@austa/errors/journey';

// Health journey error
throw new HealthJourneyError('Failed to sync health data', 'HEALTH_001', {
  deviceType: 'fitbit',
  metricType: 'steps'
});

// Care journey error
throw new CareJourneyError('Unable to schedule appointment', 'CARE_001', {
  providerId: '123',
  reason: 'No available slots'
});

// Plan journey error
throw new PlanJourneyError('Claim submission failed', 'PLAN_001', {
  claimType: 'medical',
  reason: 'Missing documentation'
});
```

### Creating Custom Error Classes

You can create custom error classes by extending the base classes:

```typescript
import { BusinessError } from '@austa/errors';

// Custom error class for appointment-related errors
export class AppointmentError extends BusinessError {
  constructor(message: string, code: string, metadata?: Record<string, any>) {
    super(message, code, {
      ...metadata,
      errorType: 'AppointmentError',
      journey: 'care'
    });
    this.name = 'AppointmentError';
  }
}

// Usage
throw new AppointmentError('Double booking not allowed', 'APT_001', {
  appointmentId: '123',
  requestedTime: '2023-05-01T10:00:00Z'
});
```

### Error Handling in Controllers

Integrate with NestJS exception filters for consistent API responses:

```typescript
import { Controller, Post, Body, UseFilters } from '@nestjs/common';
import { ValidationError } from '@austa/errors';
import { ErrorFilter } from '@austa/errors/filters';

@Controller('appointments')
@UseFilters(ErrorFilter) // Apply the error filter to standardize error responses
export class AppointmentController {
  
  @Post()
  async createAppointment(@Body() appointmentData: CreateAppointmentDto) {
    if (!appointmentData.providerId) {
      throw new ValidationError('Provider ID is required', 'CARE_VAL_001', {
        field: 'providerId'
      });
    }
    
    // Continue with appointment creation logic
  }
}
```

### Error Handling in Services

Implement consistent error handling in service classes:

```typescript
import { Injectable } from '@nestjs/common';
import { 
  BusinessError, 
  ExternalServiceError,
  NotFoundError 
} from '@austa/errors';
import { CareJourneyError } from '@austa/errors/journey';
import { JourneyLogger } from '@austa/logging';

@Injectable()
export class AppointmentService {
  constructor(private readonly logger: JourneyLogger) {}

  async bookAppointment(data: AppointmentDto): Promise<Appointment> {
    try {
      // Check if provider exists
      const provider = await this.providerRepository.findById(data.providerId);
      if (!provider) {
        throw new NotFoundError('Provider not found', 'CARE_NF_001', {
          entity: 'Provider',
          id: data.providerId
        });
      }
      
      // Check provider availability
      const isAvailable = await this.checkProviderAvailability(
        data.providerId,
        data.dateTime
      );
      
      if (!isAvailable) {
        throw new CareJourneyError(
          'Provider is not available at the requested time',
          'CARE_BUS_001',
          { providerId: data.providerId, requestedTime: data.dateTime }
        );
      }
      
      // Try to create appointment in external system
      try {
        await this.externalSchedulingSystem.createAppointment({
          providerId: data.providerId,
          patientId: data.patientId,
          dateTime: data.dateTime
        });
      } catch (error) {
        throw new ExternalServiceError(
          'Failed to schedule appointment with external system',
          'CARE_EXT_001',
          { 
            service: 'ExternalSchedulingSystem',
            originalError: error.message 
          }
        );
      }
      
      // Continue with booking logic
      return this.appointmentRepository.create(data);
    } catch (error) {
      // Log the error with context
      this.logger.error('Failed to book appointment', error, {
        userId: data.patientId,
        providerId: data.providerId
      });
      
      // Rethrow the error to be handled by the error filter
      throw error;
    }
  }
}
```

### Integration with Logging

Seamlessly integrate with the `@austa/logging` package for comprehensive error logging:

```typescript
import { Injectable } from '@nestjs/common';
import { BusinessError } from '@austa/errors';
import { JourneyLogger } from '@austa/logging';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly logger: JourneyLogger) {}

  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    try {
      // Implementation
      if (!this.isValidMetricValue(metric.value)) {
        throw new BusinessError(
          'Metric value outside acceptable range',
          'HEALTH_BUS_001',
          { 
            metricType: metric.type,
            value: metric.value,
            acceptableRange: this.getAcceptableRange(metric.type)
          }
        );
      }
      
      // Continue with implementation
    } catch (error) {
      // The error will be automatically enriched with journey context
      this.logger.error('Failed to record health metric', error, { 
        userId,
        metricType: metric.type 
      });
      
      throw error;
    }
  }
}
```

### Error Response Format

The standard error response format returned by the error filter:

```json
{
  "status": 400,
  "code": "CARE_VAL_001",
  "message": "Provider ID is required",
  "timestamp": "2023-05-01T10:00:00Z",
  "path": "/api/appointments",
  "journey": "care",
  "details": {
    "field": "providerId"
  },
  "traceId": "abc123def456"
}
```

### Handling Validation Errors

Integrate with class-validator and NestJS validation pipe:

```typescript
import { ValidationPipe } from '@nestjs/common';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationError } from '@austa/errors';

// Custom validation pipe that transforms class-validator errors to @austa/errors
export class ErrorsValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ClassValidatorError[]) => {
        const errors = this.mapValidationErrors(validationErrors);
        return new ValidationError(
          'Validation failed',
          'VAL_001',
          { fields: errors }
        );
      },
    });
  }

  private mapValidationErrors(errors: ClassValidatorError[], parentField = ''): Record<string, string> {
    const result: Record<string, string> = {};
    
    errors.forEach(error => {
      const field = parentField ? `${parentField}.${error.property}` : error.property;
      
      if (error.constraints) {
        // Get the first constraint message
        const message = Object.values(error.constraints)[0];
        result[field] = message;
      }
      
      if (error.children && error.children.length > 0) {
        const childErrors = this.mapValidationErrors(error.children, field);
        Object.assign(result, childErrors);
      }
    });
    
    return result;
  }
}
```

### Error Code System

The package follows a structured error code system:

```
[JOURNEY]_[TYPE]_[NUMBER]
```

Where:
- `JOURNEY`: Optional journey identifier (HEALTH, CARE, PLAN)
- `TYPE`: Error type identifier (VAL, BUS, TECH, EXT, AUTH, NF)
- `NUMBER`: Unique numeric identifier within the type

Examples:
- `HEALTH_VAL_001`: Health journey validation error
- `CARE_BUS_002`: Care journey business logic error
- `PLAN_EXT_003`: Plan journey external service error
- `TECH_001`: General technical error (no journey specified)

## Error Categories

| Category | Description | HTTP Status | Base Class |
|----------|-------------|-------------|------------|
| Validation | Input validation failures | 400 | ValidationError |
| Business | Business rule violations | 422 | BusinessError |
| Technical | System/infrastructure issues | 500 | TechnicalError |
| External | External service failures | 502/503 | ExternalServiceError |
| Authorization | Permission/access issues | 403 | AuthorizationError |
| Not Found | Resource not found | 404 | NotFoundError |
| Authentication | Authentication failures | 401 | AuthenticationError |

## Journey-Specific Error Handling

### Health Journey

Common error scenarios in the Health journey:

```typescript
import { HealthJourneyError } from '@austa/errors/journey';

// Device connection errors
throw new HealthJourneyError('Failed to connect to device', 'HEALTH_EXT_001', {
  deviceType: 'fitbit',
  errorCode: 'CONNECTION_TIMEOUT'
});

// Health data validation errors
throw new HealthJourneyError('Invalid health metric value', 'HEALTH_VAL_001', {
  metricType: 'heartRate',
  value: 250,
  validRange: '40-200'
});

// Goal setting errors
throw new HealthJourneyError('Goal target not achievable', 'HEALTH_BUS_001', {
  goalType: 'steps',
  requestedTarget: 100000,
  recommendedMax: 25000
});
```

### Care Journey

Common error scenarios in the Care journey:

```typescript
import { CareJourneyError } from '@austa/errors/journey';

// Appointment booking errors
throw new CareJourneyError('Provider fully booked', 'CARE_BUS_001', {
  providerId: '123',
  requestedDate: '2023-05-01'
});

// Medication errors
throw new CareJourneyError('Medication interaction detected', 'CARE_BUS_002', {
  medicationId: '456',
  interactingMedicationId: '789',
  severityLevel: 'high'
});

// Telemedicine errors
throw new CareJourneyError('Video session failed', 'CARE_TECH_001', {
  sessionId: '123',
  reason: 'Insufficient bandwidth'
});
```

### Plan Journey

Common error scenarios in the Plan journey:

```typescript
import { PlanJourneyError } from '@austa/errors/journey';

// Claim submission errors
throw new PlanJourneyError('Missing required documentation', 'PLAN_VAL_001', {
  claimId: '123',
  missingDocuments: ['receipt', 'prescription']
});

// Coverage verification errors
throw new PlanJourneyError('Service not covered by plan', 'PLAN_BUS_001', {
  serviceCode: 'DENTAL_ORTHO',
  planId: '456'
});

// Benefit calculation errors
throw new PlanJourneyError('Annual benefit limit reached', 'PLAN_BUS_002', {
  benefitType: 'PHYSICAL_THERAPY',
  annualLimit: 20,
  used: 20
});
```

## Error Propagation and Logging Strategy

The package implements a consistent error propagation and logging strategy:

1. **Error Creation**: Errors are created with specific types, codes, and metadata
2. **Error Enrichment**: Errors are enriched with context (journey, user, request)
3. **Error Logging**: Errors are logged with the `@austa/logging` package
4. **Error Propagation**: Errors are propagated to the appropriate handler
5. **Error Response**: Errors are transformed into standardized API responses

```typescript
import { Injectable } from '@nestjs/common';
import { BusinessError } from '@austa/errors';
import { JourneyLogger } from '@austa/logging';

@Injectable()
export class ErrorHandlingExample {
  constructor(private readonly logger: JourneyLogger) {}

  async processRequest(data: any): Promise<any> {
    try {
      // Attempt to process the request
      return await this.performOperation(data);
    } catch (error) {
      // Step 1: Determine if we need to transform the error
      if (error.name === 'ExternalApiError') {
        // Transform external error to our error type
        error = new BusinessError(
          'Operation failed due to external service',
          'EXT_001',
          { originalError: error.message }
        );
      }
      
      // Step 2: Log the error with context
      this.logger.error('Request processing failed', error, {
        requestId: data.requestId,
        userId: data.userId
      });
      
      // Step 3: Propagate the error
      throw error;
    }
  }
}
```

## Integration with NestJS

The package provides NestJS-specific integrations:

### Exception Filters

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from '@austa/errors/filters';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ErrorFilter,
    },
  ],
})
export class AppModule {}
```

### Interceptors

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorInterceptor } from '@austa/errors/interceptors';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
})
export class AppModule {}
```

## Technologies

- TypeScript 5.3+
- NestJS 10.0+
- Compatible with Express and Fastify

## Contributing

When extending the errors package:

1. Maintain the error hierarchy and classification system
2. Follow the error code naming convention
3. Include comprehensive metadata for context
4. Ensure proper integration with logging
5. Document all new error types and codes