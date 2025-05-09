/**
 * Default configuration constants for the event processing system.
 * These values are used as fallbacks when specific environment variables are not provided.
 * They ensure consistent behavior across services and provide sensible defaults for
 * optimal performance and reliability.
 */

/**
 * Default consumer group IDs for each service.
 * These prevent cross-consumption of events between services and ensure
 * each service processes only the events intended for it.
 */
export const DEFAULT_CONSUMER_GROUPS = {
  API_GATEWAY: 'api-gateway-consumer-group',
  AUTH_SERVICE: 'auth-service-consumer-group',
  HEALTH_SERVICE: 'health-service-consumer-group',
  CARE_SERVICE: 'care-service-consumer-group',
  PLAN_SERVICE: 'plan-service-consumer-group',
  GAMIFICATION_ENGINE: 'gamification-engine-consumer-group',
  NOTIFICATION_SERVICE: 'notification-service-consumer-group',
};

/**
 * Default Kafka topic names for different event types.
 * These ensure consistent topic naming across services.
 */
export const DEFAULT_TOPICS = {
  HEALTH_EVENTS: 'health.events',
  CARE_EVENTS: 'care.events',
  PLAN_EVENTS: 'plan.events',
  USER_EVENTS: 'user.events',
  GAME_EVENTS: 'game.events',
  NOTIFICATION_EVENTS: 'notification.events',
};

/**
 * Default batch processing configuration.
 * These values control how many events are processed at once and
 * the level of concurrency for optimal performance.
 */
export const BATCH_PROCESSING = {
  // Number of events to process in a single batch
  DEFAULT_BATCH_SIZE: 100,
  // Minimum batch size allowed
  MIN_BATCH_SIZE: 10,
  // Maximum batch size allowed
  MAX_BATCH_SIZE: 1000,
  // Default number of concurrent event processing workers
  DEFAULT_CONCURRENCY: 10,
  // Minimum concurrency allowed
  MIN_CONCURRENCY: 1,
  // Maximum concurrency allowed
  MAX_CONCURRENCY: 50,
  // Default interval between batch processing in milliseconds
  DEFAULT_PROCESSING_INTERVAL_MS: 1000,
};

/**
 * Retry configuration with exponential backoff.
 * These settings control how failed events are retried, with increasing
 * delays between attempts to prevent overwhelming the system.
 */
export const RETRY_CONFIG = {
  // Maximum number of retry attempts for failed events
  MAX_RETRY_ATTEMPTS: 5,
  // Initial retry delay in milliseconds
  INITIAL_RETRY_DELAY_MS: 1000,
  // Maximum retry delay in milliseconds
  MAX_RETRY_DELAY_MS: 60000, // 1 minute
  // Backoff factor for exponential retry delay calculation
  BACKOFF_FACTOR: 2,
  // Jitter factor to add randomness to retry delays (0-1)
  JITTER_FACTOR: 0.1,
};

/**
 * Timeout and circuit breaker thresholds.
 * These values control timeouts for various operations and
 * circuit breaker thresholds to prevent cascading failures.
 */
export const TIMEOUT_CONFIG = {
  // Default timeout for event processing in milliseconds
  DEFAULT_PROCESSING_TIMEOUT_MS: 5000,
  // Default timeout for event publishing in milliseconds
  DEFAULT_PUBLISHING_TIMEOUT_MS: 3000,
  // Default timeout for consumer connection in milliseconds
  DEFAULT_CONSUMER_CONNECTION_TIMEOUT_MS: 10000,
  // Default timeout for producer connection in milliseconds
  DEFAULT_PRODUCER_CONNECTION_TIMEOUT_MS: 10000,
  // Circuit breaker failure threshold (number of failures before opening)
  CIRCUIT_BREAKER_THRESHOLD: 5,
  // Circuit breaker reset timeout in milliseconds
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 30000, // 30 seconds
  // Circuit breaker half-open state request limit
  CIRCUIT_BREAKER_HALF_OPEN_REQUESTS: 3,
};

/**
 * Time-to-live (TTL) values for different event types.
 * These control how long events are retained in various systems
 * based on their importance and relevance over time.
 */
export const TTL_CONFIG = {
  // Default TTL for events in the processing queue in milliseconds
  DEFAULT_EVENT_QUEUE_TTL_MS: 86400000, // 24 hours
  // TTL for high-priority events in milliseconds
  HIGH_PRIORITY_EVENT_TTL_MS: 259200000, // 3 days
  // TTL for achievement events in milliseconds
  ACHIEVEMENT_EVENT_TTL_MS: 604800000, // 7 days
  // TTL for health metric events in milliseconds
  HEALTH_METRIC_EVENT_TTL_MS: 2592000000, // 30 days
  // TTL for user profile events in milliseconds
  USER_PROFILE_EVENT_TTL_MS: 7776000000, // 90 days
  // TTL for dead letter queue events in milliseconds
  DLQ_EVENT_TTL_MS: 1209600000, // 14 days
};

/**
 * Dead Letter Queue (DLQ) configuration.
 * These settings control how failed events are handled and stored
 * for later analysis and potential reprocessing.
 */
export const DLQ_CONFIG = {
  // Default DLQ topic suffix
  DLQ_TOPIC_SUFFIX: '.dlq',
  // Maximum size of the DLQ before oldest events are purged
  MAX_DLQ_SIZE: 10000,
  // Default DLQ processing interval in milliseconds
  DLQ_PROCESSING_INTERVAL_MS: 3600000, // 1 hour
  // Maximum number of DLQ reprocessing attempts
  MAX_DLQ_REPROCESSING_ATTEMPTS: 3,
};

/**
 * Event audit and logging configuration.
 * These settings control how events are logged and audited
 * for compliance, debugging, and monitoring purposes.
 */
export const AUDIT_CONFIG = {
  // Enable detailed event auditing
  ENABLE_DETAILED_AUDIT: true,
  // Log level for event processing (debug, info, warn, error)
  DEFAULT_LOG_LEVEL: 'info',
  // Include event payload in logs (may contain sensitive data)
  LOG_EVENT_PAYLOAD: false,
  // Maximum event payload size to log in bytes
  MAX_LOGGED_PAYLOAD_SIZE: 1024, // 1KB
  // Enable event tracing with correlation IDs
  ENABLE_EVENT_TRACING: true,
  // Retention period for audit logs in days
  AUDIT_LOG_RETENTION_DAYS: 90,
};

/**
 * Performance monitoring configuration.
 * These settings control how event processing performance is monitored
 * and what thresholds trigger alerts or scaling actions.
 */
export const PERFORMANCE_CONFIG = {
  // Enable performance monitoring
  ENABLE_PERFORMANCE_MONITORING: true,
  // Interval for collecting performance metrics in milliseconds
  METRICS_COLLECTION_INTERVAL_MS: 60000, // 1 minute
  // Threshold for event processing lag warning in milliseconds
  LAG_WARNING_THRESHOLD_MS: 30000, // 30 seconds
  // Threshold for event processing lag critical alert in milliseconds
  LAG_CRITICAL_THRESHOLD_MS: 300000, // 5 minutes
  // Maximum acceptable event processing time in milliseconds
  MAX_PROCESSING_TIME_MS: 1000, // 1 second
  // Enable auto-scaling based on performance metrics
  ENABLE_AUTO_SCALING: false,
};

/**
 * Event schema validation configuration.
 * These settings control how event schemas are validated
 * to ensure data integrity and compatibility.
 */
export const SCHEMA_VALIDATION_CONFIG = {
  // Enable schema validation for incoming events
  ENABLE_SCHEMA_VALIDATION: true,
  // Action to take on schema validation failure (log, reject, dlq)
  VALIDATION_FAILURE_ACTION: 'dlq',
  // Enable strict mode for schema validation
  STRICT_VALIDATION: false,
  // Enable schema version compatibility checking
  CHECK_SCHEMA_COMPATIBILITY: true,
  // Maximum schema validation cache size
  MAX_SCHEMA_CACHE_SIZE: 100,
  // Schema cache TTL in milliseconds
  SCHEMA_CACHE_TTL_MS: 3600000, // 1 hour
};

/**
 * Journey-specific event configuration.
 * These settings control journey-specific event processing behavior.
 */
export const JOURNEY_CONFIG = {
  // Health journey event processing priority (1-10, higher is more important)
  HEALTH_JOURNEY_PRIORITY: 5,
  // Care journey event processing priority
  CARE_JOURNEY_PRIORITY: 7,
  // Plan journey event processing priority
  PLAN_JOURNEY_PRIORITY: 6,
  // Enable cross-journey event correlation
  ENABLE_CROSS_JOURNEY_CORRELATION: true,
  // Maximum events per user per journey per minute (anti-gaming)
  MAX_EVENTS_PER_USER_PER_JOURNEY_PER_MINUTE: 100,
};