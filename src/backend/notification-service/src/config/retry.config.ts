/**
 * Retry Configuration for Notification Service
 * 
 * This module defines the configuration for retry mechanisms in the notification service,
 * including backoff strategies, maximum retry counts, and dead-letter queue settings.
 * It provides channel-specific retry configurations and integrates with @austa/interfaces
 * for standardized notification payload schemas.
 * 
 * Key features:
 * - Channel-specific retry configurations (email, SMS, push, in-app)
 * - Priority-based retry settings (high, medium, low)
 * - Exponential backoff and fixed delay retry policies
 * - Dead-letter queue (DLQ) configuration for persistently failed notifications
 * - Fallback strategy for switching channels when primary channel fails
 * - Circuit breaker pattern to prevent overwhelming external services
 * - Metrics collection for monitoring retry performance
 * 
 * All configurations can be overridden via environment variables, allowing for
 * environment-specific tuning without code changes.
 */

import { registerAs } from '@nestjs/config';
import { NotificationChannel, NotificationPriority } from '@austa/interfaces/notification';
import { ErrorType } from '../retry/constants/error-types.constants';
import { PolicyType } from '../retry/constants/policy-types.constants';
import { IExponentialBackoffOptions, IFixedDelayOptions, IRetryOptions } from '../retry/interfaces/retry-options.interface';
import { RetryStatus } from '../retry/interfaces/retry-status.enum';

/**
 * Default retry options that apply to all notification channels
 * 
 * These base settings provide a foundation for all retry policies and are
 * extended by the specific policy configurations. They define reasonable
 * defaults that balance reliability with resource utilization.
 * 
 * Key parameters:
 * - maxRetries: Maximum number of retry attempts before giving up
 * - initialDelay: Base delay in milliseconds before the first retry
 * - timeout: Maximum time in milliseconds to wait for a response
 * - jitter: Random factor (0-1) to add/subtract from delays to prevent synchronized retries
 */
const defaultRetryOptions: IRetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  timeout: 5000, // 5 seconds
  jitter: 0.2, // 20% jitter to prevent thundering herd
};

/**
 * Exponential backoff configuration for transient errors
 * 
 * Exponential backoff increases the delay between retry attempts exponentially,
 * giving systems more time to recover with each subsequent retry. The formula is:
 * 
 * delay = min(initialDelay * (backoffFactor^attemptNumber) * (1 ± jitter), maxDelay)
 * 
 * This approach is ideal for transient errors like network issues or service
 * overloads, as it reduces the load on the system while still attempting delivery.
 * The jitter factor adds randomness to prevent the "thundering herd" problem
 * where many retries occur simultaneously.
 */
const exponentialBackoffOptions: IExponentialBackoffOptions = {
  ...defaultRetryOptions,
  maxRetries: 5,
  backoffFactor: 2,
  maxDelay: 60000, // 1 minute maximum delay
};

/**
 * Fixed delay configuration for rate-limited operations
 * 
 * Fixed delay retry policy uses a constant time interval between retry attempts.
 * This is useful for:
 * 
 * 1. Rate-limited APIs where retries should occur at predictable intervals
 * 2. Operations where the delay doesn't need to increase with each attempt
 * 3. Simpler retry scenarios where exponential backoff is unnecessary
 * 
 * The fixed delay can still include jitter to prevent synchronized retries
 * across multiple notifications.
 */
const fixedDelayOptions: IFixedDelayOptions = {
  ...defaultRetryOptions,
  maxRetries: 3,
  delay: 5000, // 5 seconds fixed delay
};

/**
 * Priority-based retry configurations
 * Higher priority notifications get more aggressive retry settings
 * 
 * These configurations are applied based on the notification's priority level:
 * - HIGH: Critical notifications (e.g., security alerts, appointment reminders)
 *   get more retries with shorter initial delays and slower backoff
 * - MEDIUM: Important but non-critical notifications (e.g., achievement unlocks)
 *   get standard retry behavior
 * - LOW: Informational notifications (e.g., weekly summaries)
 *   get fewer retries with longer initial delays
 * 
 * The priority settings are combined with channel-specific settings, with
 * priority settings taking precedence for overlapping properties.
 */
const priorityRetryConfigs = {
  [NotificationPriority.HIGH]: {
    maxRetries: 8,
    initialDelay: 500, // 500ms
    backoffFactor: 1.5, // Slower backoff for high priority
    timeout: 8000, // 8 seconds
  },
  [NotificationPriority.MEDIUM]: {
    maxRetries: 5,
    initialDelay: 1000, // 1 second
    backoffFactor: 2,
    timeout: 5000, // 5 seconds
  },
  [NotificationPriority.LOW]: {
    maxRetries: 3,
    initialDelay: 2000, // 2 seconds
    backoffFactor: 2,
    timeout: 5000, // 5 seconds
  },
};

/**
 * Channel-specific retry configurations
 * 
 * Each notification channel has its own retry configuration optimized for the
 * characteristics of that channel. For example:
 * - Email: Longer timeouts due to SMTP server latency
 * - SMS: Medium timeouts with fewer retries due to cost considerations
 * - Push: More aggressive retries with shorter timeouts for real-time notifications
 * - In-app: Minimal retries as these are delivered through our own infrastructure
 * 
 * Each channel configuration also includes:
 * - retryableStatusCodes: HTTP status codes that should trigger a retry
 * - fallbackChannel: Alternative channel to use if this one fails completely
 */
const channelRetryConfigs = {
  [NotificationChannel.EMAIL]: {
    ...exponentialBackoffOptions,
    maxRetries: 4,
    initialDelay: 2000, // 2 seconds
    timeout: 10000, // 10 seconds
    // Email-specific settings
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    fallbackChannel: NotificationChannel.IN_APP,
  } as IExponentialBackoffOptions,
  
  [NotificationChannel.SMS]: {
    ...exponentialBackoffOptions,
    maxRetries: 3,
    initialDelay: 3000, // 3 seconds
    timeout: 8000, // 8 seconds
    // SMS-specific settings
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    fallbackChannel: NotificationChannel.PUSH,
  } as IExponentialBackoffOptions,
  
  [NotificationChannel.PUSH]: {
    ...exponentialBackoffOptions,
    maxRetries: 5,
    initialDelay: 1000, // 1 second
    timeout: 5000, // 5 seconds
    // Push-specific settings
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    fallbackChannel: NotificationChannel.IN_APP,
  } as IExponentialBackoffOptions,
  
  [NotificationChannel.IN_APP]: {
    ...fixedDelayOptions,
    maxRetries: 2,
    delay: 2000, // 2 seconds
    timeout: 3000, // 3 seconds
    // In-app specific settings
    retryableStatusCodes: [500, 503],
    fallbackChannel: null, // No fallback for in-app
  } as IFixedDelayOptions,
};

/**
 * Error type to policy mapping
 * 
 * Different types of errors require different retry strategies. This mapping
 * associates each error type with the most appropriate retry policy:
 * 
 * - TRANSIENT: Temporary issues like network glitches or service overloads
 *   → Use exponential backoff to give the system time to recover
 * 
 * - EXTERNAL: Problems with external services or dependencies
 *   → Use exponential backoff with longer delays for external recovery
 * 
 * - SYSTEM: Internal system errors within our notification service
 *   → Use fixed delay for consistent retry intervals
 * 
 * - CLIENT: Issues with the notification request itself (validation, etc.)
 *   → Use fixed delay with limited retries as these are unlikely to resolve
 * 
 * This mapping is used by the RetryService to dynamically select the appropriate
 * policy based on the type of error encountered during notification delivery.
 */
const errorTypePolicyMap = {
  [ErrorType.TRANSIENT]: PolicyType.EXPONENTIAL_BACKOFF,
  [ErrorType.EXTERNAL]: PolicyType.EXPONENTIAL_BACKOFF,
  [ErrorType.SYSTEM]: PolicyType.FIXED,
  [ErrorType.CLIENT]: PolicyType.FIXED,
};

/**
 * Dead-letter queue configuration
 * 
 * The dead-letter queue (DLQ) stores notifications that have exhausted all retry
 * attempts and could not be delivered through any channel. This provides:
 * 
 * 1. Persistence of failed notifications for later analysis and troubleshooting
 * 2. Possibility of manual or automated reprocessing once issues are resolved
 * 3. Metrics and alerting on delivery failures
 * 
 * The DLQ implementation uses Kafka as the underlying storage mechanism, with
 * configurable retention periods and processing intervals. When the number of
 * entries exceeds the alertThreshold, the system generates alerts for operations.
 * 
 * Each DLQ entry contains:
 * - The original notification payload
 * - Complete retry history with timestamps and error details
 * - Metadata about the notification (channel, priority, user, etc.)
 * - Current status and failure reason
 */
const dlqConfig = {
  enabled: true,
  topicPrefix: 'notification.dlq',
  retentionPeriodDays: 7,
  maxPayloadSize: 1024 * 1024, // 1MB
  alertThreshold: 100, // Alert when DLQ reaches this many entries
  processingInterval: 60000, // Process DLQ entries every minute
  maxProcessingBatchSize: 50, // Process up to 50 entries at once
  // Kafka configuration for DLQ
  kafka: {
    topic: 'notification.dlq',
    groupId: 'notification-dlq-consumer',
    clientId: 'notification-dlq-client',
  },
};

/**
 * Fallback strategy configuration
 * 
 * The fallback strategy allows the notification service to attempt delivery
 * through alternative channels when the primary channel fails. This improves
 * overall delivery reliability by providing multiple paths for notifications.
 * 
 * Key aspects of the fallback strategy:
 * - Triggered only after the primary channel has exhausted its retry attempts
 * - Follows a predefined order of channels to try (fallbackChannelOrder)
 * - Limited by maxFallbackAttempts to prevent excessive fallback attempts
 * - Only triggered for specific error types and status codes
 * 
 * This approach ensures that critical notifications have the highest chance
 * of being delivered, even when a particular channel is experiencing issues.
 */
const fallbackConfig = {
  enabled: true,
  maxFallbackAttempts: 2, // Maximum number of fallback channels to try
  fallbackChannelOrder: [
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
    NotificationChannel.SMS,
    NotificationChannel.IN_APP,
  ],
  // Conditions under which to trigger fallback
  fallbackTriggers: {
    retryStatus: [RetryStatus.EXHAUSTED],
    errorTypes: [ErrorType.EXTERNAL, ErrorType.SYSTEM],
    statusCodes: [429, 500, 502, 503, 504],
  },
};

/**
 * Circuit breaker configuration to prevent overwhelming external services
 * 
 * The circuit breaker pattern prevents the notification service from repeatedly
 * attempting to use a failing external service. This protects both the external
 * service from excessive load and our service from wasting resources on requests
 * that are likely to fail.
 * 
 * Circuit breaker states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: External service is failing, requests are immediately rejected
 * - HALF-OPEN: Testing if the service has recovered by allowing limited requests
 * 
 * The circuit breaker transitions:
 * - CLOSED → OPEN: When failureThreshold consecutive requests fail
 * - OPEN → HALF-OPEN: After resetTimeout milliseconds
 * - HALF-OPEN → CLOSED: When halfOpenSuccessThreshold consecutive requests succeed
 * - HALF-OPEN → OPEN: When a single request fails
 * 
 * Each notification channel has its own circuit breaker with customized settings.
 */
const circuitBreakerConfig = {
  enabled: true,
  failureThreshold: 5, // Number of failures before opening circuit
  resetTimeout: 30000, // Time before attempting to close circuit (30 seconds)
  halfOpenSuccessThreshold: 2, // Successes needed in half-open state to close
  // Per-channel circuit breaker settings
  channels: {
    [NotificationChannel.EMAIL]: {
      failureThreshold: 10,
      resetTimeout: 60000, // 1 minute
    },
    [NotificationChannel.SMS]: {
      failureThreshold: 5,
      resetTimeout: 45000, // 45 seconds
    },
    [NotificationChannel.PUSH]: {
      failureThreshold: 8,
      resetTimeout: 30000, // 30 seconds
    },
  },
};

/**
 * Retry configuration factory function
 */
export default registerAs('retry', () => {
  return {
    // Policy configurations
    policies: {
      [PolicyType.EXPONENTIAL_BACKOFF]: exponentialBackoffOptions,
      [PolicyType.FIXED]: fixedDelayOptions,
    },
    
    // Channel and priority configurations
    channelConfigs: channelRetryConfigs,
    priorityConfigs: priorityRetryConfigs,
    errorTypePolicyMap,
    
    // Advanced retry features
    dlq: dlqConfig,
    fallback: fallbackConfig,
    circuitBreaker: circuitBreakerConfig,
    
    /**
     * Metrics and monitoring configuration
     * 
     * These settings control which metrics are collected for monitoring the
     * retry system's performance and reliability. The metrics are exposed
     * via Prometheus and can be visualized in Grafana dashboards.
     * 
     * Available metrics:
     * - retryCountHistogram: Distribution of retry attempts per notification
     * - retryLatencyHistogram: Time between retry attempts
     * - channelSuccessRateGauge: Success rate by notification channel
     * - dlqSizeGauge: Number of entries in the dead-letter queue
     */
    metrics: {
      enabled: true,
      retryCountHistogram: true,
      retryLatencyHistogram: true,
      channelSuccessRateGauge: true,
      dlqSizeGauge: true,
    },
    
    /**
     * Environment variable overrides for retry configuration
     * These settings take precedence over the defaults defined above
     * 
     * Available environment variables:
     * - RETRY_MAX_ATTEMPTS: Maximum number of retry attempts (number)
     * - RETRY_INITIAL_DELAY: Initial delay in milliseconds (number)
     * - RETRY_MAX_DELAY: Maximum delay in milliseconds (number)
     * - RETRY_BACKOFF_FACTOR: Multiplier for exponential backoff (number)
     * - RETRY_JITTER: Random jitter factor to add to delays (0-1)
     */
    maxRetries: process.env.RETRY_MAX_ATTEMPTS ? parseInt(process.env.RETRY_MAX_ATTEMPTS, 10) : undefined,
    initialDelay: process.env.RETRY_INITIAL_DELAY ? parseInt(process.env.RETRY_INITIAL_DELAY, 10) : undefined,
    maxDelay: process.env.RETRY_MAX_DELAY ? parseInt(process.env.RETRY_MAX_DELAY, 10) : undefined,
    backoffFactor: process.env.RETRY_BACKOFF_FACTOR ? parseFloat(process.env.RETRY_BACKOFF_FACTOR) : undefined,
    jitter: process.env.RETRY_JITTER ? parseFloat(process.env.RETRY_JITTER) : undefined,
    
    /**
     * Environment variable overrides for dead-letter queue configuration
     * 
     * Available environment variables:
     * - DLQ_ENABLED: Enable/disable the dead-letter queue (true/false)
     * - DLQ_TOPIC_PREFIX: Prefix for DLQ Kafka topics (string)
     * - DLQ_RETENTION_DAYS: Number of days to retain DLQ entries (number)
     */
    dlqEnabled: process.env.DLQ_ENABLED ? process.env.DLQ_ENABLED === 'true' : undefined,
    dlqTopicPrefix: process.env.DLQ_TOPIC_PREFIX || undefined,
    dlqRetentionPeriodDays: process.env.DLQ_RETENTION_DAYS ? parseInt(process.env.DLQ_RETENTION_DAYS, 10) : undefined,
    
    /**
     * Environment variable overrides for fallback strategy configuration
     * 
     * Available environment variables:
     * - FALLBACK_ENABLED: Enable/disable the fallback strategy (true/false)
     * - MAX_FALLBACK_ATTEMPTS: Maximum number of fallback channels to try (number)
     */
    fallbackEnabled: process.env.FALLBACK_ENABLED ? process.env.FALLBACK_ENABLED === 'true' : undefined,
    maxFallbackAttempts: process.env.MAX_FALLBACK_ATTEMPTS ? parseInt(process.env.MAX_FALLBACK_ATTEMPTS, 10) : undefined,
    
    /**
     * Environment variable overrides for circuit breaker configuration
     * 
     * Available environment variables:
     * - CIRCUIT_BREAKER_ENABLED: Enable/disable the circuit breaker (true/false)
     * - CIRCUIT_BREAKER_FAILURE_THRESHOLD: Number of failures before opening circuit (number)
     * - CIRCUIT_BREAKER_RESET_TIMEOUT: Time in ms before attempting to close circuit (number)
     */
    circuitBreakerEnabled: process.env.CIRCUIT_BREAKER_ENABLED ? process.env.CIRCUIT_BREAKER_ENABLED === 'true' : undefined,
    failureThreshold: process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD ? 
      parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD, 10) : undefined,
    resetTimeout: process.env.CIRCUIT_BREAKER_RESET_TIMEOUT ? 
      parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT, 10) : undefined,
  };
});