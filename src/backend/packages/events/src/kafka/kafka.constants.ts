/**
 * Kafka constants for the AUSTA SuperApp event system.
 * 
 * This file defines standardized constants used in Kafka integration across all services,
 * including topic names, consumer group IDs, error codes, retry settings, and configuration values.
 * 
 * These constants ensure consistency across all services using Kafka and prevent integration
 * issues that could arise from inconsistent naming or configuration.
 */

/**
 * Base prefixes for Kafka topics by domain
 */
export const TOPIC_PREFIXES = {
  /** Base prefix for all AUSTA Kafka topics */
  BASE: 'austa',
  /** Prefix for all health journey topics */
  HEALTH: 'austa.health',
  /** Prefix for all care journey topics */
  CARE: 'austa.care',
  /** Prefix for all plan journey topics */
  PLAN: 'austa.plan',
  /** Prefix for all gamification topics */
  GAMIFICATION: 'austa.gamification',
  /** Prefix for all notification topics */
  NOTIFICATION: 'austa.notification',
  /** Prefix for all user-related topics */
  USER: 'austa.user',
  /** Prefix for all dead-letter queue topics */
  DLQ: 'austa.dlq',
};

/**
 * Journey-specific event topics
 */
export const JOURNEY_EVENT_TOPICS = {
  /** Health journey event topic */
  HEALTH: `${TOPIC_PREFIXES.HEALTH}.events`,
  /** Care journey event topic */
  CARE: `${TOPIC_PREFIXES.CARE}.events`,
  /** Plan journey event topic */
  PLAN: `${TOPIC_PREFIXES.PLAN}.events`,
  /** User-related event topic */
  USER: `${TOPIC_PREFIXES.USER}.events`,
};

/**
 * Health journey specific event topics
 */
export const HEALTH_EVENT_TOPICS = {
  /** Health metric recording events (weight, heart rate, steps, etc.) */
  METRICS: `${TOPIC_PREFIXES.HEALTH}.metrics`,
  /** Health goal events (creation, progress, achievement) */
  GOALS: `${TOPIC_PREFIXES.HEALTH}.goals`,
  /** Health insight generation events */
  INSIGHTS: `${TOPIC_PREFIXES.HEALTH}.insights`,
  /** Device synchronization events */
  DEVICES: `${TOPIC_PREFIXES.HEALTH}.devices`,
};

/**
 * Care journey specific event topics
 */
export const CARE_EVENT_TOPICS = {
  /** Appointment booking events */
  APPOINTMENTS: `${TOPIC_PREFIXES.CARE}.appointments`,
  /** Medication adherence events */
  MEDICATIONS: `${TOPIC_PREFIXES.CARE}.medications`,
  /** Telemedicine session events */
  TELEMEDICINE: `${TOPIC_PREFIXES.CARE}.telemedicine`,
  /** Care plan progress events */
  CARE_PLANS: `${TOPIC_PREFIXES.CARE}.care_plans`,
};

/**
 * Plan journey specific event topics
 */
export const PLAN_EVENT_TOPICS = {
  /** Claim submission events */
  CLAIMS: `${TOPIC_PREFIXES.PLAN}.claims`,
  /** Benefit utilization events */
  BENEFITS: `${TOPIC_PREFIXES.PLAN}.benefits`,
  /** Plan selection and comparison events */
  PLANS: `${TOPIC_PREFIXES.PLAN}.plans`,
  /** Reward redemption events */
  REWARDS: `${TOPIC_PREFIXES.PLAN}.rewards`,
};

/**
 * Gamification engine event topics
 */
export const GAMIFICATION_TOPICS = {
  /** Achievement-related events */
  ACHIEVEMENT: `${TOPIC_PREFIXES.GAMIFICATION}.achievement.events`,
  /** Reward-related events */
  REWARD: `${TOPIC_PREFIXES.GAMIFICATION}.reward.events`,
  /** Quest-related events */
  QUEST: `${TOPIC_PREFIXES.GAMIFICATION}.quest.events`,
  /** User profile events */
  PROFILE: `${TOPIC_PREFIXES.GAMIFICATION}.profile.events`,
  /** Leaderboard events */
  LEADERBOARD: `${TOPIC_PREFIXES.GAMIFICATION}.leaderboard.events`,
  /** Rule evaluation events */
  RULE: `${TOPIC_PREFIXES.GAMIFICATION}.rule.events`,
};

/**
 * Achievement-specific event topics
 */
export const ACHIEVEMENT_TOPICS = {
  /** Achievement unlocked events */
  UNLOCKED: `${GAMIFICATION_TOPICS.ACHIEVEMENT}.unlocked`,
  /** Achievement progress events */
  PROGRESS: `${GAMIFICATION_TOPICS.ACHIEVEMENT}.progress`,
};

/**
 * Quest-specific event topics
 */
export const QUEST_TOPICS = {
  /** Quest started events */
  STARTED: `${GAMIFICATION_TOPICS.QUEST}.started`,
  /** Quest completed events */
  COMPLETED: `${GAMIFICATION_TOPICS.QUEST}.completed`,
  /** Quest progress events */
  PROGRESS: `${GAMIFICATION_TOPICS.QUEST}.progress`,
};

/**
 * Reward-specific event topics
 */
export const REWARD_TOPICS = {
  /** Reward granted events */
  GRANTED: `${GAMIFICATION_TOPICS.REWARD}.granted`,
  /** Reward redeemed events */
  REDEEMED: `${GAMIFICATION_TOPICS.REWARD}.redeemed`,
};

/**
 * Profile-specific event topics
 */
export const PROFILE_TOPICS = {
  /** Profile created events */
  CREATED: `${GAMIFICATION_TOPICS.PROFILE}.created`,
  /** Profile updated events */
  UPDATED: `${GAMIFICATION_TOPICS.PROFILE}.updated`,
  /** Profile level up events */
  LEVEL_UP: `${GAMIFICATION_TOPICS.PROFILE}.level_up`,
};

/**
 * Notification service event topics
 */
export const NOTIFICATION_TOPICS = {
  /** Notification request events */
  REQUEST: `${TOPIC_PREFIXES.NOTIFICATION}.request`,
  /** Notification delivery status events */
  STATUS: `${TOPIC_PREFIXES.NOTIFICATION}.status`,
  /** Notification preference update events */
  PREFERENCES: `${TOPIC_PREFIXES.NOTIFICATION}.preferences`,
};

/**
 * Dead-letter queue topics for failed event processing
 */
export const DLQ_TOPICS = {
  /** Health journey DLQ */
  HEALTH_EVENTS: `${TOPIC_PREFIXES.DLQ}.${JOURNEY_EVENT_TOPICS.HEALTH}`,
  /** Care journey DLQ */
  CARE_EVENTS: `${TOPIC_PREFIXES.DLQ}.${JOURNEY_EVENT_TOPICS.CARE}`,
  /** Plan journey DLQ */
  PLAN_EVENTS: `${TOPIC_PREFIXES.DLQ}.${JOURNEY_EVENT_TOPICS.PLAN}`,
  /** User events DLQ */
  USER_EVENTS: `${TOPIC_PREFIXES.DLQ}.${JOURNEY_EVENT_TOPICS.USER}`,
  /** Achievement events DLQ */
  ACHIEVEMENT: `${TOPIC_PREFIXES.DLQ}.achievement.events`,
  /** Reward events DLQ */
  REWARD: `${TOPIC_PREFIXES.DLQ}.reward.events`,
  /** Quest events DLQ */
  QUEST: `${TOPIC_PREFIXES.DLQ}.quest.events`,
  /** Profile events DLQ */
  PROFILE: `${TOPIC_PREFIXES.DLQ}.profile.events`,
  /** Notification events DLQ */
  NOTIFICATION: `${TOPIC_PREFIXES.DLQ}.notification.events`,
};

/**
 * Consumer group IDs for different services and processors
 */
export const CONSUMER_GROUPS = {
  /** Health service consumer group */
  HEALTH_SERVICE: 'health-service-group',
  /** Care service consumer group */
  CARE_SERVICE: 'care-service-group',
  /** Plan service consumer group */
  PLAN_SERVICE: 'plan-service-group',
  /** Gamification engine consumer group */
  GAMIFICATION_ENGINE: 'gamification-engine-group',
  /** Achievement processor consumer group */
  ACHIEVEMENT_PROCESSOR: 'achievement-processor-group',
  /** Reward processor consumer group */
  REWARD_PROCESSOR: 'reward-processor-group',
  /** Quest processor consumer group */
  QUEST_PROCESSOR: 'quest-processor-group',
  /** Profile processor consumer group */
  PROFILE_PROCESSOR: 'profile-processor-group',
  /** Leaderboard processor consumer group */
  LEADERBOARD_PROCESSOR: 'leaderboard-processor-group',
  /** Notification service consumer group */
  NOTIFICATION_SERVICE: 'notification-service-group',
  /** Notification processor consumer group */
  NOTIFICATION_PROCESSOR: 'notification-processor-group',
  /** Dead-letter queue processor consumer group */
  DLQ_PROCESSOR: 'dlq-processor-group',
};

/**
 * Kafka topic configuration constants
 */
export const KAFKA_CONFIG = {
  /** Default number of partitions for topics */
  DEFAULT_PARTITIONS: 3,
  /** Number of partitions for high-throughput topics */
  HIGH_THROUGHPUT_PARTITIONS: 6,
  /** Default replication factor for topics */
  DEFAULT_REPLICATION_FACTOR: 3,
  /** Default message retention period (7 days) */
  DEFAULT_RETENTION_MS: 7 * 24 * 60 * 60 * 1000,
  /** Message retention period for high-priority topics (14 days) */
  HIGH_PRIORITY_RETENTION_MS: 14 * 24 * 60 * 60 * 1000,
  /** Message retention period for dead-letter queue topics (30 days) */
  DLQ_RETENTION_MS: 30 * 24 * 60 * 60 * 1000,
  /** Default session timeout for consumers (30 seconds) */
  DEFAULT_SESSION_TIMEOUT_MS: 30000,
  /** Default request timeout for Kafka operations (30 seconds) */
  DEFAULT_REQUEST_TIMEOUT_MS: 30000,
  /** Default connection timeout for Kafka clients (10 seconds) */
  DEFAULT_CONNECTION_TIMEOUT_MS: 10000,
};

/**
 * Retry configuration constants for Kafka operations
 */
export const RETRY_CONFIG = {
  /** Maximum number of retries for failed operations */
  MAX_RETRIES: 3,
  /** Initial retry delay in milliseconds (1 second) */
  INITIAL_RETRY_DELAY_MS: 1000,
  /** Maximum retry delay in milliseconds (30 seconds) */
  MAX_RETRY_DELAY_MS: 30000,
  /** Exponential backoff factor for retry delays */
  RETRY_FACTOR: 2,
  /** Jitter factor to add randomness to retry delays (0.1 = 10%) */
  JITTER_FACTOR: 0.1,
};

/**
 * Circuit breaker configuration constants for Kafka clients
 */
export const CIRCUIT_BREAKER_CONFIG = {
  /** Failure threshold to trip the circuit breaker */
  FAILURE_THRESHOLD: 5,
  /** Success threshold to reset the circuit breaker */
  SUCCESS_THRESHOLD: 3,
  /** Timeout in milliseconds before attempting to reset the circuit breaker (30 seconds) */
  RESET_TIMEOUT_MS: 30000,
};

/**
 * Error codes for Kafka operations
 */
export const KAFKA_ERROR_CODES = {
  /** Connection error */
  CONNECTION_ERROR: 'KAFKA_CONNECTION_ERROR',
  /** Authentication error */
  AUTHENTICATION_ERROR: 'KAFKA_AUTHENTICATION_ERROR',
  /** Authorization error */
  AUTHORIZATION_ERROR: 'KAFKA_AUTHORIZATION_ERROR',
  /** Topic does not exist */
  TOPIC_NOT_FOUND: 'KAFKA_TOPIC_NOT_FOUND',
  /** Broker not available */
  BROKER_NOT_AVAILABLE: 'KAFKA_BROKER_NOT_AVAILABLE',
  /** Leader not available */
  LEADER_NOT_AVAILABLE: 'KAFKA_LEADER_NOT_AVAILABLE',
  /** Message too large */
  MESSAGE_TOO_LARGE: 'KAFKA_MESSAGE_TOO_LARGE',
  /** Invalid message */
  INVALID_MESSAGE: 'KAFKA_INVALID_MESSAGE',
  /** Offset out of range */
  OFFSET_OUT_OF_RANGE: 'KAFKA_OFFSET_OUT_OF_RANGE',
  /** Group rebalancing */
  GROUP_REBALANCING: 'KAFKA_GROUP_REBALANCING',
  /** Serialization error */
  SERIALIZATION_ERROR: 'KAFKA_SERIALIZATION_ERROR',
  /** Deserialization error */
  DESERIALIZATION_ERROR: 'KAFKA_DESERIALIZATION_ERROR',
  /** Producer error */
  PRODUCER_ERROR: 'KAFKA_PRODUCER_ERROR',
  /** Consumer error */
  CONSUMER_ERROR: 'KAFKA_CONSUMER_ERROR',
  /** Admin error */
  ADMIN_ERROR: 'KAFKA_ADMIN_ERROR',
  /** Timeout error */
  TIMEOUT_ERROR: 'KAFKA_TIMEOUT_ERROR',
  /** Unknown error */
  UNKNOWN_ERROR: 'KAFKA_UNKNOWN_ERROR',
};

/**
 * Kafka message header keys
 */
export const KAFKA_HEADERS = {
  /** Correlation ID for distributed tracing */
  CORRELATION_ID: 'X-Correlation-ID',
  /** Source service that produced the message */
  SOURCE_SERVICE: 'X-Source-Service',
  /** Event type */
  EVENT_TYPE: 'X-Event-Type',
  /** Event version */
  EVENT_VERSION: 'X-Event-Version',
  /** User ID associated with the event */
  USER_ID: 'X-User-ID',
  /** Journey associated with the event */
  JOURNEY: 'X-Journey',
  /** Timestamp when the event was produced */
  TIMESTAMP: 'X-Timestamp',
  /** Number of retry attempts for this message */
  RETRY_COUNT: 'X-Retry-Count',
  /** Original topic if message was moved to DLQ */
  ORIGINAL_TOPIC: 'X-Original-Topic',
  /** Error message if message was moved to DLQ */
  ERROR_MESSAGE: 'X-Error-Message',
  /** Error code if message was moved to DLQ */
  ERROR_CODE: 'X-Error-Code',
};