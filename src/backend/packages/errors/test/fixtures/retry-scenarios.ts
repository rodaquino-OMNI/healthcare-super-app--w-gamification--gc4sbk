/**
 * @file retry-scenarios.ts
 * @description Test fixtures for retry-related functionality, including sample transient errors,
 * retry history objects, and circuit breaker test scenarios. These fixtures are used for testing
 * the retry and circuit breaker mechanisms of the error handling framework.
 */

import { ErrorType } from '../../src/categories';
import { ExternalApiError, ExternalDependencyUnavailableError, ExternalRateLimitError } from '../../src/categories/external.errors';
import { DatabaseError, ServiceUnavailableError, TimeoutError } from '../../src/categories/technical.errors';

// ===== TRANSIENT ERROR INSTANCES =====

/**
 * Common transient error patterns for testing retry mechanisms
 */
export const transientErrors = {
  /**
   * Network timeout error that typically resolves after a few retries
   */
  networkTimeout: new TimeoutError(
    'Request timed out after 5000ms',
    {
      operationName: 'fetchUserProfile',
      timeoutMs: 5000,
      url: 'https://api.example.com/users/123',
      attempt: 1
    }
  ),

  /**
   * Database connection error that typically resolves after a short delay
   */
  databaseConnection: new DatabaseError(
    'Connection to database lost',
    {
      operation: 'SELECT',
      table: 'users',
      connectionId: 'postgres-pool-3',
      errorCode: 'ECONNRESET'
    }
  ),

  /**
   * Rate limiting error with Retry-After header
   */
  rateLimiting: new ExternalRateLimitError(
    'Rate limit exceeded',
    {
      service: 'payment-gateway',
      retryAfterSeconds: 30,
      limitType: 'requests-per-minute',
      limitValue: 100,
      endpoint: '/api/v1/payments'
    }
  ),

  /**
   * Temporary service unavailability that resolves after multiple retries
   */
  serviceUnavailable: new ServiceUnavailableError(
    'Service temporarily unavailable',
    {
      service: 'notification-provider',
      estimatedResolutionTime: '2023-05-15T14:30:00Z',
      statusCode: 503,
      retryable: true
    }
  ),

  /**
   * External API error with a 5xx status code (typically transient)
   */
  externalApi5xx: new ExternalApiError(
    'External API returned 502 Bad Gateway',
    {
      service: 'health-data-provider',
      statusCode: 502,
      endpoint: '/api/v2/metrics',
      requestId: '8a7b6c5d-4e3f-2d1c-0b9a-8a7b6c5d4e3f'
    }
  ),

  /**
   * External dependency temporarily unavailable
   */
  dependencyUnavailable: new ExternalDependencyUnavailableError(
    'External dependency temporarily unavailable',
    {
      dependency: 'wearable-data-sync',
      statusCode: 503,
      lastAvailable: '2023-05-15T10:15:00Z',
      estimatedResolutionTime: '2023-05-15T11:30:00Z'
    }
  )
};

// ===== RETRY HISTORY OBJECTS =====

/**
 * Sample retry history objects for testing backoff algorithms and retry policies
 */
export const retryHistories = {
  /**
   * Exponential backoff pattern with increasing delays
   */
  exponentialBackoff: [
    {
      timestamp: new Date('2023-05-15T10:00:00Z').getTime(),
      attempt: 1,
      delay: 100, // ms
      error: {
        message: 'Connection to database lost',
        type: ErrorType.TECHNICAL,
        code: 'DATABASE_CONNECTION_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.1Z').getTime(),
      attempt: 2,
      delay: 200, // ms
      error: {
        message: 'Connection to database lost',
        type: ErrorType.TECHNICAL,
        code: 'DATABASE_CONNECTION_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.3Z').getTime(),
      attempt: 3,
      delay: 400, // ms
      error: {
        message: 'Connection to database lost',
        type: ErrorType.TECHNICAL,
        code: 'DATABASE_CONNECTION_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.7Z').getTime(),
      attempt: 4,
      delay: 800, // ms
      error: {
        message: 'Connection to database lost',
        type: ErrorType.TECHNICAL,
        code: 'DATABASE_CONNECTION_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:01.5Z').getTime(),
      attempt: 5,
      delay: 1600, // ms
      error: {
        message: 'Connection to database lost',
        type: ErrorType.TECHNICAL,
        code: 'DATABASE_CONNECTION_ERROR'
      }
    }
  ],

  /**
   * Fixed interval retry pattern with consistent delays
   */
  fixedInterval: [
    {
      timestamp: new Date('2023-05-15T10:00:00Z').getTime(),
      attempt: 1,
      delay: 1000, // ms
      error: {
        message: 'Rate limit exceeded',
        type: ErrorType.EXTERNAL,
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:01Z').getTime(),
      attempt: 2,
      delay: 1000, // ms
      error: {
        message: 'Rate limit exceeded',
        type: ErrorType.EXTERNAL,
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:02Z').getTime(),
      attempt: 3,
      delay: 1000, // ms
      error: {
        message: 'Rate limit exceeded',
        type: ErrorType.EXTERNAL,
        code: 'RATE_LIMIT_EXCEEDED'
      }
    }
  ],

  /**
   * Retry history with mixed error types
   */
  mixedErrorTypes: [
    {
      timestamp: new Date('2023-05-15T10:00:00Z').getTime(),
      attempt: 1,
      delay: 100, // ms
      error: {
        message: 'Network request failed',
        type: ErrorType.TECHNICAL,
        code: 'NETWORK_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.1Z').getTime(),
      attempt: 2,
      delay: 200, // ms
      error: {
        message: 'Service unavailable',
        type: ErrorType.EXTERNAL,
        code: 'SERVICE_UNAVAILABLE'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.3Z').getTime(),
      attempt: 3,
      delay: 400, // ms
      error: {
        message: 'Rate limit exceeded',
        type: ErrorType.EXTERNAL,
        code: 'RATE_LIMIT_EXCEEDED'
      }
    }
  ],

  /**
   * Retry history with eventual success
   */
  eventualSuccess: [
    {
      timestamp: new Date('2023-05-15T10:00:00Z').getTime(),
      attempt: 1,
      delay: 100, // ms
      error: {
        message: 'Connection to database lost',
        type: ErrorType.TECHNICAL,
        code: 'DATABASE_CONNECTION_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.1Z').getTime(),
      attempt: 2,
      delay: 200, // ms
      error: {
        message: 'Connection to database lost',
        type: ErrorType.TECHNICAL,
        code: 'DATABASE_CONNECTION_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.3Z').getTime(),
      attempt: 3,
      delay: 400, // ms
      success: true,
      result: { id: '123', status: 'completed' }
    }
  ],

  /**
   * Retry history with maximum attempts exhausted
   */
  maxAttemptsExhausted: [
    {
      timestamp: new Date('2023-05-15T10:00:00Z').getTime(),
      attempt: 1,
      delay: 100, // ms
      error: {
        message: 'External API returned 502 Bad Gateway',
        type: ErrorType.EXTERNAL,
        code: 'EXTERNAL_API_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.1Z').getTime(),
      attempt: 2,
      delay: 200, // ms
      error: {
        message: 'External API returned 502 Bad Gateway',
        type: ErrorType.EXTERNAL,
        code: 'EXTERNAL_API_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.3Z').getTime(),
      attempt: 3,
      delay: 400, // ms
      error: {
        message: 'External API returned 502 Bad Gateway',
        type: ErrorType.EXTERNAL,
        code: 'EXTERNAL_API_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:00.7Z').getTime(),
      attempt: 4,
      delay: 800, // ms
      error: {
        message: 'External API returned 502 Bad Gateway',
        type: ErrorType.EXTERNAL,
        code: 'EXTERNAL_API_ERROR'
      }
    },
    {
      timestamp: new Date('2023-05-15T10:00:01.5Z').getTime(),
      attempt: 5,
      delay: 1600, // ms
      error: {
        message: 'External API returned 502 Bad Gateway',
        type: ErrorType.EXTERNAL,
        code: 'EXTERNAL_API_ERROR'
      },
      exhausted: true
    }
  ]
};

// ===== CIRCUIT BREAKER TEST SCENARIOS =====

/**
 * Circuit breaker test scenarios with different failure thresholds and patterns
 */
export const circuitBreakerScenarios = {
  /**
   * Scenario where the circuit should open after consecutive failures
   */
  shouldOpen: {
    serviceName: 'payment-gateway',
    failureThreshold: 5,
    failureHistory: [
      { timestamp: new Date('2023-05-15T10:00:00Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:01Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:02Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:03Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:04Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:05Z').getTime(), success: false }
    ],
    expectedState: 'OPEN',
    halfOpenAfter: 30000 // ms
  },

  /**
   * Scenario where the circuit should remain closed despite some failures
   */
  shouldStayClosed: {
    serviceName: 'user-profile-service',
    failureThreshold: 5,
    failureHistory: [
      { timestamp: new Date('2023-05-15T10:00:00Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:01Z').getTime(), success: true },
      { timestamp: new Date('2023-05-15T10:00:02Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:03Z').getTime(), success: true },
      { timestamp: new Date('2023-05-15T10:00:04Z').getTime(), success: false }
    ],
    expectedState: 'CLOSED',
    halfOpenAfter: 30000 // ms
  },

  /**
   * Scenario where the circuit should transition from open to half-open after timeout
   */
  shouldTransitionToHalfOpen: {
    serviceName: 'notification-provider',
    failureThreshold: 3,
    failureHistory: [
      { timestamp: new Date('2023-05-15T10:00:00Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:01Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:02Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:03Z').getTime(), success: false }
    ],
    openStateTimestamp: new Date('2023-05-15T10:00:03Z').getTime(),
    currentTimestamp: new Date('2023-05-15T10:00:33Z').getTime(), // 30 seconds later
    expectedState: 'HALF_OPEN',
    halfOpenAfter: 30000 // ms
  },

  /**
   * Scenario where the circuit should close after successful test request in half-open state
   */
  shouldCloseAfterHalfOpen: {
    serviceName: 'health-data-provider',
    failureThreshold: 3,
    failureHistory: [
      { timestamp: new Date('2023-05-15T10:00:00Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:01Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:02Z').getTime(), success: false }
    ],
    openStateTimestamp: new Date('2023-05-15T10:00:02Z').getTime(),
    halfOpenTimestamp: new Date('2023-05-15T10:00:32Z').getTime(), // 30 seconds later
    testRequestResult: { timestamp: new Date('2023-05-15T10:00:33Z').getTime(), success: true },
    expectedState: 'CLOSED',
    halfOpenAfter: 30000 // ms
  },

  /**
   * Scenario where the circuit should remain open after failed test request in half-open state
   */
  shouldStayOpenAfterFailedTest: {
    serviceName: 'wearable-data-sync',
    failureThreshold: 3,
    failureHistory: [
      { timestamp: new Date('2023-05-15T10:00:00Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:01Z').getTime(), success: false },
      { timestamp: new Date('2023-05-15T10:00:02Z').getTime(), success: false }
    ],
    openStateTimestamp: new Date('2023-05-15T10:00:02Z').getTime(),
    halfOpenTimestamp: new Date('2023-05-15T10:00:32Z').getTime(), // 30 seconds later
    testRequestResult: { timestamp: new Date('2023-05-15T10:00:33Z').getTime(), success: false },
    expectedState: 'OPEN',
    halfOpenAfter: 30000, // ms
    resetTimeout: 60000 // ms
  }
};

// ===== TIMEOUT AND EXPIRATION TEST DATA =====

/**
 * Mock timestamps for testing timeout and expiration logic
 */
export const timeoutTestData = {
  /**
   * Test data for operation timeout detection
   */
  operationTimeout: {
    operationStart: new Date('2023-05-15T10:00:00Z').getTime(),
    operationTimeout: 5000, // ms
    currentTime: new Date('2023-05-15T10:00:06Z').getTime(), // 6 seconds later
    shouldTimeout: true
  },

  /**
   * Test data for token expiration
   */
  tokenExpiration: {
    tokenIssued: new Date('2023-05-15T10:00:00Z').getTime(),
    tokenExpiry: new Date('2023-05-15T11:00:00Z').getTime(), // 1 hour later
    currentTime: new Date('2023-05-15T10:30:00Z').getTime(), // 30 minutes later
    shouldBeValid: true
  },

  /**
   * Test data for retry window expiration
   */
  retryWindowExpiration: {
    firstAttempt: new Date('2023-05-15T10:00:00Z').getTime(),
    maxRetryWindow: 3600000, // 1 hour in ms
    currentTime: new Date('2023-05-15T11:30:00Z').getTime(), // 1.5 hours later
    shouldExpire: true
  },

  /**
   * Test data for rate limit reset
   */
  rateLimitReset: {
    rateLimitExceeded: new Date('2023-05-15T10:00:00Z').getTime(),
    resetAfter: 300, // 5 minutes in seconds
    currentTime: new Date('2023-05-15T10:04:00Z').getTime(), // 4 minutes later
    shouldReset: false
  }
};

/**
 * Sample retry operations with different configurations for testing
 */
export const retryOperations = {
  /**
   * Email notification with exponential backoff
   */
  emailNotification: {
    id: 'email-notification-1',
    type: 'email',
    recipient: 'user@example.com',
    payload: {
      subject: 'Your appointment reminder',
      body: 'You have an appointment tomorrow at 2:00 PM.'
    },
    retryPolicy: {
      type: 'exponential',
      maxRetries: 5,
      initialDelay: 100,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true
    }
  },

  /**
   * SMS notification with fixed interval
   */
  smsNotification: {
    id: 'sms-notification-1',
    type: 'sms',
    recipient: '+1234567890',
    payload: {
      message: 'Your verification code is 123456'
    },
    retryPolicy: {
      type: 'fixed',
      maxRetries: 3,
      delay: 1000,
      jitter: false
    }
  },

  /**
   * Push notification with custom retry policy
   */
  pushNotification: {
    id: 'push-notification-1',
    type: 'push',
    recipient: 'device-token-123',
    payload: {
      title: 'New message',
      body: 'You have a new message from Dr. Smith',
      data: {
        messageId: '456',
        senderId: '789'
      }
    },
    retryPolicy: {
      type: 'composite',
      policies: [
        {
          errorTypes: ['NETWORK_ERROR', 'TIMEOUT_ERROR'],
          policy: {
            type: 'exponential',
            maxRetries: 5,
            initialDelay: 200,
            maxDelay: 10000,
            backoffFactor: 2,
            jitter: true
          }
        },
        {
          errorTypes: ['RATE_LIMIT_EXCEEDED'],
          policy: {
            type: 'fixed',
            maxRetries: 3,
            delay: 5000,
            jitter: false
          }
        }
      ],
      defaultPolicy: {
        type: 'exponential',
        maxRetries: 3,
        initialDelay: 500,
        maxDelay: 5000,
        backoffFactor: 1.5,
        jitter: true
      }
    }
  },

  /**
   * Database operation with linear backoff
   */
  databaseOperation: {
    id: 'db-operation-1',
    type: 'database',
    operation: 'UPDATE',
    table: 'user_profiles',
    payload: {
      id: '123',
      status: 'active',
      lastLogin: '2023-05-15T10:00:00Z'
    },
    retryPolicy: {
      type: 'linear',
      maxRetries: 4,
      initialDelay: 50,
      increment: 50,
      jitter: true
    }
  }
};