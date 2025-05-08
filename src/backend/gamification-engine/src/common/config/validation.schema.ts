import * as Joi from 'joi';
import { JourneyType } from '@austa/interfaces/gamification';

/**
 * Comprehensive validation schema for all gamification engine environment variables.
 * This schema is consumed by the NestJS ConfigModule to validate configuration at application startup
 * and prevent runtime errors due to misconfiguration.
 * 
 * The schema includes validation for:
 * - Server configuration
 * - Kafka configuration with dead-letter queue support
 * - Event processing with standardized schema validation
 * - Points and gamification rules
 * - Redis configuration with Sorted Sets for leaderboards
 * - Database connection and pooling
 * - Feature toggles and service integration
 */
export const validationSchema = Joi.object({
  /**
   * Server Configuration
   * Core application settings for the gamification engine service
   */
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development')
    .description('Application environment (affects logging, error handling, etc.)'),
  PORT: Joi.number()
    .port()
    .default(3000)
    .description('Port on which the gamification engine service will listen'),
  API_PREFIX: Joi.string()
    .default('api')
    .description('Prefix for all API endpoints'),
  
  /**
   * Kafka Configuration
   * Settings for connecting to Kafka message broker and consuming events
   */
  KAFKA_CLIENT_ID: Joi.string()
    .default('gamification-engine')
    .description('Client identifier for Kafka connections'),
  KAFKA_BROKERS: Joi.string()
    .required()
    .description('Comma-separated list of Kafka brokers (host:port)'),
  KAFKA_GROUP_ID: Joi.string()
    .default('gamification-consumer-group')
    .description('Consumer group ID for Kafka consumers'),
  
  // Kafka topics for different event sources
  KAFKA_TOPIC_HEALTH_EVENTS: Joi.string()
    .default('health.events')
    .description('Topic for health journey events'),
  KAFKA_TOPIC_CARE_EVENTS: Joi.string()
    .default('care.events')
    .description('Topic for care journey events'),
  KAFKA_TOPIC_PLAN_EVENTS: Joi.string()
    .default('plan.events')
    .description('Topic for plan journey events'),
  KAFKA_TOPIC_USER_EVENTS: Joi.string()
    .default('user.events')
    .description('Topic for user-related events'),
  KAFKA_TOPIC_GAME_EVENTS: Joi.string()
    .default('game.events')
    .description('Topic for internal gamification events'),
  
  // Kafka retry configuration for transient errors
  KAFKA_MAX_RETRIES: Joi.number()
    .min(0)
    .default(3)
    .description('Maximum number of retry attempts for failed Kafka operations'),
  KAFKA_RETRY_INTERVAL: Joi.number()
    .min(100)
    .default(1000)
    .description('Base interval (ms) between retry attempts'),
  
  /**
   * Dead-Letter Queue Configuration
   * Settings for handling failed event processing with reliable retry mechanisms
   * and eventual dead-letter queuing for manual intervention
   */
  KAFKA_DLQ_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable/disable dead-letter queue for failed events'),
  KAFKA_DLQ_TOPIC_PREFIX: Joi.string()
    .default('dlq-')
    .description('Prefix for dead-letter queue topics'),
  KAFKA_DLQ_MAX_ATTEMPTS: Joi.number()
    .min(1)
    .default(3)
    .description('Maximum retry attempts before sending to dead-letter queue'),
  KAFKA_DLQ_BACKOFF_MULTIPLIER: Joi.number()
    .min(1)
    .default(2)
    .description('Multiplier for exponential backoff between retry attempts'),
  KAFKA_DLQ_INITIAL_RETRY_TIME: Joi.number()
    .min(100)
    .default(1000)
    .description('Initial retry delay in milliseconds'),
  KAFKA_DLQ_MAX_RETRY_TIME: Joi.number()
    .min(1000)
    .default(30000)
    .description('Maximum retry delay in milliseconds'),
  KAFKA_DLQ_SEPARATE_TOPICS: Joi.boolean()
    .default(true)
    .description('Use separate DLQ topics for each source topic'),
  KAFKA_DLQ_ERROR_THRESHOLD: Joi.number()
    .min(0)
    .max(100)
    .default(50)
    .description('Error percentage threshold to trigger circuit breaker'),
  KAFKA_DLQ_MONITORING_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable monitoring and alerting for DLQ events'),
  KAFKA_DLQ_RETRY_CRON: Joi.string()
    .default('0 */10 * * * *') // Every 10 minutes
    .description('Cron expression for scheduled DLQ retry processing'),
  
  /**
   * Event Processing Configuration
   * Settings for event consumption, batching, and rule evaluation
   */
  EVENT_PROCESSING_RATE: Joi.number()
    .min(100)
    .default(1000)
    .description('Rate of event processing in milliseconds'),
  EVENT_BATCH_SIZE: Joi.number()
    .min(1)
    .max(1000)
    .default(100)
    .description('Number of events to process in a single batch'),
  RULES_REFRESH_INTERVAL: Joi.number()
    .min(1000)
    .default(60000)
    .description('Interval for refreshing rules cache in milliseconds'),
  EVENT_PROCESSING_CONCURRENCY: Joi.number()
    .min(1)
    .max(20)
    .default(5)
    .description('Number of concurrent event processing tasks'),
  EVENT_PROCESSING_TIMEOUT: Joi.number()
    .min(1000)
    .default(30000)
    .description('Timeout for event processing in milliseconds'),
  
  /**
   * Event Schema Validation
   * Configuration for validating events against standardized schemas
   * to ensure data integrity and prevent processing invalid events
   */
  EVENT_SCHEMA_VALIDATION_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable/disable schema validation for incoming events'),
  EVENT_SCHEMA_STRICT_MODE: Joi.boolean()
    .default(false)
    .description('Reject events with extra properties not defined in schema'),
  EVENT_SCHEMA_REGISTRY_URL: Joi.string()
    .uri()
    .optional()
    .description('URL of schema registry service (if used)'),
  EVENT_SCHEMA_CACHE_SIZE: Joi.number()
    .min(10)
    .default(100)
    .description('Maximum number of schemas to cache in memory'),
  EVENT_SCHEMA_CACHE_TTL: Joi.number()
    .min(60000)
    .default(3600000)
    .description('Time-to-live for cached schemas in milliseconds'),
  EVENT_SCHEMA_VERSION_FALLBACK: Joi.boolean()
    .default(true)
    .description('Allow fallback to earlier schema versions if exact match not found'),
  EVENT_SCHEMA_VALIDATION_ERROR_ACTION: Joi.string()
    .valid('reject', 'log', 'dlq')
    .default('dlq')
    .description('Action to take when schema validation fails'),
  EVENT_JOURNEY_VALIDATION: Joi.boolean()
    .default(true)
    .description('Validate that events contain valid journey identifiers'),
  EVENT_JOURNEY_ALLOWED_TYPES: Joi.array()
    .items(Joi.string().valid(...Object.values(JourneyType)))
    .default(Object.values(JourneyType))
    .description('List of allowed journey types for events'),
  
  /**
   * Points Configuration
   * Default point values for various user actions across journeys
   */
  DEFAULT_POINT_HEALTH_METRIC_RECORDED: Joi.number()
    .min(0)
    .default(10)
    .description('Points awarded for recording a health metric'),
  DEFAULT_POINT_APPOINTMENT_BOOKED: Joi.number()
    .min(0)
    .default(20)
    .description('Points awarded for booking a medical appointment'),
  DEFAULT_POINT_APPOINTMENT_ATTENDED: Joi.number()
    .min(0)
    .default(50)
    .description('Points awarded for attending a medical appointment'),
  DEFAULT_POINT_CLAIM_SUBMITTED: Joi.number()
    .min(0)
    .default(15)
    .description('Points awarded for submitting an insurance claim'),
  DEFAULT_POINT_GOAL_COMPLETED: Joi.number()
    .min(0)
    .default(100)
    .description('Points awarded for completing a health goal'),
  
  // Points limits to prevent gaming the system
  MAX_POINTS_PER_DAY: Joi.number()
    .min(0)
    .default(1000)
    .description('Maximum points a user can earn per day'),
  MAX_POINTS_PER_ACTION: Joi.number()
    .min(0)
    .default(500)
    .description('Maximum points a user can earn from a single action'),
  POINTS_DECAY_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable points decay over time for inactivity'),
  POINTS_DECAY_RATE: Joi.number()
    .min(0)
    .max(100)
    .default(5)
    .description('Percentage of points to decay per period'),
  POINTS_DECAY_PERIOD_DAYS: Joi.number()
    .min(1)
    .default(30)
    .description('Number of days in each decay period'),
  
  /**
   * Redis Configuration
   * Settings for Redis connection and caching behavior
   */
  REDIS_HOST: Joi.string()
    .default('localhost')
    .description('Redis server hostname'),
  REDIS_PORT: Joi.number()
    .port()
    .default(6379)
    .description('Redis server port'),
  REDIS_PASSWORD: Joi.string()
    .allow('')
    .default('')
    .description('Redis server password'),
  REDIS_DB: Joi.number()
    .min(0)
    .max(15)
    .default(0)
    .description('Redis database index'),
  REDIS_KEY_PREFIX: Joi.string()
    .default('game:')
    .description('Prefix for all Redis keys'),
  REDIS_TLS_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable TLS for Redis connection'),
  REDIS_SENTINEL_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable Redis Sentinel for high availability'),
  REDIS_SENTINEL_MASTER: Joi.string()
    .when('REDIS_SENTINEL_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('Redis Sentinel master name'),
  REDIS_SENTINEL_NODES: Joi.string()
    .when('REDIS_SENTINEL_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('Comma-separated list of Redis Sentinel nodes (host:port)'),
  
  // Redis TTL configuration for different cache types
  ACHIEVEMENTS_TTL: Joi.number()
    .min(0)
    .default(3600)
    .description('Cache TTL for achievements in seconds'),
  USER_PROFILE_TTL: Joi.number()
    .min(0)
    .default(300)
    .description('Cache TTL for user profiles in seconds'),
  LEADERBOARD_TTL: Joi.number()
    .min(0)
    .default(900)
    .description('Cache TTL for leaderboards in seconds'),
  RULES_TTL: Joi.number()
    .min(0)
    .default(600)
    .description('Cache TTL for rules in seconds'),
  
  /**
   * Redis Sorted Sets Configuration
   * Specialized settings for leaderboard implementation using Redis Sorted Sets
   * for high-performance, real-time leaderboard functionality
   */
  REDIS_SORTED_SETS_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable Redis Sorted Sets for leaderboard implementation'),
  REDIS_SORTED_SETS_KEY_PREFIX: Joi.string()
    .default('leaderboard:')
    .description('Prefix for Sorted Sets keys'),
  REDIS_SORTED_SETS_MAX_ENTRIES: Joi.number()
    .min(10)
    .default(1000)
    .description('Maximum number of entries to maintain in each leaderboard'),
  REDIS_SORTED_SETS_UPDATE_BATCH_SIZE: Joi.number()
    .min(1)
    .default(50)
    .description('Batch size for leaderboard updates'),
  REDIS_SORTED_SETS_CLEANUP_INTERVAL: Joi.number()
    .min(0)
    .default(86400000) // 24 hours
    .description('Interval for cleaning up expired leaderboard entries (ms)'),
  REDIS_SORTED_SETS_JOURNEY_SPECIFIC: Joi.boolean()
    .default(true)
    .description('Maintain separate leaderboards for each journey'),
  REDIS_SORTED_SETS_GLOBAL_ENABLED: Joi.boolean()
    .default(true)
    .description('Maintain a global cross-journey leaderboard'),
  REDIS_SORTED_SETS_TIME_PERIODS: Joi.array()
    .items(Joi.string().valid('daily', 'weekly', 'monthly', 'alltime'))
    .default(['daily', 'weekly', 'monthly', 'alltime'])
    .description('Time periods for which to maintain leaderboards'),
  REDIS_SORTED_SETS_SECONDARY_RANKING: Joi.boolean()
    .default(false)
    .description('Enable secondary ranking criteria (e.g., achievements count)'),
  REDIS_SORTED_SETS_CACHE_USER_DATA: Joi.boolean()
    .default(true)
    .description('Cache user profile data alongside leaderboard entries'),
  
  /**
   * Database Configuration
   * Settings for database connection and behavior
   */
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL connection URL'),
  DATABASE_SSL: Joi.boolean()
    .default(false)
    .description('Enable SSL for database connection'),
  DATABASE_LOGGING: Joi.boolean()
    .default(false)
    .description('Enable query logging'),
  DATABASE_SCHEMA: Joi.string()
    .default('public')
    .description('Database schema to use'),
  
  // Database connection pool configuration
  DATABASE_POOL_MIN: Joi.number()
    .min(1)
    .default(2)
    .description('Minimum number of connections in pool'),
  DATABASE_POOL_MAX: Joi.number()
    .min(1)
    .default(10)
    .description('Maximum number of connections in pool'),
  DATABASE_POOL_IDLE: Joi.number()
    .min(1000)
    .default(10000)
    .description('Maximum idle time for connections in milliseconds'),
  DATABASE_CONNECTION_TIMEOUT: Joi.number()
    .min(1000)
    .default(30000)
    .description('Connection timeout in milliseconds'),
  DATABASE_STATEMENT_TIMEOUT: Joi.number()
    .min(1000)
    .default(60000)
    .description('Statement timeout in milliseconds'),
  DATABASE_QUERY_CACHE_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable query result caching'),
  DATABASE_QUERY_CACHE_TTL: Joi.number()
    .min(0)
    .default(300) // 5 minutes
    .description('TTL for cached query results in seconds'),
  
  /**
   * Gamification Features Configuration
   * Feature flags and settings for gamification components
   */
  CACHE_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable caching for gamification data'),
  
  // Leaderboard configuration
  LEADERBOARD_UPDATE_INTERVAL: Joi.number()
    .min(0)
    .default(900000) // 15 minutes
    .description('Interval for updating leaderboards in milliseconds'),
  LEADERBOARD_MAX_ENTRIES: Joi.number()
    .min(10)
    .default(100)
    .description('Maximum number of entries to return in leaderboard queries'),
  LEADERBOARD_FRIENDS_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable friends-only leaderboards'),
  LEADERBOARD_REGIONAL_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable region-specific leaderboards'),
  
  // Achievements configuration
  ACHIEVEMENTS_NOTIFICATIONS_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable notifications for achievement unlocks'),
  ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable tracking of partial progress towards achievements'),
  ACHIEVEMENTS_MAX_CONCURRENT_QUESTS: Joi.number()
    .min(1)
    .default(5)
    .description('Maximum number of active quests per user'),
  ACHIEVEMENTS_JOURNEY_SPECIFIC: Joi.boolean()
    .default(true)
    .description('Enable journey-specific achievements'),
  ACHIEVEMENTS_CROSS_JOURNEY: Joi.boolean()
    .default(true)
    .description('Enable achievements that span multiple journeys'),
  ACHIEVEMENTS_TIERED: Joi.boolean()
    .default(true)
    .description('Enable tiered achievements (bronze, silver, gold)'),
  
  // Rewards configuration
  REWARDS_EXPIRATION_DAYS: Joi.number()
    .min(0)
    .default(30)
    .description('Number of days until rewards expire'),
  REWARDS_REDEMPTION_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable reward redemption'),
  REWARDS_EXTERNAL_VALIDATION: Joi.boolean()
    .default(false)
    .description('Require external validation for reward redemption'),
  REWARDS_EXTERNAL_VALIDATION_URL: Joi.string()
    .uri()
    .when('REWARDS_EXTERNAL_VALIDATION', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('URL for external reward validation service'),
  
  /**
   * Notification Integration
   * Settings for integration with the notification service
   */
  NOTIFICATION_SERVICE_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable integration with notification service'),
  NOTIFICATION_SERVICE_URL: Joi.string()
    .uri()
    .when('NOTIFICATION_SERVICE_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('URL of the notification service'),
  NOTIFICATION_SERVICE_TIMEOUT: Joi.number()
    .min(100)
    .default(5000)
    .description('Timeout for notification service requests in milliseconds'),
  NOTIFICATION_SERVICE_RETRY_ATTEMPTS: Joi.number()
    .min(0)
    .default(3)
    .description('Number of retry attempts for failed notification requests'),
  NOTIFICATION_ACHIEVEMENT_TEMPLATE: Joi.string()
    .default('achievement-unlocked')
    .description('Notification template for achievement unlocks'),
  NOTIFICATION_LEVEL_UP_TEMPLATE: Joi.string()
    .default('level-up')
    .description('Notification template for level-up events'),
  NOTIFICATION_QUEST_COMPLETE_TEMPLATE: Joi.string()
    .default('quest-complete')
    .description('Notification template for quest completions'),
  NOTIFICATION_REWARD_AVAILABLE_TEMPLATE: Joi.string()
    .default('reward-available')
    .description('Notification template for available rewards'),
  
  /**
   * Tracing and Monitoring
   * Settings for observability and performance monitoring
   */
  TRACING_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable distributed tracing'),
  TRACING_SAMPLING_RATE: Joi.number()
    .min(0)
    .max(1)
    .default(0.1)
    .description('Sampling rate for traces (0-1)'),
  METRICS_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable metrics collection'),
  METRICS_PREFIX: Joi.string()
    .default('gamification_')
    .description('Prefix for metric names'),
  HEALTH_CHECK_INTERVAL: Joi.number()
    .min(1000)
    .default(30000)
    .description('Interval for health checks in milliseconds'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info')
    .description('Logging level'),
  PERFORMANCE_MONITORING_ENABLED: Joi.boolean()
    .default(true)
    .description('Enable performance monitoring for critical operations'),
  SLOW_QUERY_THRESHOLD_MS: Joi.number()
    .min(100)
    .default(1000)
    .description('Threshold for logging slow queries in milliseconds'),
});