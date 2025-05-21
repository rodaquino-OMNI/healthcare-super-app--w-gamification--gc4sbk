/**
 * Database Constants for Gamification Engine
 * 
 * This file defines constants and configuration values for database operations
 * in the gamification engine. It centralizes connection pool settings, timeout values,
 * retry configurations, and other database-related parameters to ensure consistency
 * across the application.
 */

/**
 * Environment types for database configuration
 */
export enum DatabaseEnvironment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Database error types for classification and handling
 */
export enum DatabaseErrorType {
  CONNECTION = 'connection',
  QUERY = 'query',
  TRANSACTION = 'transaction',
  DATA_INTEGRITY = 'data_integrity',
  CONFIGURATION = 'configuration',
}

/**
 * Database error severity levels
 */
export enum DatabaseErrorSeverity {
  CRITICAL = 'critical', // Service cannot function, immediate attention required
  MAJOR = 'major',       // Significant impact on functionality, prompt attention needed
  MINOR = 'minor',       // Limited impact, can be addressed in normal course of operations
}

/**
 * Database error recoverability classification
 */
export enum DatabaseErrorRecoverability {
  TRANSIENT = 'transient', // Temporary error that may resolve with retry
  PERMANENT = 'permanent', // Permanent error that will not resolve with retry
}

/**
 * Connection pool configuration constants
 */
export const CONNECTION_POOL = {
  /**
   * Minimum number of connections to maintain in the pool
   */
  MIN_CONNECTIONS: 2,

  /**
   * Maximum number of connections allowed in the pool
   */
  MAX_CONNECTIONS: 10,

  /**
   * Maximum number of idle connections to keep in the pool
   */
  MAX_IDLE_CONNECTIONS: 5,

  /**
   * Time in milliseconds after which idle connections are removed from the pool
   */
  IDLE_TIMEOUT_MS: 60000, // 1 minute

  /**
   * Time in milliseconds to wait for a connection to become available
   */
  CONNECTION_ACQUISITION_TIMEOUT_MS: 30000, // 30 seconds

  /**
   * Time in milliseconds between connection health checks
   */
  CONNECTION_VALIDATION_INTERVAL_MS: 10000, // 10 seconds

  /**
   * Maximum time in milliseconds a connection can remain in the pool
   */
  MAX_CONNECTION_AGE_MS: 3600000, // 1 hour

  /**
   * Environment-specific connection pool settings
   */
  ENVIRONMENT: {
    [DatabaseEnvironment.DEVELOPMENT]: {
      MIN_CONNECTIONS: 1,
      MAX_CONNECTIONS: 5,
      MAX_IDLE_CONNECTIONS: 2,
      IDLE_TIMEOUT_MS: 30000, // 30 seconds
    },
    [DatabaseEnvironment.TEST]: {
      MIN_CONNECTIONS: 1,
      MAX_CONNECTIONS: 3,
      MAX_IDLE_CONNECTIONS: 1,
      IDLE_TIMEOUT_MS: 10000, // 10 seconds
    },
    [DatabaseEnvironment.STAGING]: {
      MIN_CONNECTIONS: 2,
      MAX_CONNECTIONS: 8,
      MAX_IDLE_CONNECTIONS: 3,
      IDLE_TIMEOUT_MS: 45000, // 45 seconds
    },
    [DatabaseEnvironment.PRODUCTION]: {
      MIN_CONNECTIONS: 3,
      MAX_CONNECTIONS: 15,
      MAX_IDLE_CONNECTIONS: 5,
      IDLE_TIMEOUT_MS: 60000, // 1 minute
    },
  },
};

/**
 * Timeout configuration constants for database operations
 */
export const TIMEOUTS = {
  /**
   * Default query timeout in milliseconds
   */
  QUERY_TIMEOUT_MS: 5000, // 5 seconds

  /**
   * Default transaction timeout in milliseconds
   */
  TRANSACTION_TIMEOUT_MS: 30000, // 30 seconds

  /**
   * Default connection timeout in milliseconds
   */
  CONNECTION_TIMEOUT_MS: 10000, // 10 seconds

  /**
   * Default health check timeout in milliseconds
   */
  HEALTH_CHECK_TIMEOUT_MS: 2000, // 2 seconds

  /**
   * Environment-specific timeout settings
   */
  ENVIRONMENT: {
    [DatabaseEnvironment.DEVELOPMENT]: {
      QUERY_TIMEOUT_MS: 10000, // 10 seconds (longer for development)
      TRANSACTION_TIMEOUT_MS: 60000, // 1 minute (longer for development)
      CONNECTION_TIMEOUT_MS: 15000, // 15 seconds
    },
    [DatabaseEnvironment.TEST]: {
      QUERY_TIMEOUT_MS: 3000, // 3 seconds (shorter for tests)
      TRANSACTION_TIMEOUT_MS: 15000, // 15 seconds
      CONNECTION_TIMEOUT_MS: 5000, // 5 seconds
    },
    [DatabaseEnvironment.STAGING]: {
      QUERY_TIMEOUT_MS: 5000, // 5 seconds
      TRANSACTION_TIMEOUT_MS: 30000, // 30 seconds
      CONNECTION_TIMEOUT_MS: 10000, // 10 seconds
    },
    [DatabaseEnvironment.PRODUCTION]: {
      QUERY_TIMEOUT_MS: 5000, // 5 seconds
      TRANSACTION_TIMEOUT_MS: 30000, // 30 seconds
      CONNECTION_TIMEOUT_MS: 10000, // 10 seconds
    },
  },

  /**
   * Journey-specific timeout overrides
   */
  JOURNEY: {
    HEALTH: {
      QUERY_TIMEOUT_MS: 8000, // 8 seconds (health data queries may be more complex)
    },
    CARE: {
      QUERY_TIMEOUT_MS: 6000, // 6 seconds
    },
    PLAN: {
      QUERY_TIMEOUT_MS: 6000, // 6 seconds
    },
  },
};

/**
 * Retry configuration constants for database operations
 */
export const RETRY = {
  /**
   * Maximum number of retry attempts for database operations
   */
  MAX_RETRY_ATTEMPTS: 3,

  /**
   * Initial delay in milliseconds before the first retry
   */
  INITIAL_RETRY_DELAY_MS: 100,

  /**
   * Multiplier applied to the delay after each retry attempt
   */
  BACKOFF_MULTIPLIER: 2,

  /**
   * Maximum delay in milliseconds between retry attempts
   */
  MAX_RETRY_DELAY_MS: 5000, // 5 seconds

  /**
   * Random factor to add jitter to retry delays (0-1)
   * Helps prevent retry storms by randomizing retry timing
   */
  JITTER_FACTOR: 0.2, // 20% randomization

  /**
   * Time in milliseconds before a circuit breaker resets after tripping
   */
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 30000, // 30 seconds

  /**
   * Number of failures required to trip the circuit breaker
   */
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,

  /**
   * Environment-specific retry settings
   */
  ENVIRONMENT: {
    [DatabaseEnvironment.DEVELOPMENT]: {
      MAX_RETRY_ATTEMPTS: 5, // More retries in development
      INITIAL_RETRY_DELAY_MS: 200, // Longer initial delay
    },
    [DatabaseEnvironment.TEST]: {
      MAX_RETRY_ATTEMPTS: 2, // Fewer retries in tests
      INITIAL_RETRY_DELAY_MS: 50, // Shorter initial delay
    },
    [DatabaseEnvironment.STAGING]: {
      MAX_RETRY_ATTEMPTS: 3,
      INITIAL_RETRY_DELAY_MS: 100,
    },
    [DatabaseEnvironment.PRODUCTION]: {
      MAX_RETRY_ATTEMPTS: 3,
      INITIAL_RETRY_DELAY_MS: 100,
    },
  },

  /**
   * Operation-specific retry configurations
   */
  OPERATIONS: {
    /**
     * Retry configuration for connection operations
     */
    CONNECTION: {
      MAX_RETRY_ATTEMPTS: 5, // More retries for connection issues
      INITIAL_RETRY_DELAY_MS: 200,
      BACKOFF_MULTIPLIER: 2.5,
    },

    /**
     * Retry configuration for read operations
     */
    READ: {
      MAX_RETRY_ATTEMPTS: 3,
      INITIAL_RETRY_DELAY_MS: 100,
      BACKOFF_MULTIPLIER: 2,
    },

    /**
     * Retry configuration for write operations
     */
    WRITE: {
      MAX_RETRY_ATTEMPTS: 2, // Fewer retries for write operations
      INITIAL_RETRY_DELAY_MS: 150,
      BACKOFF_MULTIPLIER: 2,
    },

    /**
     * Retry configuration for transaction operations
     */
    TRANSACTION: {
      MAX_RETRY_ATTEMPTS: 2, // Fewer retries for transactions
      INITIAL_RETRY_DELAY_MS: 150,
      BACKOFF_MULTIPLIER: 2,
    },
  },
};

/**
 * Logging configuration constants for database operations
 */
export const LOGGING = {
  /**
   * Enable query logging
   */
  ENABLE_QUERY_LOGGING: false,

  /**
   * Enable transaction logging
   */
  ENABLE_TRANSACTION_LOGGING: false,

  /**
   * Enable connection pool logging
   */
  ENABLE_POOL_LOGGING: false,

  /**
   * Log slow queries that exceed this threshold in milliseconds
   */
  SLOW_QUERY_THRESHOLD_MS: 1000, // 1 second

  /**
   * Environment-specific logging settings
   */
  ENVIRONMENT: {
    [DatabaseEnvironment.DEVELOPMENT]: {
      ENABLE_QUERY_LOGGING: true,
      ENABLE_TRANSACTION_LOGGING: true,
      ENABLE_POOL_LOGGING: true,
      SLOW_QUERY_THRESHOLD_MS: 500, // 500ms in development
    },
    [DatabaseEnvironment.TEST]: {
      ENABLE_QUERY_LOGGING: false,
      ENABLE_TRANSACTION_LOGGING: false,
      ENABLE_POOL_LOGGING: false,
    },
    [DatabaseEnvironment.STAGING]: {
      ENABLE_QUERY_LOGGING: false,
      ENABLE_TRANSACTION_LOGGING: true,
      ENABLE_POOL_LOGGING: true,
      SLOW_QUERY_THRESHOLD_MS: 1000, // 1 second
    },
    [DatabaseEnvironment.PRODUCTION]: {
      ENABLE_QUERY_LOGGING: false,
      ENABLE_TRANSACTION_LOGGING: false,
      ENABLE_POOL_LOGGING: false,
      SLOW_QUERY_THRESHOLD_MS: 1000, // 1 second
    },
  },
};

/**
 * Error code prefixes for database errors
 */
export const ERROR_CODE_PREFIXES = {
  CONNECTION: 'DB_CONN_',
  QUERY: 'DB_QUERY_',
  TRANSACTION: 'DB_TXN_',
  DATA_INTEGRITY: 'DB_INTEG_',
  CONFIGURATION: 'DB_CONFIG_',
};

/**
 * Database error codes for specific error scenarios
 */
export const ERROR_CODES = {
  // Connection errors
  CONNECTION_FAILED: `${ERROR_CODE_PREFIXES.CONNECTION}001`,
  CONNECTION_TIMEOUT: `${ERROR_CODE_PREFIXES.CONNECTION}002`,
  CONNECTION_LIMIT_REACHED: `${ERROR_CODE_PREFIXES.CONNECTION}003`,
  CONNECTION_CLOSED: `${ERROR_CODE_PREFIXES.CONNECTION}004`,
  CONNECTION_REJECTED: `${ERROR_CODE_PREFIXES.CONNECTION}005`,

  // Query errors
  QUERY_FAILED: `${ERROR_CODE_PREFIXES.QUERY}001`,
  QUERY_TIMEOUT: `${ERROR_CODE_PREFIXES.QUERY}002`,
  QUERY_SYNTAX_ERROR: `${ERROR_CODE_PREFIXES.QUERY}003`,
  QUERY_EXECUTION_ERROR: `${ERROR_CODE_PREFIXES.QUERY}004`,
  QUERY_RESULT_ERROR: `${ERROR_CODE_PREFIXES.QUERY}005`,

  // Transaction errors
  TRANSACTION_FAILED: `${ERROR_CODE_PREFIXES.TRANSACTION}001`,
  TRANSACTION_TIMEOUT: `${ERROR_CODE_PREFIXES.TRANSACTION}002`,
  TRANSACTION_CONFLICT: `${ERROR_CODE_PREFIXES.TRANSACTION}003`,
  TRANSACTION_ROLLBACK: `${ERROR_CODE_PREFIXES.TRANSACTION}004`,
  TRANSACTION_DEADLOCK: `${ERROR_CODE_PREFIXES.TRANSACTION}005`,

  // Data integrity errors
  UNIQUE_CONSTRAINT_VIOLATION: `${ERROR_CODE_PREFIXES.DATA_INTEGRITY}001`,
  FOREIGN_KEY_CONSTRAINT_VIOLATION: `${ERROR_CODE_PREFIXES.DATA_INTEGRITY}002`,
  CHECK_CONSTRAINT_VIOLATION: `${ERROR_CODE_PREFIXES.DATA_INTEGRITY}003`,
  NOT_NULL_CONSTRAINT_VIOLATION: `${ERROR_CODE_PREFIXES.DATA_INTEGRITY}004`,
  DATA_TYPE_MISMATCH: `${ERROR_CODE_PREFIXES.DATA_INTEGRITY}005`,

  // Configuration errors
  INVALID_CONFIGURATION: `${ERROR_CODE_PREFIXES.CONFIGURATION}001`,
  MISSING_CONFIGURATION: `${ERROR_CODE_PREFIXES.CONFIGURATION}002`,
  INCOMPATIBLE_CONFIGURATION: `${ERROR_CODE_PREFIXES.CONFIGURATION}003`,
  ENVIRONMENT_CONFIGURATION_ERROR: `${ERROR_CODE_PREFIXES.CONFIGURATION}004`,
  SCHEMA_CONFIGURATION_ERROR: `${ERROR_CODE_PREFIXES.CONFIGURATION}005`,
};

/**
 * Mapping of database error types to their recoverability classification
 */
export const ERROR_RECOVERABILITY: Record<string, DatabaseErrorRecoverability> = {
  // Connection errors - generally transient
  [ERROR_CODES.CONNECTION_FAILED]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.CONNECTION_TIMEOUT]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.CONNECTION_LIMIT_REACHED]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.CONNECTION_CLOSED]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.CONNECTION_REJECTED]: DatabaseErrorRecoverability.PERMANENT,

  // Query errors - mixed
  [ERROR_CODES.QUERY_FAILED]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.QUERY_TIMEOUT]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.QUERY_SYNTAX_ERROR]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.QUERY_EXECUTION_ERROR]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.QUERY_RESULT_ERROR]: DatabaseErrorRecoverability.TRANSIENT,

  // Transaction errors - mixed
  [ERROR_CODES.TRANSACTION_FAILED]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.TRANSACTION_TIMEOUT]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.TRANSACTION_CONFLICT]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.TRANSACTION_ROLLBACK]: DatabaseErrorRecoverability.TRANSIENT,
  [ERROR_CODES.TRANSACTION_DEADLOCK]: DatabaseErrorRecoverability.TRANSIENT,

  // Data integrity errors - generally permanent
  [ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.CHECK_CONSTRAINT_VIOLATION]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.NOT_NULL_CONSTRAINT_VIOLATION]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.DATA_TYPE_MISMATCH]: DatabaseErrorRecoverability.PERMANENT,

  // Configuration errors - generally permanent
  [ERROR_CODES.INVALID_CONFIGURATION]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.MISSING_CONFIGURATION]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.INCOMPATIBLE_CONFIGURATION]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.ENVIRONMENT_CONFIGURATION_ERROR]: DatabaseErrorRecoverability.PERMANENT,
  [ERROR_CODES.SCHEMA_CONFIGURATION_ERROR]: DatabaseErrorRecoverability.PERMANENT,
};

/**
 * Mapping of database error types to their severity classification
 */
export const ERROR_SEVERITY: Record<string, DatabaseErrorSeverity> = {
  // Connection errors
  [ERROR_CODES.CONNECTION_FAILED]: DatabaseErrorSeverity.CRITICAL,
  [ERROR_CODES.CONNECTION_TIMEOUT]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.CONNECTION_LIMIT_REACHED]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.CONNECTION_CLOSED]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.CONNECTION_REJECTED]: DatabaseErrorSeverity.CRITICAL,

  // Query errors
  [ERROR_CODES.QUERY_FAILED]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.QUERY_TIMEOUT]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.QUERY_SYNTAX_ERROR]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.QUERY_EXECUTION_ERROR]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.QUERY_RESULT_ERROR]: DatabaseErrorSeverity.MINOR,

  // Transaction errors
  [ERROR_CODES.TRANSACTION_FAILED]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.TRANSACTION_TIMEOUT]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.TRANSACTION_CONFLICT]: DatabaseErrorSeverity.MINOR,
  [ERROR_CODES.TRANSACTION_ROLLBACK]: DatabaseErrorSeverity.MINOR,
  [ERROR_CODES.TRANSACTION_DEADLOCK]: DatabaseErrorSeverity.MAJOR,

  // Data integrity errors
  [ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION]: DatabaseErrorSeverity.MINOR,
  [ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION]: DatabaseErrorSeverity.MAJOR,
  [ERROR_CODES.CHECK_CONSTRAINT_VIOLATION]: DatabaseErrorSeverity.MINOR,
  [ERROR_CODES.NOT_NULL_CONSTRAINT_VIOLATION]: DatabaseErrorSeverity.MINOR,
  [ERROR_CODES.DATA_TYPE_MISMATCH]: DatabaseErrorSeverity.MINOR,

  // Configuration errors
  [ERROR_CODES.INVALID_CONFIGURATION]: DatabaseErrorSeverity.CRITICAL,
  [ERROR_CODES.MISSING_CONFIGURATION]: DatabaseErrorSeverity.CRITICAL,
  [ERROR_CODES.INCOMPATIBLE_CONFIGURATION]: DatabaseErrorSeverity.CRITICAL,
  [ERROR_CODES.ENVIRONMENT_CONFIGURATION_ERROR]: DatabaseErrorSeverity.CRITICAL,
  [ERROR_CODES.SCHEMA_CONFIGURATION_ERROR]: DatabaseErrorSeverity.CRITICAL,
};

/**
 * Database metrics constants for monitoring and observability
 */
export const METRICS = {
  /**
   * Prefix for all database metrics
   */
  PREFIX: 'gamification_db_',

  /**
   * Metric names for database operations
   */
  NAMES: {
    QUERY_EXECUTION_TIME: 'query_execution_time',
    TRANSACTION_EXECUTION_TIME: 'transaction_execution_time',
    CONNECTION_ACQUISITION_TIME: 'connection_acquisition_time',
    POOL_SIZE: 'pool_size',
    ACTIVE_CONNECTIONS: 'active_connections',
    IDLE_CONNECTIONS: 'idle_connections',
    CONNECTION_ERRORS: 'connection_errors',
    QUERY_ERRORS: 'query_errors',
    TRANSACTION_ERRORS: 'transaction_errors',
    RETRY_ATTEMPTS: 'retry_attempts',
    CIRCUIT_BREAKER_TRIPS: 'circuit_breaker_trips',
  },

  /**
   * Tags for database metrics
   */
  TAGS: {
    JOURNEY: 'journey',
    OPERATION_TYPE: 'operation_type',
    ERROR_TYPE: 'error_type',
    DATABASE_TYPE: 'database_type',
    ENVIRONMENT: 'environment',
  },
};

/**
 * Database health check constants
 */
export const HEALTH_CHECK = {
  /**
   * Interval in milliseconds between health checks
   */
  INTERVAL_MS: 30000, // 30 seconds

  /**
   * Timeout in milliseconds for health check queries
   */
  TIMEOUT_MS: 2000, // 2 seconds

  /**
   * Number of consecutive failures before marking a connection as unhealthy
   */
  FAILURE_THRESHOLD: 3,

  /**
   * Number of consecutive successes before marking a connection as healthy again
   */
  RECOVERY_THRESHOLD: 2,

  /**
   * Environment-specific health check settings
   */
  ENVIRONMENT: {
    [DatabaseEnvironment.DEVELOPMENT]: {
      INTERVAL_MS: 60000, // 1 minute (less frequent in development)
    },
    [DatabaseEnvironment.TEST]: {
      INTERVAL_MS: 10000, // 10 seconds (more frequent in testing)
    },
    [DatabaseEnvironment.STAGING]: {
      INTERVAL_MS: 30000, // 30 seconds
    },
    [DatabaseEnvironment.PRODUCTION]: {
      INTERVAL_MS: 30000, // 30 seconds
    },
  },
};