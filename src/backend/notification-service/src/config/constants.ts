/**
 * Configuration constants for the notification service.
 * This file centralizes important constant values to ensure consistent configuration
 * across the application and simplify maintenance by avoiding magic numbers and strings.
 */

/**
 * Environment names used throughout the application.
 */
export enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
  PROVISION = 'provision',
}

/**
 * Server configuration constants.
 */
export const DEFAULT_PORT = 3000;
export const DEFAULT_WEBSOCKET_PORT = 3001;
export const DEFAULT_HOST = '0.0.0.0';
export const DEFAULT_CORS_ORIGIN = '*';
export const DEFAULT_RATE_LIMIT = 100; // requests per minute
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Kafka topic constants.
 */
export const KAFKA_TOPIC_PREFIX = 'austa.notification';
export const NOTIFICATION_REQUEST_TOPIC = `${KAFKA_TOPIC_PREFIX}.request`;
export const NOTIFICATION_STATUS_TOPIC = `${KAFKA_TOPIC_PREFIX}.status`;
export const NOTIFICATION_DLQ_TOPIC = `${KAFKA_TOPIC_PREFIX}.dlq`;

// Journey-specific notification topics
export const HEALTH_NOTIFICATION_TOPIC = `${KAFKA_TOPIC_PREFIX}.health`;
export const CARE_NOTIFICATION_TOPIC = `${KAFKA_TOPIC_PREFIX}.care`;
export const PLAN_NOTIFICATION_TOPIC = `${KAFKA_TOPIC_PREFIX}.plan`;
export const GAMIFICATION_NOTIFICATION_TOPIC = `${KAFKA_TOPIC_PREFIX}.gamification`;

// Kafka consumer group IDs
export const NOTIFICATION_CONSUMER_GROUP = 'notification-service';
export const NOTIFICATION_DLQ_CONSUMER_GROUP = 'notification-service-dlq';

/**
 * Retry policy constants.
 */
export const DEFAULT_MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000; // 1 second
export const DEFAULT_MAX_RETRY_DELAY_MS = 60000; // 1 minute
export const DEFAULT_BACKOFF_MULTIPLIER = 2; // exponential backoff factor

// Retry timeout constants
export const DEFAULT_RETRY_TIMEOUT_MS = 30000; // 30 seconds
export const PUSH_NOTIFICATION_TIMEOUT_MS = 10000; // 10 seconds
export const EMAIL_NOTIFICATION_TIMEOUT_MS = 30000; // 30 seconds
export const SMS_NOTIFICATION_TIMEOUT_MS = 15000; // 15 seconds
export const IN_APP_NOTIFICATION_TIMEOUT_MS = 5000; // 5 seconds

/**
 * Notification channel constants.
 */
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in-app',
}

// Default notification channel priorities (lower number = higher priority)
export const CHANNEL_PRIORITIES = {
  [NotificationChannel.PUSH]: 1,
  [NotificationChannel.IN_APP]: 2,
  [NotificationChannel.SMS]: 3,
  [NotificationChannel.EMAIL]: 4,
};

// Default notification templates path
export const DEFAULT_TEMPLATES_PATH = 'templates';

/**
 * Database constants.
 */
export const DEFAULT_DB_CONNECTION_TIMEOUT_MS = 30000; // 30 seconds
export const DEFAULT_DB_QUERY_TIMEOUT_MS = 10000; // 10 seconds
export const DEFAULT_DB_CONNECTION_POOL_SIZE = 10;

/**
 * Logging constants.
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export const DEFAULT_LOG_LEVEL = LogLevel.INFO;

/**
 * Health check constants.
 */
export const HEALTH_CHECK_PATH = '/health';
export const HEALTH_CHECK_TIMEOUT_MS = 5000; // 5 seconds