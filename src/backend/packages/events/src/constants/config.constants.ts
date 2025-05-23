/**
 * Default configuration constants for the event processing system.
 * These values are used when specific environment variables are not provided.
 * 
 * @packageDocumentation
 */

/**
 * Default consumer group IDs for each service to prevent cross-consumption
 * Each service should use its own consumer group to ensure events are properly distributed
 */
export const DEFAULT_CONSUMER_GROUPS = {
  /** Default consumer group ID for the API Gateway */
  API_GATEWAY: 'api-gateway-consumer-group',
  /** Default consumer group ID for the Auth Service */
  AUTH_SERVICE: 'auth-service-consumer-group',
  /** Default consumer group ID for the Health Journey Service */
  HEALTH_SERVICE: 'health-service-consumer-group',
  /** Default consumer group ID for the Care Journey Service */
  CARE_SERVICE: 'care-service-consumer-group',
  /** Default consumer group ID for the Plan Journey Service */
  PLAN_SERVICE: 'plan-service-consumer-group',
  /** Default consumer group ID for the Gamification Engine */
  GAMIFICATION_ENGINE: 'gamification-engine-consumer-group',
  /** Default consumer group ID for the Notification Service */
  NOTIFICATION_SERVICE: 'notification-service-consumer-group',
} as const;

/**
 * Default Kafka topic names for event communication between services
 */
export const DEFAULT_TOPICS = {
  /** Topic for health journey events */
  HEALTH_EVENTS: 'health.events',
  /** Topic for care journey events */
  CARE_EVENTS: 'care.events',
  /** Topic for plan journey events */
  PLAN_EVENTS: 'plan.events',
  /** Topic for user events */
  USER_EVENTS: 'user.events',
  /** Topic for gamification events */
  GAME_EVENTS: 'game.events',
  /** Topic for notification events */
  NOTIFICATION_EVENTS: 'notification.events',
  /** Topic for dead letter queue events */
  DLQ_EVENTS: 'dlq.events',
} as const;

/**
 * Default batch sizes for event processing to optimize performance
 * These values balance throughput and memory usage
 */
export const DEFAULT_BATCH_SIZES = {
  /** Default number of events to process in a single batch */
  EVENT_PROCESSING: 100,
  /** Default number of events to commit in a single transaction */
  COMMIT: 50,
  /** Default number of events to fetch in a single poll */
  POLL: 500,
  /** Default number of events to process for high-priority events */
  HIGH_PRIORITY: 25,
  /** Default number of events to process for low-priority events */
  LOW_PRIORITY: 200,
} as const;

/**
 * Default concurrency limits for event processing
 * These values prevent overloading the system while maintaining throughput
 */
export const DEFAULT_CONCURRENCY = {
  /** Default number of concurrent event processing workers */
  EVENT_PROCESSOR_WORKERS: 10,
  /** Default number of concurrent event consumers */
  EVENT_CONSUMERS: 3,
  /** Default number of concurrent event producers */
  EVENT_PRODUCERS: 5,
  /** Default number of concurrent event handlers per consumer */
  EVENT_HANDLERS: 5,
  /** Default number of concurrent database operations */
  DATABASE_OPERATIONS: 20,
} as const;

/**
 * Default timeout values in milliseconds for various operations
 * These values prevent operations from hanging indefinitely
 */
export const DEFAULT_TIMEOUTS_MS = {
  /** Default timeout for event processing in milliseconds */
  EVENT_PROCESSING: 5000,
  /** Default timeout for Kafka connection in milliseconds */
  KAFKA_CONNECTION: 10000,
  /** Default timeout for Kafka message production in milliseconds */
  KAFKA_PRODUCER: 2000,
  /** Default timeout for Kafka message consumption in milliseconds */
  KAFKA_CONSUMER: 5000,
  /** Default timeout for database operations in milliseconds */
  DATABASE: 3000,
  /** Default session timeout for Kafka consumer in milliseconds */
  SESSION: 30000,
  /** Default heartbeat interval for Kafka consumer in milliseconds */
  HEARTBEAT: 3000,
} as const;

/**
 * Default retry settings with exponential backoff
 * These values ensure reliable event processing with appropriate backoff
 */
export const DEFAULT_RETRY = {
  /** Default maximum number of retries for failed operations */
  MAX_RETRIES: 5,
  /** Default initial retry delay in milliseconds */
  INITIAL_RETRY_DELAY_MS: 100,
  /** Default maximum retry delay in milliseconds */
  MAX_RETRY_DELAY_MS: 30000,
  /** Default backoff factor for exponential retry (multiplier) */
  BACKOFF_FACTOR: 2,
  /** Default jitter factor to add randomness to retry delays (0-1) */
  JITTER_FACTOR: 0.1,
  /** Default delay for dead letter queue retry in milliseconds */
  DLQ_RETRY_DELAY_MS: 60000,
} as const;

/**
 * Default circuit breaker thresholds for error handling
 * These values prevent cascading failures by failing fast when services are unhealthy
 */
export const DEFAULT_CIRCUIT_BREAKER = {
  /** Default failure threshold before opening circuit (percentage) */
  FAILURE_THRESHOLD: 50,
  /** Default number of requests to sample for threshold calculation */
  REQUEST_VOLUME_THRESHOLD: 20,
  /** Default time window for failure threshold calculation in milliseconds */
  WINDOW_MS: 60000,
  /** Default time to keep circuit open before trying half-open state in milliseconds */
  SLEEP_WINDOW_MS: 30000,
  /** Default number of successful requests in half-open state to close circuit */
  HALF_OPEN_SUCCESSFUL_REQUESTS: 5,
} as const;

/**
 * Default Time-To-Live (TTL) values in seconds for different event types
 * These values determine how long events are retained based on importance
 */
export const DEFAULT_TTL_SECONDS = {
  /** Default TTL for critical events (e.g., health alerts) in seconds */
  CRITICAL_EVENTS: 604800, // 7 days
  /** Default TTL for standard events in seconds */
  STANDARD_EVENTS: 259200, // 3 days
  /** Default TTL for high-volume events in seconds */
  HIGH_VOLUME_EVENTS: 86400, // 1 day
  /** Default TTL for processed events in seconds */
  PROCESSED_EVENTS: 43200, // 12 hours
  /** Default TTL for cached event schemas in seconds */
  SCHEMA_CACHE: 3600, // 1 hour
  /** Default TTL for event processing locks in seconds */
  PROCESSING_LOCKS: 300, // 5 minutes
} as const;

/**
 * Default event processing rate limits
 * These values prevent system overload from excessive event generation
 */
export const DEFAULT_RATE_LIMITS = {
  /** Default maximum events per user per minute */
  EVENTS_PER_USER_PER_MINUTE: 100,
  /** Default maximum events per service per second */
  EVENTS_PER_SERVICE_PER_SECOND: 1000,
  /** Default maximum event size in bytes */
  MAX_EVENT_SIZE_BYTES: 1048576, // 1 MB
  /** Default maximum batch size in bytes */
  MAX_BATCH_SIZE_BYTES: 5242880, // 5 MB
} as const;

/**
 * Default event audit and logging configuration
 * These values control the verbosity and retention of event logs
 */
export const DEFAULT_AUDIT = {
  /** Default audit logging enabled flag */
  ENABLED: true,
  /** Default log level for event processing */
  LOG_LEVEL: 'info',
  /** Default sampling rate for detailed event logging (percentage) */
  SAMPLING_RATE: 10,
  /** Default retention period for audit logs in days */
  RETENTION_DAYS: 90,
  /** Default detailed logging for critical events enabled flag */
  DETAILED_CRITICAL_EVENTS: true,
} as const;

/**
 * Default event validation settings
 * These values control schema validation behavior for events
 */
export const DEFAULT_VALIDATION = {
  /** Default strict validation mode enabled flag */
  STRICT_MODE: true,
  /** Default unknown field handling (reject, strip, allow) */
  UNKNOWN_FIELDS: 'strip',
  /** Default validation timeout in milliseconds */
  TIMEOUT_MS: 500,
  /** Default schema caching enabled flag */
  SCHEMA_CACHE_ENABLED: true,
  /** Default maximum validation errors to return */
  MAX_ERRORS: 10,
} as const;