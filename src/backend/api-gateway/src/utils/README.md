# API Gateway Error Handling

This directory contains utilities for comprehensive error handling in the API Gateway. The error handling framework provides error classification, standardized error codes, and journey-specific context.

## Key Components

### error-handling.util.ts

Provides core error handling utilities:

- **Error Classification**: Categorizes errors as Client, System, Transient, or External Dependency
- **Journey-Specific Context**: Adds journey context (Health, Care, Plan) to errors
- **Error Enrichment**: Adds request context, user information, and tracing data
- **Recovery Strategies**: Implements retry with exponential backoff and circuit breaker patterns

### response-transform.util.ts

Transforms responses for client consumption:

- **Success Transformation**: Ensures consistent response format for successful operations
- **Error Transformation**: Converts various error types to a standardized format
- **Legacy Support**: Maintains backward compatibility with existing error handling

### global-exception.filter.ts

Provides a NestJS exception filter for global error handling:

- **Exception Catching**: Catches all unhandled exceptions in the application
- **Format Standardization**: Ensures consistent error response format
- **Context Enrichment**: Adds request context to error responses
- **GraphQL Support**: Handles errors in GraphQL resolvers

## Usage Examples

### Basic Error Handling

```typescript
import { handleApiGatewayError } from './utils/error-handling.util';

try {
  // Your code here
} catch (error) {
  const formattedError = handleApiGatewayError(error, request);
  return formattedError;
}
```

### Using Retry with Backoff

```typescript
import { retryWithBackoff } from './utils/error-handling.util';
import { Observable } from 'rxjs';

function fetchData(): Observable<any> {
  return httpClient.get('/api/data').pipe(
    retryWithBackoff({
      maxRetries: 3,
      scalingDuration: 1000,
      excludedStatusCodes: [400, 401, 403, 404]
    })
  );
}
```

### Using Circuit Breaker

```typescript
import { createCircuitBreaker } from './utils/error-handling.util';

const circuitBreaker = createCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
  fallbackResponse: { message: 'Service temporarily unavailable' }
});

async function callExternalService() {
  return circuitBreaker(async () => {
    // Call to external service
    return externalService.getData();
  });
}
```

## Integration with NestJS

To use the global exception filter in a NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './utils/global-exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
```

To use the error handling middleware:

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ErrorHandlingMiddleware } from './middleware/error-handling.middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ErrorHandlingMiddleware).forRoutes('*');
  }
}
```

## Error Response Format

All error responses follow this standard format:

```json
{
  "statusCode": 400,
  "errorCode": "API.INVALID_INPUT",
  "message": "Invalid input: username is required",
  "timestamp": "2023-05-01T12:34:56.789Z",
  "path": "/api/users",
  "journey": "health",
  "correlationId": "abc123"
}
```

## Journey-Specific Error Codes

Each journey has specific error codes for domain-specific errors:

- **Health Journey**: `HEALTH_*` (e.g., `HEALTH_DEVICE_CONNECTION_FAILED`)
- **Care Journey**: `CARE_*` (e.g., `CARE_APPOINTMENT_NOT_AVAILABLE`)
- **Plan Journey**: `PLAN_*` (e.g., `PLAN_CLAIM_SUBMISSION_FAILED`)

Generic error codes are also available:

- **Authentication**: `AUTH_*` (e.g., `AUTH_UNAUTHORIZED`)
- **API**: `API_*` (e.g., `API_INVALID_INPUT`)
- **System**: `SYSTEM_*` (e.g., `SYSTEM_INTERNAL_SERVER_ERROR`)