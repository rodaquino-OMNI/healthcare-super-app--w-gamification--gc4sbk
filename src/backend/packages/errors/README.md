# @austa/errors

A comprehensive error handling framework for the AUSTA SuperApp ecosystem that provides standardized error classification, journey-specific error types, consistent error responses, and advanced error recovery mechanisms.

## Overview

The `@austa/errors` package serves as the foundation for robust error handling across the AUSTA SuperApp's journey-centered architecture. It ensures consistent error classification, formatting, and recovery strategies across all services while supporting the unique requirements of each journey (Health, Care, Plan).

This package implements industry best practices for error handling in distributed systems, including:

- **Standardized Error Classification**: Categorizes errors into validation, business, technical, and external types with consistent HTTP status code mapping
- **Journey-Specific Error Types**: Provides specialized error classes for each journey's unique domains
- **Client-Friendly Error Responses**: Generates structured error responses with appropriate context and user-friendly messages
- **Advanced Recovery Mechanisms**: Implements retry with exponential backoff, circuit breaker pattern, and fallback strategies
- **NestJS Integration**: Seamlessly integrates with NestJS through filters, interceptors, and decorators

## Installation

```bash
# npm
npm install @austa/errors

# yarn
yarn add @austa/errors

# pnpm
pnpm add @austa/errors
```

## Core Concepts

### Error Types

The framework classifies errors into four primary categories:

1. **Validation Errors** (HTTP 400): Client-side errors due to invalid input or request format
2. **Business Errors** (HTTP 400-409): Errors resulting from business rule violations
3. **Technical Errors** (HTTP 500): Internal server errors and unexpected system failures
4. **External Errors** (HTTP 502-504): Errors from external dependencies and third-party services

### Base Error Classes

All errors extend the `BaseError` class, which provides:

- Consistent error structure with code, message, and context
- Automatic HTTP status code mapping
- Serialization for cross-service error propagation
- Integration with logging and monitoring

```typescript
import { BaseError, ErrorType } from '@austa/errors';

// Creating a custom error
class CustomError extends BaseError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, ErrorType.BUSINESS, code, context);
  }
}

// Using the error
throw new CustomError(
  'Resource not found', 
  'CUSTOM_001', 
  { resourceId: '123', resourceType: 'user' }
);
```

### Error Context

All errors support rich context that provides additional information about the error:

```typescript
import { BusinessError } from '@austa/errors/categories';

throw new BusinessError(
  'Appointment slot is already booked',
  'CARE_APPOINTMENT_002',
  {
    appointmentId: '12345',
    providerId: 'dr-smith',
    requestedTime: '2023-05-15T14:00:00Z',
    journey: 'care',
    // Additional context specific to this error
    availableSlots: ['2023-05-15T15:00:00Z', '2023-05-15T16:00:00Z']
  }
);
```

## Journey-Specific Error Handling

The framework provides specialized error classes for each journey's unique domains:

### Health Journey

```typescript
import { Health } from '@austa/errors/journey';

// Using domain-specific error classes
throw new Health.Metrics.InvalidMetricValueError(
  'Heart rate value is outside acceptable range',
  { 
    value: 220, 
    min: 40, 
    max: 200,
    userId: '12345',
    deviceId: 'fitbit-123'
  }
);

// Using specialized FHIR integration errors
try {
  await fhirClient.getPatientRecord(patientId);
} catch (error) {
  throw new Health.Fhir.FhirConnectionFailureError(
    'Failed to retrieve patient record from FHIR server',
    { 
      patientId,
      endpoint: 'Patient/$everything',
      originalError: error
    }
  );
}
```

### Care Journey

```typescript
import { Care } from '@austa/errors/journey';

// Appointment errors
if (!availableSlots.includes(requestedTime)) {
  throw new Care.Appointment.AppointmentProviderUnavailableError(
    'Provider is not available at the requested time',
    {
      providerId,
      requestedTime,
      availableSlots
    }
  );
}

// Telemedicine errors
if (!deviceHasCamera) {
  throw new Care.Telemedicine.TelemedicineDeviceError(
    'Device does not have a camera required for video consultation',
    {
      deviceType,
      missingCapabilities: ['camera'],
      sessionId
    }
  );
}
```

### Plan Journey

```typescript
import { Plan } from '@austa/errors/journey';

// Claims errors
if (existingClaim) {
  throw new Plan.Claims.DuplicateClaimError(
    'A claim for this service has already been submitted',
    {
      existingClaimId: existingClaim.id,
      serviceDate: serviceDate,
      providerId,
      submissionDate: existingClaim.submissionDate
    }
  );
}

// Coverage errors
if (!isServiceCovered) {
  throw new Plan.Coverage.ServiceNotCoveredError(
    'The requested service is not covered by your current plan',
    {
      serviceCode,
      planId,
      planName,
      coverageDetails
    }
  );
}
```

## Error Categories

The framework provides pre-defined error classes for common scenarios:

### Validation Errors

```typescript
import { 
  MissingParameterError,
  InvalidParameterError,
  SchemaValidationError 
} from '@austa/errors/categories';

// Missing required parameter
if (!userId) {
  throw new MissingParameterError('userId is required');
}

// Invalid parameter format
if (!isValidEmail(email)) {
  throw new InvalidParameterError('email must be a valid email address', { email });
}

// Schema validation errors (e.g., from class-validator or Zod)
try {
  const validatedData = schema.parse(inputData);
} catch (error) {
  throw new SchemaValidationError('Input validation failed', {
    errors: error.errors,
    input: inputData
  });
}
```

### Business Errors

```typescript
import { 
  ResourceNotFoundError,
  ResourceExistsError,
  BusinessRuleViolationError,
  InsufficientPermissionsError 
} from '@austa/errors/categories';

// Resource not found
const user = await userRepository.findById(userId);
if (!user) {
  throw new ResourceNotFoundError('User not found', { userId });
}

// Resource already exists
const existingUser = await userRepository.findByEmail(email);
if (existingUser) {
  throw new ResourceExistsError('User with this email already exists', { email });
}

// Business rule violation
if (user.age < 18 && planType === 'adult') {
  throw new BusinessRuleViolationError(
    'Adult plans are only available for users 18 and older',
    { userId, age: user.age, planType }
  );
}

// Insufficient permissions
if (!userHasPermission(user, 'MANAGE_CLAIMS')) {
  throw new InsufficientPermissionsError(
    'User does not have permission to manage claims',
    { userId, requiredPermission: 'MANAGE_CLAIMS' }
  );
}
```

### Technical Errors

```typescript
import { 
  DatabaseError,
  ConfigurationError,
  TimeoutError 
} from '@austa/errors/categories';

// Database errors
try {
  await prisma.user.create({ data: userData });
} catch (error) {
  throw new DatabaseError(
    'Failed to create user record',
    { operation: 'create', entity: 'user', originalError: error }
  );
}

// Configuration errors
if (!process.env.DATABASE_URL) {
  throw new ConfigurationError(
    'Missing required environment variable: DATABASE_URL'
  );
}

// Timeout errors
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new TimeoutError(
    'Operation timed out after 5000ms',
    { operationType: 'database_query', timeoutMs: 5000 }
  )), 5000);
});

try {
  await Promise.race([operation(), timeoutPromise]);
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout specifically
  }
  throw error;
}
```

### External Errors

```typescript
import { 
  ExternalApiError,
  ExternalDependencyUnavailableError,
  ExternalRateLimitError 
} from '@austa/errors/categories';

try {
  await externalApi.getData();
} catch (error) {
  // API returned an error response
  if (error.response) {
    throw new ExternalApiError(
      'External API returned an error response',
      { 
        service: 'payment-gateway',
        endpoint: '/process-payment',
        statusCode: error.response.status,
        responseBody: error.response.data
      }
    );
  }
  
  // API could not be reached
  if (error.request) {
    throw new ExternalDependencyUnavailableError(
      'Payment gateway service is unavailable',
      { 
        service: 'payment-gateway',
        originalError: error
      }
    );
  }
  
  // Rate limit exceeded
  if (error.response?.status === 429) {
    throw new ExternalRateLimitError(
      'Payment gateway rate limit exceeded',
      { 
        service: 'payment-gateway',
        retryAfter: error.response.headers['retry-after'] || 60
      }
    );
  }
}
```

## NestJS Integration

The framework seamlessly integrates with NestJS applications:

### Global Error Handling

```typescript
import { Module } from '@nestjs/common';
import { ErrorsModule } from '@austa/errors/nest';

@Module({
  imports: [
    ErrorsModule.forRoot({
      // Configure global error handling behavior
      journey: 'health',
      includeStackTrace: process.env.NODE_ENV !== 'production',
      logErrors: true,
      // Additional options
    }),
    // Other modules
  ],
})
export class AppModule {}
```

### Declarative Error Handling

```typescript
import { Controller, Get } from '@nestjs/common';
import { Retry, CircuitBreaker, Fallback } from '@austa/errors/nest';

@Controller('health-metrics')
export class HealthMetricsController {
  constructor(private readonly externalService: ExternalService) {}

  // Automatically retry failed operations with exponential backoff
  @Retry({ maxAttempts: 3, initialDelay: 100 })
  @Get('sync-from-device')
  async syncFromDevice() {
    return this.externalService.fetchDeviceData();
  }

  // Implement circuit breaker for external dependencies
  @CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    fallbackMethod: 'getLocalHealthMetrics'
  })
  @Get('latest')
  async getLatestMetrics() {
    return this.externalService.fetchLatestMetrics();
  }

  // Fallback method for circuit breaker
  getLocalHealthMetrics() {
    return { source: 'local-cache', metrics: [...] };
  }

  // Define fallback strategy for specific endpoints
  @Fallback({
    fallbackMethod: 'getDefaultInsights',
    errorTypes: [ExternalApiError, TimeoutError]
  })
  @Get('insights')
  async getHealthInsights() {
    return this.insightsService.generateInsights();
  }

  getDefaultInsights() {
    return { source: 'default', insights: [...] };
  }
}
```

## Utility Functions

The framework provides utility functions for common error handling scenarios:

### Retry with Exponential Backoff

```typescript
import { retryWithBackoff } from '@austa/errors/utils';

// Retry an operation with exponential backoff
const result = await retryWithBackoff(
  async () => {
    return await externalApi.getData();
  },
  {
    maxAttempts: 3,
    initialDelay: 100, // ms
    maxDelay: 5000, // ms
    factor: 2, // exponential factor
    jitter: true, // add randomness to prevent thundering herd
    retryCondition: (error) => {
      // Only retry specific errors
      return error instanceof ExternalApiError && 
             error.context.statusCode >= 500;
    },
    onRetry: (error, attempt) => {
      logger.warn(`Retrying operation after error (attempt ${attempt})`, {
        error: error.message,
        attempt
      });
    }
  }
);
```

### Circuit Breaker

```typescript
import { CircuitBreaker } from '@austa/errors/utils';

// Create a circuit breaker for an external service
const paymentServiceBreaker = new CircuitBreaker({
  name: 'payment-service',
  failureThreshold: 5, // number of failures before opening
  resetTimeout: 30000, // ms to wait before trying again
  fallback: () => ({ status: 'degraded', message: 'Using offline payment processing' }),
  onStateChange: (from, to) => {
    logger.warn(`Circuit state changed from ${from} to ${to}`, {
      service: 'payment-service',
      circuitState: to
    });
  }
});

// Use the circuit breaker
try {
  const result = await paymentServiceBreaker.execute(() => {
    return paymentService.processPayment(paymentData);
  });
  return result;
} catch (error) {
  // Handle error or use fallback
  logger.error('Payment processing failed', { error });
  return { status: 'failed', error: error.message };
}
```

### Secure HTTP Client

```typescript
import { createSecureHttpClient } from '@austa/errors/utils';

// Create a secure HTTP client with SSRF protection and error handling
const apiClient = createSecureHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  // SSRF protection
  allowedHosts: ['api.example.com', 'api.backup-service.com'],
  // Retry configuration
  retry: {
    maxAttempts: 3,
    initialDelay: 100,
    retryCondition: (error) => error.isRetryable
  },
  // Circuit breaker configuration
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000
  },
  // Error transformation
  errorTransformer: (error) => {
    if (error.response?.status === 404) {
      return new ResourceNotFoundError(
        'Resource not found on external API',
        { path: error.config.url }
      );
    }
    return new ExternalApiError(
      'External API request failed',
      {
        statusCode: error.response?.status,
        url: error.config.url,
        method: error.config.method
      }
    );
  }
});

// Use the client
try {
  const response = await apiClient.get('/users/123');
  return response.data;
} catch (error) {
  // Error is already transformed to an application-specific error
  throw error;
}
```

## Best Practices

### Error Handling in Controllers

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { JourneyLogger } from '@austa/logging';
import { ValidationError, DatabaseError } from '@austa/errors/categories';
import { Health } from '@austa/errors/journey';

@Controller('health/metrics')
export class HealthMetricsController {
  constructor(
    private readonly metricsService: HealthMetricsService,
    private readonly logger: JourneyLogger
  ) {}

  @Post()
  async recordMetric(@Body() metricData: RecordMetricDto) {
    try {
      // Validate input
      if (!this.isValidMetricType(metricData.type)) {
        throw new ValidationError(
          `Invalid metric type: ${metricData.type}`,
          'HEALTH_METRIC_001',
          { allowedTypes: this.getAllowedMetricTypes() }
        );
      }

      // Process the request
      const result = await this.metricsService.recordMetric(metricData);
      
      // Log success
      this.logger.info('Health metric recorded successfully', {
        userId: metricData.userId,
        metricType: metricData.type
      });
      
      return result;
    } catch (error) {
      // Log the error with context
      this.logger.error('Failed to record health metric', error, {
        userId: metricData.userId,
        metricType: metricData.type
      });
      
      // Rethrow domain-specific errors
      if (error instanceof Health.Metrics.InvalidMetricValueError) {
        throw error;
      }
      
      // Transform generic errors to domain-specific ones
      if (error instanceof DatabaseError) {
        throw new Health.Metrics.MetricPersistenceError(
          'Failed to save health metric',
          {
            userId: metricData.userId,
            metricType: metricData.type,
            originalError: error
          }
        );
      }
      
      // Rethrow other errors
      throw error;
    }
  }
  
  private isValidMetricType(type: string): boolean {
    // Implementation
  }
  
  private getAllowedMetricTypes(): string[] {
    // Implementation
  }
}
```

### Error Handling in Services

```typescript
import { Injectable } from '@nestjs/common';
import { JourneyLogger } from '@austa/logging';
import { DatabaseError } from '@austa/errors/categories';
import { Health } from '@austa/errors/journey';
import { retryWithBackoff } from '@austa/errors/utils';

@Injectable()
export class HealthMetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deviceService: DeviceService,
    private readonly logger: JourneyLogger
  ) {}

  async recordMetric(metricData: RecordMetricDto) {
    // Validate metric value based on type
    this.validateMetricValue(metricData.type, metricData.value);
    
    // Check if the metric exceeds thresholds
    if (this.exceedsThreshold(metricData.type, metricData.value)) {
      throw new Health.Metrics.MetricThresholdExceededError(
        `${metricData.type} value exceeds safe threshold`,
        {
          value: metricData.value,
          threshold: this.getThreshold(metricData.type),
          userId: metricData.userId
        }
      );
    }
    
    try {
      // Save to database with retry for transient errors
      return await retryWithBackoff(
        async () => {
          return await this.prisma.healthMetric.create({
            data: {
              userId: metricData.userId,
              type: metricData.type,
              value: metricData.value,
              recordedAt: metricData.timestamp || new Date(),
              deviceId: metricData.deviceId
            }
          });
        },
        {
          maxAttempts: 3,
          initialDelay: 100,
          retryCondition: (error) => {
            // Only retry transient database errors
            return error instanceof DatabaseError && 
                   error.isTransient;
          }
        }
      );
    } catch (error) {
      // Transform database errors to domain-specific errors
      if (error instanceof DatabaseError) {
        throw new Health.Metrics.MetricPersistenceError(
          'Failed to save health metric to database',
          {
            userId: metricData.userId,
            metricType: metricData.type,
            originalError: error
          }
        );
      }
      
      // Rethrow other errors
      throw error;
    }
  }
  
  private validateMetricValue(type: string, value: number) {
    const { min, max } = this.getValidRange(type);
    
    if (value < min || value > max) {
      throw new Health.Metrics.InvalidMetricValueError(
        `${type} value must be between ${min} and ${max}`,
        { value, min, max, type }
      );
    }
  }
  
  private exceedsThreshold(type: string, value: number): boolean {
    // Implementation
  }
  
  private getThreshold(type: string): number {
    // Implementation
  }
  
  private getValidRange(type: string): { min: number, max: number } {
    // Implementation
  }
}
```

## Integration with Other Packages

### Logging Integration

```typescript
import { Injectable } from '@nestjs/common';
import { JourneyLogger } from '@austa/logging';
import { BaseError } from '@austa/errors';

@Injectable()
export class ExampleService {
  constructor(private readonly logger: JourneyLogger) {}

  async performOperation() {
    try {
      // Operation that might fail
    } catch (error) {
      // Enhanced error logging with context
      if (error instanceof BaseError) {
        // Log with error context
        this.logger.error(
          error.message,
          error,
          { 
            errorCode: error.code,
            errorType: error.type,
            ...error.context
          }
        );
      } else {
        // Log unknown errors
        this.logger.error(
          'An unexpected error occurred',
          error
        );
      }
      
      throw error;
    }
  }
}
```

### Tracing Integration

```typescript
import { Injectable } from '@nestjs/common';
import { TraceService } from '@austa/tracing';
import { BaseError } from '@austa/errors';

@Injectable()
export class ExampleService {
  constructor(private readonly traceService: TraceService) {}

  async performOperation() {
    const span = this.traceService.startSpan('performOperation');
    
    try {
      // Operation that might fail
      const result = await this.riskyOperation();
      
      span.end();
      return result;
    } catch (error) {
      // Record error in trace
      if (error instanceof BaseError) {
        span.setAttributes({
          'error.type': error.type,
          'error.code': error.code,
          ...this.flattenContext(error.context)
        });
      }
      
      span.recordException(error);
      span.setStatus({ code: 'ERROR' });
      span.end();
      
      throw error;
    }
  }
  
  private flattenContext(context: Record<string, any>, prefix = 'error.context') {
    // Implementation to flatten nested context for span attributes
  }
}
```

### Events Integration

```typescript
import { Injectable } from '@nestjs/common';
import { KafkaProducer } from '@austa/events';
import { BaseError } from '@austa/errors';

@Injectable()
export class ErrorReportingService {
  constructor(private readonly kafkaProducer: KafkaProducer) {}

  async reportError(error: Error) {
    if (error instanceof BaseError) {
      // Send structured error event
      await this.kafkaProducer.send('error.reported', {
        timestamp: new Date().toISOString(),
        errorType: error.type,
        errorCode: error.code,
        message: error.message,
        stack: error.stack,
        context: error.context,
        journey: error.context?.journey || 'unknown'
      });
    } else {
      // Send generic error event
      await this.kafkaProducer.send('error.reported', {
        timestamp: new Date().toISOString(),
        errorType: 'UNKNOWN',
        message: error.message,
        stack: error.stack
      });
    }
  }
}
```

## Contributing

When extending the error handling framework:

1. Follow the established error classification system
2. Maintain backward compatibility
3. Include comprehensive tests
4. Document all public APIs and interfaces
5. Consider journey-specific requirements

## License

MIT