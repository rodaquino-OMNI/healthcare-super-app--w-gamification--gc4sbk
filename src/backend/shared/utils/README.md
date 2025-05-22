# AUSTA SuperApp Shared Utilities

This directory contains shared utilities used across the AUSTA SuperApp backend services.

## HTTP Client

The `http-client.ts` module provides a robust HTTP client implementation with advanced resilience patterns:

- Circuit breaker pattern to prevent cascading failures
- Retry mechanism with exponential backoff
- Request timeouts
- Standardized error handling
- Journey-aware request context

### Usage

```typescript
import { createHttpClient, createInternalServiceClient, createExternalApiClient } from '@austa/shared/utils/http-client';

// Create a basic HTTP client
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    'X-API-Key': 'your-api-key',
  },
  timeout: 5000, // 5 seconds
  journeyContext: {
    journey: 'health',
    context: {
      userId: '123',
      sessionId: '456',
    },
  },
});

// Use the client
try {
  const response = await client.get('/users/123');
  console.log(response.data);
} catch (error) {
  console.error('Request failed:', error.message);
}

// Create a client for internal service communication
const authServiceClient = createInternalServiceClient(
  'auth-service',
  'http://auth-service:3000',
  { journey: 'health' }
);

// Create a client for external API communication
const externalApiClient = createExternalApiClient(
  'https://api.external-service.com',
  { journey: 'care' }
);
```

### Configuration Options

The HTTP client supports the following configuration options:

#### Basic Configuration

- `baseURL`: Base URL for all requests
- `headers`: Default headers to include with all requests
- `timeout`: Default timeout in milliseconds (default: 30000)

#### Circuit Breaker Configuration

- `circuitBreaker.failureThreshold`: Maximum number of failures before opening the circuit (default: 5)
- `circuitBreaker.successThreshold`: Number of successful calls required to close the circuit (default: 3)
- `circuitBreaker.resetTimeout`: Time in milliseconds that the circuit stays open before moving to half-open (default: 10000)
- `circuitBreaker.timeout`: Request timeout in milliseconds (default: 3000)
- `circuitBreaker.rollingCountBuckets`: Maximum number of requests allowed when the circuit is half-open (default: 10)
- `circuitBreaker.rollingCountTimeout`: Time window in milliseconds for failure rate calculation (default: 10000)
- `circuitBreaker.errorThresholdPercentage`: Percentage of failures that will trip the circuit (default: 50)

#### Retry Configuration

- `retry.retries`: Number of retry attempts (default: 3)
- `retry.httpMethodsToRetry`: HTTP methods that should be retried (default: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT'])
- `retry.statusCodesToRetry`: Status codes that should trigger a retry (default: [[100, 199], [429, 429], [500, 599]])
- `retry.useExponentialBackoff`: Whether to use exponential backoff (default: true)
- `retry.initialRetryDelay`: Initial retry delay in milliseconds (default: 1000)

#### Journey Context

- `journeyContext.journey`: Journey identifier ('health', 'care', 'plan')
- `journeyContext.context`: Additional context information

### Error Handling

The HTTP client integrates with the `@austa/errors` package for standardized error handling. All HTTP errors are wrapped in a `HttpClientError` class that includes:

- Original error
- HTTP status code
- Request URL and method
- Response data
- Journey context

Example error handling:

```typescript
import { HttpClientError } from '@austa/shared/utils/http-client';

try {
  const response = await client.get('/users/123');
  console.log(response.data);
} catch (error) {
  if (error instanceof HttpClientError) {
    console.error('HTTP request failed:', {
      message: error.message,
      status: error.metadata.status,
      url: error.metadata.url,
      journey: error.metadata.journey,
    });
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Best Practices

1. **Use Journey Context**: Always provide journey context for better error reporting and monitoring.

2. **Configure Circuit Breakers Appropriately**: Adjust circuit breaker settings based on the criticality and expected behavior of the service.

3. **Customize Retry Logic**: Configure retry settings based on the idempotency and expected failure modes of the API.

4. **Monitor Circuit Breaker Events**: The circuit breaker emits events that can be monitored for better observability.

5. **Use Specialized Clients**: Use `createInternalServiceClient` for service-to-service communication and `createExternalApiClient` for external API calls, as they come with appropriate defaults.