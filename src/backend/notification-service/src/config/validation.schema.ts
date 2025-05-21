import * as Joi from 'joi';
import { NotificationChannelType } from '@austa/interfaces/notification';
import { LogLevel } from '@app/shared/logging';

/**
 * Validation schema for notification service environment configuration.
 * Defines allowed values, types, defaults, and required constraints for all
 * critical environment variables.
 * 
 * This schema is used for validating environment variables at application startup
 * to prevent misconfiguration and ensure reliable notification delivery.
 * 
 * @see NotificationChannelType from @austa/interfaces for supported notification channels
 * @see RetryService for retry policy implementation details
 * @see DlqService for dead-letter queue implementation details
 */
export const validationSchema = Joi.object({
  // Core application settings
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development')
    .description('Application environment'),
  PORT: Joi.number().default(3000)
    .description('HTTP port for the notification service API'),
  LOG_LEVEL: Joi.string()
    .valid(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR)
    .default(LogLevel.INFO)
    .description('Logging level for the application'),
  ENABLE_TRACING: Joi.boolean().default(true)
    .description('Enable distributed tracing for request tracking'),
  SERVICE_NAME: Joi.string().default('notification-service')
    .description('Service name for logging and tracing'),
  
  // Email delivery configuration
  EMAIL_PROVIDER: Joi.string()
    .valid(NotificationChannelType.EMAIL_SENDGRID, 
           NotificationChannelType.EMAIL_MAILGUN, 
           NotificationChannelType.EMAIL_SES, 
           NotificationChannelType.EMAIL_SMTP)
    .required()
    .description('Email delivery provider'),
  EMAIL_TEMPLATE_DIR: Joi.string().default('./templates')
    .description('Directory containing email templates'),
  EMAIL_RATE_LIMIT: Joi.number().min(1).max(100).default(10)
    .description('Maximum number of emails per second'),
  EMAIL_BATCH_SIZE: Joi.number().min(1).max(1000).default(50)
    .description('Batch size for bulk email sending'),
  EMAIL_RETRY_STRATEGY: Joi.string().valid('exponential', 'fixed', 'linear').default('exponential')
    .description('Retry strategy for failed email deliveries'),
  EMAIL_TRACKING_ENABLED: Joi.boolean().default(true)
    .description('Enable tracking for email opens and clicks'),
  EMAIL_ANALYTICS_ENDPOINT: Joi.string().uri().optional()
    .description('Endpoint for email analytics tracking'),
  EMAIL_TEMPLATE_ENGINE: Joi.string().valid('handlebars', 'ejs', 'pug').default('handlebars')
    .description('Template engine for email rendering'),
  EMAIL_QUEUE_STRATEGY: Joi.string().valid('memory', 'redis', 'database').default('redis')
    .description('Queue strategy for email delivery'),
  EMAIL_API_KEY: Joi.string().required()
    .description('API key for the email delivery provider'),
  EMAIL_DEFAULT_FROM: Joi.string().email().required()
    .description('Default sender email address'),
  
  // Push notification configuration
  PUSH_API_KEY: Joi.string().required()
    .description('API key for push notification service'),
  PUSH_PROVIDER: Joi.string()
    .valid(NotificationChannelType.PUSH_FIREBASE, 
           NotificationChannelType.PUSH_ONESIGNAL, 
           NotificationChannelType.PUSH_APNS)
    .default(NotificationChannelType.PUSH_FIREBASE)
    .description('Push notification provider'),
  PUSH_TTL_SECONDS: Joi.number().min(60).max(2592000).default(604800)
    .description('Time-to-live for push notifications in seconds (default: 7 days)'),
  PUSH_PRIORITY: Joi.string().valid('high', 'normal').default('normal')
    .description('Default priority for push notifications'),
  
  // SMS delivery configuration
  SMS_ACCOUNT_SID: Joi.string().required()
    .description('Account SID for SMS provider'),
  SMS_AUTH_TOKEN: Joi.string().required()
    .description('Authentication token for SMS provider'),
  SMS_DEFAULT_FROM: Joi.string().required()
    .description('Default sender phone number for SMS'),
  
  // WebSocket configuration for real-time notifications
  WEBSOCKET_PORT: Joi.number().default(3001)
    .description('WebSocket port for real-time notification delivery'),
  WEBSOCKET_PATH: Joi.string().default('/notifications')
    .description('WebSocket endpoint path'),
  
  // Kafka configuration for event-driven notification processing
  KAFKA_BROKERS: Joi.string().required()
    .description('Comma-separated list of Kafka broker addresses'),
  KAFKA_GROUP_ID: Joi.string().required()
    .description('Consumer group ID for the notification service'),
  KAFKA_TOPIC_PREFIX: Joi.string().default('austa.notification')
    .description('Prefix for Kafka topics used by the notification service'),
  KAFKA_CLIENT_ID: Joi.string().default('notification-service')
    .description('Client ID for Kafka connections'),
  KAFKA_CONSUMER_HEARTBEAT_INTERVAL: Joi.number().default(3000)
    .description('Heartbeat interval in milliseconds for Kafka consumer'),
  KAFKA_CONSUMER_SESSION_TIMEOUT: Joi.number().default(30000)
    .description('Session timeout in milliseconds for Kafka consumer'),
  
  // Retry policy configuration for failed notifications
  RETRY_MAX_ATTEMPTS: Joi.number().min(1).max(10).default(3)
    .description('Maximum number of retry attempts for failed notifications'),
  RETRY_INITIAL_DELAY: Joi.number().min(100).max(10000).default(1000)
    .description('Initial delay in milliseconds before the first retry'),
  RETRY_MAX_DELAY: Joi.number().min(1000).max(300000).default(60000)
    .description('Maximum delay in milliseconds between retries'),
  RETRY_BACKOFF_FACTOR: Joi.number().min(1).max(5).default(2)
    .description('Exponential backoff factor for retry delay calculation'),
  RETRY_JITTER: Joi.number().min(0).max(1).default(0.1)
    .description('Random jitter factor to add to retry delays (0-1)'),
  
  // Dead-letter queue configuration for persistently failing notifications
  DLQ_ENABLED: Joi.boolean().default(true)
    .description('Enable/disable the dead-letter queue for failed notifications'),
  DLQ_TOPIC_PREFIX: Joi.string().default('austa.notification.dlq')
    .description('Prefix for DLQ Kafka topics'),
  DLQ_MAX_RETENTION_DAYS: Joi.number().min(1).max(90).default(30)
    .description('Maximum number of days to retain DLQ entries'),
  
  // Journey-specific notification configuration
  HEALTH_JOURNEY_TOPIC: Joi.string().default('austa.health.events')
    .description('Kafka topic for health journey notification events'),
  CARE_JOURNEY_TOPIC: Joi.string().default('austa.care.events')
    .description('Kafka topic for care journey notification events'),
  PLAN_JOURNEY_TOPIC: Joi.string().default('austa.plan.events')
    .description('Kafka topic for plan journey notification events'),
  GAMIFICATION_TOPIC: Joi.string().default('austa.gamification.events')
    .description('Kafka topic for gamification notification events'),
});