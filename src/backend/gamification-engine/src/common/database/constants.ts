/**
 * Database constants for the gamification engine.
 * Centralizes connection pool settings, timeout values, retry configurations,
 * and other database-related parameters to ensure consistency across the application.
 */

import { Prisma } from '@prisma/client';
import { JourneyType } from '@austa/interfaces/common';

/**
 * Connection pool configuration constants.
 * These values control the database connection pool behavior.
 */
export const CONNECTION_POOL = {
  /**
   * Minimum number of connections to keep in the pool.
   * Ensures a baseline of available connections for immediate use.
   */
  MIN_CONNECTIONS: 5,

  /**
   * Maximum number of connections allowed in the pool.
   * Prevents resource exhaustion during high load.
   */
  MAX_CONNECTIONS: 25,

  /**
   * Time in milliseconds after which idle connections are removed from the pool.
   */
  IDLE_TIMEOUT_MS: 60000, // 1 minute

  /**
   * Maximum time in milliseconds that a connection can remain in the pool.
   * Forces periodic connection refresh to prevent stale connections.
   */
  MAX_CONNECTION_LIFETIME_MS: 3600000, // 1 hour

  /**
   * Time in milliseconds to wait for a connection to become available before timing out.
   */
  CONNECTION_ACQUISITION_TIMEOUT_MS: 30000, // 30 seconds

  /**
   * Time in milliseconds to wait when checking connection health.
   */
  HEALTH_CHECK_TIMEOUT_MS: 5000, // 5 seconds

  /**
   * Interval in milliseconds between connection health checks.
   */
  HEALTH_CHECK_INTERVAL_MS: 60000, // 1 minute
};

/**
 * Database operation timeout constants.
 * These values control how long various database operations can run before timing out.
 */
export const OPERATION_TIMEOUTS = {
  /**
   * Default query timeout in milliseconds.
   */
  DEFAULT_QUERY_TIMEOUT_MS: 10000, // 10 seconds

  /**
   * Timeout for complex queries in milliseconds.
   */
  COMPLEX_QUERY_TIMEOUT_MS: 30000, // 30 seconds

  /**
   * Timeout for batch operations in milliseconds.
   */
  BATCH_OPERATION_TIMEOUT_MS: 60000, // 1 minute

  /**
   * Timeout for transaction operations in milliseconds.
   */
  TRANSACTION_TIMEOUT_MS: 30000, // 30 seconds

  /**
   * Timeout for database migrations in milliseconds.
   */
  MIGRATION_TIMEOUT_MS: 300000, // 5 minutes

  /**
   * Timeout for database schema validation in milliseconds.
   */
  SCHEMA_VALIDATION_TIMEOUT_MS: 15000, // 15 seconds

  /**
   * Timeout for database connection in milliseconds.
   */
  CONNECTION_TIMEOUT_MS: 10000, // 10 seconds

  /**
   * Timeout for database disconnection in milliseconds.
   */
  DISCONNECTION_TIMEOUT_MS: 5000, // 5 seconds

  /**
   * Journey-specific timeouts in milliseconds.
   */
  JOURNEY_TIMEOUTS: {
    [JourneyType.HEALTH]: 15000, // 15 seconds
    [JourneyType.CARE]: 15000, // 15 seconds
    [JourneyType.PLAN]: 15000, // 15 seconds
  },
};

/**
 * Retry strategy constants for database operations.
 * These values control how failed database operations are retried.
 */
export const RETRY_STRATEGY = {
  /**
   * Default maximum number of retry attempts for database operations.
   */
  DEFAULT_MAX_RETRIES: 3,

  /**
   * Maximum number of retry attempts for critical operations.
   */
  CRITICAL_OPERATION_MAX_RETRIES: 5,

  /**
   * Base delay in milliseconds between retry attempts.
   */
  BASE_DELAY_MS: 100,

  /**
   * Maximum delay in milliseconds between retry attempts.
   */
  MAX_DELAY_MS: 5000, // 5 seconds

  /**
   * Jitter factor to add randomness to retry delays (0-1).
   * Helps prevent thundering herd problems when multiple clients retry simultaneously.
   */
  JITTER_FACTOR: 0.1,

  /**
   * Backoff factor for exponential backoff calculation.
   */
  BACKOFF_FACTOR: 2,

  /**
   * Time in milliseconds after which the circuit breaker opens (stops retrying).
   */
  CIRCUIT_BREAKER_THRESHOLD_MS: 30000, // 30 seconds

  /**
   * Time in milliseconds after which the circuit breaker resets (allows retrying).
   */
  CIRCUIT_BREAKER_RESET_MS: 60000, // 1 minute

  /**
   * Number of consecutive failures required to open the circuit breaker.
   */
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,

  /**
   * Journey-specific retry configurations.
   */
  JOURNEY_RETRIES: {
    [JourneyType.HEALTH]: 3,
    [JourneyType.CARE]: 3,
    [JourneyType.PLAN]: 3,
  },
};

/**
 * Database error classification constants.
 * These values are used to categorize and handle database errors consistently.
 */
export const ERROR_CLASSIFICATION = {
  /**
   * Error categories for database operations.
   */
  CATEGORIES: {
    CONNECTION: 'CONNECTION',
    QUERY: 'QUERY',
    TRANSACTION: 'TRANSACTION',
    DATA_INTEGRITY: 'DATA_INTEGRITY',
    CONFIGURATION: 'CONFIGURATION',
    UNKNOWN: 'UNKNOWN',
  },

  /**
   * Error severity levels.
   */
  SEVERITY: {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  },

  /**
   * Error recoverability classifications.
   */
  RECOVERABILITY: {
    TRANSIENT: 'TRANSIENT', // Temporary errors that may resolve on retry
    PERMANENT: 'PERMANENT', // Errors that will not resolve without intervention
    UNKNOWN: 'UNKNOWN',
  },

  /**
   * Prisma error codes mapped to error categories.
   * Based on Prisma error codes from: https://www.prisma.io/docs/reference/api-reference/error-reference
   */
  PRISMA_ERROR_MAPPINGS: {
    // Connection errors
    P1001: 'CONNECTION', // Authentication failed
    P1002: 'CONNECTION', // Connection timed out
    P1003: 'CONNECTION', // Database does not exist
    P1008: 'CONNECTION', // Operations timed out
    P1017: 'CONNECTION', // Server closed the connection

    // Query errors
    P2001: 'QUERY', // Record not found
    P2002: 'QUERY', // Unique constraint failed
    P2003: 'QUERY', // Foreign key constraint failed
    P2004: 'QUERY', // Constraint failed
    P2005: 'QUERY', // Value invalid for type
    P2006: 'QUERY', // Value not valid
    P2007: 'QUERY', // Validation error
    P2008: 'QUERY', // Query parsing failed
    P2009: 'QUERY', // Query validation failed
    P2010: 'QUERY', // Raw query failed
    P2011: 'QUERY', // Null constraint violation
    P2012: 'QUERY', // Missing required value
    P2013: 'QUERY', // Missing required argument
    P2014: 'QUERY', // Relation violation
    P2015: 'QUERY', // Related record not found
    P2016: 'QUERY', // Query interpretation error
    P2017: 'QUERY', // Records not connected
    P2018: 'QUERY', // Required connected records not found
    P2019: 'QUERY', // Input error
    P2020: 'QUERY', // Value out of range
    P2021: 'QUERY', // Table does not exist
    P2022: 'QUERY', // Column does not exist
    P2023: 'QUERY', // Inconsistent column data
    P2024: 'CONNECTION', // Connection pool timeout
    P2025: 'QUERY', // Record not found for update/delete
    P2026: 'QUERY', // Unsupported feature
    P2027: 'QUERY', // Multiple errors
    P2028: 'QUERY', // Transaction API error
    P2030: 'QUERY', // Full-text search not supported
    P2033: 'QUERY', // Number out of range

    // Transaction errors
    P3000: 'TRANSACTION', // Transaction failed
    P3001: 'TRANSACTION', // Migration failed
    P3002: 'TRANSACTION', // Transaction already in progress
    P3003: 'TRANSACTION', // Transaction rollback failed
    P3004: 'TRANSACTION', // Transaction commit failed
    P3005: 'TRANSACTION', // Database schema mismatch
    P3006: 'TRANSACTION', // Migration in progress
    P3007: 'TRANSACTION', // Preview feature not enabled
    P3008: 'TRANSACTION', // Migration not found
    P3009: 'TRANSACTION', // Migration already applied
    P3010: 'TRANSACTION', // Migration name not unique
    P3011: 'TRANSACTION', // Migration cannot be rolled back
    P3012: 'TRANSACTION', // Migration directory not found
    P3013: 'TRANSACTION', // Nested transaction not supported
    P3014: 'TRANSACTION', // Prisma schema validation error
    P3015: 'TRANSACTION', // Prisma schema not found
    P3016: 'TRANSACTION', // Prisma schema parsing error
    P3017: 'TRANSACTION', // Migration engine version mismatch
    P3018: 'TRANSACTION', // Migration engine communication error
    P3019: 'TRANSACTION', // Native database error
    P3020: 'TRANSACTION', // Prisma schema validation warning
    P3021: 'TRANSACTION', // Foreign key constraint failed on delete
    P3022: 'TRANSACTION', // Direct execution of migrations required

    // Data integrity errors
    P4000: 'DATA_INTEGRITY', // Introspection error
    P4001: 'DATA_INTEGRITY', // Introspection schema parsing error
    P4002: 'DATA_INTEGRITY', // Introspection schema validation error

    // Configuration errors
    P5000: 'CONFIGURATION', // Server error
    P5001: 'CONFIGURATION', // Unknown server error
    P5002: 'CONFIGURATION', // Unknown client error
    P5003: 'CONFIGURATION', // Database URL parsing error
    P5004: 'CONFIGURATION', // Database URL validation error
    P5005: 'CONFIGURATION', // Unknown engine error
    P5006: 'CONFIGURATION', // Migration engine start error
    P5007: 'CONFIGURATION', // Query engine start error
    P5008: 'CONFIGURATION', // Schema engine start error
    P5009: 'CONFIGURATION', // Engine version mismatch
    P5010: 'CONFIGURATION', // Engine communication error
    P5011: 'CONFIGURATION', // Engine protocol error
    P5012: 'CONFIGURATION', // Engine binary not found
    P5013: 'CONFIGURATION', // Engine binary corrupted
    P5014: 'CONFIGURATION', // Engine not running
    P5015: 'CONFIGURATION', // Engine connection error
  },

  /**
   * Prisma error codes mapped to recoverability classification.
   */
  PRISMA_ERROR_RECOVERABILITY: {
    // Transient errors (may resolve on retry)
    P1002: 'TRANSIENT', // Connection timed out
    P1008: 'TRANSIENT', // Operations timed out
    P1017: 'TRANSIENT', // Server closed the connection
    P2024: 'TRANSIENT', // Connection pool timeout
    P3000: 'TRANSIENT', // Transaction failed
    P3002: 'TRANSIENT', // Transaction already in progress
    P3003: 'TRANSIENT', // Transaction rollback failed
    P3004: 'TRANSIENT', // Transaction commit failed
    P3006: 'TRANSIENT', // Migration in progress
    P3013: 'TRANSIENT', // Nested transaction not supported
    P3018: 'TRANSIENT', // Migration engine communication error
    P3019: 'TRANSIENT', // Native database error
    P5010: 'TRANSIENT', // Engine communication error
    P5014: 'TRANSIENT', // Engine not running
    P5015: 'TRANSIENT', // Engine connection error

    // All other errors default to PERMANENT
  },
};

/**
 * Environment-specific database configuration defaults.
 * These values provide default configurations for different environments.
 */
export const ENVIRONMENT_DEFAULTS = {
  /**
   * Development environment defaults.
   */
  DEVELOPMENT: {
    CONNECTION_POOL: {
      MIN_CONNECTIONS: 2,
      MAX_CONNECTIONS: 10,
      IDLE_TIMEOUT_MS: 60000, // 1 minute
    },
    LOGGING: {
      QUERY_LOGGING: true,
      ERROR_LOGGING: true,
      PERFORMANCE_LOGGING: true,
      LOG_LEVEL: 'debug',
    },
    RETRY: {
      MAX_RETRIES: 3,
      BASE_DELAY_MS: 100,
    },
  },

  /**
   * Testing environment defaults.
   */
  TEST: {
    CONNECTION_POOL: {
      MIN_CONNECTIONS: 1,
      MAX_CONNECTIONS: 5,
      IDLE_TIMEOUT_MS: 10000, // 10 seconds
    },
    LOGGING: {
      QUERY_LOGGING: false,
      ERROR_LOGGING: true,
      PERFORMANCE_LOGGING: false,
      LOG_LEVEL: 'error',
    },
    RETRY: {
      MAX_RETRIES: 0, // No retries in test environment
      BASE_DELAY_MS: 0,
    },
  },

  /**
   * Production environment defaults.
   */
  PRODUCTION: {
    CONNECTION_POOL: {
      MIN_CONNECTIONS: 5,
      MAX_CONNECTIONS: 25,
      IDLE_TIMEOUT_MS: 60000, // 1 minute
    },
    LOGGING: {
      QUERY_LOGGING: false,
      ERROR_LOGGING: true,
      PERFORMANCE_LOGGING: true,
      LOG_LEVEL: 'warn',
    },
    RETRY: {
      MAX_RETRIES: 3,
      BASE_DELAY_MS: 100,
    },
  },
};

/**
 * Database query logging constants.
 * These values control how database queries are logged.
 */
export const QUERY_LOGGING = {
  /**
   * Maximum length of SQL query to log.
   */
  MAX_QUERY_LENGTH: 2000,

  /**
   * Whether to log query parameters.
   */
  LOG_PARAMETERS: true,

  /**
   * Whether to log query execution time.
   */
  LOG_EXECUTION_TIME: true,

  /**
   * Threshold in milliseconds above which queries are considered slow and logged with warning level.
   */
  SLOW_QUERY_THRESHOLD_MS: 1000, // 1 second

  /**
   * Threshold in milliseconds above which queries are considered very slow and logged with error level.
   */
  VERY_SLOW_QUERY_THRESHOLD_MS: 5000, // 5 seconds

  /**
   * Whether to include stack trace in query logs.
   */
  INCLUDE_STACK_TRACE: false,
};

/**
 * Transaction isolation level defaults.
 * These values define the default isolation levels for different types of operations.
 */
export const TRANSACTION_ISOLATION = {
  /**
   * Default isolation level for read operations.
   */
  DEFAULT_READ_ISOLATION_LEVEL: Prisma.TransactionIsolationLevel.ReadCommitted,

  /**
   * Default isolation level for write operations.
   */
  DEFAULT_WRITE_ISOLATION_LEVEL: Prisma.TransactionIsolationLevel.RepeatableRead,

  /**
   * Isolation level for operations requiring the highest consistency.
   */
  HIGH_CONSISTENCY_ISOLATION_LEVEL: Prisma.TransactionIsolationLevel.Serializable,

  /**
   * Isolation level for operations prioritizing performance over consistency.
   */
  HIGH_PERFORMANCE_ISOLATION_LEVEL: Prisma.TransactionIsolationLevel.ReadUncommitted,

  /**
   * Journey-specific isolation levels.
   */
  JOURNEY_ISOLATION_LEVELS: {
    [JourneyType.HEALTH]: Prisma.TransactionIsolationLevel.RepeatableRead,
    [JourneyType.CARE]: Prisma.TransactionIsolationLevel.RepeatableRead,
    [JourneyType.PLAN]: Prisma.TransactionIsolationLevel.RepeatableRead,
  },
};

/**
 * Database batch operation constants.
 * These values control how batch operations are performed.
 */
export const BATCH_OPERATIONS = {
  /**
   * Default batch size for bulk operations.
   */
  DEFAULT_BATCH_SIZE: 100,

  /**
   * Maximum batch size for bulk operations.
   */
  MAX_BATCH_SIZE: 1000,

  /**
   * Delay in milliseconds between batch operations to prevent database overload.
   */
  BATCH_DELAY_MS: 100,

  /**
   * Journey-specific batch sizes.
   */
  JOURNEY_BATCH_SIZES: {
    [JourneyType.HEALTH]: 100,
    [JourneyType.CARE]: 100,
    [JourneyType.PLAN]: 100,
  },
};