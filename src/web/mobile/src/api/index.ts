/**
 * @file index.ts
 * @description Barrel file for API module exports
 */

// Export API clients
export { graphQLClient, restClient } from './client';

// Export error handling framework
export {
  // Error classes
  ApiError,
  ClientError,
  SystemError,
  TransientError,
  ExternalError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  
  // Enums
  ErrorCategory,
  CircuitState,
  
  // Circuit breaker
  CircuitBreaker,
  CircuitBreakerOptions,
  
  // Retry mechanism
  withRetry,
  RetryOptions,
  
  // Error utilities
  parseError,
  createProtectedApiClient,
  withErrorHandling,
  logError,
  isErrorType,
  
  // Global instances
  globalCircuitBreaker
} from './errors';