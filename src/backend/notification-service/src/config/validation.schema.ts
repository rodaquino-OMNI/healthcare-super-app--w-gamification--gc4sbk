import * as Joi from 'joi';

/**
 * Validation schema for environment variables used by the notification service.
 * 
 * This schema defines validation rules, default values, and requirements for all
 * environment variables used by the notification service. It ensures that the
 * application is properly configured at startup and prevents runtime errors due
 * to missing or invalid configuration.
 * 
 * The schema is used by NestJS's ConfigModule for validation during application
 * bootstrap.
 */
export const validationSchema = Joi.object({
  // Core application settings
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),
  WEBSOCKET_PORT: Joi.number().default(3001),
  
  // Email channel settings
  EMAIL_HOST: Joi.string().default('smtp.example.com'),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().allow(''),
  EMAIL_PASSWORD: Joi.string().allow(''),
  EMAIL_DEFAULT_FROM: Joi.string().default('noreply@austa.health'),
  EMAIL_PROVIDER: Joi.string(),
  EMAIL_API_KEY: Joi.string().allow(''),
  EMAIL_TTL: Joi.number().default(604800), // 7 days
  EMAIL_RATE_LIMIT: Joi.number().default(100),
  EMAIL_RATE_WINDOW: Joi.number().default(3600),
  EMAIL_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  EMAIL_FALLBACK_ENABLED: Joi.boolean().default(true),
  EMAIL_FALLBACK_MAX_ATTEMPTS: Joi.number().default(3),
  EMAIL_FALLBACK_RETRY_DELAY: Joi.number().default(60000),
  
  // SMS channel settings
  SMS_ACCOUNT_SID: Joi.string().allow(''),
  SMS_AUTH_TOKEN: Joi.string().allow(''),
  SMS_DEFAULT_FROM: Joi.string().allow(''),
  SMS_TTL: Joi.number().default(86400), // 24 hours
  SMS_RATE_LIMIT: Joi.number().default(50),
  SMS_RATE_WINDOW: Joi.number().default(3600),
  SMS_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  SMS_FALLBACK_ENABLED: Joi.boolean().default(true),
  SMS_FALLBACK_MAX_ATTEMPTS: Joi.number().default(3),
  SMS_FALLBACK_RETRY_DELAY: Joi.number().default(60000),
  
  // Push notification channel settings
  PUSH_API_KEY: Joi.string().allow(''),
  PUSH_USE_ADMIN_SDK: Joi.boolean().default(true),
  PUSH_ANDROID_PRIORITY: Joi.string().valid('high', 'normal').default('high'),
  PUSH_ANDROID_TTL: Joi.number().default(2419200), // 28 days
  PUSH_IOS_PRIORITY: Joi.number().default(10),
  PUSH_IOS_CRITICAL: Joi.boolean().default(false),
  PUSH_TTL: Joi.number().default(259200), // 3 days
  PUSH_RATE_LIMIT: Joi.number().default(500),
  PUSH_RATE_WINDOW: Joi.number().default(3600),
  PUSH_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  PUSH_FALLBACK_ENABLED: Joi.boolean().default(true),
  PUSH_FALLBACK_MAX_ATTEMPTS: Joi.number().default(3),
  PUSH_FALLBACK_RETRY_DELAY: Joi.number().default(30000),
  
  // In-app notification channel settings
  IN_APP_KEY_PREFIX: Joi.string().default('notification:inapp:'),
  IN_APP_TTL: Joi.number().default(2592000), // 30 days
  IN_APP_WEBSOCKET_ENABLED: Joi.boolean().default(true),
  IN_APP_WEBSOCKET_NAMESPACE: Joi.string().default('/notifications'),
  IN_APP_RATE_LIMIT: Joi.number().default(1000),
  IN_APP_RATE_WINDOW: Joi.number().default(3600),
  IN_APP_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  IN_APP_FALLBACK_ENABLED: Joi.boolean().default(true),
  IN_APP_FALLBACK_MAX_ATTEMPTS: Joi.number().default(3),
  IN_APP_FALLBACK_RETRY_DELAY: Joi.number().default(15000),
  IN_APP_HEALTH_TTL: Joi.number().default(2592000), // 30 days
  IN_APP_CARE_TTL: Joi.number().default(1209600), // 14 days
  IN_APP_PLAN_TTL: Joi.number().default(7776000), // 90 days
  IN_APP_GAME_TTL: Joi.number().default(5184000), // 60 days
  IN_APP_DEFAULT_TTL: Joi.number().default(2592000), // 30 days
  
  // Global notification settings
  NOTIFICATION_ENABLE_FALLBACK: Joi.boolean().default(true),
  NOTIFICATION_TRACK_DELIVERY: Joi.boolean().default(true),
  NOTIFICATION_RETRY_FAILED: Joi.boolean().default(true),
  NOTIFICATION_MAX_RETRY_ATTEMPTS: Joi.number().default(3),
  
  // Kafka configuration
  KAFKA_BROKERS: Joi.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: Joi.string().default('notification-service'),
  KAFKA_GROUP_ID: Joi.string().default('notification-consumer-group'),
  KAFKA_CONSUMER_GROUP_ID: Joi.string().default('notification-consumer-group'),
  KAFKA_ALLOW_AUTO_TOPIC_CREATION: Joi.boolean().default(false),
  
  // Kafka topic configuration
  KAFKA_TOPIC_HEALTH_NOTIFICATIONS: Joi.string().default('health.notifications'),
  KAFKA_TOPIC_CARE_NOTIFICATIONS: Joi.string().default('care.notifications'),
  KAFKA_TOPIC_PLAN_NOTIFICATIONS: Joi.string().default('plan.notifications'),
  KAFKA_TOPIC_GAMIFICATION_NOTIFICATIONS: Joi.string().default('gamification.notifications'),
  KAFKA_TOPIC_ACHIEVEMENT_EVENTS: Joi.string().default('gamification.achievements'),
  KAFKA_TOPIC_QUEST_EVENTS: Joi.string().default('gamification.quests'),
  KAFKA_TOPIC_REWARD_EVENTS: Joi.string().default('gamification.rewards'),
  KAFKA_TOPIC_NOTIFICATION_STATUS: Joi.string().default('notification.status'),
  KAFKA_TOPIC_NOTIFICATION_DELIVERY: Joi.string().default('notification.delivery'),
  KAFKA_TOPIC_NOTIFICATION_READ: Joi.string().default('notification.read'),
  KAFKA_TOPIC_DLQ: Joi.string().default('notification.dlq'),
  KAFKA_TOPIC_HEALTH_DLQ: Joi.string().default('health.notifications.dlq'),
  KAFKA_TOPIC_CARE_DLQ: Joi.string().default('care.notifications.dlq'),
  KAFKA_TOPIC_PLAN_DLQ: Joi.string().default('plan.notifications.dlq'),
  KAFKA_TOPIC_GAMIFICATION_DLQ: Joi.string().default('gamification.notifications.dlq'),
  
  // Kafka retry configuration
  KAFKA_MAX_RETRIES: Joi.number().default(3),
  KAFKA_INITIAL_RETRY_INTERVAL: Joi.number().default(1000),
  KAFKA_MAX_RETRY_INTERVAL: Joi.number().default(30000),
  KAFKA_RETRY_FACTOR: Joi.number().default(2.0),
  KAFKA_RETRY_WITH_JITTER: Joi.boolean().default(true),
  
  // Kafka consumer configuration
  KAFKA_SESSION_TIMEOUT: Joi.number().default(30000),
  KAFKA_HEARTBEAT_INTERVAL: Joi.number().default(3000),
  KAFKA_MAX_WAIT_TIME: Joi.number().default(5000),
  KAFKA_MAX_BYTES_PER_PARTITION: Joi.number().default(1048576),
  KAFKA_AUTO_COMMIT: Joi.boolean().default(true),
  KAFKA_AUTO_COMMIT_INTERVAL: Joi.number().default(5000),
  KAFKA_AUTO_COMMIT_THRESHOLD: Joi.number().default(100),
  KAFKA_FETCH_MIN_BYTES: Joi.number().default(1),
  KAFKA_FETCH_MAX_BYTES: Joi.number().default(1048576),
  KAFKA_CONSUMER_MAX_IN_FLIGHT: Joi.number().default(1),
  KAFKA_READ_UNCOMMITTED: Joi.boolean().default(false),
  
  // Kafka producer configuration
  KAFKA_PRODUCER_IDEMPOTENT: Joi.boolean().default(true),
  KAFKA_TRANSACTIONAL_ID: Joi.string().default('notification-producer-tx'),
  KAFKA_MAX_IN_FLIGHT_REQUESTS: Joi.number().default(5),
  KAFKA_MESSAGE_TIMEOUT: Joi.number().default(30000),
  KAFKA_COMPRESSION_TYPE: Joi.string().valid('none', 'gzip', 'snappy', 'lz4').default('gzip'),
  KAFKA_ACKS: Joi.number().valid(-1, 0, 1).default(-1),
  KAFKA_PRODUCER_RETRIES: Joi.number().default(5),
  KAFKA_BATCH_SIZE: Joi.number().default(16384),
  KAFKA_LINGER_MS: Joi.number().default(5),
  
  // Schema validation configuration
  KAFKA_SCHEMA_VALIDATION: Joi.boolean().default(true),
  KAFKA_SCHEMA_STRICT_MODE: Joi.boolean().default(false),
  KAFKA_SCHEMA_LOG_ERRORS: Joi.boolean().default(true),
});