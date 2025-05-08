# AUSTA SuperApp Shared Utilities

This directory contains shared utilities used across the AUSTA SuperApp backend services.

## HTTP Client

The `http-client.ts` module provides a robust HTTP client with built-in resilience patterns for making external API calls. It builds on top of the secure-axios module to provide additional features like circuit breaking, retry with exponential backoff, and standardized error handling.

### Features

- **SSRF Protection**: Inherits all security features from secure-axios to prevent Server-Side Request Forgery attacks
- **Circuit Breaker Pattern**: Prevents cascading failures when external services are unavailable
- **Retry Mechanism**: Automatically retries failed requests with exponential backoff
- **Timeout Handling**: Configurable request timeouts with proper error handling
- **Error Classification**: Transforms HTTP errors into application-specific error types
- **Journey Context**: Adds journey-specific context to errors for better troubleshooting

### Usage

```typescript
import { createHttpClient, createJourneyHttpClient } from '@austa/shared/utils/http-client';
import { Logger } from '@nestjs/common';

// Create a basic HTTP client
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
  timeout: 5000 // 5 seconds
});

// Create a journey-specific HTTP client
const healthClient = createJourneyHttpClient('health', {
  baseURL: 'https://health-api.example.com',
  logger: new Logger('HealthApiClient')
});

// Make requests with automatic retry and circuit breaking
async function fetchUserData(userId: string) {
  try {
    return await client.get(`/users/${userId}`);
  } catch (error) {
    // Error will be an instance of a specific error class from @austa/errors
    console.error(`Failed to fetch user data: ${error.message}`);
    throw error;
  }
}
```

### Configuration Options

#### HttpClientOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| baseURL | string | undefined | Base URL for all requests |
| headers | Record<string, string> | {} | Default headers to include with all requests |
| timeout | number | 10000 | Default timeout in milliseconds |
| retry | RetryOptions | See below | Retry options for failed requests |
| circuitBreaker | CircuitBreakerOptions | See below | Circuit breaker options |
| journey | JourneyType | undefined | Journey type for context-aware error handling |
| logger | Logger | undefined | Logger instance for logging retry attempts and errors |

#### RetryOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxRetries | number | 3 | Maximum number of retry attempts |
| backoffFactor | number | 2 | Factor by which the delay increases with each retry |
| initialDelay | number | 1000 | Initial delay in milliseconds before the first retry |
| maxDelay | number | 10000 | Maximum delay in milliseconds between retries |

#### CircuitBreakerOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| failureThreshold | number | 5 | Number of failures before opening the circuit |
| resetTimeout | number | 30000 | Time in milliseconds to keep the circuit open before moving to half-open |
| successThreshold | number | 2 | Number of successful requests in half-open state to close the circuit |

### Error Handling

The HTTP client transforms HTTP errors into application-specific error types from the `@austa/errors` package:

- **ExternalApiError**: General API errors with status code and response data
- **ExternalDependencyUnavailableError**: Network errors or when the circuit breaker is open
- **ExternalRateLimitError**: Rate limit exceeded (HTTP 429) with retry-after information
- **ExternalResponseFormatError**: Invalid response format (e.g., JSON parsing errors)
- **TimeoutError**: Request timed out

All errors include journey context and request details to aid in troubleshooting.

### Retry Strategy

The HTTP client automatically retries the following types of errors:

- Network errors (connection failures)
- Server errors (HTTP 5xx)
- Rate limit errors (HTTP 429)
- Timeout errors

Client errors (HTTP 4xx) other than 429 are not retried as they typically indicate a problem with the request that won't be resolved by retrying.

### Circuit Breaker States

The circuit breaker has three states:

1. **CLOSED**: Normal operation, requests flow through
2. **OPEN**: Circuit is open, requests fail fast without hitting the external service
3. **HALF-OPEN**: Testing if the service is back online by allowing a limited number of requests

When the circuit is in the OPEN state, requests will fail fast with an `ExternalDependencyUnavailableError` without attempting to call the external service. After the reset timeout, the circuit moves to HALF-OPEN and allows a limited number of requests to test if the service is back online.