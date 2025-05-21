/**
 * Retry Policies for the Gamification Engine
 * 
 * This file defines constants for retry strategies and circuit breaker configurations
 * used throughout the gamification engine. These constants ensure consistent handling
 * of transient failures and external service dependencies across all modules.
 */

/**
 * Enum defining the types of retry policies available in the system.
 */
export enum RetryPolicyType {
  /** Increases delay between retries exponentially (recommended for most cases) */
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  /** Increases delay between retries linearly */
  LINEAR = 'linear',
  /** Uses the same delay between all retries */
  FIXED = 'fixed',
}

/**
 * Enum defining error categories for determining retry behavior.
 */
export enum ErrorCategory {
  /** Temporary errors that are likely to resolve on retry (network issues, timeouts) */
  TRANSIENT = 'transient',
  /** Client-side errors that will not be resolved by retrying (validation errors) */
  CLIENT = 'client',
  /** Server-side errors that may or may not be resolved by retrying */
  SYSTEM = 'system',
  /** Errors from external dependencies that may be temporarily unavailable */
  EXTERNAL = 'external',
}

/**
 * Enum defining different operation categories in the gamification engine.
 */
export enum OperationCategory {
  /** Event ingestion from Kafka */
  EVENT_INGESTION = 'event_ingestion',
  /** Event processing and rule evaluation */
  EVENT_PROCESSING = 'event_processing',
  /** Achievement calculation and awarding */
  ACHIEVEMENT_PROCESSING = 'achievement_processing',
  /** Database operations */
  DATABASE = 'database',
  /** Redis operations for leaderboards and caching */
  REDIS = 'redis',
  /** External API calls */
  EXTERNAL_API = 'external_api',
  /** Notification dispatch */
  NOTIFICATION = 'notification',
}

/**
 * Maximum retry attempts for different operation categories.
 */
export const MAX_RETRY_ATTEMPTS = {
  [OperationCategory.EVENT_INGESTION]: 5,
  [OperationCategory.EVENT_PROCESSING]: 3,
  [OperationCategory.ACHIEVEMENT_PROCESSING]: 3,
  [OperationCategory.DATABASE]: 3,
  [OperationCategory.REDIS]: 5,
  [OperationCategory.EXTERNAL_API]: 3,
  [OperationCategory.NOTIFICATION]: 5,
} as const;

/**
 * Initial delay in milliseconds for the first retry attempt.
 */
export const INITIAL_RETRY_DELAY_MS = {
  [OperationCategory.EVENT_INGESTION]: 100,
  [OperationCategory.EVENT_PROCESSING]: 200,
  [OperationCategory.ACHIEVEMENT_PROCESSING]: 200,
  [OperationCategory.DATABASE]: 50,
  [OperationCategory.REDIS]: 50,
  [OperationCategory.EXTERNAL_API]: 300,
  [OperationCategory.NOTIFICATION]: 500,
} as const;

/**
 * Maximum delay in milliseconds between retry attempts.
 */
export const MAX_RETRY_DELAY_MS = {
  [OperationCategory.EVENT_INGESTION]: 10000, // 10 seconds
  [OperationCategory.EVENT_PROCESSING]: 5000,  // 5 seconds
  [OperationCategory.ACHIEVEMENT_PROCESSING]: 5000,  // 5 seconds
  [OperationCategory.DATABASE]: 2000,  // 2 seconds
  [OperationCategory.REDIS]: 2000,  // 2 seconds
  [OperationCategory.EXTERNAL_API]: 30000, // 30 seconds
  [OperationCategory.NOTIFICATION]: 60000, // 60 seconds
} as const;

/**
 * Backoff factor for exponential retry delay calculation.
 * The formula is: delay = min(maxDelay, initialDelay * (backoffFactor ^ attemptNumber))
 */
export const BACKOFF_FACTOR = {
  [OperationCategory.EVENT_INGESTION]: 2,
  [OperationCategory.EVENT_PROCESSING]: 2,
  [OperationCategory.ACHIEVEMENT_PROCESSING]: 2,
  [OperationCategory.DATABASE]: 1.5,
  [OperationCategory.REDIS]: 1.5,
  [OperationCategory.EXTERNAL_API]: 2,
  [OperationCategory.NOTIFICATION]: 2,
} as const;

/**
 * Jitter factor (0-1) to add randomness to retry delays to prevent thundering herd problem.
 * A value of 0.25 means the actual delay will be between 75% and 125% of the calculated delay.
 */
export const JITTER_FACTOR = 0.25;

/**
 * Timeout in milliseconds for different operation categories.
 */
export const OPERATION_TIMEOUT_MS = {
  [OperationCategory.EVENT_INGESTION]: 5000,  // 5 seconds
  [OperationCategory.EVENT_PROCESSING]: 10000, // 10 seconds
  [OperationCategory.ACHIEVEMENT_PROCESSING]: 15000, // 15 seconds
  [OperationCategory.DATABASE]: 5000,  // 5 seconds
  [OperationCategory.REDIS]: 2000,  // 2 seconds
  [OperationCategory.EXTERNAL_API]: 10000, // 10 seconds
  [OperationCategory.NOTIFICATION]: 5000,  // 5 seconds
} as const;

/**
 * Circuit breaker configuration for different operation categories.
 */
export const CIRCUIT_BREAKER = {
  /** Number of consecutive failures before the circuit breaker opens */
  FAILURE_THRESHOLD: {
    [OperationCategory.EVENT_INGESTION]: 10,
    [OperationCategory.EVENT_PROCESSING]: 5,
    [OperationCategory.ACHIEVEMENT_PROCESSING]: 5,
    [OperationCategory.DATABASE]: 3,
    [OperationCategory.REDIS]: 5,
    [OperationCategory.EXTERNAL_API]: 5,
    [OperationCategory.NOTIFICATION]: 10,
  } as const,

  /** Time in milliseconds to keep the circuit breaker open before moving to half-open state */
  RESET_TIMEOUT_MS: {
    [OperationCategory.EVENT_INGESTION]: 30000,  // 30 seconds
    [OperationCategory.EVENT_PROCESSING]: 15000,  // 15 seconds
    [OperationCategory.ACHIEVEMENT_PROCESSING]: 15000,  // 15 seconds
    [OperationCategory.DATABASE]: 10000,  // 10 seconds
    [OperationCategory.REDIS]: 5000,   // 5 seconds
    [OperationCategory.EXTERNAL_API]: 60000,  // 60 seconds
    [OperationCategory.NOTIFICATION]: 30000,  // 30 seconds
  } as const,

  /** Number of successful test requests required in half-open state to close the circuit */
  HALF_OPEN_SUCCESS_THRESHOLD: {
    [OperationCategory.EVENT_INGESTION]: 3,
    [OperationCategory.EVENT_PROCESSING]: 2,
    [OperationCategory.ACHIEVEMENT_PROCESSING]: 2,
    [OperationCategory.DATABASE]: 2,
    [OperationCategory.REDIS]: 2,
    [OperationCategory.EXTERNAL_API]: 1,
    [OperationCategory.NOTIFICATION]: 2,
  } as const,
} as const;

/**
 * Dead letter queue (DLQ) configuration for handling persistently failing operations.
 */
export const DEAD_LETTER_QUEUE = {
  /** Whether to enable DLQ for the operation category */
  ENABLED: {
    [OperationCategory.EVENT_INGESTION]: true,
    [OperationCategory.EVENT_PROCESSING]: true,
    [OperationCategory.ACHIEVEMENT_PROCESSING]: true,
    [OperationCategory.DATABASE]: false, // Database operations should fail rather than go to DLQ
    [OperationCategory.REDIS]: false,     // Redis operations should fail rather than go to DLQ
    [OperationCategory.EXTERNAL_API]: true,
    [OperationCategory.NOTIFICATION]: true,
  } as const,

  /** Suffix to add to the original topic name for the DLQ topic */
  TOPIC_SUFFIX: '.dlq',

  /** Maximum size of the message payload to store in the DLQ (in bytes) */
  MAX_MESSAGE_SIZE_BYTES: 1048576, // 1MB

  /** Whether to include the full error stack trace in the DLQ message */
  INCLUDE_STACK_TRACE: process.env.NODE_ENV !== 'production',

  /** Time-to-live for messages in the DLQ (in milliseconds) */
  MESSAGE_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Retry policy configuration for Kafka consumers.
 */
export const KAFKA_CONSUMER_RETRY = {
  /** Maximum number of retries for Kafka consumer group rebalancing */
  MAX_REBALANCING_RETRIES: 10,

  /** Initial delay for rebalancing retries in milliseconds */
  INITIAL_REBALANCING_RETRY_DELAY_MS: 1000,

  /** Maximum delay for rebalancing retries in milliseconds */
  MAX_REBALANCING_RETRY_DELAY_MS: 30000,

  /** Backoff factor for rebalancing retries */
  REBALANCING_BACKOFF_FACTOR: 2,

  /** Maximum number of retries for Kafka consumer connection */
  MAX_CONNECTION_RETRIES: 5,

  /** Initial delay for connection retries in milliseconds */
  INITIAL_CONNECTION_RETRY_DELAY_MS: 1000,

  /** Maximum delay for connection retries in milliseconds */
  MAX_CONNECTION_RETRY_DELAY_MS: 10000,

  /** Backoff factor for connection retries */
  CONNECTION_BACKOFF_FACTOR: 2,
} as const;

/**
 * Retry policy configuration for Kafka producers.
 */
export const KAFKA_PRODUCER_RETRY = {
  /** Maximum number of retries for Kafka producer message sending */
  MAX_SEND_RETRIES: 5,

  /** Initial delay for send retries in milliseconds */
  INITIAL_SEND_RETRY_DELAY_MS: 100,

  /** Maximum delay for send retries in milliseconds */
  MAX_SEND_RETRY_DELAY_MS: 5000,

  /** Backoff factor for send retries */
  SEND_BACKOFF_FACTOR: 2,

  /** Maximum number of retries for Kafka producer connection */
  MAX_CONNECTION_RETRIES: 5,

  /** Initial delay for connection retries in milliseconds */
  INITIAL_CONNECTION_RETRY_DELAY_MS: 1000,

  /** Maximum delay for connection retries in milliseconds */
  MAX_CONNECTION_RETRY_DELAY_MS: 10000,

  /** Backoff factor for connection retries */
  CONNECTION_BACKOFF_FACTOR: 2,
} as const;

/**
 * Retry policy configuration for database operations.
 */
export const DATABASE_RETRY = {
  /** Whether to retry on connection errors */
  RETRY_ON_CONNECTION_ERROR: true,

  /** Whether to retry on deadlock errors */
  RETRY_ON_DEADLOCK: true,

  /** Whether to retry on serialization failures */
  RETRY_ON_SERIALIZATION_FAILURE: true,

  /** Whether to retry on constraint violations (generally not recommended) */
  RETRY_ON_CONSTRAINT_VIOLATION: false,
} as const;

/**
 * Retry policy configuration for Redis operations.
 */
export const REDIS_RETRY = {
  /** Whether to retry on connection errors */
  RETRY_ON_CONNECTION_ERROR: true,

  /** Whether to retry on READONLY errors (when connected to a replica) */
  RETRY_ON_READONLY: true,

  /** Whether to retry on LOADING errors (when Redis is loading dataset into memory) */
  RETRY_ON_LOADING: true,

  /** Whether to retry on CLUSTERDOWN errors */
  RETRY_ON_CLUSTERDOWN: true,
} as const;