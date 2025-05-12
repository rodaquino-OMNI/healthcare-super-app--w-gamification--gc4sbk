/**
 * @file retry-scenarios.ts
 * @description Test fixtures for retry mechanisms and circuit breaker patterns
 * 
 * This file contains sample retry scenarios, transient error patterns, and retry history
 * objects for testing retry-related functionality. It includes pre-configured common
 * transient errors like network timeouts, rate limiting, temporary unavailability,
 * and database connection issues with appropriate timing patterns.
 */

import { 
  TimeoutError, 
  DatabaseError, 
  ServiceUnavailableError 
} from '../../src/categories/technical.errors';

import {
  ExternalApiError,
  ExternalDependencyUnavailableError,
  ExternalRateLimitError
} from '../../src/categories/external.errors';

/**
 * Interface representing a retry attempt history entry
 */
export interface RetryAttempt {
  timestamp: number;
  error: Error;
  attemptNumber: number;
  delayMs?: number;
}

/**
 * Interface representing a complete retry history
 */
export interface RetryHistory {
  operationId: string;
  startTime: number;
  attempts: RetryAttempt[];
  successful?: boolean;
  finalError?: Error;
  finalResult?: any;
}

/**
 * Interface for circuit breaker test scenarios
 */
export interface CircuitBreakerScenario {
  name: string;
  description: string;
  failureThreshold: number;
  failureWindow: number; // in milliseconds
  resetTimeout: number; // in milliseconds
  errors: Error[];
  expectedState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

/**
 * Common transient network errors for testing retry mechanisms
 */
export const networkErrors = {
  /**
   * Connection timeout error - occurs when a connection cannot be established
   */
  connectionTimeout: new TimeoutError(
    'Connection timed out after 5000ms', 
    { 
      operationId: 'connect-api-123',
      resource: 'https://api.example.com/health',
      timeoutMs: 5000,
      isTransient: true
    }
  ),

  /**
   * Request timeout error - occurs when a request takes too long to complete
   */
  requestTimeout: new TimeoutError(
    'Request timed out after 30000ms', 
    { 
      operationId: 'fetch-user-profile',
      resource: 'https://api.example.com/users/123',
      timeoutMs: 30000,
      isTransient: true
    }
  ),

  /**
   * Socket hang up error - occurs when the connection is unexpectedly closed
   */
  socketHangUp: new ExternalApiError(
    'socket hang up', 
    { 
      statusCode: 0,
      endpoint: 'https://api.example.com/data',
      method: 'GET',
      isTransient: true,
      originalError: new Error('socket hang up')
    }
  ),

  /**
   * Network unreachable error - occurs when the network is temporarily unavailable
   */
  networkUnreachable: new ExternalApiError(
    'network unreachable', 
    { 
      statusCode: 0,
      endpoint: 'https://api.example.com/health',
      method: 'GET',
      isTransient: true,
      originalError: new Error('network unreachable')
    }
  ),

  /**
   * DNS resolution error - occurs when a domain name cannot be resolved
   */
  dnsResolutionError: new ExternalApiError(
    'getaddrinfo ENOTFOUND api.example.com', 
    { 
      statusCode: 0,
      endpoint: 'https://api.example.com/health',
      method: 'GET',
      isTransient: true,
      originalError: new Error('getaddrinfo ENOTFOUND api.example.com')
    }
  )
};

/**
 * Common database transient errors for testing retry mechanisms
 */
export const databaseErrors = {
  /**
   * Connection pool exhausted error - occurs when all connections are in use
   */
  connectionPoolExhausted: new DatabaseError(
    'Connection pool exhausted', 
    { 
      operation: 'connect',
      database: 'postgres',
      isTransient: true,
      code: 'POOL_EXHAUSTED'
    }
  ),

  /**
   * Deadlock detected error - occurs when a transaction deadlock is detected
   */
  deadlockDetected: new DatabaseError(
    'Deadlock detected, transaction aborted', 
    { 
      operation: 'update',
      database: 'postgres',
      table: 'users',
      isTransient: true,
      code: 'DEADLOCK_DETECTED'
    }
  ),

  /**
   * Connection terminated error - occurs when a connection is unexpectedly closed
   */
  connectionTerminated: new DatabaseError(
    'Connection terminated unexpectedly', 
    { 
      operation: 'query',
      database: 'postgres',
      isTransient: true,
      code: 'CONNECTION_TERMINATED'
    }
  ),

  /**
   * Too many connections error - occurs when the database has too many connections
   */
  tooManyConnections: new DatabaseError(
    'Too many connections', 
    { 
      operation: 'connect',
      database: 'postgres',
      isTransient: true,
      code: 'TOO_MANY_CONNECTIONS'
    }
  ),

  /**
   * Lock timeout error - occurs when a lock cannot be acquired within the timeout period
   */
  lockTimeout: new DatabaseError(
    'Lock acquisition timeout', 
    { 
      operation: 'update',
      database: 'postgres',
      table: 'health_metrics',
      isTransient: true,
      code: 'LOCK_TIMEOUT'
    }
  )
};

/**
 * Common external service errors for testing retry mechanisms
 */
export const externalServiceErrors = {
  /**
   * Rate limit exceeded error - occurs when an API rate limit is exceeded
   */
  rateLimitExceeded: new ExternalRateLimitError(
    'Rate limit exceeded', 
    { 
      endpoint: 'https://api.example.com/data',
      method: 'GET',
      rateLimitReset: Date.now() + 60000, // Reset in 1 minute
      retryAfterMs: 60000,
      isTransient: true
    }
  ),

  /**
   * Service unavailable error - occurs when a service is temporarily unavailable
   */
  serviceUnavailable: new ServiceUnavailableError(
    'Service temporarily unavailable', 
    { 
      service: 'payment-gateway',
      isTransient: true,
      retryAfterMs: 30000 // Retry after 30 seconds
    }
  ),

  /**
   * Gateway timeout error - occurs when an upstream service times out
   */
  gatewayTimeout: new ExternalApiError(
    'Gateway timeout', 
    { 
      statusCode: 504,
      endpoint: 'https://api.example.com/payments',
      method: 'POST',
      isTransient: true
    }
  ),

  /**
   * Dependency unavailable error - occurs when a required dependency is unavailable
   */
  dependencyUnavailable: new ExternalDependencyUnavailableError(
    'External dependency unavailable', 
    { 
      dependency: 'fhir-service',
      isTransient: true,
      retryAfterMs: 15000 // Retry after 15 seconds
    }
  ),

  /**
   * Too many requests error - occurs when too many requests are made to a service
   */
  tooManyRequests: new ExternalRateLimitError(
    'Too many requests', 
    { 
      endpoint: 'https://api.example.com/health-records',
      method: 'GET',
      rateLimitReset: Date.now() + 10000, // Reset in 10 seconds
      retryAfterMs: 10000,
      isTransient: true
    }
  )
};

/**
 * Sample retry histories for testing backoff algorithms
 */
export const retryHistories: Record<string, RetryHistory> = {
  /**
   * Successful retry after multiple network timeouts
   */
  successAfterNetworkTimeouts: {
    operationId: 'fetch-user-profile-123',
    startTime: Date.now() - 15000, // Started 15 seconds ago
    attempts: [
      {
        timestamp: Date.now() - 15000, // First attempt 15 seconds ago
        error: networkErrors.connectionTimeout,
        attemptNumber: 1,
      },
      {
        timestamp: Date.now() - 13000, // Second attempt 13 seconds ago
        error: networkErrors.connectionTimeout,
        attemptNumber: 2,
        delayMs: 2000 // 2 second delay after first failure
      },
      {
        timestamp: Date.now() - 9000, // Third attempt 9 seconds ago
        error: networkErrors.connectionTimeout,
        attemptNumber: 3,
        delayMs: 4000 // 4 second delay after second failure
      },
      {
        timestamp: Date.now() - 1000, // Fourth attempt 1 second ago
        error: null, // No error on this attempt (success)
        attemptNumber: 4,
        delayMs: 8000 // 8 second delay after third failure
      }
    ],
    successful: true,
    finalResult: { userId: '123', name: 'Test User' }
  },

  /**
   * Failed retry after database connection issues
   */
  failedAfterDatabaseIssues: {
    operationId: 'update-health-metrics-456',
    startTime: Date.now() - 30000, // Started 30 seconds ago
    attempts: [
      {
        timestamp: Date.now() - 30000, // First attempt 30 seconds ago
        error: databaseErrors.connectionPoolExhausted,
        attemptNumber: 1,
      },
      {
        timestamp: Date.now() - 28000, // Second attempt 28 seconds ago
        error: databaseErrors.connectionPoolExhausted,
        attemptNumber: 2,
        delayMs: 2000 // 2 second delay after first failure
      },
      {
        timestamp: Date.now() - 24000, // Third attempt 24 seconds ago
        error: databaseErrors.connectionPoolExhausted,
        attemptNumber: 3,
        delayMs: 4000 // 4 second delay after second failure
      },
      {
        timestamp: Date.now() - 16000, // Fourth attempt 16 seconds ago
        error: databaseErrors.connectionPoolExhausted,
        attemptNumber: 4,
        delayMs: 8000 // 8 second delay after third failure
      },
      {
        timestamp: Date.now() - 0, // Fifth attempt just now
        error: databaseErrors.connectionPoolExhausted,
        attemptNumber: 5,
        delayMs: 16000 // 16 second delay after fourth failure
      }
    ],
    successful: false,
    finalError: databaseErrors.connectionPoolExhausted
  },

  /**
   * Successful retry after rate limiting
   */
  successAfterRateLimiting: {
    operationId: 'fetch-health-records-789',
    startTime: Date.now() - 120000, // Started 2 minutes ago
    attempts: [
      {
        timestamp: Date.now() - 120000, // First attempt 2 minutes ago
        error: externalServiceErrors.rateLimitExceeded,
        attemptNumber: 1,
      },
      {
        timestamp: Date.now() - 60000, // Second attempt 1 minute ago
        error: null, // No error on this attempt (success)
        attemptNumber: 2,
        delayMs: 60000 // 60 second delay after rate limit error (from Retry-After header)
      }
    ],
    successful: true,
    finalResult: { records: [{ id: '1', type: 'bloodPressure' }] }
  },

  /**
   * Failed retry with mixed error types
   */
  failedWithMixedErrors: {
    operationId: 'process-payment-321',
    startTime: Date.now() - 45000, // Started 45 seconds ago
    attempts: [
      {
        timestamp: Date.now() - 45000, // First attempt 45 seconds ago
        error: networkErrors.socketHangUp,
        attemptNumber: 1,
      },
      {
        timestamp: Date.now() - 43000, // Second attempt 43 seconds ago
        error: externalServiceErrors.serviceUnavailable,
        attemptNumber: 2,
        delayMs: 2000 // 2 second delay after first failure
      },
      {
        timestamp: Date.now() - 13000, // Third attempt 13 seconds ago
        error: externalServiceErrors.gatewayTimeout,
        attemptNumber: 3,
        delayMs: 30000 // 30 second delay from Retry-After header
      },
      {
        timestamp: Date.now() - 5000, // Fourth attempt 5 seconds ago
        error: new Error('Invalid payment details'), // Non-transient error
        attemptNumber: 4,
        delayMs: 8000 // 8 second delay after third failure
      }
    ],
    successful: false,
    finalError: new Error('Invalid payment details')
  }
};

/**
 * Sample circuit breaker test scenarios
 */
export const circuitBreakerScenarios: CircuitBreakerScenario[] = [
  {
    name: 'healthy-service',
    description: 'Service is healthy with occasional errors below threshold',
    failureThreshold: 5,
    failureWindow: 60000, // 1 minute
    resetTimeout: 30000, // 30 seconds
    errors: [
      networkErrors.connectionTimeout,
      networkErrors.requestTimeout,
      // Only 2 errors, below the threshold of 5
    ],
    expectedState: 'CLOSED'
  },
  {
    name: 'failing-service',
    description: 'Service is failing with errors above threshold',
    failureThreshold: 3,
    failureWindow: 60000, // 1 minute
    resetTimeout: 30000, // 30 seconds
    errors: [
      networkErrors.connectionTimeout,
      networkErrors.requestTimeout,
      networkErrors.socketHangUp,
      networkErrors.networkUnreachable,
      // 4 errors, above the threshold of 3
    ],
    expectedState: 'OPEN'
  },
  {
    name: 'recovering-service',
    description: 'Service is recovering after being in open state',
    failureThreshold: 3,
    failureWindow: 60000, // 1 minute
    resetTimeout: 30000, // 30 seconds
    errors: [
      networkErrors.connectionTimeout,
      networkErrors.requestTimeout,
      networkErrors.socketHangUp,
      networkErrors.networkUnreachable,
      // 4 errors initially, then cooling period elapsed
      // Next attempt will determine if circuit moves to closed or stays open
    ],
    expectedState: 'HALF_OPEN'
  },
  {
    name: 'database-circuit',
    description: 'Database connection circuit with specific error types',
    failureThreshold: 4,
    failureWindow: 30000, // 30 seconds
    resetTimeout: 15000, // 15 seconds
    errors: [
      databaseErrors.connectionPoolExhausted,
      databaseErrors.connectionTerminated,
      databaseErrors.tooManyConnections,
      databaseErrors.connectionTerminated,
      // 4 errors, at the threshold of 4
    ],
    expectedState: 'OPEN'
  },
  {
    name: 'rate-limited-api',
    description: 'External API with rate limiting errors',
    failureThreshold: 2,
    failureWindow: 120000, // 2 minutes
    resetTimeout: 60000, // 1 minute
    errors: [
      externalServiceErrors.rateLimitExceeded,
      externalServiceErrors.tooManyRequests,
      // 2 errors, at the threshold of 2
    ],
    expectedState: 'OPEN'
  }
];

/**
 * Mock timestamps for testing timeout and expiration logic
 */
export const mockTimestamps = {
  now: Date.now(),
  oneMinuteAgo: Date.now() - 60000,
  fiveMinutesAgo: Date.now() - 300000,
  fifteenMinutesAgo: Date.now() - 900000,
  oneHourAgo: Date.now() - 3600000,
  oneDayAgo: Date.now() - 86400000,
  oneMinuteFromNow: Date.now() + 60000,
  fiveMinutesFromNow: Date.now() + 300000,
  fifteenMinutesFromNow: Date.now() + 900000,
  oneHourFromNow: Date.now() + 3600000,
  oneDayFromNow: Date.now() + 86400000,
};

/**
 * Utility function to create a retry history with exponential backoff pattern
 * @param operationId Unique identifier for the operation
 * @param error Error to use for all attempts
 * @param attempts Number of attempts to generate
 * @param baseDelayMs Base delay in milliseconds
 * @param successful Whether the final attempt was successful
 * @returns A RetryHistory object with the specified pattern
 */
export function createExponentialBackoffHistory(
  operationId: string,
  error: Error,
  attempts: number,
  baseDelayMs: number = 1000,
  successful: boolean = false
): RetryHistory {
  const startTime = Date.now() - (Math.pow(2, attempts) - 1) * baseDelayMs;
  const retryAttempts: RetryAttempt[] = [];
  let currentTime = startTime;

  for (let i = 0; i < attempts; i++) {
    const isLastAttempt = i === attempts - 1;
    const attemptError = isLastAttempt && successful ? null : error;
    
    retryAttempts.push({
      timestamp: currentTime,
      error: attemptError,
      attemptNumber: i + 1,
      delayMs: i === 0 ? undefined : Math.pow(2, i - 1) * baseDelayMs
    });

    if (i < attempts - 1) {
      currentTime += Math.pow(2, i) * baseDelayMs;
    }
  }

  return {
    operationId,
    startTime,
    attempts: retryAttempts,
    successful,
    finalError: successful ? undefined : error,
    finalResult: successful ? { success: true } : undefined
  };
}

/**
 * Sample retry scenarios with different backoff strategies
 */
export const retryScenarios = {
  /**
   * Exponential backoff with network errors
   */
  exponentialBackoffNetwork: createExponentialBackoffHistory(
    'api-call-with-network-issues',
    networkErrors.connectionTimeout,
    5, // 5 attempts
    1000, // 1 second base delay
    true // Eventually successful
  ),

  /**
   * Exponential backoff with database errors
   */
  exponentialBackoffDatabase: createExponentialBackoffHistory(
    'database-query-with-connection-issues',
    databaseErrors.connectionPoolExhausted,
    4, // 4 attempts
    2000, // 2 second base delay
    false // Never successful
  ),

  /**
   * Exponential backoff with external service errors
   */
  exponentialBackoffExternalService: createExponentialBackoffHistory(
    'external-service-with-availability-issues',
    externalServiceErrors.serviceUnavailable,
    3, // 3 attempts
    5000, // 5 second base delay
    true // Eventually successful
  )
};