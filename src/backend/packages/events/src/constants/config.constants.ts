/**
 * Default configuration constants for Kafka consumers and producers.
 * These values provide sensible defaults for production use and can be
 * overridden by environment-specific settings.
 */

/**
 * Prefix for all consumer group IDs to ensure consistent naming
 * across all services in the AUSTA SuperApp.
 */
export const CONSUMER_GROUP_PREFIX = 'austa-';

/**
 * Consumer group IDs for each service to prevent cross-consumption
 * of messages between different services.
 */
export const CONSUMER_GROUPS = {
  HEALTH_SERVICE: `${CONSUMER_GROUP_PREFIX}health-service`,
  CARE_SERVICE: `${CONSUMER_GROUP_PREFIX}care-service`,
  PLAN_SERVICE: `${CONSUMER_GROUP_PREFIX}plan-service`,
  GAMIFICATION_ENGINE: `${CONSUMER_GROUP_PREFIX}gamification-engine`,
  NOTIFICATION_SERVICE: `${CONSUMER_GROUP_PREFIX}notification-service`,
};

/**
 * Default batch size for Kafka consumers.
 * This value determines how many messages are processed in a single batch.
 */
export const DEFAULT_BATCH_SIZE = 500;

/**
 * Minimum batch size for Kafka consumers.
 * This value sets a lower bound for the batch size to ensure efficient processing.
 */
export const DEFAULT_MIN_BATCH_SIZE = 10;

/**
 * Maximum batch size for Kafka consumers.
 * This value sets an upper bound for the batch size to prevent overwhelming the system.
 */
export const DEFAULT_MAX_BATCH_SIZE = 5000;

/**
 * Default concurrency limit for processing Kafka messages.
 * This value determines how many messages can be processed concurrently.
 */
export const DEFAULT_CONCURRENCY_LIMIT = 5;

/**
 * Default number of retry attempts for failed Kafka operations.
 * This value determines how many times a failed operation will be retried.
 */
export const DEFAULT_RETRY_ATTEMPTS = 5;

/**
 * Default initial delay between retry attempts in milliseconds.
 * This value is used as the base for exponential backoff.
 */
export const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Maximum delay between retry attempts in milliseconds.
 * This value caps the exponential backoff to prevent excessive waiting.
 */
export const DEFAULT_MAX_RETRY_DELAY = 30000; // 30 seconds

/**
 * Jitter factor for retry delay to prevent retry storms.
 * This value is used to add randomness to the retry delay.
 */
export const DEFAULT_RETRY_JITTER = 0.2; // 20% jitter

/**
 * Default timeout for Kafka operations in milliseconds.
 * This value determines how long to wait for a response before considering the operation failed.
 */
export const DEFAULT_TIMEOUT = 5000; // 5 seconds

/**
 * Default threshold for circuit breaker.
 * This value determines how many consecutive failures trigger the circuit breaker.
 */
export const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 5;

/**
 * Default reset timeout for circuit breaker in milliseconds.
 * This value determines how long to wait before attempting to close the circuit.
 */
export const DEFAULT_CIRCUIT_BREAKER_RESET_TIMEOUT = 30000; // 30 seconds

/**
 * Default TTL (Time-To-Live) for high priority events in milliseconds.
 * High priority events have shorter TTL to ensure timely processing.
 */
export const DEFAULT_TTL_HIGH_PRIORITY = 180000; // 3 minutes

/**
 * Default TTL (Time-To-Live) for medium priority events in milliseconds.
 * Medium priority events have moderate TTL.
 */
export const DEFAULT_TTL_MEDIUM_PRIORITY = 1800000; // 30 minutes

/**
 * Default TTL (Time-To-Live) for low priority events in milliseconds.
 * Low priority events have longer TTL.
 */
export const DEFAULT_TTL_LOW_PRIORITY = 43200000; // 12 hours