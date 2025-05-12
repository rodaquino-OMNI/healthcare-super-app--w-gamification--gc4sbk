/**
 * Default configuration constants for the event processing system.
 * These values are used when specific environment variables are not provided.
 * They ensure consistent behavior across services for event processing.
 */

/**
 * Default consumer group IDs for each service to prevent cross-consumption
 * Each service should have its own consumer group to ensure events are processed correctly
 */
export const DEFAULT_CONSUMER_GROUPS = {
  /** API Gateway consumer group */
  API_GATEWAY: 'api-gateway-consumer-group',
  /** Auth Service consumer group */
  AUTH_SERVICE: 'auth-service-consumer-group',
  /** Health Journey consumer group */
  HEALTH_SERVICE: 'health-service-consumer-group',
  /** Care Journey consumer group */
  CARE_SERVICE: 'care-service-consumer-group',
  /** Plan Journey consumer group */
  PLAN_SERVICE: 'plan-service-consumer-group',
  /** Gamification Engine consumer group */
  GAMIFICATION_ENGINE: 'gamification-consumer-group',
  /** Notification Service consumer group */
  NOTIFICATION_SERVICE: 'notification-service-consumer-group',
};

/**
 * Default batch sizes for event processing
 * These values are optimized for performance and memory usage
 */
export const DEFAULT_BATCH_SIZES = {
  /** Standard batch size for most event types */
  STANDARD: 100,
  /** Larger batch size for high-volume events */
  HIGH_VOLUME: 250,
  /** Smaller batch size for complex events that require more processing */
  COMPLEX: 50,
  /** Minimal batch size for critical events that need immediate processing */
  CRITICAL: 10,
};

/**
 * Default concurrency limits for event processing
 * These values control how many events can be processed simultaneously
 */
export const DEFAULT_CONCURRENCY_LIMITS = {
  /** Standard concurrency for most services */
  STANDARD: 10,
  /** Higher concurrency for services with simple event processing */
  HIGH: 20,
  /** Lower concurrency for services with complex event processing */
  LOW: 5,
  /** Minimal concurrency for services with resource-intensive processing */
  MINIMAL: 2,
};

/**
 * Default timeout values in milliseconds
 * These values control how long operations can take before timing out
 */
export const DEFAULT_TIMEOUTS_MS = {
  /** Standard timeout for most operations */
  STANDARD: 5000, // 5 seconds
  /** Extended timeout for complex operations */
  EXTENDED: 15000, // 15 seconds
  /** Short timeout for time-sensitive operations */
  SHORT: 2000, // 2 seconds
  /** Long timeout for operations that may take longer */
  LONG: 30000, // 30 seconds
  /** Connection timeout for establishing connections */
  CONNECTION: 10000, // 10 seconds
  /** Idle timeout for maintaining connections */
  IDLE: 60000, // 1 minute
};

/**
 * Default retry settings with exponential backoff
 * These values control how retries are handled for failed operations
 */
export const DEFAULT_RETRY_SETTINGS = {
  /** Maximum number of retry attempts */
  MAX_ATTEMPTS: 5,
  /** Initial retry delay in milliseconds */
  INITIAL_DELAY_MS: 1000, // 1 second
  /** Maximum retry delay in milliseconds */
  MAX_DELAY_MS: 60000, // 1 minute
  /** Backoff factor for exponential backoff */
  BACKOFF_FACTOR: 2,
  /** Jitter factor to add randomness to retry delays (0-1) */
  JITTER_FACTOR: 0.1,
};

/**
 * Default circuit breaker thresholds
 * These values control when circuit breakers open to prevent cascading failures
 */
export const DEFAULT_CIRCUIT_BREAKER = {
  /** Failure threshold percentage to trip the circuit */
  FAILURE_THRESHOLD_PERCENTAGE: 50,
  /** Number of requests to consider for the failure threshold */
  REQUEST_VOLUME_THRESHOLD: 20,
  /** Time window in milliseconds for tracking failures */
  TRACKING_PERIOD_MS: 30000, // 30 seconds
  /** Reset timeout in milliseconds before attempting to close the circuit */
  RESET_TIMEOUT_MS: 60000, // 1 minute
};

/**
 * Default TTL (Time To Live) values in seconds for different event types
 * These values control how long events are retained in various systems
 */
export const DEFAULT_TTL_SECONDS = {
  /** TTL for standard events */
  STANDARD_EVENT: 86400, // 1 day
  /** TTL for critical events that need longer retention */
  CRITICAL_EVENT: 604800, // 7 days
  /** TTL for transient events that can be discarded quickly */
  TRANSIENT_EVENT: 3600, // 1 hour
  /** TTL for cached event processing results */
  CACHED_RESULT: 300, // 5 minutes
  /** TTL for user-related events */
  USER_EVENT: 259200, // 3 days
  /** TTL for journey-specific events */
  JOURNEY_EVENT: 172800, // 2 days
  /** TTL for achievement events */
  ACHIEVEMENT_EVENT: 432000, // 5 days
};

/**
 * Default Kafka topic names for different event types
 * These values provide standard topic names for event publishing and consumption
 */
export const DEFAULT_KAFKA_TOPICS = {
  /** Health journey events topic */
  HEALTH_EVENTS: 'health.events',
  /** Care journey events topic */
  CARE_EVENTS: 'care.events',
  /** Plan journey events topic */
  PLAN_EVENTS: 'plan.events',
  /** User events topic */
  USER_EVENTS: 'user.events',
  /** Gamification events topic */
  GAME_EVENTS: 'game.events',
  /** Notification events topic */
  NOTIFICATION_EVENTS: 'notification.events',
  /** Dead letter queue topic for failed events */
  DEAD_LETTER_QUEUE: 'events.dlq',
};

/**
 * Default event processing rate limits
 * These values control how many events can be processed in a given time period
 */
export const DEFAULT_RATE_LIMITS = {
  /** Maximum events per user per minute */
  MAX_EVENTS_PER_USER_PER_MINUTE: 100,
  /** Maximum events per service per minute */
  MAX_EVENTS_PER_SERVICE_PER_MINUTE: 1000,
  /** Maximum event queue size before applying backpressure */
  MAX_EVENT_QUEUE_SIZE: 10000,
  /** Processing rate in milliseconds (how often to process events) */
  PROCESSING_RATE_MS: 1000, // 1 second
};

/**
 * Default event audit and logging settings
 * These values control how events are audited and logged
 */
export const DEFAULT_AUDIT_SETTINGS = {
  /** Whether to enable detailed event auditing */
  ENABLE_DETAILED_AUDITING: true,
  /** Whether to log event processing metrics */
  LOG_PROCESSING_METRICS: true,
  /** Sampling rate for event auditing (1 = 100%, 0.1 = 10%) */
  AUDIT_SAMPLING_RATE: 0.1,
  /** Maximum size of audit log entries in bytes */
  MAX_AUDIT_ENTRY_SIZE_BYTES: 10240, // 10 KB
};