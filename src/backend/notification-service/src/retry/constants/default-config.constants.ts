/**
 * Default configuration values for retry policies in the notification service.
 * These values are optimized for different notification channels and priorities
 * to ensure reliable delivery while meeting the service SLA of <30s (95th percentile).
 */

import { IExponentialBackoffOptions, IFixedDelayOptions, IRetryOptions } from '../interfaces/retry-options.interface';

/**
 * Notification priority levels that affect retry behavior.
 * Higher priority notifications have more aggressive retry strategies.
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Default timeout values (in milliseconds) for different notification channels.
 * These values are used to determine when a request should be considered failed.
 */
export const DEFAULT_TIMEOUTS = {
  PUSH: 5000,    // 5 seconds for push notification services (FCM, APNs)
  EMAIL: 10000,  // 10 seconds for email services (SendGrid, SES)
  SMS: 15000,    // 15 seconds for SMS services (Twilio, SNS)
  IN_APP: 3000   // 3 seconds for in-app notifications (WebSocket, Redis)
};

/**
 * Maximum number of retry attempts for each notification channel.
 * These values are balanced to ensure delivery while avoiding excessive retries.
 */
export const MAX_RETRY_ATTEMPTS = {
  PUSH: 5,       // Mobile push notifications
  EMAIL: 3,      // Email notifications
  SMS: 3,        // SMS notifications
  IN_APP: 3      // In-app notifications
};

/**
 * Initial delay (in milliseconds) before the first retry attempt for each channel.
 * These values are optimized based on typical response times of external providers.
 */
export const INITIAL_RETRY_DELAYS = {
  PUSH: 1000,    // 1 second for push notifications
  EMAIL: 5000,   // 5 seconds for email
  SMS: 5000,     // 5 seconds for SMS
  IN_APP: 1000   // 1 second for in-app notifications
};

/**
 * Maximum delay (in milliseconds) between retry attempts for each channel.
 * These caps prevent excessive waiting times for notifications.
 */
export const MAX_RETRY_DELAYS = {
  PUSH: 60000,     // 1 minute for push notifications
  EMAIL: 3600000,  // 1 hour for email
  SMS: 1800000,    // 30 minutes for SMS
  IN_APP: 30000    // 30 seconds for in-app notifications
};

/**
 * Backoff factors for exponential backoff strategy for each channel.
 * These determine how quickly the delay increases between retry attempts.
 */
export const BACKOFF_FACTORS = {
  PUSH: 2,    // Doubles the delay each time
  EMAIL: 2,   // Doubles the delay each time
  SMS: 2,     // Doubles the delay each time
  IN_APP: 1.5 // Increases delay by 50% each time
};

/**
 * Whether to apply jitter (randomization) to retry delays for each channel.
 * Jitter helps prevent thundering herd problems when many retries occur simultaneously.
 */
export const APPLY_JITTER = {
  PUSH: true,
  EMAIL: true,
  SMS: true,
  IN_APP: false // Less important for in-app as they're typically handled by our own infrastructure
};

/**
 * Priority-based multipliers that adjust retry parameters based on notification priority.
 * Higher priority notifications get more aggressive retry strategies.
 */
export const PRIORITY_MULTIPLIERS = {
  [NotificationPriority.LOW]: {
    maxRetries: 0.5,      // Fewer retries for low priority
    initialDelay: 2,      // Longer initial delay
    maxDelay: 1,          // Standard max delay
    backoffFactor: 0.8    // Slower backoff
  },
  [NotificationPriority.MEDIUM]: {
    maxRetries: 1,         // Standard number of retries
    initialDelay: 1,       // Standard initial delay
    maxDelay: 1,           // Standard max delay
    backoffFactor: 1       // Standard backoff
  },
  [NotificationPriority.HIGH]: {
    maxRetries: 1.5,        // More retries for high priority
    initialDelay: 0.7,      // Shorter initial delay
    maxDelay: 0.8,          // Lower max delay
    backoffFactor: 1.2      // Faster backoff
  },
  [NotificationPriority.CRITICAL]: {
    maxRetries: 2,          // Maximum retries for critical notifications
    initialDelay: 0.5,      // Minimum initial delay
    maxDelay: 0.5,          // Lower max delay
    backoffFactor: 1.5      // Fastest backoff
  }
};

/**
 * Default retry options for push notifications using exponential backoff.
 */
export const DEFAULT_PUSH_RETRY_OPTIONS: IExponentialBackoffOptions = {
  maxRetries: MAX_RETRY_ATTEMPTS.PUSH,
  initialDelay: INITIAL_RETRY_DELAYS.PUSH,
  maxDelay: MAX_RETRY_DELAYS.PUSH,
  backoffFactor: BACKOFF_FACTORS.PUSH,
  jitter: APPLY_JITTER.PUSH,
  timeout: DEFAULT_TIMEOUTS.PUSH
};

/**
 * Default retry options for email notifications using exponential backoff.
 */
export const DEFAULT_EMAIL_RETRY_OPTIONS: IExponentialBackoffOptions = {
  maxRetries: MAX_RETRY_ATTEMPTS.EMAIL,
  initialDelay: INITIAL_RETRY_DELAYS.EMAIL,
  maxDelay: MAX_RETRY_DELAYS.EMAIL,
  backoffFactor: BACKOFF_FACTORS.EMAIL,
  jitter: APPLY_JITTER.EMAIL,
  timeout: DEFAULT_TIMEOUTS.EMAIL
};

/**
 * Default retry options for SMS notifications using exponential backoff.
 */
export const DEFAULT_SMS_RETRY_OPTIONS: IExponentialBackoffOptions = {
  maxRetries: MAX_RETRY_ATTEMPTS.SMS,
  initialDelay: INITIAL_RETRY_DELAYS.SMS,
  maxDelay: MAX_RETRY_DELAYS.SMS,
  backoffFactor: BACKOFF_FACTORS.SMS,
  jitter: APPLY_JITTER.SMS,
  timeout: DEFAULT_TIMEOUTS.SMS
};

/**
 * Default retry options for in-app notifications using fixed delay.
 */
export const DEFAULT_IN_APP_RETRY_OPTIONS: IFixedDelayOptions = {
  maxRetries: MAX_RETRY_ATTEMPTS.IN_APP,
  initialDelay: INITIAL_RETRY_DELAYS.IN_APP,
  jitter: APPLY_JITTER.IN_APP,
  timeout: DEFAULT_TIMEOUTS.IN_APP
};

/**
 * Default retry options for each notification channel.
 * These are used when no specific options are provided.
 */
export const DEFAULT_CHANNEL_RETRY_OPTIONS: Record<string, IRetryOptions> = {
  'push': DEFAULT_PUSH_RETRY_OPTIONS,
  'email': DEFAULT_EMAIL_RETRY_OPTIONS,
  'sms': DEFAULT_SMS_RETRY_OPTIONS,
  'in-app': DEFAULT_IN_APP_RETRY_OPTIONS
};

/**
 * Adjusts retry options based on notification priority.
 * 
 * @param options - Base retry options
 * @param priority - Notification priority
 * @returns Adjusted retry options
 */
export function getRetryOptionsForPriority(
  options: IRetryOptions,
  priority: NotificationPriority = NotificationPriority.MEDIUM
): IRetryOptions {
  const multipliers = PRIORITY_MULTIPLIERS[priority];
  
  // Create a copy of the options to avoid modifying the original
  const adjustedOptions = { ...options };
  
  // Apply multipliers to the options
  if (adjustedOptions.maxRetries !== undefined) {
    adjustedOptions.maxRetries = Math.max(
      1, 
      Math.round(adjustedOptions.maxRetries * multipliers.maxRetries)
    );
  }
  
  if (adjustedOptions.initialDelay !== undefined) {
    adjustedOptions.initialDelay = Math.max(
      100, 
      Math.round(adjustedOptions.initialDelay * multipliers.initialDelay)
    );
  }
  
  if ('maxDelay' in adjustedOptions && adjustedOptions.maxDelay !== undefined) {
    adjustedOptions.maxDelay = Math.max(
      adjustedOptions.initialDelay * 2,
      Math.round(adjustedOptions.maxDelay * multipliers.maxDelay)
    );
  }
  
  if ('backoffFactor' in adjustedOptions && adjustedOptions.backoffFactor !== undefined) {
    adjustedOptions.backoffFactor = Math.max(
      1.1,
      adjustedOptions.backoffFactor * multipliers.backoffFactor
    );
  }
  
  return adjustedOptions;
}

/**
 * Gets retry options for a specific channel and priority.
 * 
 * @param channel - Notification channel
 * @param priority - Notification priority
 * @returns Retry options for the specified channel and priority
 */
export function getChannelRetryOptions(
  channel: string,
  priority: NotificationPriority = NotificationPriority.MEDIUM
): IRetryOptions {
  const baseOptions = DEFAULT_CHANNEL_RETRY_OPTIONS[channel] || DEFAULT_PUSH_RETRY_OPTIONS;
  return getRetryOptionsForPriority(baseOptions, priority);
}