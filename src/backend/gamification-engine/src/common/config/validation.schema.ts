import * as Joi from 'joi';

/**
 * Validation schema for all gamification engine environment variables.
 * This schema is used by the NestJS ConfigModule to validate configuration at application startup.
 * 
 * Includes validation for:
 * - Basic server configuration
 * - Kafka configuration with dead-letter queue support
 * - Event processing with standardized schema validation
 * - Points and rewards system
 * - Redis configuration with Sorted Sets for leaderboards
 * - Database and feature toggles
 */
export const validationSchema = Joi.object({
  // Server configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development')
    .description('Application environment'),
  PORT: Joi.number().default(3000).description('HTTP server port'),
  API_PREFIX: Joi.string().default('api').description('API endpoint prefix'),
  
  // Kafka configuration for event processing
  KAFKA_CLIENT_ID: Joi.string().default('gamification-engine')
    .description('Kafka client identifier'),
  KAFKA_BROKERS: Joi.string().required()
    .description('Comma-separated list of Kafka brokers'),
  KAFKA_GROUP_ID: Joi.string().default('gamification-consumer-group')
    .description('Consumer group identifier for Kafka'),
  
  // Kafka topics
  KAFKA_TOPIC_HEALTH_EVENTS: Joi.string().default('health.events')
    .description('Topic for health journey events'),
  KAFKA_TOPIC_CARE_EVENTS: Joi.string().default('care.events')
    .description('Topic for care journey events'),
  KAFKA_TOPIC_PLAN_EVENTS: Joi.string().default('plan.events')
    .description('Topic for plan journey events'),
  KAFKA_TOPIC_USER_EVENTS: Joi.string().default('user.events')
    .description('Topic for user-related events'),
  KAFKA_TOPIC_GAME_EVENTS: Joi.string().default('game.events')
    .description('Topic for gamification events'),
  
  // Kafka retry configuration
  KAFKA_MAX_RETRIES: Joi.number().min(0).default(3)
    .description('Maximum number of retry attempts for failed Kafka operations'),
  KAFKA_RETRY_INTERVAL: Joi.number().min(100).default(1000)
    .description('Interval in milliseconds between retry attempts'),
  
  // Dead Letter Queue configuration
  DLQ_ENABLED: Joi.boolean().default(true)
    .description('Enable/disable dead letter queue for failed events'),
  DLQ_TOPIC_PREFIX: Joi.string().default('dlq.')
    .description('Prefix for dead letter queue topics'),
  DLQ_MAX_RETRIES: Joi.number().min(0).default(3)
    .description('Maximum retries before sending to dead letter queue'),
  DLQ_BACKOFF_MULTIPLIER: Joi.number().min(1).default(2)
    .description('Multiplier for exponential backoff between retries'),
  DLQ_INITIAL_RETRY_DELAY: Joi.number().min(100).default(1000)
    .description('Initial delay in milliseconds before first retry'),
  DLQ_MAX_RETRY_DELAY: Joi.number().min(1000).default(60000)
    .description('Maximum delay in milliseconds between retries'),
  DLQ_RETENTION_DAYS: Joi.number().min(1).default(7)
    .description('Number of days to retain messages in dead letter queue'),
  
  // Event schema validation
  EVENT_SCHEMA_VALIDATION_ENABLED: Joi.boolean().default(true)
    .description('Enable/disable schema validation for incoming events'),
  EVENT_SCHEMA_REGISTRY_URL: Joi.string().when('EVENT_SCHEMA_VALIDATION_ENABLED', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }).description('URL for the schema registry service'),
  EVENT_SCHEMA_VALIDATION_CACHE_SIZE: Joi.number().min(10).default(100)
    .description('Maximum number of schemas to cache'),
  EVENT_SCHEMA_VALIDATION_CACHE_TTL: Joi.number().min(60).default(3600)
    .description('Time-to-live in seconds for cached schemas'),
  
  // Event processing configuration
  EVENT_PROCESSING_RATE: Joi.number().min(100).default(1000)
    .description('Rate of event processing in milliseconds'),
  EVENT_BATCH_SIZE: Joi.number().min(1).max(1000).default(100)
    .description('Number of events to process in a single batch'),
  RULES_REFRESH_INTERVAL: Joi.number().min(1000).default(60000)
    .description('Interval in milliseconds to refresh gamification rules'),
  
  // Points configuration for gamification
  DEFAULT_POINT_HEALTH_METRIC_RECORDED: Joi.number().min(0).default(10)
    .description('Default points awarded for recording a health metric'),
  DEFAULT_POINT_APPOINTMENT_BOOKED: Joi.number().min(0).default(20)
    .description('Default points awarded for booking an appointment'),
  DEFAULT_POINT_APPOINTMENT_ATTENDED: Joi.number().min(0).default(50)
    .description('Default points awarded for attending an appointment'),
  DEFAULT_POINT_CLAIM_SUBMITTED: Joi.number().min(0).default(15)
    .description('Default points awarded for submitting a claim'),
  DEFAULT_POINT_GOAL_COMPLETED: Joi.number().min(0).default(100)
    .description('Default points awarded for completing a goal'),
  
  // Points limits
  MAX_POINTS_PER_DAY: Joi.number().min(0).default(1000)
    .description('Maximum points a user can earn per day'),
  MAX_POINTS_PER_ACTION: Joi.number().min(0).default(500)
    .description('Maximum points a user can earn from a single action'),
  
  // Redis configuration for caching and real-time state
  REDIS_HOST: Joi.string().default('localhost')
    .description('Redis server hostname'),
  REDIS_PORT: Joi.number().default(6379)
    .description('Redis server port'),
  REDIS_PASSWORD: Joi.string().allow('').default('')
    .description('Redis server password'),
  REDIS_DB: Joi.number().min(0).max(15).default(0)
    .description('Redis database index'),
  REDIS_KEY_PREFIX: Joi.string().default('game:')
    .description('Prefix for all Redis keys'),
  
  // Redis TTL configuration
  ACHIEVEMENTS_TTL: Joi.number().min(0).default(3600)
    .description('Time-to-live in seconds for cached achievements'),
  USER_PROFILE_TTL: Joi.number().min(0).default(300)
    .description('Time-to-live in seconds for cached user profiles'),
  LEADERBOARD_TTL: Joi.number().min(0).default(900)
    .description('Time-to-live in seconds for cached leaderboards'),
  RULES_TTL: Joi.number().min(0).default(600)
    .description('Time-to-live in seconds for cached rules'),
  
  // Redis Sorted Sets configuration for leaderboards
  REDIS_SORTED_SETS_ENABLED: Joi.boolean().default(true)
    .description('Enable/disable Redis Sorted Sets for leaderboards'),
  REDIS_SORTED_SETS_KEY_PREFIX: Joi.string().default('leaderboard:')
    .description('Prefix for leaderboard sorted set keys'),
  REDIS_SORTED_SETS_MAX_RANGE_SIZE: Joi.number().min(10).max(10000).default(1000)
    .description('Maximum range size for sorted set operations'),
  REDIS_SORTED_SETS_UPDATE_BATCH_SIZE: Joi.number().min(1).max(1000).default(100)
    .description('Batch size for sorted set updates'),
  REDIS_SORTED_SETS_SCORE_PRECISION: Joi.number().valid(0, 1, 2, 3, 4, 5, 6).default(2)
    .description('Decimal precision for scores in sorted sets'),
  REDIS_SORTED_SETS_GLOBAL_LEADERBOARD_KEY: Joi.string().default('global')
    .description('Key for the global leaderboard sorted set'),
  REDIS_SORTED_SETS_JOURNEY_LEADERBOARD_KEYS: Joi.string().default('health,care,plan')
    .description('Comma-separated list of journey-specific leaderboard keys'),
  
  // Database configuration for persistence
  DATABASE_URL: Joi.string().required()
    .description('PostgreSQL connection URL'),
  DATABASE_SSL: Joi.boolean().default(false)
    .description('Enable/disable SSL for database connection'),
  DATABASE_LOGGING: Joi.boolean().default(false)
    .description('Enable/disable SQL query logging'),
  DATABASE_CONNECTION_POOL_MIN: Joi.number().min(1).default(2)
    .description('Minimum number of connections in the database pool'),
  DATABASE_CONNECTION_POOL_MAX: Joi.number().min(5).default(10)
    .description('Maximum number of connections in the database pool'),
  
  // Gamification features configuration
  CACHE_ENABLED: Joi.boolean().default(true)
    .description('Enable/disable caching for gamification data'),
  
  // Leaderboard configuration
  LEADERBOARD_UPDATE_INTERVAL: Joi.number().min(1000).default(900000)
    .description('Interval in milliseconds to update leaderboards'),
  LEADERBOARD_MAX_ENTRIES: Joi.number().min(10).max(1000).default(100)
    .description('Maximum number of entries in a leaderboard'),
  LEADERBOARD_REAL_TIME_UPDATES: Joi.boolean().default(false)
    .description('Enable/disable real-time leaderboard updates'),
  LEADERBOARD_JOURNEY_SPECIFIC: Joi.boolean().default(true)
    .description('Enable/disable journey-specific leaderboards'),
  
  // Achievement configuration
  ACHIEVEMENTS_NOTIFICATIONS_ENABLED: Joi.boolean().default(true)
    .description('Enable/disable notifications for achievements'),
  ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED: Joi.boolean().default(true)
    .description('Enable/disable tracking of achievement progress'),
  ACHIEVEMENTS_MAX_CONCURRENT_QUESTS: Joi.number().min(1).max(20).default(5)
    .description('Maximum number of concurrent quests a user can have'),
  
  // Rewards configuration
  REWARDS_EXPIRATION_DAYS: Joi.number().min(1).default(30)
    .description('Number of days until rewards expire'),
  REWARDS_REDEMPTION_ENABLED: Joi.boolean().default(true)
    .description('Enable/disable reward redemption'),
  REWARDS_NOTIFICATION_DAYS_BEFORE_EXPIRY: Joi.number().min(1).default(7)
    .description('Days before expiry to send notification'),
});