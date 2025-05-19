# Exception Handling Framework

## Overview

This directory contains the exception handling framework for the AUSTA SuperApp gamification engine. It provides a comprehensive set of exception classes, utilities, and patterns to ensure consistent error handling across the application.

## Key Components

### Base Exception Classes

- `AppExceptionBase`: Foundation abstract exception class that all other exceptions extend
- `HttpExceptionBase`: Abstract base class for HTTP-specific exceptions

### Client Exceptions (HTTP 4xx)

- `ClientException`: Base class for all client error exceptions
- `ValidationException`: For handling validation failures in API requests
- `NotFoundException`: For resource not found scenarios
- `UnauthorizedException`: For authentication and authorization failures

### System Exceptions (HTTP 5xx)

- `SystemException`: Base class for all system error exceptions
- `DatabaseException`: For database operation failures

### External Dependency Exceptions

- `ExternalDependencyException`: Base class for external dependency failures
- `KafkaException`: Specialized exception for Kafka-related errors

### Transient Exceptions

- `TransientException`: For handling transient errors with retry capabilities

### Utilities

- `CircuitBreaker`: Implementation of the circuit breaker pattern
- `RetryUtils`: Utility functions for implementing retry logic

## Circuit Breaker Pattern

The `CircuitBreaker` class implements the circuit breaker pattern to prevent cascading failures when external dependencies experience issues. It works by monitoring for failures and, when a threshold is reached, "trips" the circuit to prevent further calls to the failing service.

### States

- **CLOSED**: Circuit is closed and requests are allowed through
- **OPEN**: Circuit is open and requests are blocked
- **HALF_OPEN**: Circuit is allowing a test request to check if the service has recovered

### Usage

#### Using the Decorator

```typescript
class PaymentService {
  @CircuitBreaker.Protect('payment-api')
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    return this.paymentApi.process(data);
  }
}
```

#### Using the Circuit Breaker Directly

```typescript
const breaker = new CircuitBreaker('payment-service', {
  failureThreshold: 5,
  resetTimeout: 30000
});

async function processPayment(paymentData) {
  return breaker.execute(async () => {
    return await paymentService.process(paymentData);
  });
}
```

#### Using the Utility Functions

```typescript
// With circuit breaker
async function processPayment(paymentData) {
  return withCircuitBreaker(
    'payment-service',
    async () => await paymentService.process(paymentData),
    { failureThreshold: 5, resetTimeout: 30000 }
  );
}

// With circuit breaker and fallback
async function processPayment(paymentData) {
  return withCircuitBreakerAndFallback(
    'payment-service',
    async () => await paymentService.process(paymentData),
    async (error) => ({ success: false, error: error.message }),
    { failureThreshold: 5, resetTimeout: 30000 }
  );
}
```

### Configuration

The circuit breaker can be configured with the following options:

```typescript
interface CircuitBreakerOptions {
  // Number of failures required to trip the circuit
  failureThreshold: number;
  
  // Time in milliseconds to wait before attempting to reset the circuit
  resetTimeout: number;
  
  // Time in milliseconds to wait for a response before considering the call a failure
  requestTimeout?: number;
  
  // Logger instance for circuit breaker events
  logger?: Logger;
  
  // Function to determine if an error should count as a failure
  isFailure?: (error: Error) => boolean;
  
  // Function to execute when the circuit trips from CLOSED to OPEN
  onOpen?: (serviceName: string, failureCount: number) => void;
  
  // Function to execute when the circuit resets from OPEN to CLOSED
  onClose?: (serviceName: string) => void;
  
  // Function to execute when the circuit transitions to HALF_OPEN
  onHalfOpen?: (serviceName: string) => void;
}
```

## Retry Utilities

The `RetryUtils` module provides a comprehensive set of utilities for handling transient errors through configurable retry strategies. It includes exponential backoff with jitter, specialized retry functions for different operation types, and integration with the dead letter queue system for failed operations.

### Usage

```typescript
import { retryAsync } from '@app/common/exceptions/retry.utils';

async function fetchData() {
  return retryAsync(
    async () => {
      // Operation that might fail transiently
      return await apiClient.getData();
    },
    { operationType: 'externalApi' }
  );
}
```

## Integration

The exception handling framework integrates with the following components:

- **NestJS Exception Filters**: For transforming exceptions into HTTP responses
- **Logging System**: For logging exceptions with appropriate context
- **Monitoring System**: For tracking error trends and triggering alerts
- **Kafka Integration**: For handling message processing failures
- **Database Integration**: For handling database operation failures

## Best Practices

1. **Use Specific Exception Types**: Always use the most specific exception type for the error scenario
2. **Include Context**: Provide detailed context in exception messages and metadata
3. **Handle Transient Errors**: Use retry utilities for operations that might experience transient failures
4. **Protect External Dependencies**: Use the circuit breaker pattern for external service calls
5. **Provide Fallbacks**: Implement fallback strategies for critical operations
6. **Log Appropriately**: Ensure exceptions are logged with the appropriate severity level
7. **User-Friendly Messages**: Provide user-friendly error messages for client exceptions