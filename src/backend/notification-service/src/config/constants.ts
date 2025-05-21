/**
 * Constants used across the notification service's configuration modules.
 * This file centralizes important constant values to ensure consistent configuration
 * across the application and simplify maintenance by avoiding magic numbers and strings.
 */

/**
 * Environment names used throughout the application.
 */
export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  PROVISION = 'provision',
}

/**
 * Default port values for the notification service.
 */
export const DEFAULT_PORT = 3000;
export const DEFAULT_WEBSOCKET_PORT = 3001;

/**
 * Kafka topic prefixes for different environments.
 */
export enum KafkaTopicPrefix {
  DEVELOPMENT = 'dev',
  PRODUCTION = 'prod',
  TEST = 'test',
  PROVISION = 'prov',
}

/**
 * Kafka topic names for notification events.
 */
export enum KafkaTopic {
  HEALTH_NOTIFICATIONS = 'health-notifications',
  CARE_NOTIFICATIONS = 'care-notifications',
  PLAN_NOTIFICATIONS = 'plan-notifications',
  GAMIFICATION_NOTIFICATIONS = 'gamification-notifications',
  NOTIFICATION_STATUS = 'notification-status',
}

/**
 * Kafka consumer group IDs.
 */
export const NOTIFICATION_CONSUMER_GROUP = 'notification-service';

/**
 * Retry policy types for failed notifications.
 */
export enum RetryPolicyType {
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR = 'linear',
  FIXED = 'fixed',
}

/**
 * Default retry configuration values.
 */
export const DEFAULT_MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000; // 1 second
export const DEFAULT_BACKOFF_FACTOR = 2; // For exponential backoff
export const DEFAULT_MAX_RETRY_DELAY_MS = 60000; // 1 minute

/**
 * Channel-specific retry configuration.
 */
export const EMAIL_MAX_RETRY_ATTEMPTS = 5;
export const SMS_MAX_RETRY_ATTEMPTS = 3;
export const PUSH_MAX_RETRY_ATTEMPTS = 3;
export const IN_APP_MAX_RETRY_ATTEMPTS = 2;

/**
 * Dead Letter Queue (DLQ) configuration.
 */
export const DLQ_RETENTION_DAYS = 7;
export const DLQ_PROCESSING_INTERVAL_MS = 3600000; // 1 hour

/**
 * Error types for notification delivery failures.
 */
export enum ErrorType {
  TRANSIENT = 'transient',
  CLIENT = 'client',
  SYSTEM = 'system',
  EXTERNAL = 'external',
}

/**
 * HTTP status codes used in the notification service.
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Notification channel types.
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

/**
 * Notification priority levels.
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Notification status types.
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

/**
 * Template rendering engine types.
 */
export enum TemplateEngine {
  HANDLEBARS = 'handlebars',
  EJS = 'ejs',
  PUG = 'pug',
}

/**
 * Logging levels.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Rate limiting configuration.
 */
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;

/**
 * Timeouts for external service calls (in milliseconds).
 */
export const EMAIL_PROVIDER_TIMEOUT_MS = 10000; // 10 seconds
export const SMS_PROVIDER_TIMEOUT_MS = 5000; // 5 seconds
export const PUSH_PROVIDER_TIMEOUT_MS = 5000; // 5 seconds

/**
 * Cache TTL values (in milliseconds).
 */
export const TEMPLATE_CACHE_TTL_MS = 3600000; // 1 hour
export const USER_PREFERENCES_CACHE_TTL_MS = 300000; // 5 minutes

/**
 * WebSocket event names.
 */
export enum WebSocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',
  ERROR = 'error',
}

/**
 * Feature flags.
 */
export enum FeatureFlag {
  ENABLE_PUSH_NOTIFICATIONS = 'enable_push_notifications',
  ENABLE_EMAIL_NOTIFICATIONS = 'enable_email_notifications',
  ENABLE_SMS_NOTIFICATIONS = 'enable_sms_notifications',
  ENABLE_IN_APP_NOTIFICATIONS = 'enable_in_app_notifications',
  ENABLE_NOTIFICATION_BATCHING = 'enable_notification_batching',
  ENABLE_DELIVERY_TRACKING = 'enable_delivery_tracking',
}