/**
 * Retry Policies and Circuit Breaker Configurations
 *
 * This file defines constants for retry strategies and circuit breaker configurations
 * used throughout the gamification engine. These constants ensure consistent handling
 * of transient failures and external service dependencies across all modules.
 *
 * The retry policies are categorized by operation type and include parameters for:
 * - Maximum retry attempts
 * - Initial delay before first retry
 * - Backoff factors for exponential retry strategies
 * - Jitter ranges to prevent thundering herd problems
 * - Circuit breaker thresholds and reset timings
 * - Dead-letter queue configurations
 */

/**
 * Retry policy types supported by the gamification engine
 */
export enum RetryPolicyType {
  /** Fixed interval between retry attempts */
  FIXED = 'fixed',
  /** Linear increase in delay between retry attempts */
  LINEAR = 'linear',
  /** Exponential increase in delay between retry attempts */
  EXPONENTIAL = 'exponential',
}

/**
 * Operation categories for retry policies
 * Used to apply different retry strategies based on the type of operation
 */
export enum OperationCategory {
  /** Database operations */
  DATABASE = 'database',
  /** Kafka event processing */
  EVENT_PROCESSING = 'event_processing',
  /** Redis cache operations */
  CACHE = 'cache',
  /** External API calls */
  EXTERNAL_API = 'external_api',
  /** Internal service communication */
  INTERNAL_SERVICE = 'internal_service',
  /** Leaderboard operations */
  LEADERBOARD = 'leaderboard',
  /** Achievement processing */
  ACHIEVEMENT = 'achievement',
  /** Reward distribution */
  REWARD = 'reward',
  /** User profile operations */
  PROFILE = 'profile',
  /** Quest processing */
  QUEST = 'quest',
  /** Rule evaluation */
  RULE = 'rule',
}

/**
 * Error types that determine retry behavior
 */
export enum ErrorType {
  /** Temporary errors that are likely to resolve on retry */
  TRANSIENT = 'transient',
  /** Client errors that should not be retried */
  CLIENT = 'client',
  /** System errors that may require intervention */
  SYSTEM = 'system',
  /** External dependency errors */
  EXTERNAL = 'external',
}

/**
 * General retry configuration constants
 */
export const RETRY_CONFIG = {
  /** Default maximum number of retry attempts */
  DEFAULT_MAX_RETRIES: 3,
  /** Default initial delay in milliseconds before first retry */
  DEFAULT_INITIAL_DELAY_MS: 100,
  /** Default maximum delay in milliseconds between retries */
  DEFAULT_MAX_DELAY_MS: 10000,
  /** Default jitter factor to add randomness to retry delays (0-1) */
  DEFAULT_JITTER_FACTOR: 0.1,
  /** Default timeout in milliseconds for operations */
  DEFAULT_TIMEOUT_MS: 5000,
  /** Default backoff factor for exponential retry strategy */
  DEFAULT_BACKOFF_FACTOR: 2,
  /** Default linear increment in milliseconds for linear retry strategy */
  DEFAULT_LINEAR_INCREMENT_MS: 1000,
};

/**
 * Maximum retry attempts by operation category
 */
export const MAX_RETRY_ATTEMPTS = {
  [OperationCategory.DATABASE]: 5,
  [OperationCategory.EVENT_PROCESSING]: 10,
  [OperationCategory.CACHE]: 3,
  [OperationCategory.EXTERNAL_API]: 3,
  [OperationCategory.INTERNAL_SERVICE]: 5,
  [OperationCategory.LEADERBOARD]: 3,
  [OperationCategory.ACHIEVEMENT]: 5,
  [OperationCategory.REWARD]: 7,
  [OperationCategory.PROFILE]: 3,
  [OperationCategory.QUEST]: 5,
  [OperationCategory.RULE]: 3,
};

/**
 * Initial delay in milliseconds before first retry by operation category
 */
export const INITIAL_RETRY_DELAY_MS = {
  [OperationCategory.DATABASE]: 100,
  [OperationCategory.EVENT_PROCESSING]: 50,
  [OperationCategory.CACHE]: 50,
  [OperationCategory.EXTERNAL_API]: 200,
  [OperationCategory.INTERNAL_SERVICE]: 100,
  [OperationCategory.LEADERBOARD]: 50,
  [OperationCategory.ACHIEVEMENT]: 100,
  [OperationCategory.REWARD]: 200,
  [OperationCategory.PROFILE]: 100,
  [OperationCategory.QUEST]: 100,
  [OperationCategory.RULE]: 50,
};

/**
 * Maximum delay in milliseconds between retries by operation category
 */
export const MAX_RETRY_DELAY_MS = {
  [OperationCategory.DATABASE]: 5000,
  [OperationCategory.EVENT_PROCESSING]: 30000,
  [OperationCategory.CACHE]: 1000,
  [OperationCategory.EXTERNAL_API]: 10000,
  [OperationCategory.INTERNAL_SERVICE]: 5000,
  [OperationCategory.LEADERBOARD]: 3000,
  [OperationCategory.ACHIEVEMENT]: 5000,
  [OperationCategory.REWARD]: 10000,
  [OperationCategory.PROFILE]: 3000,
  [OperationCategory.QUEST]: 5000,
  [OperationCategory.RULE]: 2000,
};

/**
 * Backoff factors for exponential retry strategy by operation category
 */
export const BACKOFF_FACTORS = {
  [OperationCategory.DATABASE]: 2,
  [OperationCategory.EVENT_PROCESSING]: 2,
  [OperationCategory.CACHE]: 1.5,
  [OperationCategory.EXTERNAL_API]: 2.5,
  [OperationCategory.INTERNAL_SERVICE]: 2,
  [OperationCategory.LEADERBOARD]: 1.5,
  [OperationCategory.ACHIEVEMENT]: 2,
  [OperationCategory.REWARD]: 2,
  [OperationCategory.PROFILE]: 1.5,
  [OperationCategory.QUEST]: 2,
  [OperationCategory.RULE]: 1.5,
};

/**
 * Jitter factors to add randomness to retry delays by operation category
 * Values between 0 and 1, where 0 means no jitter and 1 means up to 100% jitter
 */
export const JITTER_FACTORS = {
  [OperationCategory.DATABASE]: 0.1,
  [OperationCategory.EVENT_PROCESSING]: 0.2,
  [OperationCategory.CACHE]: 0.1,
  [OperationCategory.EXTERNAL_API]: 0.2,
  [OperationCategory.INTERNAL_SERVICE]: 0.15,
  [OperationCategory.LEADERBOARD]: 0.1,
  [OperationCategory.ACHIEVEMENT]: 0.15,
  [OperationCategory.REWARD]: 0.15,
  [OperationCategory.PROFILE]: 0.1,
  [OperationCategory.QUEST]: 0.15,
  [OperationCategory.RULE]: 0.1,
};

/**
 * Circuit breaker configurations
 */
export const CIRCUIT_BREAKER = {
  /** Default failure threshold before opening the circuit */
  DEFAULT_FAILURE_THRESHOLD: 5,
  /** Default success threshold before closing the circuit */
  DEFAULT_SUCCESS_THRESHOLD: 3,
  /** Default timeout in milliseconds before attempting to half-open the circuit */
  DEFAULT_RESET_TIMEOUT_MS: 30000,
  /** Default timeout in milliseconds for circuit breaker operations */
  DEFAULT_OPERATION_TIMEOUT_MS: 5000,
  /** Default volume threshold before circuit breaker starts operating */
  DEFAULT_VOLUME_THRESHOLD: 10,
  /** Default window size in milliseconds for failure rate calculation */
  DEFAULT_WINDOW_SIZE_MS: 60000,
};

/**
 * Circuit breaker failure thresholds by operation category
 */
export const CIRCUIT_BREAKER_FAILURE_THRESHOLDS = {
  [OperationCategory.DATABASE]: 10,
  [OperationCategory.EVENT_PROCESSING]: 20,
  [OperationCategory.CACHE]: 5,
  [OperationCategory.EXTERNAL_API]: 5,
  [OperationCategory.INTERNAL_SERVICE]: 8,
  [OperationCategory.LEADERBOARD]: 5,
  [OperationCategory.ACHIEVEMENT]: 8,
  [OperationCategory.REWARD]: 8,
  [OperationCategory.PROFILE]: 5,
  [OperationCategory.QUEST]: 8,
  [OperationCategory.RULE]: 5,
};

/**
 * Circuit breaker reset timeouts in milliseconds by operation category
 */
export const CIRCUIT_BREAKER_RESET_TIMEOUTS_MS = {
  [OperationCategory.DATABASE]: 30000,
  [OperationCategory.EVENT_PROCESSING]: 60000,
  [OperationCategory.CACHE]: 10000,
  [OperationCategory.EXTERNAL_API]: 60000,
  [OperationCategory.INTERNAL_SERVICE]: 30000,
  [OperationCategory.LEADERBOARD]: 20000,
  [OperationCategory.ACHIEVEMENT]: 30000,
  [OperationCategory.REWARD]: 45000,
  [OperationCategory.PROFILE]: 20000,
  [OperationCategory.QUEST]: 30000,
  [OperationCategory.RULE]: 15000,
};

/**
 * Dead-letter queue (DLQ) configurations
 */
export const DLQ_CONFIG = {
  /** Default DLQ topic suffix */
  DEFAULT_TOPIC_SUFFIX: '.dlq',
  /** Default maximum number of DLQ processing attempts */
  DEFAULT_MAX_PROCESSING_ATTEMPTS: 3,
  /** Default delay in milliseconds before processing DLQ messages */
  DEFAULT_PROCESSING_DELAY_MS: 300000, // 5 minutes
  /** Default maximum age in milliseconds for DLQ messages before permanent failure */
  DEFAULT_MAX_AGE_MS: 86400000, // 24 hours
  /** Default batch size for DLQ message processing */
  DEFAULT_BATCH_SIZE: 10,
};

/**
 * DLQ processing delays in milliseconds by operation category
 */
export const DLQ_PROCESSING_DELAYS_MS = {
  [OperationCategory.DATABASE]: 300000, // 5 minutes
  [OperationCategory.EVENT_PROCESSING]: 600000, // 10 minutes
  [OperationCategory.CACHE]: 60000, // 1 minute
  [OperationCategory.EXTERNAL_API]: 900000, // 15 minutes
  [OperationCategory.INTERNAL_SERVICE]: 300000, // 5 minutes
  [OperationCategory.LEADERBOARD]: 180000, // 3 minutes
  [OperationCategory.ACHIEVEMENT]: 300000, // 5 minutes
  [OperationCategory.REWARD]: 600000, // 10 minutes
  [OperationCategory.PROFILE]: 300000, // 5 minutes
  [OperationCategory.QUEST]: 300000, // 5 minutes
  [OperationCategory.RULE]: 180000, // 3 minutes
};

/**
 * Retry policy configurations for Kafka consumers
 */
export const KAFKA_CONSUMER_RETRY = {
  /** Maximum number of retry attempts for Kafka consumer operations */
  MAX_RETRIES: 10,
  /** Initial retry delay in milliseconds for Kafka consumer operations */
  INITIAL_RETRY_DELAY_MS: 100,
  /** Maximum retry delay in milliseconds for Kafka consumer operations */
  MAX_RETRY_DELAY_MS: 30000,
  /** Backoff factor for Kafka consumer retry operations */
  BACKOFF_FACTOR: 2,
  /** Jitter factor for Kafka consumer retry operations */
  JITTER_FACTOR: 0.2,
  /** Retry policy type for Kafka consumer operations */
  POLICY_TYPE: RetryPolicyType.EXPONENTIAL,
  /** DLQ topic suffix for Kafka consumer operations */
  DLQ_TOPIC_SUFFIX: '.dlq',
  /** Delay in milliseconds before processing DLQ messages for Kafka consumers */
  DLQ_PROCESSING_DELAY_MS: 600000, // 10 minutes
};

/**
 * Retry policy configurations for Redis operations
 */
export const REDIS_RETRY = {
  /** Maximum number of retry attempts for Redis operations */
  MAX_RETRIES: 3,
  /** Initial retry delay in milliseconds for Redis operations */
  INITIAL_RETRY_DELAY_MS: 50,
  /** Maximum retry delay in milliseconds for Redis operations */
  MAX_RETRY_DELAY_MS: 1000,
  /** Backoff factor for Redis retry operations */
  BACKOFF_FACTOR: 1.5,
  /** Jitter factor for Redis retry operations */
  JITTER_FACTOR: 0.1,
  /** Retry policy type for Redis operations */
  POLICY_TYPE: RetryPolicyType.EXPONENTIAL,
  /** Circuit breaker failure threshold for Redis operations */
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,
  /** Circuit breaker reset timeout in milliseconds for Redis operations */
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 10000,
};

/**
 * Retry policy configurations for database operations
 */
export const DATABASE_RETRY = {
  /** Maximum number of retry attempts for database operations */
  MAX_RETRIES: 5,
  /** Initial retry delay in milliseconds for database operations */
  INITIAL_RETRY_DELAY_MS: 100,
  /** Maximum retry delay in milliseconds for database operations */
  MAX_RETRY_DELAY_MS: 5000,
  /** Backoff factor for database retry operations */
  BACKOFF_FACTOR: 2,
  /** Jitter factor for database retry operations */
  JITTER_FACTOR: 0.1,
  /** Retry policy type for database operations */
  POLICY_TYPE: RetryPolicyType.EXPONENTIAL,
  /** Circuit breaker failure threshold for database operations */
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 10,
  /** Circuit breaker reset timeout in milliseconds for database operations */
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 30000,
};

/**
 * Retry policy configurations for achievement processing
 */
export const ACHIEVEMENT_PROCESSING_RETRY = {
  /** Maximum number of retry attempts for achievement processing */
  MAX_RETRIES: 5,
  /** Initial retry delay in milliseconds for achievement processing */
  INITIAL_RETRY_DELAY_MS: 100,
  /** Maximum retry delay in milliseconds for achievement processing */
  MAX_RETRY_DELAY_MS: 5000,
  /** Backoff factor for achievement processing retry operations */
  BACKOFF_FACTOR: 2,
  /** Jitter factor for achievement processing retry operations */
  JITTER_FACTOR: 0.15,
  /** Retry policy type for achievement processing */
  POLICY_TYPE: RetryPolicyType.EXPONENTIAL,
  /** DLQ topic suffix for achievement processing */
  DLQ_TOPIC_SUFFIX: '.achievement.dlq',
  /** Delay in milliseconds before processing DLQ messages for achievement processing */
  DLQ_PROCESSING_DELAY_MS: 300000, // 5 minutes
};

/**
 * Retry policy configurations for reward distribution
 */
export const REWARD_DISTRIBUTION_RETRY = {
  /** Maximum number of retry attempts for reward distribution */
  MAX_RETRIES: 7,
  /** Initial retry delay in milliseconds for reward distribution */
  INITIAL_RETRY_DELAY_MS: 200,
  /** Maximum retry delay in milliseconds for reward distribution */
  MAX_RETRY_DELAY_MS: 10000,
  /** Backoff factor for reward distribution retry operations */
  BACKOFF_FACTOR: 2,
  /** Jitter factor for reward distribution retry operations */
  JITTER_FACTOR: 0.15,
  /** Retry policy type for reward distribution */
  POLICY_TYPE: RetryPolicyType.EXPONENTIAL,
  /** DLQ topic suffix for reward distribution */
  DLQ_TOPIC_SUFFIX: '.reward.dlq',
  /** Delay in milliseconds before processing DLQ messages for reward distribution */
  DLQ_PROCESSING_DELAY_MS: 600000, // 10 minutes
};

/**
 * Retry policy configurations for quest processing
 */
export const QUEST_PROCESSING_RETRY = {
  /** Maximum number of retry attempts for quest processing */
  MAX_RETRIES: 5,
  /** Initial retry delay in milliseconds for quest processing */
  INITIAL_RETRY_DELAY_MS: 100,
  /** Maximum retry delay in milliseconds for quest processing */
  MAX_RETRY_DELAY_MS: 5000,
  /** Backoff factor for quest processing retry operations */
  BACKOFF_FACTOR: 2,
  /** Jitter factor for quest processing retry operations */
  JITTER_FACTOR: 0.15,
  /** Retry policy type for quest processing */
  POLICY_TYPE: RetryPolicyType.EXPONENTIAL,
  /** DLQ topic suffix for quest processing */
  DLQ_TOPIC_SUFFIX: '.quest.dlq',
  /** Delay in milliseconds before processing DLQ messages for quest processing */
  DLQ_PROCESSING_DELAY_MS: 300000, // 5 minutes
};

/**
 * Retry policy configurations for leaderboard operations
 */
export const LEADERBOARD_RETRY = {
  /** Maximum number of retry attempts for leaderboard operations */
  MAX_RETRIES: 3,
  /** Initial retry delay in milliseconds for leaderboard operations */
  INITIAL_RETRY_DELAY_MS: 50,
  /** Maximum retry delay in milliseconds for leaderboard operations */
  MAX_RETRY_DELAY_MS: 3000,
  /** Backoff factor for leaderboard retry operations */
  BACKOFF_FACTOR: 1.5,
  /** Jitter factor for leaderboard retry operations */
  JITTER_FACTOR: 0.1,
  /** Retry policy type for leaderboard operations */
  POLICY_TYPE: RetryPolicyType.EXPONENTIAL,
  /** Circuit breaker failure threshold for leaderboard operations */
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,
  /** Circuit breaker reset timeout in milliseconds for leaderboard operations */
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 20000,
};

/**
 * Retry policy configurations for rule evaluation
 */
export const RULE_EVALUATION_RETRY = {
  /** Maximum number of retry attempts for rule evaluation */
  MAX_RETRIES: 3,
  /** Initial retry delay in milliseconds for rule evaluation */
  INITIAL_RETRY_DELAY_MS: 50,
  /** Maximum retry delay in milliseconds for rule evaluation */
  MAX_RETRY_DELAY_MS: 2000,
  /** Backoff factor for rule evaluation retry operations */
  BACKOFF_FACTOR: 1.5,
  /** Jitter factor for rule evaluation retry operations */
  JITTER_FACTOR: 0.1,
  /** Retry policy type for rule evaluation */
  POLICY_TYPE: RetryPolicyType.EXPONENTIAL,
  /** Circuit breaker failure threshold for rule evaluation */
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,
  /** Circuit breaker reset timeout in milliseconds for rule evaluation */
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 15000,
};