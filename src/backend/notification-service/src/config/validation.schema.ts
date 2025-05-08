import * as Joi from 'joi';
import { ValidationSchemaOptions } from '@app/shared/config';
import { NotificationChannelType, NotificationPriority } from '@austa/interfaces/notification';

/**
 * Validation schema for notification service environment configuration.
 * Defines allowed values, types, defaults, and required constraints for all
 * critical environment variables.
 */
export const validationSchema = Joi.object({
  // General configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  // Email channel configuration
  EMAIL_PROVIDER: Joi.string().required(),
  EMAIL_API_KEY: Joi.string().required(),
  EMAIL_DEFAULT_FROM: Joi.string().required(),
  
  // Push notification configuration
  PUSH_API_KEY: Joi.string().required(),
  
  // SMS configuration
  SMS_ACCOUNT_SID: Joi.string().required(),
  SMS_AUTH_TOKEN: Joi.string().required(),
  SMS_DEFAULT_FROM: Joi.string().required(),
  
  // WebSocket configuration
  WEBSOCKET_PORT: Joi.number().default(3001),
  
  // Kafka configuration
  KAFKA_BROKERS: Joi.string().required().description('Comma-separated list of Kafka brokers'),
  KAFKA_GROUP_ID: Joi.string().required().description('Consumer group ID for the notification service'),
  KAFKA_TOPIC_PREFIX: Joi.string().default('austa.notification').description('Prefix for all Kafka topics'),
  KAFKA_CLIENT_ID: Joi.string().default('notification-service').description('Client ID for Kafka connections'),
  KAFKA_CONNECTION_TIMEOUT: Joi.number().default(3000).min(1000).description('Connection timeout in ms for Kafka'),
  KAFKA_REQUEST_TIMEOUT: Joi.number().default(30000).min(1000).description('Request timeout in ms for Kafka'),
  KAFKA_AUTH_MECHANISM: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512', 'none').default('none').description('Authentication mechanism for Kafka'),
  KAFKA_USERNAME: Joi.string().when('KAFKA_AUTH_MECHANISM', {
    is: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).description('Username for Kafka authentication'),
  KAFKA_PASSWORD: Joi.string().when('KAFKA_AUTH_MECHANISM', {
    is: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).description('Password for Kafka authentication'),
  KAFKA_SSL_ENABLED: Joi.boolean().default(false).description('Enable/disable SSL for Kafka connections'),
  KAFKA_SSL_CA_CERT: Joi.string().when('KAFKA_SSL_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).description('CA certificate for Kafka SSL'),
  KAFKA_CONSUMER_HEARTBEAT_INTERVAL: Joi.number().default(3000).min(1000).description('Consumer heartbeat interval in ms'),
  KAFKA_CONSUMER_SESSION_TIMEOUT: Joi.number().default(30000).min(3000).description('Consumer session timeout in ms'),
  KAFKA_CONSUMER_MAX_BYTES: Joi.number().default(1048576).min(1024).description('Maximum bytes per partition'),
  KAFKA_CONSUMER_MAX_WAIT_TIME: Joi.number().default(1000).min(100).description('Maximum wait time in ms for new messages'),
  KAFKA_CONSUMER_RETRY_MIN_BYTES: Joi.number().default(1).min(1).description('Minimum bytes to accumulate before returning messages'),
  KAFKA_PRODUCER_COMPRESSION: Joi.string().valid('none', 'gzip', 'snappy', 'lz4', 'zstd').default('none').description('Compression type for produced messages'),
  KAFKA_PRODUCER_ACKS: Joi.number().valid(0, 1, -1).default(-1).description('Producer acknowledgement level (-1 = all)'),
  KAFKA_PRODUCER_TIMEOUT: Joi.number().default(30000).min(1000).description('Producer timeout in ms'),
  KAFKA_PRODUCER_BATCH_SIZE: Joi.number().default(16384).min(1024).description('Producer batch size in bytes'),
  KAFKA_PRODUCER_LINGER_MS: Joi.number().default(5).min(0).description('Producer linger time in ms'),
  KAFKA_PRODUCER_IDEMPOTENT: Joi.boolean().default(true).description('Enable/disable idempotent producer'),
  KAFKA_PRODUCER_RETRIES: Joi.number().default(5).min(0).description('Number of retries for producer'),
  KAFKA_PRODUCER_RETRY_BACKOFF_MS: Joi.number().default(100).min(1).description('Backoff time in ms between producer retries'),
  KAFKA_HEALTH_CHECK_ENABLED: Joi.boolean().default(true).description('Enable/disable Kafka health checks'),
  KAFKA_HEALTH_CHECK_INTERVAL: Joi.number().default(60000).min(5000).description('Interval in ms for Kafka health checks'),
  KAFKA_TOPIC_HEALTH: Joi.string().default('austa.notification.health').description('Topic for health notifications'),
  KAFKA_TOPIC_CARE: Joi.string().default('austa.notification.care').description('Topic for care notifications'),
  KAFKA_TOPIC_PLAN: Joi.string().default('austa.notification.plan').description('Topic for plan notifications'),
  KAFKA_TOPIC_GAMIFICATION: Joi.string().default('austa.notification.gamification').description('Topic for gamification notifications'),
  KAFKA_TOPIC_STATUS: Joi.string().default('austa.notification.status').description('Topic for notification status updates'),
  KAFKA_TOPIC_EVENTS: Joi.string().default('austa.notification.events').description('Topic for notification events'),
  KAFKA_TOPIC_METRICS: Joi.string().default('austa.notification.metrics').description('Topic for notification metrics'),
  KAFKA_TOPIC_PARTITIONS: Joi.number().default(3).min(1).description('Number of partitions for created topics'),
  KAFKA_TOPIC_REPLICATION_FACTOR: Joi.number().default(3).min(1).description('Replication factor for created topics'),
  
  // Retry policy configuration
  RETRY_MAX_ATTEMPTS: Joi.number().default(3).min(1).description('Maximum number of retry attempts'),
  RETRY_INITIAL_DELAY: Joi.number().default(1000).min(100).description('Initial delay in ms before first retry'),
  RETRY_MAX_DELAY: Joi.number().default(30000).min(1000).description('Maximum delay in ms between retries'),
  RETRY_BACKOFF_FACTOR: Joi.number().default(2).min(1).description('Exponential backoff factor for retry delays'),
  RETRY_JITTER_FACTOR: Joi.number().default(0.1).min(0).max(1).description('Random jitter factor to add to retry delays (0-1)'),
  RETRY_TIMEOUT: Joi.number().default(60000).min(1000).description('Overall timeout in ms for the entire retry process'),
  RETRY_CONCURRENCY: Joi.number().default(5).min(1).description('Maximum number of concurrent retry operations'),
  RETRY_QUEUE_SIZE: Joi.number().default(100).min(10).description('Maximum size of the retry queue'),
  RETRY_BATCH_SIZE: Joi.number().default(10).min(1).description('Batch size for processing retry operations'),
  RETRY_PROCESSING_INTERVAL: Joi.number().default(5000).min(1000).description('Interval in ms for processing retry queue'),
  RETRY_CIRCUIT_BREAKER_THRESHOLD: Joi.number().default(50).min(1).description('Failure threshold for circuit breaker activation'),
  RETRY_CIRCUIT_BREAKER_TIMEOUT: Joi.number().default(300000).min(1000).description('Timeout in ms for circuit breaker reset'),
  RETRY_CIRCUIT_BREAKER_ENABLED: Joi.boolean().default(true).description('Enable/disable circuit breaker for retry operations'),
  RETRY_STRATEGY_BY_CHANNEL: Joi.object().pattern(
    Joi.string().valid(...Object.values(NotificationChannelType)),
    Joi.string().valid('exponential', 'linear', 'fixed')
  ).default({
    [NotificationChannelType.EMAIL]: 'exponential',
    [NotificationChannelType.PUSH]: 'exponential',
    [NotificationChannelType.SMS]: 'linear',
    [NotificationChannelType.IN_APP]: 'fixed'
  }).description('Retry strategy by notification channel'),
  RETRY_MAX_ATTEMPTS_BY_PRIORITY: Joi.object().pattern(
    Joi.string().valid(...Object.values(NotificationPriority)),
    Joi.number().min(0)
  ).default({
    [NotificationPriority.HIGH]: 5,
    [NotificationPriority.MEDIUM]: 3,
    [NotificationPriority.LOW]: 1
  }).description('Maximum retry attempts by notification priority'),
  RETRY_DELAY_BY_CHANNEL: Joi.object().pattern(
    Joi.string().valid(...Object.values(NotificationChannelType)),
    Joi.number().min(100)
  ).default({
    [NotificationChannelType.EMAIL]: 5000,
    [NotificationChannelType.PUSH]: 1000,
    [NotificationChannelType.SMS]: 10000,
    [NotificationChannelType.IN_APP]: 500
  }).description('Initial retry delay in ms by notification channel'),
  
  // Dead-letter queue configuration
  DLQ_ENABLED: Joi.boolean().default(true).description('Enable/disable dead-letter queue for failed notifications'),
  DLQ_TOPIC_PREFIX: Joi.string().default('austa.notification.dlq').description('Prefix for dead-letter queue topics'),
  DLQ_MAX_RETRIES: Joi.number().default(3).min(0).description('Maximum number of DLQ processing attempts'),
  DLQ_PROCESSING_INTERVAL: Joi.number().default(300000).min(60000).description('Interval in ms for processing DLQ messages'),
  DLQ_BATCH_SIZE: Joi.number().default(50).min(1).description('Batch size for processing DLQ messages'),
  DLQ_RETENTION_PERIOD: Joi.number().default(604800000).min(86400000).description('Retention period in ms for DLQ messages (default: 7 days)'),
  DLQ_ALERT_THRESHOLD: Joi.number().default(100).min(1).description('Threshold for alerting on DLQ size'),
  DLQ_STORAGE_TYPE: Joi.string().valid('kafka', 'database', 'redis').default('kafka').description('Storage type for DLQ messages'),
  DLQ_DATABASE_TABLE: Joi.string().default('notification_dlq').description('Database table name for DLQ messages when using database storage'),
  DLQ_REDIS_KEY_PREFIX: Joi.string().default('notification:dlq').description('Redis key prefix for DLQ messages when using Redis storage'),
  DLQ_ERROR_THRESHOLD_PERCENTAGE: Joi.number().default(10).min(1).max(100).description('Error threshold percentage for DLQ alerts'),
  DLQ_MONITORING_ENABLED: Joi.boolean().default(true).description('Enable/disable DLQ monitoring and alerting'),
  DLQ_CHANNEL_SPECIFIC_TOPICS: Joi.boolean().default(true).description('Enable/disable channel-specific DLQ topics'),
  DLQ_JOURNEY_SPECIFIC_TOPICS: Joi.boolean().default(true).description('Enable/disable journey-specific DLQ topics'),
  DLQ_REASON_TRACKING_ENABLED: Joi.boolean().default(true).description('Enable/disable tracking of failure reasons in DLQ'),
});