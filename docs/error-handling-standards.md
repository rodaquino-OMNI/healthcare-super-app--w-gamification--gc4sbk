# AUSTA SuperApp Error Handling Standards

## Table of Contents

1. [Introduction](#1-introduction)
2. [Error Classification System](#2-error-classification-system)
   1. [General Error Categories](#21-general-error-categories)
   2. [Journey-Specific Error Classification](#22-journey-specific-error-classification)
3. [Error Handling Patterns](#3-error-handling-patterns)
   1. [Detection and Classification](#31-detection-and-classification)
   2. [Recovery Strategies](#32-recovery-strategies)
   3. [Fallback Mechanisms](#33-fallback-mechanisms)
4. [Error Propagation and Logging](#4-error-propagation-and-logging)
   1. [Cross-Service Error Propagation](#41-cross-service-error-propagation)
   2. [Structured Logging](#42-structured-logging)
   3. [Correlation with Tracing](#43-correlation-with-tracing)
5. [Client-Friendly Error Responses](#5-client-friendly-error-responses)
   1. [Response Structure](#51-response-structure)
   2. [Journey Context in Errors](#52-journey-context-in-errors)
   3. [Localization](#53-localization)
6. [Implementation Details](#6-implementation-details)
   1. [Error Package Structure](#61-error-package-structure)
   2. [Base Error Classes](#62-base-error-classes)
   3. [Utility Functions](#63-utility-functions)
7. [Framework Integration](#7-framework-integration)
   1. [NestJS Integration](#71-nestjs-integration)
   2. [React/React Native Integration](#72-reactreact-native-integration)
8. [Usage Examples](#8-usage-examples)
   1. [Backend Examples](#81-backend-examples)
   2. [Frontend Examples](#82-frontend-examples)

## 1. Introduction

The AUSTA SuperApp Error Handling Framework provides a standardized approach to error management across all services and journeys within the application. This document outlines the principles, patterns, and implementation details for consistent error handling throughout the platform.

The framework addresses several key requirements:

- **Journey-Specific Context**: Errors include context relevant to the user's current journey (Health, Care, Plan)
- **Consistent Patterns**: Standardized approach to error detection, classification, and recovery
- **Proper Propagation**: Errors maintain context as they cross service boundaries
- **Client-Friendly Responses**: Users receive actionable, understandable error messages
- **Operational Visibility**: Errors are properly logged, tracked, and correlated for troubleshooting

By following these standards, we ensure that errors are handled consistently, improving both the user experience and the operational reliability of the AUSTA SuperApp.

## 2. Error Classification System

### 2.1 General Error Categories

All errors in the AUSTA SuperApp are classified into one of four primary categories:

| Category | Description | HTTP Status Codes | Examples |
|----------|-------------|-------------------|----------|
| **Validation** | Errors related to invalid input data | 400, 422 | Missing required fields, invalid formats, malformed requests |
| **Business** | Errors related to business rule violations | 400, 403, 404, 409 | Resource not found, insufficient permissions, conflicting operations |
| **Technical** | Internal system errors | 500, 503 | Database failures, unexpected exceptions, configuration errors |
| **External** | Errors from external dependencies | 502, 504 | API timeouts, third-party service failures, integration errors |

Each category has specific error classes that extend the base error type:

#### Validation Errors

- `MissingParameterError`: Required parameter is missing
- `InvalidParameterError`: Parameter has invalid value or format
- `MalformedRequestError`: Request structure is invalid
- `InvalidCredentialsError`: Authentication credentials are invalid
- `SchemaValidationError`: Request fails schema validation

#### Business Errors

- `ResourceNotFoundError`: Requested resource does not exist
- `ResourceExistsError`: Resource already exists (on creation)
- `BusinessRuleViolationError`: Operation violates business rules
- `ConflictError`: Operation conflicts with current state
- `InsufficientPermissionsError`: User lacks required permissions
- `InvalidStateError`: Resource is in an invalid state for operation

#### Technical Errors

- `InternalServerError`: Unexpected system error
- `DatabaseError`: Database operation failure
- `ConfigurationError`: System misconfiguration
- `TimeoutError`: Operation exceeded time limit
- `DataProcessingError`: Error processing or transforming data
- `ServiceUnavailableError`: Service is temporarily unavailable

#### External Errors

- `ExternalApiError`: Error from external API
- `IntegrationError`: Error in external system integration
- `ExternalDependencyUnavailableError`: External system unavailable
- `ExternalAuthenticationError`: Authentication with external system failed
- `ExternalResponseFormatError`: Invalid response from external system
- `ExternalRateLimitError`: Rate limit exceeded on external system

### 2.2 Journey-Specific Error Classification

In addition to the general categories, the AUSTA SuperApp implements journey-specific error types that provide context relevant to each journey:

#### Health Journey Errors

Health journey errors are organized into five domains:

1. **Health Metrics Errors**
   - `InvalidMetricValueError`: Metric value is outside acceptable range
   - `MetricThresholdExceededError`: Metric exceeds health threshold
   - `MetricProcessingError`: Error processing health metric data
   - `MetricSourceUnavailableError`: Health metric data source unavailable

2. **Health Goals Errors**
   - `InvalidGoalParametersError`: Goal parameters are invalid
   - `ConflictingGoalsError`: Goal conflicts with existing goals
   - `GoalTrackingError`: Error tracking goal progress
   - `UnachievableGoalError`: Goal cannot be achieved based on parameters

3. **Health Insights Errors**
   - `InsufficientDataError`: Not enough data for insight generation
   - `PatternRecognitionFailureError`: Failed to recognize health patterns
   - `InsightGenerationError`: Error generating health insights
   - `ConflictingRecommendationsError`: Recommendations conflict with each other

4. **Device Integration Errors**
   - `DeviceConnectionFailureError`: Failed to connect to health device
   - `DeviceAuthenticationError`: Authentication with device failed
   - `SynchronizationFailedError`: Failed to sync data from device
   - `UnsupportedDeviceError`: Device is not supported

5. **FHIR Integration Errors**
   - `FhirConnectionFailureError`: Failed to connect to FHIR endpoint
   - `InvalidResourceError`: FHIR resource is invalid
   - `FhirAuthenticationError`: Authentication with FHIR server failed
   - `UnsupportedResourceTypeError`: FHIR resource type not supported

#### Care Journey Errors

Care journey errors are organized into five domains:

1. **Appointment Errors**
   - `AppointmentUnavailableError`: Requested appointment slot unavailable
   - `AppointmentConflictError`: Appointment conflicts with existing one
   - `AppointmentCancellationError`: Error canceling appointment
   - `ProviderUnavailableError`: Provider not available for appointment

2. **Medication Errors**
   - `MedicationNotFoundError`: Medication not found in database
   - `MedicationInteractionError`: Medication interacts with existing medications
   - `DosageCalculationError`: Error calculating medication dosage
   - `PrescriptionError`: Error processing prescription

3. **Telemedicine Errors**
   - `SessionInitializationError`: Failed to initialize telemedicine session
   - `ConnectionQualityError`: Poor connection quality for telemedicine
   - `ProviderDisconnectedError`: Provider disconnected from session
   - `MediaDeviceError`: Error accessing camera or microphone

4. **Provider Errors**
   - `ProviderNotFoundError`: Provider not found in system
   - `ProviderAuthenticationError`: Provider authentication failed
   - `SpecialtyUnavailableError`: No providers available for specialty
   - `ProviderSchedulingError`: Error scheduling with provider

5. **Symptom Checker Errors**
   - `SymptomValidationError`: Invalid symptom input
   - `DiagnosisProcessingError`: Error processing diagnosis
   - `EmergencyDetectedError`: Emergency condition detected
   - `IncompleteSymptomDataError`: Insufficient symptom data provided

#### Plan Journey Errors

Plan journey errors are organized into five domains:

1. **Insurance Plan Errors**
   - `PlanNotFoundError`: Insurance plan not found
   - `PlanEligibilityError`: User not eligible for plan
   - `PlanComparisonError`: Error comparing insurance plans
   - `PlanEnrollmentError`: Error during plan enrollment

2. **Benefits Errors**
   - `BenefitNotCoveredError`: Benefit not covered by plan
   - `BenefitLimitExceededError`: Benefit usage limit exceeded
   - `BenefitVerificationError`: Error verifying benefit coverage
   - `BenefitCalculationError`: Error calculating benefit amount

3. **Claims Errors**
   - `ClaimSubmissionError`: Error submitting insurance claim
   - `ClaimProcessingError`: Error processing claim
   - `ClaimDocumentationError`: Missing or invalid claim documentation
   - `ClaimStatusUpdateError`: Error updating claim status

4. **Coverage Errors**
   - `CoverageVerificationError`: Error verifying coverage
   - `CoverageExpirationError`: Coverage has expired
   - `ProcedureNotCoveredError`: Procedure not covered by plan
   - `PreauthorizationRequiredError`: Preauthorization required but not obtained

5. **Document Errors**
   - `DocumentUploadError`: Error uploading document
   - `DocumentProcessingError`: Error processing document
   - `DocumentValidationError`: Document failed validation
   - `DocumentNotFoundError`: Required document not found

## 3. Error Handling Patterns

### 3.1 Detection and Classification

Errors should be detected as early as possible in the request lifecycle and properly classified according to the error classification system. The following patterns should be used for error detection:

1. **Input Validation**
   - Validate all input at API boundaries using Zod/class-validator
   - Return validation errors with specific field information
   - Use consistent validation patterns across all services

2. **Business Rule Validation**
   - Validate business rules after input validation
   - Use domain-specific validators for complex rules
   - Return business errors with context about the rule violation

3. **Exception Handling**
   - Use try/catch blocks for operations that may throw exceptions
   - Convert standard errors to application-specific errors
   - Preserve original error as cause for debugging

4. **External System Monitoring**
   - Monitor external system responses for errors
   - Classify external errors based on response codes
   - Track external system health for proactive error handling

### 3.2 Recovery Strategies

The AUSTA SuperApp implements several recovery strategies for different error types:

1. **Retry with Exponential Backoff**
   - Use for transient errors (network issues, temporary unavailability)
   - Implement exponential backoff with jitter to prevent thundering herd
   - Set maximum retry attempts and timeout
   - Example configuration:
     ```typescript
     @Retry({
       maxAttempts: 3,
       backoffFactor: 2,
       initialDelay: 100,
       maxDelay: 1000,
       jitter: true,
     })
     ```

2. **Circuit Breaker Pattern**
   - Use for failing external dependencies
   - Track failure rates and trip circuit when threshold exceeded
   - Implement half-open state for recovery testing
   - Example configuration:
     ```typescript
     @CircuitBreaker({
       failureThreshold: 0.5,  // 50% failure rate
       resetTimeout: 30000,    // 30 seconds
       minimumRequests: 10,    // Minimum requests before tripping
     })
     ```

3. **Timeout Management**
   - Set appropriate timeouts for all operations
   - Handle timeout errors gracefully
   - Provide user feedback for long-running operations
   - Example configuration:
     ```typescript
     @TimeoutConfig({
       timeout: 5000,  // 5 seconds
       errorMessage: 'Operation timed out. Please try again.',
     })
     ```

### 3.3 Fallback Mechanisms

When errors cannot be recovered, implement appropriate fallback mechanisms:

1. **Cached Data Fallback**
   - Return cached data when fresh data cannot be retrieved
   - Clearly indicate that data may be stale
   - Set appropriate cache TTL based on data criticality
   - Example:
     ```typescript
     @Fallback({
       strategy: 'cache',
       maxAge: 3600,  // 1 hour
       staleIfError: true,
     })
     ```

2. **Graceful Degradation**
   - Disable non-critical features when dependencies fail
   - Provide limited functionality instead of complete failure
   - Communicate degraded state to users
   - Example:
     ```typescript
     @Fallback({
       strategy: 'degrade',
       features: ['recommendations', 'insights'],
       preserveCore: true,
     })
     ```

3. **Default Values**
   - Use sensible defaults when actual values cannot be retrieved
   - Clearly indicate when defaults are being used
   - Ensure defaults don't violate business rules
   - Example:
     ```typescript
     @Fallback({
       strategy: 'default',
       value: { status: 'unknown', recommendations: [] },
     })
     ```

## 4. Error Propagation and Logging

### 4.1 Cross-Service Error Propagation

Errors must maintain context as they cross service boundaries:

1. **Error Serialization**
   - Serialize errors to JSON when crossing service boundaries
   - Include error code, message, and context
   - Preserve journey-specific information
   - Use the `serialize` utility from `@austa/errors/utils`

2. **Error Deserialization**
   - Deserialize JSON errors back to appropriate error classes
   - Reconstruct error hierarchy and context
   - Use the `deserialize` utility from `@austa/errors/utils`

3. **GraphQL Error Handling**
   - Format errors consistently in GraphQL responses
   - Include error codes and paths in extensions
   - Filter sensitive information from error details
   - Use the `formatError` function from `@austa/errors/graphql`

4. **REST Error Handling**
   - Return consistent error response structure
   - Map error types to appropriate HTTP status codes
   - Include detailed error information in response body
   - Use the `GlobalExceptionFilter` from `@austa/errors/nest`

### 4.2 Structured Logging

All errors must be logged with appropriate context:

1. **Log Levels**
   - Validation errors: WARN
   - Business errors: INFO
   - Technical errors: ERROR
   - External errors: ERROR
   - Fatal errors: FATAL

2. **Log Context**
   - Include request ID for correlation
   - Add user ID and journey context when available
   - Log error code, type, and message
   - Include stack trace in development/staging environments

3. **Sensitive Information**
   - Redact sensitive information (PII, PHI, credentials)
   - Use secure logging patterns for sensitive operations
   - Follow HIPAA compliance requirements for health data

4. **Structured Format**
   - Use JSON format for all logs
   - Include standardized fields for filtering and analysis
   - Ensure consistent field names across all services

Example log structure:

```json
{
  "timestamp": "2023-04-15T14:32:45.123Z",
  "level": "ERROR",
  "requestId": "req-123456",
  "userId": "user-789012",
  "journey": "health",
  "service": "health-service",
  "error": {
    "code": "HEALTH_METRICS_001",
    "type": "validation",
    "message": "Invalid blood pressure value",
    "details": {
      "field": "systolic",
      "value": 300,
      "constraint": "<= 250"
    }
  },
  "context": {
    "operation": "recordBloodPressure",
    "metricId": "bp-123456"
  }
}
```

### 4.3 Correlation with Tracing

Errors must be correlated with distributed traces:

1. **Trace Context**
   - Include trace ID in all error logs
   - Add span ID for specific operation context
   - Correlate errors across service boundaries

2. **Error Spans**
   - Create error spans for significant errors
   - Add error attributes to spans
   - Set span status to ERROR for failed operations

3. **Baggage Propagation**
   - Use W3C baggage for propagating error context
   - Include journey information in baggage
   - Preserve context across async operations

4. **Visualization**
   - Link errors to traces in observability tools
   - Create error dashboards for monitoring
   - Set up alerts for critical error patterns

## 5. Client-Friendly Error Responses

### 5.1 Response Structure

All error responses to clients must follow a consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": { /* Additional error details */ },
    "type": "error_type",
    "path": "resource.field",  // For validation errors
    "timestamp": "2023-04-15T14:32:45.123Z",
    "requestId": "req-123456"  // For support reference
  }
}
```

For validation errors with multiple fields:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": [
        {
          "path": "email",
          "message": "Must be a valid email address",
          "value": "invalid-email"
        },
        {
          "path": "password",
          "message": "Must be at least 8 characters",
          "value": "****"
        }
      ]
    },
    "type": "validation",
    "timestamp": "2023-04-15T14:32:45.123Z",
    "requestId": "req-123456"
  }
}
```

### 5.2 Journey Context in Errors

Error messages should include journey-specific context to help users understand and resolve issues:

1. **Health Journey Context**
   - Include relevant health metric information
   - Reference health goals when applicable
   - Provide guidance on device connectivity issues
   - Suggest alternative actions for health tracking

2. **Care Journey Context**
   - Include appointment details for scheduling errors
   - Reference provider information when relevant
   - Provide guidance on telemedicine connectivity
   - Suggest alternative care options when appropriate

3. **Plan Journey Context**
   - Include plan and benefit information
   - Reference claim details when applicable
   - Provide guidance on coverage issues
   - Suggest next steps for resolving insurance problems

Example of journey-specific error message:

```json
{
  "error": {
    "code": "CARE_APPOINTMENT_001",
    "message": "This appointment time is no longer available",
    "details": {
      "providerId": "provider-123",
      "providerName": "Dr. Smith",
      "requestedTime": "2023-05-10T14:00:00Z",
      "alternativeSlots": [
        "2023-05-10T15:00:00Z",
        "2023-05-11T10:00:00Z"
      ]
    },
    "type": "business",
    "timestamp": "2023-04-15T14:32:45.123Z",
    "requestId": "req-123456"
  }
}
```

### 5.3 Localization

Error messages must support localization for all supported languages:

1. **Message Templates**
   - Use message templates with placeholders
   - Store templates in localization files
   - Support variable substitution in messages

2. **Error Codes as Keys**
   - Use error codes as localization keys
   - Maintain consistent codes across the application
   - Document all error codes with descriptions

3. **Fallback Messages**
   - Provide fallback messages when translation is missing
   - Ensure technical details are never exposed to users
   - Use generic messages for unexpected errors

4. **Cultural Considerations**
   - Adapt error messages to cultural contexts
   - Consider tone and formality appropriate to locale
   - Provide culturally relevant guidance

Example of localized error messages:

```typescript
// en-US.json
{
  "HEALTH_METRICS_001": "The blood pressure value {{value}} is outside the normal range ({{min}}-{{max}})"
}

// pt-BR.json
{
  "HEALTH_METRICS_001": "O valor da pressão arterial {{value}} está fora do intervalo normal ({{min}}-{{max}})"
}
```

## 6. Implementation Details

### 6.1 Error Package Structure

The `@austa/errors` package provides a comprehensive error handling framework with the following structure:

```
@austa/errors/
├── src/
│   ├── base.ts                # Base error classes
│   ├── constants.ts           # Error constants and codes
│   ├── types.ts               # TypeScript interfaces and types
│   ├── index.ts               # Main entry point
│   ├── categories/            # General error categories
│   │   ├── validation.errors.ts
│   │   ├── business.errors.ts
│   │   ├── technical.errors.ts
│   │   ├── external.errors.ts
│   │   └── index.ts
│   ├── journey/              # Journey-specific errors
│   │   ├── health/
│   │   │   ├── metrics.errors.ts
│   │   │   ├── goals.errors.ts
│   │   │   ├── insights.errors.ts
│   │   │   ├── devices.errors.ts
│   │   │   ├── fhir.errors.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── care/
│   │   │   ├── appointments.errors.ts
│   │   │   ├── medications.errors.ts
│   │   │   ├── telemedicine.errors.ts
│   │   │   ├── providers.errors.ts
│   │   │   ├── symptom-checker.errors.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── plan/
│   │   │   ├── insurance.errors.ts
│   │   │   ├── benefits.errors.ts
│   │   │   ├── claims.errors.ts
│   │   │   ├── coverage.errors.ts
│   │   │   ├── documents.errors.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── nest/                 # NestJS integration
│   │   ├── filters.ts
│   │   ├── interceptors.ts
│   │   ├── decorators.ts
│   │   ├── module.ts
│   │   └── index.ts
│   └── utils/                # Utility functions
│       ├── retry.ts
│       ├── circuit-breaker.ts
│       ├── format.ts
│       ├── serialize.ts
│       ├── stack.ts
│       ├── secure-http.ts
│       └── index.ts
```

### 6.2 Base Error Classes

All errors in the AUSTA SuperApp extend the `BaseError` class, which provides common functionality:

```typescript
class BaseError extends Error {
  public readonly code: string;
  public readonly type: ErrorType;
  public readonly timestamp: Date;
  public readonly details?: Record<string, any>;
  public readonly cause?: Error;
  public readonly isOperational: boolean;
  public readonly httpStatus?: number;

  constructor(options: BaseErrorOptions) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.type = options.type;
    this.timestamp = new Date();
    this.details = options.details;
    this.cause = options.cause;
    this.isOperational = options.isOperational ?? true;
    this.httpStatus = options.httpStatus;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializes the error to a plain object for transmission
   */
  public toJSON(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
      stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined,
      cause: this.cause instanceof BaseError 
        ? this.cause.toJSON() 
        : this.cause 
          ? { message: this.cause.message } 
          : undefined,
      isOperational: this.isOperational,
      httpStatus: this.httpStatus
    };
  }

  /**
   * Creates a user-friendly error message with context
   */
  public toUserMessage(locale: string = 'en-US'): string {
    // Implementation depends on i18n setup
    return formatErrorMessage(this.code, this.details, locale);
  }
}
```

### 6.3 Utility Functions

The `@austa/errors/utils` module provides several utility functions for error handling:

1. **Retry Utilities**

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts = 3,
    backoffFactor = 2,
    initialDelay = 100,
    maxDelay = 10000,
    jitter = true,
    retryableErrors = [ErrorType.EXTERNAL, ErrorType.TECHNICAL],
    onRetry = () => {}
  } = options;

  let attempt = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      // Check if we should retry
      const shouldRetry = 
        attempt < maxAttempts && 
        isRetryableError(error, retryableErrors);
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Calculate delay with optional jitter
      const actualDelay = jitter 
        ? calculateJitteredDelay(delay) 
        : delay;
      
      // Call onRetry callback
      onRetry(error, attempt, actualDelay);
      
      // Wait before retrying
      await sleep(actualDelay);
      
      // Increase delay for next attempt
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
}
```

2. **Circuit Breaker**

```typescript
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: 0.5,
      resetTimeout: 30000,
      minimumRequests: 10,
      halfOpenSuccessThreshold: 5,
      ...options
    };
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.toHalfOpen();
      } else {
        throw new CircuitOpenError({
          message: 'Circuit breaker is open',
          resetTimeout: this.options.resetTimeout,
          remainingTime: this.options.resetTimeout - (Date.now() - this.lastFailureTime)
        });
      }
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.halfOpenSuccessThreshold) {
        this.toClosed();
      }
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.toOpen();
    } else if (this.state === CircuitState.CLOSED) {
      const totalRequests = this.failureCount + this.successCount;
      if (totalRequests >= this.options.minimumRequests) {
        const failureRate = this.failureCount / totalRequests;
        if (failureRate >= this.options.failureThreshold) {
          this.toOpen();
        }
      }
    }
  }

  private toClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }

  private toOpen(): void {
    this.state = CircuitState.OPEN;
    this.successCount = 0;
  }

  private toHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
  }
}
```

3. **Error Serialization**

```typescript
function serializeError(error: Error | BaseError): SerializedError {
  if (error instanceof BaseError) {
    return error.toJSON();
  }

  return {
    name: error.name,
    message: error.message,
    code: 'UNKNOWN_ERROR',
    type: ErrorType.TECHNICAL,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    isOperational: false
  };
}

function deserializeError(serialized: SerializedError): BaseError {
  // Create appropriate error instance based on name and code
  const ErrorClass = findErrorClass(serialized.name, serialized.code);
  
  // Deserialize cause if present
  const cause = serialized.cause 
    ? deserializeError(serialized.cause as SerializedError) 
    : undefined;
  
  // Create new error instance
  return new ErrorClass({
    message: serialized.message,
    code: serialized.code,
    details: serialized.details,
    cause,
    isOperational: serialized.isOperational,
    httpStatus: serialized.httpStatus
  });
}
```

## 7. Framework Integration

### 7.1 NestJS Integration

The `@austa/errors/nest` module provides integration with NestJS:

1. **Global Exception Filter**

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly options: ExceptionFilterOptions = {}
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Convert to BaseError if not already
    const error = this.normalizeError(exception);
    
    // Get HTTP status code
    const status = error.httpStatus || this.mapErrorTypeToStatus(error.type);
    
    // Log error with context
    this.logError(error, request);
    
    // Send response
    response.status(status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        type: error.type,
        timestamp: error.timestamp.toISOString(),
        requestId: request.id || 'unknown'
      }
    });
  }

  private normalizeError(exception: unknown): BaseError {
    if (exception instanceof BaseError) {
      return exception;
    }
    
    if (exception instanceof HttpException) {
      return this.convertHttpException(exception);
    }
    
    if (exception instanceof Error) {
      return new InternalServerError({
        message: exception.message,
        cause: exception
      });
    }
    
    return new InternalServerError({
      message: 'An unknown error occurred',
      details: { originalError: exception }
    });
  }

  private mapErrorTypeToStatus(type: ErrorType): number {
    switch (type) {
      case ErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.BUSINESS:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY;
      case ErrorType.TECHNICAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private logError(error: BaseError, request: Request): void {
    const logLevel = this.getLogLevel(error.type);
    
    this.logger[logLevel]({
      message: `Request error: ${error.message}`,
      error: {
        code: error.code,
        type: error.type,
        stack: error.stack
      },
      request: {
        id: request.id,
        method: request.method,
        url: request.url,
        userId: request.user?.id
      }
    });
  }

  private getLogLevel(type: ErrorType): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return 'warn';
      case ErrorType.BUSINESS:
        return 'info';
      case ErrorType.EXTERNAL:
      case ErrorType.TECHNICAL:
      default:
        return 'error';
    }
  }
}
```

2. **Error Module**

```typescript
@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: (logger: LoggerService) => {
        return new GlobalExceptionFilter(logger);
      },
      inject: [LoggerService]
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor
    }
  ],
  exports: []
})
export class ErrorsModule {
  static forRoot(options?: ErrorsModuleOptions): DynamicModule {
    return {
      module: ErrorsModule,
      providers: [
        {
          provide: ERRORS_MODULE_OPTIONS,
          useValue: options || {}
        }
      ]
    };
  }
}
```

### 7.2 React/React Native Integration

For frontend applications, the error handling framework provides React integration:

1. **Error Boundary Component**

```tsx
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to monitoring service
    logErrorToService(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return this.props.fallback ? (
        this.props.fallback(this.state.error)
      ) : (
        <DefaultErrorFallback error={this.state.error} />
      );
    }

    return this.props.children;
  }
}
```

2. **Error Context Provider**

```tsx
const ErrorContext = React.createContext<ErrorContextType>(null!);

export function ErrorProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [error, setError] = useState<AppError | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const showError = useCallback((newError: AppError | Error | string) => {
    const appError = convertToAppError(newError);
    setError(appError);
    setIsVisible(true);
  }, []);

  const hideError = useCallback(() => {
    setIsVisible(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      error,
      isVisible,
      showError,
      hideError,
      clearError,
    }),
    [error, isVisible, showError, hideError, clearError]
  );

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <ErrorModal
        error={error}
        isVisible={isVisible}
        onClose={hideError}
      />
    </ErrorContext.Provider>
  );
}
```

3. **API Error Handling**

```typescript
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Convert API errors to AppError instances
    if (error.response) {
      const { data, status } = error.response;
      
      // Handle structured error responses
      if (data && data.error) {
        return Promise.reject(
          new AppError({
            code: data.error.code,
            message: data.error.message,
            details: data.error.details,
            httpStatus: status,
          })
        );
      }
      
      // Handle unstructured error responses
      return Promise.reject(
        new AppError({
          code: 'API_ERROR',
          message: 'An error occurred while communicating with the server',
          details: { status, data },
          httpStatus: status,
        })
      );
    }
    
    // Handle network errors
    if (error.request) {
      return Promise.reject(
        new AppError({
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection.',
          details: { request: error.request },
        })
      );
    }
    
    // Handle other errors
    return Promise.reject(
      new AppError({
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        details: { originalError: error },
      })
    );
  }
);
```

## 8. Usage Examples

### 8.1 Backend Examples

1. **Creating and Throwing Journey-Specific Errors**

```typescript
import { Health } from '@austa/errors/journey';

class HealthMetricsService {
  async recordBloodPressure(userId: string, systolic: number, diastolic: number): Promise<void> {
    // Validate input
    if (systolic < 0 || systolic > 250) {
      throw new Health.Metrics.InvalidMetricValueError({
        message: 'Systolic blood pressure value is outside acceptable range',
        details: {
          field: 'systolic',
          value: systolic,
          acceptableRange: { min: 0, max: 250 }
        }
      });
    }
    
    if (diastolic < 0 || diastolic > 150) {
      throw new Health.Metrics.InvalidMetricValueError({
        message: 'Diastolic blood pressure value is outside acceptable range',
        details: {
          field: 'diastolic',
          value: diastolic,
          acceptableRange: { min: 0, max: 150 }
        }
      });
    }
    
    try {
      // Save to database
      await this.metricsRepository.saveBloodPressure(userId, systolic, diastolic);
      
      // Check for concerning values
      if (systolic > 180 || diastolic > 120) {
        throw new Health.Metrics.MetricThresholdExceededError({
          message: 'Blood pressure values indicate hypertensive crisis',
          details: {
            systolic,
            diastolic,
            severity: 'critical',
            recommendedAction: 'seek_immediate_medical_attention'
          }
        });
      }
    } catch (error) {
      // Handle database errors
      if (error instanceof DatabaseError) {
        throw new Health.Metrics.MetricProcessingError({
          message: 'Failed to save blood pressure reading',
          cause: error,
          details: { userId, systolic, diastolic }
        });
      }
      
      // Re-throw other errors
      throw error;
    }
  }
}
```

2. **Using Retry and Circuit Breaker Patterns**

```typescript
import { Retry, CircuitBreaker } from '@austa/errors/nest';
import { retryWithBackoff } from '@austa/errors/utils';

@Injectable()
class FhirIntegrationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  // Method-level retry and circuit breaker
  @Retry({
    maxAttempts: 3,
    backoffFactor: 2,
    initialDelay: 200
  })
  @CircuitBreaker({
    failureThreshold: 0.5,
    resetTimeout: 30000
  })
  async getPatientRecord(patientId: string): Promise<FhirPatient> {
    try {
      const response = await this.httpService.get(
        `${this.configService.get('FHIR_BASE_URL')}/Patient/${patientId}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Health.Fhir.InvalidResourceError({
          message: 'Patient record not found',
          details: { patientId }
        });
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Health.Fhir.FhirAuthenticationError({
          message: 'Authentication failed with FHIR server',
          details: { endpoint: 'Patient', status: error.response.status }
        });
      }
      
      throw new Health.Fhir.FhirConnectionFailureError({
        message: 'Failed to connect to FHIR server',
        cause: error,
        details: { endpoint: 'Patient', patientId }
      });
    }
  }

  // Manual retry with utility function
  async searchMedications(query: string): Promise<FhirMedication[]> {
    return retryWithBackoff(
      async () => {
        try {
          const response = await this.httpService.get(
            `${this.configService.get('FHIR_BASE_URL')}/Medication`,
            { params: { name: query } }
          );
          return response.data.entry.map(entry => entry.resource);
        } catch (error) {
          // Transform error and rethrow
          if (error.response?.status === 429) {
            throw new Health.Fhir.FhirRateLimitError({
              message: 'Rate limit exceeded for FHIR server',
              details: { 
                endpoint: 'Medication', 
                retryAfter: error.response.headers['retry-after'] 
              }
            });
          }
          
          throw new Health.Fhir.FhirConnectionFailureError({
            message: 'Failed to search medications',
            cause: error,
            details: { endpoint: 'Medication', query }
          });
        }
      },
      {
        maxAttempts: 5,
        backoffFactor: 1.5,
        initialDelay: 100,
        maxDelay: 5000,
        retryableErrors: [Health.Fhir.FhirRateLimitError, Health.Fhir.FhirConnectionFailureError],
        onRetry: (error, attempt, delay) => {
          this.logger.warn(
            `Retrying FHIR medication search (attempt ${attempt}) after ${delay}ms due to: ${error.message}`
          );
        }
      }
    );
  }
}
```

### 8.2 Frontend Examples

1. **Handling API Errors in React Components**

```tsx
import { useErrorContext } from '@austa/errors/react';
import { AppError } from '@austa/errors/client';

function BloodPressureForm() {
  const { showError } = useErrorContext();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api.post('/health/metrics/blood-pressure', {
        systolic: Number(systolic),
        diastolic: Number(diastolic)
      });
      
      // Success handling
      toast.success('Blood pressure recorded successfully');
      setSystolic('');
      setDiastolic('');
    } catch (error) {
      // Handle specific error types
      if (error instanceof AppError) {
        if (error.code === 'HEALTH_METRICS_001') {
          // Handle validation error specifically
          if (error.details?.field === 'systolic') {
            setSystolicError(error.message);
          } else if (error.details?.field === 'diastolic') {
            setDiastolicError(error.message);
          } else {
            showError(error);
          }
        } else if (error.code === 'HEALTH_METRICS_002') {
          // Show warning for threshold exceeded
          showWarningAlert({
            title: 'Medical Attention Advised',
            message: error.message,
            actions: [
              {
                label: 'Schedule Appointment',
                onPress: () => navigation.navigate('CareAppointments')
              }
            ]
          });
        } else {
          // Show general error
          showError(error);
        }
      } else {
        // Handle unexpected errors
        showError(
          new AppError({
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred while saving your blood pressure reading.'
          })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

2. **Error Boundary Usage**

```tsx
import { ErrorBoundary } from '@austa/errors/react';

function App() {
  return (
    <ErrorProvider>
      <ErrorBoundary
        fallback={error => (
          <ErrorFallbackScreen 
            error={error}
            onRetry={() => window.location.reload()}
          />
        )}
      >
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/health/*" element={<HealthJourney />} />
            <Route path="/care/*" element={<CareJourney />} />
            <Route path="/plan/*" element={<PlanJourney />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </ErrorProvider>
  );
}

// Journey-specific error boundaries
function HealthJourney() {
  return (
    <ErrorBoundary
      fallback={error => (
        <HealthJourneyErrorScreen 
          error={error}
          onRetry={() => window.location.reload()}
        />
      )}
    >
      <HealthDashboard />
    </ErrorBoundary>
  );
}
```

3. **Error Handling in API Hooks**

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppError } from '@austa/errors/client';

// Custom hook for health metrics
export function useHealthMetrics(userId: string) {
  const { showError } = useErrorContext();
  
  // Query for fetching metrics
  const metricsQuery = useQuery({
    queryKey: ['healthMetrics', userId],
    queryFn: async () => {
      try {
        const response = await api.get(`/health/metrics?userId=${userId}`);
        return response.data;
      } catch (error) {
        // Transform and rethrow error
        if (error instanceof AppError) {
          throw error;
        }
        
        throw new AppError({
          code: 'HEALTH_METRICS_FETCH_ERROR',
          message: 'Failed to load health metrics',
          details: { originalError: error }
        });
      }
    },
    onError: (error) => {
      // Handle query errors
      showError(error as AppError);
    }
  });
  
  // Mutation for adding a metric
  const addMetricMutation = useMutation({
    mutationFn: async (metricData: HealthMetricInput) => {
      try {
        const response = await api.post('/health/metrics', metricData);
        return response.data;
      } catch (error) {
        // Transform and rethrow error
        if (error instanceof AppError) {
          throw error;
        }
        
        throw new AppError({
          code: 'HEALTH_METRICS_ADD_ERROR',
          message: 'Failed to add health metric',
          details: { originalError: error, metricType: metricData.type }
        });
      }
    },
    onError: (error, variables) => {
      // Handle specific error types
      const appError = error as AppError;
      
      if (appError.code === 'HEALTH_METRICS_001') {
        // Handle validation errors
        return; // Let component handle validation errors
      }
      
      // Show general error
      showError(appError);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['healthMetrics', userId] });
    }
  });
  
  return {
    metrics: metricsQuery.data,
    isLoading: metricsQuery.isLoading,
    isError: metricsQuery.isError,
    addMetric: addMetricMutation.mutate,
    isAddingMetric: addMetricMutation.isPending
  };
}
```