/**
 * Retry Configuration for Notification Service
 * 
 * This module defines the configuration for retry mechanisms in the notification service,
 * including backoff strategies, maximum retry counts, and dead-letter queue settings.
 * It provides channel-specific configurations for email, SMS, push, and in-app notifications.
 *
 * The retry configuration is designed to ensure reliable notification delivery while
 * respecting the delivery time SLA of <30s (95th percentile) as specified in the
 * technical requirements.
 */

import { NotificationChannel, NotificationPriority } from '@austa/interfaces/notification/types';
import { IRetryOptions, IExponentialBackoffOptions, IFixedDelayOptions, ILinearBackoffOptions } from '../retry/interfaces/retry-options.interface';
import { PolicyType } from '../retry/constants/policy-types.constants';
import { ErrorType } from '../retry/constants/error-types.constants';
import { ReasonCode } from '../retry/constants/reason-codes.constants';

/**
 * Default retry configuration for all notification channels
 * 
 * These settings serve as the baseline for all retry operations and can be
 * overridden by more specific configurations. The jitter option adds randomness
 * to retry intervals to prevent the "thundering herd" problem where many retries
 * occur simultaneously after a service recovery.
 */
export const DEFAULT_RETRY_CONFIG: IRetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  jitter: true, // Add randomness to retry intervals to prevent thundering herd
  timeout: 30000, // 30 second default timeout for operations
};

/**
 * Exponential backoff configuration for transient errors
 * 
 * Uses increasing delays between retry attempts, which is ideal for transient errors
 * that may resolve themselves over time. The backoff factor determines how quickly
 * the delay increases with each retry attempt.
 * 
 * Formula: delay = min(maxDelay, initialDelay * (backoffFactor ^ attemptNumber) * (1 ± jitterFactor))
 */
export const EXPONENTIAL_BACKOFF_CONFIG: IExponentialBackoffOptions = {
  ...DEFAULT_RETRY_CONFIG,
  policyType: PolicyType.EXPONENTIAL_BACKOFF,
  backoffFactor: 2, // Each retry will wait 2x longer than the previous one
  maxRetries: 5, // More retries for transient errors
  jitterFactor: 0.25, // Add up to 25% randomness to retry intervals
};

/**
 * Linear backoff configuration for gradual retries
 * 
 * Increases delay linearly with each retry attempt, which provides a middle ground
 * between fixed delay and exponential backoff. Good for errors that benefit from
 * increasing delays but don't need the aggressive scaling of exponential backoff.
 * 
 * Formula: delay = min(maxDelay, initialDelay + (increment * attemptNumber) * (1 ± jitterFactor))
 */
export const LINEAR_BACKOFF_CONFIG: ILinearBackoffOptions = {
  ...DEFAULT_RETRY_CONFIG,
  policyType: PolicyType.LINEAR,
  increment: 5000, // Add 5 seconds with each retry
  maxRetries: 4,
  jitterFactor: 0.1, // Add up to 10% randomness to retry intervals
};

/**
 * Fixed delay configuration for quick retries
 * 
 * Uses consistent delay between retry attempts, which is suitable for operations
 * that should be retried quickly with the same delay each time. Ideal for errors
 * that are likely to be resolved within a consistent timeframe.
 * 
 * Formula: delay = delay * (1 ± jitterFactor)
 */
export const FIXED_DELAY_CONFIG: IFixedDelayOptions = {
  ...DEFAULT_RETRY_CONFIG,
  policyType: PolicyType.FIXED,
  delay: 2000, // 2 seconds between each retry
  maxRetries: 3,
  jitterFactor: 0.1, // Add up to 10% randomness to retry intervals
};

/**
 * Channel-specific retry configurations
 * 
 * These configurations are tailored for the characteristics of each notification channel,
 * taking into account typical failure modes, external service reliability, and the
 * urgency of the notification type.
 * 
 * - Email: Uses exponential backoff with longer delays as email delivery can take time
 *   and temporary server issues often resolve themselves.
 * - SMS: Uses exponential backoff with moderate delays as SMS gateways may have rate
 *   limits or temporary connectivity issues.
 * - Push: Uses exponential backoff with shorter initial delays as push notifications
 *   should be delivered quickly but may face device connectivity issues.
 * - In-App: Uses fixed delay with minimal retries as in-app notifications rely on
 *   internal systems with higher reliability.
 */
export const CHANNEL_RETRY_CONFIGS: Record<NotificationChannel, IRetryOptions> = {
  [NotificationChannel.EMAIL]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 5,
    initialDelay: 5000, // 5 seconds
    maxDelay: 3600000, // 1 hour
    timeout: 30000, // 30 seconds
    description: 'Email notification retry policy with exponential backoff',
  },
  [NotificationChannel.SMS]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 3,
    initialDelay: 3000, // 3 seconds
    maxDelay: 1800000, // 30 minutes
    timeout: 15000, // 15 seconds
    description: 'SMS notification retry policy with exponential backoff',
  },
  [NotificationChannel.PUSH]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 4,
    initialDelay: 1000, // 1 second
    maxDelay: 900000, // 15 minutes
    timeout: 10000, // 10 seconds
    description: 'Push notification retry policy with exponential backoff',
  },
  [NotificationChannel.IN_APP]: {
    ...FIXED_DELAY_CONFIG,
    maxRetries: 2,
    delay: 1000, // 1 second
    timeout: 5000, // 5 seconds
    description: 'In-app notification retry policy with fixed delay',
  },
};

/**
 * Error-specific retry configurations
 * 
 * Different retry strategies based on error type, optimized for the characteristics
 * of each error category:
 * 
 * - TRANSIENT: Temporary errors that are likely to resolve themselves with time
 *   (network blips, rate limiting, temporary outages). Uses exponential backoff
 *   with multiple retries.
 * 
 * - EXTERNAL: Errors from external dependencies or third-party services. Uses
 *   exponential backoff with moderate initial delay to allow external services
 *   to recover.
 * 
 * - SYSTEM: Internal system errors that may require more time to resolve. Uses
 *   exponential backoff with longer initial delay.
 * 
 * - CLIENT: Errors caused by invalid client requests or data. Uses minimal retries
 *   as these errors are unlikely to resolve without client intervention.
 */
export const ERROR_TYPE_RETRY_CONFIGS: Record<ErrorType, IRetryOptions> = {
  [ErrorType.TRANSIENT]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    description: 'Retry policy for transient errors with exponential backoff',
  },
  [ErrorType.EXTERNAL]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 4,
    initialDelay: 5000, // 5 seconds
    description: 'Retry policy for external service errors with exponential backoff',
  },
  [ErrorType.SYSTEM]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 3,
    initialDelay: 10000, // 10 seconds
    description: 'Retry policy for system errors with exponential backoff',
  },
  [ErrorType.CLIENT]: {
    ...FIXED_DELAY_CONFIG,
    maxRetries: 1, // Minimal retries for client errors
    description: 'Retry policy for client errors with minimal retries',
  },
};

/**
 * Reason code specific retry configurations
 * 
 * Fine-grained retry strategies for specific error reason codes, allowing for
 * more targeted handling of known error conditions. These override the more
 * general error type configurations when a specific reason code is provided.
 */
export const REASON_CODE_RETRY_CONFIGS: Partial<Record<ReasonCode, IRetryOptions>> = {
  // Email specific reason codes
  [ReasonCode.EMAIL_RATE_LIMITED]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 6,
    initialDelay: 60000, // 1 minute
    maxDelay: 3600000, // 1 hour
    description: 'Retry policy for rate-limited email with longer delays',
  },
  [ReasonCode.EMAIL_TEMPORARY_FAILURE]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 5,
    description: 'Retry policy for temporary email failures',
  },
  [ReasonCode.EMAIL_INVALID_RECIPIENT]: {
    maxRetries: 0, // Don't retry invalid recipients
    description: 'No retry for invalid email recipients',
  },
  
  // SMS specific reason codes
  [ReasonCode.SMS_RATE_LIMITED]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 4,
    initialDelay: 30000, // 30 seconds
    description: 'Retry policy for rate-limited SMS with longer delays',
  },
  [ReasonCode.SMS_CARRIER_UNAVAILABLE]: {
    ...LINEAR_BACKOFF_CONFIG,
    maxRetries: 4,
    initialDelay: 15000, // 15 seconds
    description: 'Retry policy for unavailable SMS carriers',
  },
  
  // Push specific reason codes
  [ReasonCode.PUSH_DEVICE_UNAVAILABLE]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 5,
    initialDelay: 60000, // 1 minute
    description: 'Retry policy for unavailable push devices with longer initial delay',
  },
  [ReasonCode.PUSH_TOKEN_EXPIRED]: {
    maxRetries: 0, // Don't retry expired tokens
    description: 'No retry for expired push tokens',
  },
  
  // General reason codes
  [ReasonCode.SERVICE_UNAVAILABLE]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 5,
    initialDelay: 5000, // 5 seconds
    description: 'Retry policy for unavailable services',
  },
  [ReasonCode.RATE_LIMITED]: {
    ...EXPONENTIAL_BACKOFF_CONFIG,
    maxRetries: 6,
    initialDelay: 10000, // 10 seconds
    description: 'Retry policy for rate-limited operations with longer delays',
  },
};

/**
 * Priority-based retry configurations
 * 
 * Higher priority notifications get more aggressive retry strategies through
 * multipliers that affect retry counts and timing. These multipliers are applied
 * to the base retry configuration for the notification channel and error type.
 * 
 * For example, a CRITICAL notification might get 3x the number of retry attempts
 * compared to a LOW priority notification of the same type.
 */
export const PRIORITY_RETRY_MULTIPLIERS: Record<NotificationPriority, number> = {
  [NotificationPriority.LOW]: 1, // Base multiplier (no change)
  [NotificationPriority.MEDIUM]: 1.5, // 50% more retries/shorter delays
  [NotificationPriority.HIGH]: 2, // Twice as many retries/shorter delays
  [NotificationPriority.CRITICAL]: 3, // Triple retries/shorter delays
};

/**
 * Journey-specific retry configurations
 * 
 * Different journeys may have different retry requirements based on the
 * criticality and nature of their notifications. These configurations allow
 * for journey-specific customization of retry behavior.
 */
export const JOURNEY_RETRY_MODIFIERS = {
  HEALTH: {
    maxRetriesModifier: 1.2, // 20% more retries for health notifications
    initialDelayModifier: 0.8, // 20% shorter initial delays
    description: 'Health journey notifications often have higher urgency',
  },
  CARE: {
    maxRetriesModifier: 1.5, // 50% more retries for care notifications
    initialDelayModifier: 0.7, // 30% shorter initial delays
    description: 'Care journey notifications are often time-sensitive (appointments, medication reminders)',
  },
  PLAN: {
    maxRetriesModifier: 1.0, // Standard retry count
    initialDelayModifier: 1.0, // Standard delays
    description: 'Plan journey notifications typically have standard urgency',
  },
};

/**
 * Dead Letter Queue (DLQ) configuration
 * 
 * The DLQ stores notifications that have exhausted their retry attempts or
 * encountered non-retryable errors. This configuration controls how DLQ entries
 * are stored, processed, and monitored.
 * 
 * The DLQ is a critical component for ensuring notification reliability as it
 * provides visibility into failed notifications and enables manual intervention
 * or reprocessing when needed.
 */
export const DLQ_CONFIG = {
  enabled: true,
  retentionDays: 30, // Store failed notifications for 30 days
  batchSize: 100, // Process DLQ entries in batches of 100
  processingInterval: 3600000, // Process DLQ every hour (in milliseconds)
  alertThreshold: 50, // Alert when DLQ reaches 50 entries
  maxEntries: 10000, // Maximum number of entries to store in the DLQ
  purgeOldestWhenFull: true, // Remove oldest entries when DLQ is full
  journeySpecificThresholds: {
    HEALTH: 20, // Lower threshold for health notifications
    CARE: 30, // Medium threshold for care notifications
    PLAN: 50, // Standard threshold for plan notifications
  },
  prioritySpecificRetention: {
    [NotificationPriority.LOW]: 15, // 15 days retention for low priority
    [NotificationPriority.MEDIUM]: 30, // 30 days retention for medium priority
    [NotificationPriority.HIGH]: 60, // 60 days retention for high priority
    [NotificationPriority.CRITICAL]: 90, // 90 days retention for critical priority
  },
};

/**
 * Timeout configuration for different operations
 * 
 * Defines how long the system should wait for a response from each notification
 * channel before considering the operation timed out. These timeouts are critical
 * for meeting the notification service's delivery time SLA of <30s (95th percentile).
 * 
 * Timeouts are channel-specific to account for the different performance
 * characteristics of each delivery method.
 */
export const TIMEOUT_CONFIG: Record<NotificationChannel | 'defaultTimeout', number> = {
  [NotificationChannel.EMAIL]: 30000, // 30 seconds
  [NotificationChannel.SMS]: 15000, // 15 seconds
  [NotificationChannel.PUSH]: 10000, // 10 seconds
  [NotificationChannel.IN_APP]: 5000, // 5 seconds
  defaultTimeout: 30000, // 30 seconds default
};

/**
 * Batch processing configuration
 * 
 * Controls how notifications are processed in batches to optimize throughput
 * while maintaining reliability. Batch processing is particularly important
 * for high-volume notification scenarios.
 */
export const BATCH_PROCESSING_CONFIG = {
  enabled: true,
  maxBatchSize: 50, // Maximum number of notifications in a batch
  processingInterval: 1000, // Process batches every second
  maxConcurrentBatches: 5, // Maximum number of batches to process concurrently
  channelSpecificBatchSizes: {
    [NotificationChannel.EMAIL]: 50,
    [NotificationChannel.SMS]: 20, // Smaller batches for SMS due to rate limits
    [NotificationChannel.PUSH]: 100, // Larger batches for push notifications
    [NotificationChannel.IN_APP]: 200, // Largest batches for in-app notifications
  },
};

/**
 * Retry circuit breaker configuration
 * 
 * Prevents excessive retries when a service is consistently failing by temporarily
 * disabling retry attempts after a threshold of failures is reached. This helps
 * prevent overwhelming external services during outages and allows them time to recover.
 * 
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, retries are allowed
 * - OPEN: Service is failing, retries are blocked
 * - HALF-OPEN: Testing if service has recovered, limited retries allowed
 */
export const CIRCUIT_BREAKER_CONFIG = {
  enabled: true,
  failureThreshold: 5, // Number of failures before opening circuit
  resetTimeout: 60000, // Time before attempting to close circuit (1 minute)
  halfOpenSuccessThreshold: 2, // Successes needed in half-open state to close circuit
  monitoringWindow: 300000, // 5-minute window for tracking failures
  channelSpecificThresholds: {
    [NotificationChannel.EMAIL]: 8, // Higher threshold for email
    [NotificationChannel.SMS]: 5, // Standard threshold for SMS
    [NotificationChannel.PUSH]: 10, // Higher threshold for push
    [NotificationChannel.IN_APP]: 3, // Lower threshold for in-app
  },
};

/**
 * Fallback channel configuration
 * 
 * Defines alternative notification channels to try when the primary channel fails.
 * This enhances delivery reliability by providing multiple paths for notification
 * delivery. The fallback channels are tried in the order specified.
 * 
 * For example, if a push notification fails, the system will try to deliver an
 * in-app notification, and if that fails, it will try email as a last resort.
 */
export const FALLBACK_CHANNELS: Partial<Record<NotificationChannel, NotificationChannel[]>> = {
  [NotificationChannel.PUSH]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  [NotificationChannel.EMAIL]: [NotificationChannel.IN_APP],
  [NotificationChannel.SMS]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
  // No fallbacks for IN_APP as it's typically the last resort
};

/**
 * Retry monitoring and metrics configuration
 * 
 * Controls how retry operations are monitored and measured for observability.
 * These metrics are essential for tracking the health of the notification system
 * and identifying areas for improvement.
 */
export const RETRY_METRICS_CONFIG = {
  enabled: true,
  samplingRate: 1.0, // Sample 100% of retry operations for metrics
  detailedLogging: true, // Enable detailed logging of retry operations
  aggregationInterval: 60000, // Aggregate metrics every minute
  retentionPeriod: 604800000, // Keep metrics for 7 days
  alertOnFailureRate: 0.05, // Alert when failure rate exceeds 5%
  journeySpecificAlerts: {
    HEALTH: 0.03, // Lower threshold (3%) for health notifications
    CARE: 0.04, // Medium threshold (4%) for care notifications
    PLAN: 0.05, // Standard threshold (5%) for plan notifications
  },
};

/**
 * Complete retry configuration object
 * 
 * Exports all retry-related configurations as a single object for easy import
 * and usage throughout the notification service. This centralized configuration
 * ensures consistent retry behavior across all components.
 * 
 * This configuration is designed to support the notification service's requirements:
 * - Asynchronous retry policies with dead-letter queues for failed notifications
 * - Enhanced delivery channel fallback logic for improved reliability
 * - Integration with @austa/interfaces for standardized notification payload schemas
 * - Meeting the delivery time SLA of <30s (95th percentile)
 */
export const retryConfig = {
  default: DEFAULT_RETRY_CONFIG,
  exponentialBackoff: EXPONENTIAL_BACKOFF_CONFIG,
  linearBackoff: LINEAR_BACKOFF_CONFIG,
  fixedDelay: FIXED_DELAY_CONFIG,
  channelConfigs: CHANNEL_RETRY_CONFIGS,
  errorTypeConfigs: ERROR_TYPE_RETRY_CONFIGS,
  reasonCodeConfigs: REASON_CODE_RETRY_CONFIGS,
  priorityMultipliers: PRIORITY_RETRY_MULTIPLIERS,
  journeyModifiers: JOURNEY_RETRY_MODIFIERS,
  dlq: DLQ_CONFIG,
  timeouts: TIMEOUT_CONFIG,
  batchProcessing: BATCH_PROCESSING_CONFIG,
  circuitBreaker: CIRCUIT_BREAKER_CONFIG,
  fallbackChannels: FALLBACK_CHANNELS,
  metrics: RETRY_METRICS_CONFIG,
  
  /**
   * Helper method to get the appropriate retry configuration based on notification details
   * 
   * @param channel The notification channel (email, SMS, push, in-app)
   * @param errorType The type of error encountered (transient, client, system, external)
   * @param reasonCode Optional specific reason code for the error
   * @param priority Optional priority level of the notification
   * @param journey Optional journey context of the notification
   * @returns The appropriate retry configuration for the given parameters
   */
  getRetryConfig: (
    channel: NotificationChannel,
    errorType: ErrorType,
    reasonCode?: ReasonCode,
    priority?: NotificationPriority,
    journey?: 'HEALTH' | 'CARE' | 'PLAN'
  ): IRetryOptions => {
    // Start with the channel-specific configuration
    let config = { ...CHANNEL_RETRY_CONFIGS[channel] };
    
    // Apply error type specific configuration
    config = { ...config, ...ERROR_TYPE_RETRY_CONFIGS[errorType] };
    
    // Apply reason code specific configuration if available
    if (reasonCode && REASON_CODE_RETRY_CONFIGS[reasonCode]) {
      config = { ...config, ...REASON_CODE_RETRY_CONFIGS[reasonCode] };
    }
    
    // Apply priority multiplier if available
    if (priority) {
      const multiplier = PRIORITY_RETRY_MULTIPLIERS[priority];
      config.maxRetries = Math.ceil(config.maxRetries * multiplier);
      if ('initialDelay' in config) {
        config.initialDelay = Math.ceil(config.initialDelay / multiplier);
      }
      if ('maxDelay' in config) {
        config.maxDelay = Math.ceil(config.maxDelay / multiplier);
      }
    }
    
    // Apply journey-specific modifiers if available
    if (journey && JOURNEY_RETRY_MODIFIERS[journey]) {
      const modifier = JOURNEY_RETRY_MODIFIERS[journey];
      config.maxRetries = Math.ceil(config.maxRetries * modifier.maxRetriesModifier);
      if ('initialDelay' in config) {
        config.initialDelay = Math.ceil(config.initialDelay * modifier.initialDelayModifier);
      }
    }
    
    return config;
  },
};

export default retryConfig;