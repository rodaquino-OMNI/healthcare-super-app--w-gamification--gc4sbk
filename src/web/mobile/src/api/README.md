# AUSTA SuperApp API Layer

## Error Handling Framework

This directory contains a comprehensive error handling framework for the AUSTA SuperApp mobile API layer. The framework provides error classification, standardized error responses, retry strategies with exponential backoff, circuit breaker patterns, and structured error logging.

### Key Files

- `errors.ts` - Main error handling framework implementation
- `client.ts` - API client configuration integrated with error handling
- `errors.example.ts` - Usage examples (for documentation only)

### Features

#### 1. Error Classification System

Errors are classified into four categories:

- **CLIENT** - Client-side errors (invalid input, authentication, etc.)
- **SYSTEM** - Internal system errors
- **TRANSIENT** - Temporary errors that may resolve with retry
- **EXTERNAL** - External dependency errors

#### 2. Retry Mechanism with Exponential Backoff

The framework includes a configurable retry mechanism with exponential backoff for transient errors:

```typescript
const data = await withRetry(
  async () => fetchData(),
  {
    maxRetries: 3,
    initialDelayMs: 300,
    maxDelayMs: 5000,
    backoffFactor: 2
  }
);
```

#### 3. Circuit Breaker Pattern

The circuit breaker pattern prevents cascading failures by failing fast when a service is unavailable:

```typescript
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 30000
});

const result = await circuitBreaker.execute(async () => {
  return api.fetchData();
});
```

#### 4. Structured Error Responses

All errors are converted to a standardized format with consistent properties:

```typescript
try {
  // API call
} catch (error) {
  const apiError = parseError(error);
  console.log(apiError.serialize());
  console.log(apiError.getUserMessage());
}
```

#### 5. Protected API Clients

The framework provides utilities to create protected API clients with built-in error handling:

```typescript
const protectedClient = createProtectedApiClient(apiClient);

// All API calls are now protected with retry and circuit breaker
const data = await protectedClient.fetchData();
```

### Error Types

The framework includes specialized error types for different scenarios:

- `ApiError` - Base error class
- `ClientError` - Client-side errors
- `SystemError` - Internal system errors
- `TransientError` - Temporary errors
- `ExternalError` - External dependency errors
- `NetworkError` - Network connectivity issues
- `TimeoutError` - Request timeout issues
- `AuthenticationError` - Authentication failures
- `AuthorizationError` - Authorization failures
- `NotFoundError` - Resource not found errors
- `ValidationError` - Input validation failures

### Usage in Components

See `errors.example.ts` for detailed usage examples in React components and API calls.

### Integration with API Clients

The framework is integrated with both GraphQL (Apollo) and REST (Axios) clients in `client.ts`.

### Error Logging

The framework includes structured error logging with context information:

```typescript
logError(error, { userId, action: 'fetchUserProfile' });
```

### Testing

Comprehensive tests are available in `errors.test.ts`.