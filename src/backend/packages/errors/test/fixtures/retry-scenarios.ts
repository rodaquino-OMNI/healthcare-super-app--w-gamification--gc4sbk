/**
 * @file retry-scenarios.ts
 * @description Contains sample retry scenarios, transient error patterns, and retry history objects
 * for testing retry-related functionality. Includes pre-configured common transient errors like
 * network timeouts, rate limiting, temporary unavailability, and database connection issues with
 * appropriate timing patterns.
 */

import { BaseError, ErrorType } from '../../src/base';
import { 
  ExternalApiError, 
  ExternalDependencyUnavailableError, 
  ExternalRateLimitError 
} from '../../src/categories/external.errors';
import { 
  DatabaseError, 
  TimeoutError, 
  ServiceUnavailableError 
} from '../../src/categories/technical.errors';
import { CircuitBreakerState, CircuitBreakerMetrics } from '../../src/utils/circuit-breaker';
import { RetryConfig } from '../../src/utils/retry';

// ===================================================================
// Common Transient Error Instances
// ===================================================================

/**
 * Collection of common transient error instances for testing retry mechanisms.
 */
export const TransientErrors = {
  /**
   * Network connection errors
   */
  Network: {
    /**
     * Connection refused error
     */
    ConnectionRefused: new ExternalApiError(
      'Connection refused to external API',
      'payment-gateway',
      'ECONNREFUSED',
      { 
        host: 'api.payment-gateway.com', 
        port: 443,
        attempt: 1
      }
    ),

    /**
     * Connection reset error
     */
    ConnectionReset: new ExternalApiError(
      'Connection reset by peer',
      'health-data-provider',
      'ECONNRESET',
      { 
        host: 'api.health-data-provider.com', 
        requestId: 'req_12345',
        attempt: 1
      }
    ),

    /**
     * DNS resolution error
     */
    DNSResolutionFailed: new ExternalApiError(
      'DNS resolution failed for external API',
      'insurance-provider',
      'ENOTFOUND',
      { 
        host: 'api.insurance-provider.com',
        attempt: 1
      }
    ),

    /**
     * Network timeout error
     */
    Timeout: new TimeoutError(
      'Network request timed out after 30000ms',
      'external-api-request',
      { 
        timeoutMs: 30000, 
        url: 'https://api.external-service.com/v1/data',
        attempt: 1
      }
    )
  },

  /**
   * Database-related transient errors
   */
  Database: {
    /**
     * Connection pool exhausted error
     */
    ConnectionPoolExhausted: new DatabaseError(
      'Database connection pool exhausted',
      'connection-pool',
      { 
        database: 'health_metrics', 
        maxConnections: 20,
        currentConnections: 20,
        attempt: 1
      }
    ),

    /**
     * Deadlock detected error
     */
    DeadlockDetected: new DatabaseError(
      'Deadlock detected, transaction aborted',
      'transaction',
      { 
        database: 'user_profiles', 
        transactionId: 'tx_98765',
        attempt: 1
      }
    ),

    /**
     * Connection timeout error
     */
    ConnectionTimeout: new DatabaseError(
      'Database connection timeout after 5000ms',
      'connection',
      { 
        database: 'appointments', 
        timeoutMs: 5000,
        attempt: 1
      }
    ),

    /**
     * Too many connections error
     */
    TooManyConnections: new DatabaseError(
      'Too many connections to database server',
      'connection-limit',
      { 
        database: 'gamification', 
        maxConnections: 100,
        currentConnections: 102,
        attempt: 1
      }
    )
  },

  /**
   * Rate limiting and throttling errors
   */
  RateLimiting: {
    /**
     * API rate limit exceeded error
     */
    APIRateLimitExceeded: new ExternalRateLimitError(
      'API rate limit exceeded',
      'payment-gateway',
      { 
        limitType: 'requests-per-minute', 
        limit: 60,
        resetInSeconds: 45,
        retryAfter: 45,
        attempt: 1
      }
    ),

    /**
     * Too many requests error
     */
    TooManyRequests: new ExternalRateLimitError(
      'Too many requests',
      'health-data-provider',
      { 
        limitType: 'requests-per-hour', 
        limit: 1000,
        resetInSeconds: 1200,
        retryAfter: 120,
        attempt: 1
      }
    ),

    /**
     * Database throttling error
     */
    DatabaseThrottling: new DatabaseError(
      'Database write operations throttled',
      'throttling',
      { 
        database: 'metrics', 
        operationType: 'write',
        maxOperationsPerSecond: 100,
        currentOperationsPerSecond: 120,
        attempt: 1
      }
    )
  },

  /**
   * Temporary service unavailability errors
   */
  ServiceUnavailability: {
    /**
     * Service temporarily unavailable error
     */
    TemporarilyUnavailable: new ServiceUnavailableError(
      'Service temporarily unavailable',
      'external-service',
      { 
        service: 'payment-gateway', 
        estimatedRecoveryInSeconds: 60,
        attempt: 1
      }
    ),

    /**
     * Service overloaded error
     */
    ServiceOverloaded: new ServiceUnavailableError(
      'Service overloaded, please try again later',
      'external-service',
      { 
        service: 'appointment-scheduler', 
        estimatedRecoveryInSeconds: 120,
        attempt: 1
      }
    ),

    /**
     * Dependency unavailable error
     */
    DependencyUnavailable: new ExternalDependencyUnavailableError(
      'External dependency unavailable',
      'insurance-provider',
      'service-unavailable',
      { 
        dependency: 'claims-processor', 
        estimatedRecoveryInSeconds: 300,
        attempt: 1
      }
    ),

    /**
     * Maintenance mode error
     */
    MaintenanceMode: new ServiceUnavailableError(
      'Service in maintenance mode',
      'scheduled-maintenance',
      { 
        service: 'health-metrics-api', 
        estimatedRecoveryInSeconds: 1800,
        maintenanceId: 'maint_12345',
        attempt: 1
      }
    )
  },

  /**
   * Intermittent failures that occur randomly
   */
  Intermittent: {
    /**
     * Random network glitch error
     */
    RandomNetworkGlitch: new ExternalApiError(
      'Intermittent network glitch detected',
      'network-stability',
      'ETIMEDOUT',
      { 
        probability: 0.3, // 30% chance of occurring
        durationMs: 50,
        attempt: 1
      }
    ),

    /**
     * Sporadic timeout error
     */
    SporadicTimeout: new TimeoutError(
      'Sporadic timeout occurred',
      'request-timeout',
      { 
        probability: 0.2, // 20% chance of occurring
        timeoutMs: 2000,
        attempt: 1
      }
    ),

    /**
     * Occasional database connection error
     */
    OccasionalDatabaseError: new DatabaseError(
      'Occasional database connection error',
      'connection-stability',
      { 
        probability: 0.15, // 15% chance of occurring
        database: 'shared_data',
        attempt: 1
      }
    )
  }
};

// ===================================================================
// Retry History Objects
// ===================================================================

/**
 * Interface representing a retry attempt history entry
 */
export interface RetryAttempt {
  /**
   * Attempt number (1-based)
   */
  attempt: number;
  
  /**
   * Timestamp when the attempt was made
   */
  timestamp: number;
  
  /**
   * Delay before this attempt in milliseconds
   */
  delayMs: number;
  
  /**
   * Error that triggered this retry attempt
   */
  error: Error;
  
  /**
   * Whether this attempt was successful
   */
  successful: boolean;
}

/**
 * Interface representing a complete retry history
 */
export interface RetryHistory {
  /**
   * Operation being retried
   */
  operation: string;
  
  /**
   * Retry configuration used
   */
  config: RetryConfig;
  
  /**
   * List of retry attempts
   */
  attempts: RetryAttempt[];
  
  /**
   * Final result of the retry operation
   */
  finalResult: 'success' | 'failure';
  
  /**
   * Total duration of all retry attempts in milliseconds
   */
  totalDurationMs: number;
  
  /**
   * Final error if the operation failed
   */
  finalError?: Error;
}

/**
 * Collection of sample retry histories for testing retry algorithms and reporting.
 */
export const RetryHistories = {
  /**
   * Successful retry after multiple attempts with exponential backoff
   */
  SuccessfulExponentialBackoff: {
    operation: 'fetchUserProfile',
    config: {
      maxAttempts: 5,
      initialDelayMs: 100,
      backoffFactor: 2,
      maxDelayMs: 5000,
      useJitter: false,
      jitterFactor: 0
    },
    attempts: [
      {
        attempt: 1,
        timestamp: 1000,
        delayMs: 0,
        error: TransientErrors.Network.ConnectionRefused,
        successful: false
      },
      {
        attempt: 2,
        timestamp: 1100,
        delayMs: 100,
        error: TransientErrors.Network.ConnectionRefused,
        successful: false
      },
      {
        attempt: 3,
        timestamp: 1300,
        delayMs: 200,
        error: TransientErrors.Network.ConnectionRefused,
        successful: false
      },
      {
        attempt: 4,
        timestamp: 1700,
        delayMs: 400,
        error: null,
        successful: true
      }
    ],
    finalResult: 'success',
    totalDurationMs: 700
  } as RetryHistory,

  /**
   * Failed retry after exhausting all attempts
   */
  ExhaustedRetries: {
    operation: 'processPayment',
    config: {
      maxAttempts: 3,
      initialDelayMs: 200,
      backoffFactor: 2,
      maxDelayMs: 2000,
      useJitter: false,
      jitterFactor: 0
    },
    attempts: [
      {
        attempt: 1,
        timestamp: 2000,
        delayMs: 0,
        error: TransientErrors.ServiceUnavailability.TemporarilyUnavailable,
        successful: false
      },
      {
        attempt: 2,
        timestamp: 2200,
        delayMs: 200,
        error: TransientErrors.ServiceUnavailability.TemporarilyUnavailable,
        successful: false
      },
      {
        attempt: 3,
        timestamp: 2600,
        delayMs: 400,
        error: TransientErrors.ServiceUnavailability.TemporarilyUnavailable,
        successful: false
      }
    ],
    finalResult: 'failure',
    totalDurationMs: 600,
    finalError: TransientErrors.ServiceUnavailability.TemporarilyUnavailable
  } as RetryHistory,

  /**
   * Retry with jitter applied to delay times
   */
  RetryWithJitter: {
    operation: 'syncHealthMetrics',
    config: {
      maxAttempts: 4,
      initialDelayMs: 100,
      backoffFactor: 2,
      maxDelayMs: 1000,
      useJitter: true,
      jitterFactor: 0.3
    },
    attempts: [
      {
        attempt: 1,
        timestamp: 3000,
        delayMs: 0,
        error: TransientErrors.Database.ConnectionTimeout,
        successful: false
      },
      {
        attempt: 2,
        timestamp: 3080,
        delayMs: 80, // 100 * 0.8 (jitter applied)
        error: TransientErrors.Database.ConnectionTimeout,
        successful: false
      },
      {
        attempt: 3,
        timestamp: 3230,
        delayMs: 150, // 200 * 0.75 (jitter applied)
        error: null,
        successful: true
      }
    ],
    finalResult: 'success',
    totalDurationMs: 230
  } as RetryHistory,

  /**
   * Retry with rate limiting and appropriate backoff
   */
  RateLimitRetry: {
    operation: 'fetchInsuranceClaims',
    config: {
      maxAttempts: 5,
      initialDelayMs: 1000,
      backoffFactor: 1.5,
      maxDelayMs: 10000,
      useJitter: true,
      jitterFactor: 0.1
    },
    attempts: [
      {
        attempt: 1,
        timestamp: 4000,
        delayMs: 0,
        error: TransientErrors.RateLimiting.APIRateLimitExceeded,
        successful: false
      },
      {
        attempt: 2,
        timestamp: 5000, // Respecting the rate limit's retryAfter value
        delayMs: 1000,
        error: TransientErrors.RateLimiting.APIRateLimitExceeded,
        successful: false
      },
      {
        attempt: 3,
        timestamp: 6500, // Respecting the rate limit's retryAfter value
        delayMs: 1500,
        error: null,
        successful: true
      }
    ],
    finalResult: 'success',
    totalDurationMs: 2500
  } as RetryHistory,

  /**
   * Retry with intermittent failures that eventually succeed
   */
  IntermittentFailures: {
    operation: 'syncWearableDeviceData',
    config: {
      maxAttempts: 10,
      initialDelayMs: 50,
      backoffFactor: 1.5,
      maxDelayMs: 5000,
      useJitter: true,
      jitterFactor: 0.2
    },
    attempts: [
      {
        attempt: 1,
        timestamp: 5000,
        delayMs: 0,
        error: TransientErrors.Intermittent.RandomNetworkGlitch,
        successful: false
      },
      {
        attempt: 2,
        timestamp: 5045,
        delayMs: 45, // 50 * 0.9 (jitter applied)
        error: null,
        successful: true
      }
    ],
    finalResult: 'success',
    totalDurationMs: 45
  } as RetryHistory,

  /**
   * Retry that hits max delay cap
   */
  MaxDelayCapReached: {
    operation: 'generateHealthReport',
    config: {
      maxAttempts: 6,
      initialDelayMs: 500,
      backoffFactor: 3,
      maxDelayMs: 3000,
      useJitter: false,
      jitterFactor: 0
    },
    attempts: [
      {
        attempt: 1,
        timestamp: 6000,
        delayMs: 0,
        error: TransientErrors.Database.ConnectionPoolExhausted,
        successful: false
      },
      {
        attempt: 2,
        timestamp: 6500,
        delayMs: 500,
        error: TransientErrors.Database.ConnectionPoolExhausted,
        successful: false
      },
      {
        attempt: 3,
        timestamp: 8000,
        delayMs: 1500, // 500 * 3
        error: TransientErrors.Database.ConnectionPoolExhausted,
        successful: false
      },
      {
        attempt: 4,
        timestamp: 11000,
        delayMs: 3000, // Capped at maxDelayMs
        error: null,
        successful: true
      }
    ],
    finalResult: 'success',
    totalDurationMs: 5000
  } as RetryHistory
};

// ===================================================================
// Circuit Breaker Scenarios
// ===================================================================

/**
 * Interface representing a circuit breaker state transition
 */
export interface CircuitBreakerTransition {
  /**
   * Timestamp of the transition
   */
  timestamp: number;
  
  /**
   * Previous state
   */
  fromState: CircuitBreakerState;
  
  /**
   * New state
   */
  toState: CircuitBreakerState;
  
  /**
   * Reason for the transition
   */
  reason: string;
  
  /**
   * Circuit breaker metrics at the time of transition
   */
  metrics: CircuitBreakerMetrics;
}

/**
 * Interface representing a circuit breaker operation attempt
 */
export interface CircuitBreakerOperation {
  /**
   * Timestamp of the operation
   */
  timestamp: number;
  
  /**
   * Operation name
   */
  operation: string;
  
  /**
   * Current circuit state
   */
  circuitState: CircuitBreakerState;
  
  /**
   * Whether the operation was allowed to execute
   */
  allowed: boolean;
  
  /**
   * Whether the operation was successful (if allowed)
   */
  successful?: boolean;
  
  /**
   * Error that occurred (if not successful)
   */
  error?: Error;
}

/**
 * Interface representing a complete circuit breaker scenario
 */
export interface CircuitBreakerScenario {
  /**
   * Name of the service being protected
   */
  serviceName: string;
  
  /**
   * Failure threshold configuration
   */
  failureThreshold: number;
  
  /**
   * Reset timeout in milliseconds
   */
  resetTimeoutMs: number;
  
  /**
   * Success threshold for half-open state
   */
  successThreshold: number;
  
  /**
   * List of state transitions
   */
  stateTransitions: CircuitBreakerTransition[];
  
  /**
   * List of operations attempted
   */
  operations: CircuitBreakerOperation[];
}

/**
 * Collection of sample circuit breaker scenarios for testing.
 */
export const CircuitBreakerScenarios = {
  /**
   * Scenario where circuit opens after consecutive failures and then recovers
   */
  OpenAndRecover: {
    serviceName: 'payment-gateway',
    failureThreshold: 3,
    resetTimeoutMs: 5000,
    successThreshold: 2,
    stateTransitions: [
      {
        timestamp: 10000,
        fromState: CircuitBreakerState.CLOSED,
        toState: CircuitBreakerState.OPEN,
        reason: 'Failure threshold reached',
        metrics: {
          state: CircuitBreakerState.OPEN,
          failureCount: 3,
          successCount: 0,
          totalSuccesses: 5,
          totalFailures: 3,
          totalRejections: 0,
          lastStateChangeTimestamp: 10000,
          lastFailureTimestamp: 10000,
          lastSuccessTimestamp: 9000
        }
      },
      {
        timestamp: 15000,
        fromState: CircuitBreakerState.OPEN,
        toState: CircuitBreakerState.HALF_OPEN,
        reason: 'Reset timeout elapsed',
        metrics: {
          state: CircuitBreakerState.HALF_OPEN,
          failureCount: 0,
          successCount: 0,
          totalSuccesses: 5,
          totalFailures: 3,
          totalRejections: 2,
          lastStateChangeTimestamp: 15000,
          lastFailureTimestamp: 10000,
          lastSuccessTimestamp: 9000
        }
      },
      {
        timestamp: 15500,
        fromState: CircuitBreakerState.HALF_OPEN,
        toState: CircuitBreakerState.CLOSED,
        reason: 'Success threshold reached',
        metrics: {
          state: CircuitBreakerState.CLOSED,
          failureCount: 0,
          successCount: 0,
          totalSuccesses: 7,
          totalFailures: 3,
          totalRejections: 2,
          lastStateChangeTimestamp: 15500,
          lastFailureTimestamp: 10000,
          lastSuccessTimestamp: 15500
        }
      }
    ],
    operations: [
      {
        timestamp: 9000,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: true
      },
      {
        timestamp: 9500,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: false,
        error: TransientErrors.ServiceUnavailability.TemporarilyUnavailable
      },
      {
        timestamp: 9700,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: false,
        error: TransientErrors.ServiceUnavailability.TemporarilyUnavailable
      },
      {
        timestamp: 10000,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: false,
        error: TransientErrors.ServiceUnavailability.TemporarilyUnavailable
      },
      {
        timestamp: 11000,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.OPEN,
        allowed: false
      },
      {
        timestamp: 12000,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.OPEN,
        allowed: false
      },
      {
        timestamp: 15100,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.HALF_OPEN,
        allowed: true,
        successful: true
      },
      {
        timestamp: 15300,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.HALF_OPEN,
        allowed: true,
        successful: true
      },
      {
        timestamp: 16000,
        operation: 'processPayment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: true
      }
    ]
  } as CircuitBreakerScenario,

  /**
   * Scenario where circuit opens and then fails again in half-open state
   */
  OpenAndFailAgain: {
    serviceName: 'health-data-provider',
    failureThreshold: 2,
    resetTimeoutMs: 3000,
    successThreshold: 1,
    stateTransitions: [
      {
        timestamp: 20000,
        fromState: CircuitBreakerState.CLOSED,
        toState: CircuitBreakerState.OPEN,
        reason: 'Failure threshold reached',
        metrics: {
          state: CircuitBreakerState.OPEN,
          failureCount: 2,
          successCount: 0,
          totalSuccesses: 3,
          totalFailures: 2,
          totalRejections: 0,
          lastStateChangeTimestamp: 20000,
          lastFailureTimestamp: 20000,
          lastSuccessTimestamp: 19500
        }
      },
      {
        timestamp: 23000,
        fromState: CircuitBreakerState.OPEN,
        toState: CircuitBreakerState.HALF_OPEN,
        reason: 'Reset timeout elapsed',
        metrics: {
          state: CircuitBreakerState.HALF_OPEN,
          failureCount: 0,
          successCount: 0,
          totalSuccesses: 3,
          totalFailures: 2,
          totalRejections: 1,
          lastStateChangeTimestamp: 23000,
          lastFailureTimestamp: 20000,
          lastSuccessTimestamp: 19500
        }
      },
      {
        timestamp: 23100,
        fromState: CircuitBreakerState.HALF_OPEN,
        toState: CircuitBreakerState.OPEN,
        reason: 'Failed in half-open state',
        metrics: {
          state: CircuitBreakerState.OPEN,
          failureCount: 0,
          successCount: 0,
          totalSuccesses: 3,
          totalFailures: 3,
          totalRejections: 1,
          lastStateChangeTimestamp: 23100,
          lastFailureTimestamp: 23100,
          lastSuccessTimestamp: 19500
        }
      },
      {
        timestamp: 26100,
        fromState: CircuitBreakerState.OPEN,
        toState: CircuitBreakerState.HALF_OPEN,
        reason: 'Reset timeout elapsed',
        metrics: {
          state: CircuitBreakerState.HALF_OPEN,
          failureCount: 0,
          successCount: 0,
          totalSuccesses: 3,
          totalFailures: 3,
          totalRejections: 2,
          lastStateChangeTimestamp: 26100,
          lastFailureTimestamp: 23100,
          lastSuccessTimestamp: 19500
        }
      },
      {
        timestamp: 26200,
        fromState: CircuitBreakerState.HALF_OPEN,
        toState: CircuitBreakerState.CLOSED,
        reason: 'Success threshold reached',
        metrics: {
          state: CircuitBreakerState.CLOSED,
          failureCount: 0,
          successCount: 0,
          totalSuccesses: 4,
          totalFailures: 3,
          totalRejections: 2,
          lastStateChangeTimestamp: 26200,
          lastFailureTimestamp: 23100,
          lastSuccessTimestamp: 26200
        }
      }
    ],
    operations: [
      {
        timestamp: 19500,
        operation: 'fetchHealthMetrics',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: true
      },
      {
        timestamp: 19800,
        operation: 'fetchHealthMetrics',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: false,
        error: TransientErrors.Network.ConnectionReset
      },
      {
        timestamp: 20000,
        operation: 'fetchHealthMetrics',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: false,
        error: TransientErrors.Network.ConnectionReset
      },
      {
        timestamp: 21000,
        operation: 'fetchHealthMetrics',
        circuitState: CircuitBreakerState.OPEN,
        allowed: false
      },
      {
        timestamp: 23050,
        operation: 'fetchHealthMetrics',
        circuitState: CircuitBreakerState.HALF_OPEN,
        allowed: true,
        successful: false,
        error: TransientErrors.Network.ConnectionReset
      },
      {
        timestamp: 24000,
        operation: 'fetchHealthMetrics',
        circuitState: CircuitBreakerState.OPEN,
        allowed: false
      },
      {
        timestamp: 26150,
        operation: 'fetchHealthMetrics',
        circuitState: CircuitBreakerState.HALF_OPEN,
        allowed: true,
        successful: true
      },
      {
        timestamp: 27000,
        operation: 'fetchHealthMetrics',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: true
      }
    ]
  } as CircuitBreakerScenario,

  /**
   * Scenario with multiple concurrent requests in half-open state
   */
  HalfOpenConcurrentRequests: {
    serviceName: 'appointment-scheduler',
    failureThreshold: 3,
    resetTimeoutMs: 2000,
    successThreshold: 2,
    stateTransitions: [
      {
        timestamp: 30000,
        fromState: CircuitBreakerState.CLOSED,
        toState: CircuitBreakerState.OPEN,
        reason: 'Failure threshold reached',
        metrics: {
          state: CircuitBreakerState.OPEN,
          failureCount: 3,
          successCount: 0,
          totalSuccesses: 2,
          totalFailures: 3,
          totalRejections: 0,
          lastStateChangeTimestamp: 30000,
          lastFailureTimestamp: 30000,
          lastSuccessTimestamp: 29000
        }
      },
      {
        timestamp: 32000,
        fromState: CircuitBreakerState.OPEN,
        toState: CircuitBreakerState.HALF_OPEN,
        reason: 'Reset timeout elapsed',
        metrics: {
          state: CircuitBreakerState.HALF_OPEN,
          failureCount: 0,
          successCount: 0,
          totalSuccesses: 2,
          totalFailures: 3,
          totalRejections: 1,
          lastStateChangeTimestamp: 32000,
          lastFailureTimestamp: 30000,
          lastSuccessTimestamp: 29000
        }
      }
    ],
    operations: [
      {
        timestamp: 29000,
        operation: 'scheduleAppointment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: true
      },
      {
        timestamp: 29500,
        operation: 'scheduleAppointment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: false,
        error: TransientErrors.ServiceUnavailability.ServiceOverloaded
      },
      {
        timestamp: 29700,
        operation: 'scheduleAppointment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: false,
        error: TransientErrors.ServiceUnavailability.ServiceOverloaded
      },
      {
        timestamp: 30000,
        operation: 'scheduleAppointment',
        circuitState: CircuitBreakerState.CLOSED,
        allowed: true,
        successful: false,
        error: TransientErrors.ServiceUnavailability.ServiceOverloaded
      },
      {
        timestamp: 31000,
        operation: 'scheduleAppointment',
        circuitState: CircuitBreakerState.OPEN,
        allowed: false
      },
      // Multiple concurrent requests in half-open state
      {
        timestamp: 32050,
        operation: 'scheduleAppointment',
        circuitState: CircuitBreakerState.HALF_OPEN,
        allowed: true,
        successful: true
      },
      {
        timestamp: 32051, // Almost concurrent request
        operation: 'scheduleAppointment',
        circuitState: CircuitBreakerState.HALF_OPEN,
        allowed: false // Only one request allowed in half-open state
      },
      {
        timestamp: 32052, // Almost concurrent request
        operation: 'scheduleAppointment',
        circuitState: CircuitBreakerState.HALF_OPEN,
        allowed: false // Only one request allowed in half-open state
      }
    ]
  } as CircuitBreakerScenario
};

// ===================================================================
// Mock Operation Sequences
// ===================================================================

/**
 * Interface representing a mock operation result
 */
export interface MockOperationResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * Error that occurred (if not successful)
   */
  error?: Error;
  
  /**
   * Result value (if successful)
   */
  value?: any;
  
  /**
   * Latency of the operation in milliseconds
   */
  latencyMs: number;
}

/**
 * Interface representing a sequence of mock operation results
 */
export interface MockOperationSequence {
  /**
   * Name of the operation
   */
  operation: string;
  
  /**
   * Sequence of results for consecutive calls
   */
  results: MockOperationResult[];
  
  /**
   * What to return after the sequence is exhausted (defaults to last result)
   */
  afterExhaustion?: 'repeat' | 'last' | 'success' | 'failure';
}

/**
 * Collection of mock operation sequences for testing retry and circuit breaker behavior.
 */
export const MockOperationSequences = {
  /**
   * Sequence that fails a few times and then succeeds
   */
  EventualSuccess: {
    operation: 'fetchUserData',
    results: [
      {
        success: false,
        error: TransientErrors.Network.ConnectionRefused,
        latencyMs: 50
      },
      {
        success: false,
        error: TransientErrors.Network.ConnectionRefused,
        latencyMs: 55
      },
      {
        success: false,
        error: TransientErrors.Network.Timeout,
        latencyMs: 3000
      },
      {
        success: true,
        value: { userId: '123', name: 'Test User' },
        latencyMs: 120
      }
    ],
    afterExhaustion: 'success'
  } as MockOperationSequence,

  /**
   * Sequence that consistently fails
   */
  PersistentFailure: {
    operation: 'processInsuranceClaim',
    results: [
      {
        success: false,
        error: TransientErrors.ServiceUnavailability.DependencyUnavailable,
        latencyMs: 200
      },
      {
        success: false,
        error: TransientErrors.ServiceUnavailability.DependencyUnavailable,
        latencyMs: 210
      },
      {
        success: false,
        error: TransientErrors.ServiceUnavailability.DependencyUnavailable,
        latencyMs: 205
      }
    ],
    afterExhaustion: 'repeat'
  } as MockOperationSequence,

  /**
   * Sequence with rate limiting that eventually succeeds
   */
  RateLimitedEventualSuccess: {
    operation: 'fetchMedicalRecords',
    results: [
      {
        success: false,
        error: TransientErrors.RateLimiting.APIRateLimitExceeded,
        latencyMs: 100
      },
      {
        success: false,
        error: TransientErrors.RateLimiting.APIRateLimitExceeded,
        latencyMs: 105
      },
      {
        success: true,
        value: { records: [{ id: '1', type: 'lab-result' }] },
        latencyMs: 300
      }
    ],
    afterExhaustion: 'success'
  } as MockOperationSequence,

  /**
   * Sequence with intermittent failures
   */
  IntermittentFailures: {
    operation: 'syncDeviceData',
    results: [
      {
        success: true,
        value: { deviceId: 'dev1', syncedItems: 10 },
        latencyMs: 150
      },
      {
        success: false,
        error: TransientErrors.Intermittent.RandomNetworkGlitch,
        latencyMs: 50
      },
      {
        success: true,
        value: { deviceId: 'dev1', syncedItems: 15 },
        latencyMs: 160
      },
      {
        success: false,
        error: TransientErrors.Intermittent.RandomNetworkGlitch,
        latencyMs: 45
      },
      {
        success: true,
        value: { deviceId: 'dev1', syncedItems: 20 },
        latencyMs: 155
      }
    ],
    afterExhaustion: 'repeat'
  } as MockOperationSequence,

  /**
   * Sequence with gradually increasing latency
   */
  IncreasingLatency: {
    operation: 'generateReport',
    results: [
      {
        success: true,
        value: { reportId: '1', status: 'completed' },
        latencyMs: 200
      },
      {
        success: true,
        value: { reportId: '2', status: 'completed' },
        latencyMs: 400
      },
      {
        success: true,
        value: { reportId: '3', status: 'completed' },
        latencyMs: 800
      },
      {
        success: false,
        error: TransientErrors.Network.Timeout,
        latencyMs: 3000
      },
      {
        success: true,
        value: { reportId: '4', status: 'completed' },
        latencyMs: 300
      }
    ],
    afterExhaustion: 'last'
  } as MockOperationSequence
};

// ===================================================================
// Utility Functions
// ===================================================================

/**
 * Creates a custom transient error with the specified properties.
 * 
 * @param message - Error message
 * @param source - Source of the error
 * @param code - Error code
 * @param metadata - Additional error metadata
 * @returns A new transient error instance
 */
export function createTransientError(
  message: string,
  source: string,
  code: string,
  metadata: Record<string, any> = {}
): BaseError {
  const error = new BaseError(
    message,
    ErrorType.EXTERNAL,
    {
      source,
      code,
      ...metadata
    }
  );
  
  // Mark as retryable
  error.setRetryable(true);
  
  return error;
}

/**
 * Creates a retry history with exponential backoff pattern.
 * 
 * @param operation - Operation name
 * @param initialDelayMs - Initial delay in milliseconds
 * @param backoffFactor - Backoff factor for exponential increase
 * @param attempts - Number of attempts before success
 * @param errorFactory - Function to create errors for failed attempts
 * @returns A retry history object
 */
export function createExponentialBackoffHistory(
  operation: string,
  initialDelayMs: number,
  backoffFactor: number,
  attempts: number,
  errorFactory: (attempt: number) => Error
): RetryHistory {
  const config: RetryConfig = {
    maxAttempts: attempts + 1,
    initialDelayMs,
    backoffFactor,
    maxDelayMs: 30000,
    useJitter: false,
    jitterFactor: 0
  };
  
  const retryAttempts: RetryAttempt[] = [];
  let timestamp = 1000;
  let totalDuration = 0;
  
  for (let i = 1; i <= attempts + 1; i++) {
    const isLast = i === attempts + 1;
    const delayMs = i === 1 ? 0 : Math.min(
      initialDelayMs * Math.pow(backoffFactor, i - 2),
      config.maxDelayMs
    );
    
    timestamp += delayMs;
    totalDuration += delayMs;
    
    retryAttempts.push({
      attempt: i,
      timestamp,
      delayMs,
      error: isLast ? null : errorFactory(i),
      successful: isLast
    });
  }
  
  return {
    operation,
    config,
    attempts: retryAttempts,
    finalResult: 'success',
    totalDurationMs: totalDuration
  };
}

/**
 * Creates a mock operation sequence with the specified pattern.
 * 
 * @param operation - Operation name
 * @param pattern - Pattern of successes and failures ('S' for success, 'F' for failure)
 * @param latencyMs - Base latency in milliseconds
 * @param errorFactory - Function to create errors for failed attempts
 * @returns A mock operation sequence
 */
export function createMockOperationSequence(
  operation: string,
  pattern: string,
  latencyMs: number,
  errorFactory: (index: number) => Error
): MockOperationSequence {
  const results: MockOperationResult[] = [];
  
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const isSuccess = char.toUpperCase() === 'S';
    
    results.push({
      success: isSuccess,
      error: isSuccess ? undefined : errorFactory(i),
      value: isSuccess ? { id: `${i}`, status: 'success' } : undefined,
      latencyMs: latencyMs + Math.floor(Math.random() * 20) - 10 // Add some variation
    });
  }
  
  return {
    operation,
    results,
    afterExhaustion: 'repeat'
  };
}

/**
 * Creates a circuit breaker scenario with the specified pattern.
 * 
 * @param serviceName - Name of the service
 * @param pattern - Pattern of operations ('S' for success, 'F' for failure, 'O' for open circuit)
 * @param failureThreshold - Number of failures to open the circuit
 * @param resetTimeoutMs - Time in milliseconds before half-open state
 * @returns A circuit breaker scenario
 */
export function createCircuitBreakerScenario(
  serviceName: string,
  pattern: string,
  failureThreshold: number = 3,
  resetTimeoutMs: number = 5000
): CircuitBreakerScenario {
  const operations: CircuitBreakerOperation[] = [];
  const stateTransitions: CircuitBreakerTransition[] = [];
  
  let timestamp = 1000;
  let state = CircuitBreakerState.CLOSED;
  let failureCount = 0;
  let successCount = 0;
  let totalSuccesses = 0;
  let totalFailures = 0;
  let totalRejections = 0;
  let lastFailureTimestamp: number | null = null;
  let lastSuccessTimestamp: number | null = null;
  let lastStateChangeTimestamp = timestamp;
  
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    timestamp += 500; // 500ms between operations
    
    if (char === 'O') {
      // Circuit is open, request is rejected
      operations.push({
        timestamp,
        operation: `${serviceName}Operation`,
        circuitState: state,
        allowed: false
      });
      totalRejections++;
      continue;
    }
    
    const isSuccess = char.toUpperCase() === 'S';
    
    if (state === CircuitBreakerState.OPEN) {
      // Check if reset timeout has elapsed
      if (timestamp - lastStateChangeTimestamp >= resetTimeoutMs) {
        state = CircuitBreakerState.HALF_OPEN;
        stateTransitions.push({
          timestamp,
          fromState: CircuitBreakerState.OPEN,
          toState: CircuitBreakerState.HALF_OPEN,
          reason: 'Reset timeout elapsed',
          metrics: {
            state,
            failureCount: 0,
            successCount: 0,
            totalSuccesses,
            totalFailures,
            totalRejections,
            lastStateChangeTimestamp: timestamp,
            lastFailureTimestamp,
            lastSuccessTimestamp
          }
        });
        lastStateChangeTimestamp = timestamp;
      }
    }
    
    if (state === CircuitBreakerState.CLOSED || state === CircuitBreakerState.HALF_OPEN) {
      operations.push({
        timestamp,
        operation: `${serviceName}Operation`,
        circuitState: state,
        allowed: true,
        successful: isSuccess,
        error: isSuccess ? undefined : TransientErrors.ServiceUnavailability.TemporarilyUnavailable
      });
      
      if (isSuccess) {
        totalSuccesses++;
        lastSuccessTimestamp = timestamp;
        
        if (state === CircuitBreakerState.HALF_OPEN) {
          successCount++;
          
          // Check if success threshold is reached
          if (successCount >= 2) {
            const oldState = state;
            state = CircuitBreakerState.CLOSED;
            stateTransitions.push({
              timestamp,
              fromState: oldState,
              toState: state,
              reason: 'Success threshold reached',
              metrics: {
                state,
                failureCount: 0,
                successCount: 0,
                totalSuccesses,
                totalFailures,
                totalRejections,
                lastStateChangeTimestamp: timestamp,
                lastFailureTimestamp,
                lastSuccessTimestamp
              }
            });
            lastStateChangeTimestamp = timestamp;
            successCount = 0;
          }
        } else {
          // Reset failure count on success in closed state
          failureCount = 0;
        }
      } else {
        totalFailures++;
        lastFailureTimestamp = timestamp;
        
        if (state === CircuitBreakerState.HALF_OPEN) {
          // Any failure in half-open state opens the circuit again
          const oldState = state;
          state = CircuitBreakerState.OPEN;
          stateTransitions.push({
            timestamp,
            fromState: oldState,
            toState: state,
            reason: 'Failed in half-open state',
            metrics: {
              state,
              failureCount: 0,
              successCount: 0,
              totalSuccesses,
              totalFailures,
              totalRejections,
              lastStateChangeTimestamp: timestamp,
              lastFailureTimestamp,
              lastSuccessTimestamp
            }
          });
          lastStateChangeTimestamp = timestamp;
        } else {
          failureCount++;
          
          // Check if failure threshold is reached
          if (failureCount >= failureThreshold) {
            const oldState = state;
            state = CircuitBreakerState.OPEN;
            stateTransitions.push({
              timestamp,
              fromState: oldState,
              toState: state,
              reason: 'Failure threshold reached',
              metrics: {
                state,
                failureCount,
                successCount: 0,
                totalSuccesses,
                totalFailures,
                totalRejections,
                lastStateChangeTimestamp: timestamp,
                lastFailureTimestamp,
                lastSuccessTimestamp
              }
            });
            lastStateChangeTimestamp = timestamp;
          }
        }
      }
    }
  }
  
  return {
    serviceName,
    failureThreshold,
    resetTimeoutMs,
    successThreshold: 2,
    stateTransitions,
    operations
  };
}