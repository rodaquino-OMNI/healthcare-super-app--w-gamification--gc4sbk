/**
 * Default configuration values for retry policies in the notification service.
 * These values are optimized for different notification channels (push, email, SMS, in-app)
 * to ensure reliable delivery while meeting the service SLA of <30s (95th percentile).
 */

import { PolicyType } from './policy-types.constants';

/**
 * Default maximum retry attempts for each notification channel.
 * Values are based on expected reliability of each channel and notification priority.
 */
export const DEFAULT_MAX_RETRY_ATTEMPTS = {
  /**
   * Push notification services (FCM, APNs) typically have good reliability
   * but can experience temporary outages or throttling.
   */
  PUSH: {
    HIGH_PRIORITY: 5,    // Critical alerts, security notifications
    MEDIUM_PRIORITY: 3,   // Standard notifications
    LOW_PRIORITY: 2,      // Marketing, non-urgent updates
  },

  /**
   * Email delivery can be affected by server issues, throttling,
   * or temporary recipient server unavailability.
   */
  EMAIL: {
    HIGH_PRIORITY: 6,     // Critical account notifications, security alerts
    MEDIUM_PRIORITY: 4,    // Important updates, appointment reminders
    LOW_PRIORITY: 2,       // Marketing, newsletters
  },

  /**
   * SMS delivery can be affected by carrier issues, throttling,
   * or temporary recipient unavailability.
   */
  SMS: {
    HIGH_PRIORITY: 4,     // Critical alerts, authentication codes
    MEDIUM_PRIORITY: 3,    // Appointment reminders, important updates
    LOW_PRIORITY: 1,       // Marketing messages (limited retries due to cost)
  },

  /**
   * In-app notifications are delivered through WebSockets or Redis
   * and are generally the most reliable channel.
   */
  IN_APP: {
    HIGH_PRIORITY: 3,     // Critical alerts, security notifications
    MEDIUM_PRIORITY: 2,    // Standard notifications
    LOW_PRIORITY: 1,       // Low importance updates
  },
};

/**
 * Default initial delay (in milliseconds) before the first retry attempt.
 * Values are optimized based on the expected response time of each channel.
 */
export const DEFAULT_INITIAL_DELAY_MS = {
  PUSH: 1000,    // 1 second - Push notification services typically respond quickly
  EMAIL: 2000,   // 2 seconds - Email servers may take longer to respond
  SMS: 3000,     // 3 seconds - SMS gateways may have higher latency
  IN_APP: 500,   // 0.5 seconds - In-app delivery is typically very fast
};

/**
 * Default maximum delay (in milliseconds) between retry attempts.
 * This caps the exponential backoff to prevent excessive wait times.
 */
export const DEFAULT_MAX_DELAY_MS = {
  PUSH: 10000,   // 10 seconds
  EMAIL: 15000,  // 15 seconds
  SMS: 20000,    // 20 seconds
  IN_APP: 5000,  // 5 seconds
};

/**
 * Default backoff factor for exponential backoff policy.
 * The delay increases by this factor with each retry attempt.
 * Formula: delay = initialDelay * (backoffFactor ^ attemptNumber)
 */
export const DEFAULT_BACKOFF_FACTOR = {
  PUSH: 2.0,     // Doubles the delay with each retry
  EMAIL: 1.5,    // Increases delay by 50% with each retry
  SMS: 2.0,      // Doubles the delay with each retry
  IN_APP: 1.5,   // Increases delay by 50% with each retry
};

/**
 * Default jitter factor (0-1) to add randomness to retry delays.
 * This helps prevent the "thundering herd" problem where many clients
 * retry at exactly the same time after a failure.
 */
export const DEFAULT_JITTER_FACTOR = 0.3; // 30% randomness

/**
 * Default timeout (in milliseconds) for each retry attempt.
 * After this time, the attempt is considered failed even without a response.
 */
export const DEFAULT_TIMEOUT_MS = {
  PUSH: 5000,    // 5 seconds
  EMAIL: 10000,  // 10 seconds
  SMS: 8000,     // 8 seconds
  IN_APP: 3000,  // 3 seconds
};

/**
 * Default retry policy type for each notification channel.
 * Different channels may benefit from different retry strategies.
 */
export const DEFAULT_RETRY_POLICY = {
  PUSH: PolicyType.EXPONENTIAL_BACKOFF,
  EMAIL: PolicyType.EXPONENTIAL_BACKOFF,
  SMS: PolicyType.EXPONENTIAL_BACKOFF,
  IN_APP: PolicyType.EXPONENTIAL_BACKOFF,
};

/**
 * Complete default retry configuration for each notification channel.
 * This combines all the individual settings into a single configuration object.
 */
export const DEFAULT_RETRY_CONFIG = {
  PUSH: {
    policyType: DEFAULT_RETRY_POLICY.PUSH,
    maxAttempts: DEFAULT_MAX_RETRY_ATTEMPTS.PUSH.MEDIUM_PRIORITY,
    initialDelayMs: DEFAULT_INITIAL_DELAY_MS.PUSH,
    maxDelayMs: DEFAULT_MAX_DELAY_MS.PUSH,
    backoffFactor: DEFAULT_BACKOFF_FACTOR.PUSH,
    jitterFactor: DEFAULT_JITTER_FACTOR,
    timeoutMs: DEFAULT_TIMEOUT_MS.PUSH,
  },
  EMAIL: {
    policyType: DEFAULT_RETRY_POLICY.EMAIL,
    maxAttempts: DEFAULT_MAX_RETRY_ATTEMPTS.EMAIL.MEDIUM_PRIORITY,
    initialDelayMs: DEFAULT_INITIAL_DELAY_MS.EMAIL,
    maxDelayMs: DEFAULT_MAX_DELAY_MS.EMAIL,
    backoffFactor: DEFAULT_BACKOFF_FACTOR.EMAIL,
    jitterFactor: DEFAULT_JITTER_FACTOR,
    timeoutMs: DEFAULT_TIMEOUT_MS.EMAIL,
  },
  SMS: {
    policyType: DEFAULT_RETRY_POLICY.SMS,
    maxAttempts: DEFAULT_MAX_RETRY_ATTEMPTS.SMS.MEDIUM_PRIORITY,
    initialDelayMs: DEFAULT_INITIAL_DELAY_MS.SMS,
    maxDelayMs: DEFAULT_MAX_DELAY_MS.SMS,
    backoffFactor: DEFAULT_BACKOFF_FACTOR.SMS,
    jitterFactor: DEFAULT_JITTER_FACTOR,
    timeoutMs: DEFAULT_TIMEOUT_MS.SMS,
  },
  IN_APP: {
    policyType: DEFAULT_RETRY_POLICY.IN_APP,
    maxAttempts: DEFAULT_MAX_RETRY_ATTEMPTS.IN_APP.MEDIUM_PRIORITY,
    initialDelayMs: DEFAULT_INITIAL_DELAY_MS.IN_APP,
    maxDelayMs: DEFAULT_MAX_DELAY_MS.IN_APP,
    backoffFactor: DEFAULT_BACKOFF_FACTOR.IN_APP,
    jitterFactor: DEFAULT_JITTER_FACTOR,
    timeoutMs: DEFAULT_TIMEOUT_MS.IN_APP,
  },
};

/**
 * Multi-phase retry configuration for complex retry scenarios.
 * This implements a more sophisticated retry strategy with multiple phases:
 * 1. Immediate retry phase: Quick retries with minimal delay
 * 2. Pre-backoff phase: Short delays before applying exponential backoff
 * 3. Backoff phase: Exponential backoff with increasing delays
 * 4. Post-backoff phase: Maximum delay between retries
 */
export const MULTI_PHASE_RETRY_CONFIG = {
  PUSH: {
    immediateRetryPhase: {
      attempts: 1,          // 1 immediate retry
      delayMs: 0,          // No delay
    },
    preBackoffPhase: {
      attempts: 2,          // 2 retries before exponential backoff
      delayMs: 1000,       // 1 second delay
    },
    backoffPhase: {
      attempts: 3,          // 3 retries with exponential backoff
      initialDelayMs: 2000, // Starting with 2 seconds
      maxDelayMs: 10000,   // Maximum 10 seconds
      backoffFactor: 2.0,  // Double the delay each time
      jitterFactor: 0.3,   // 30% randomness
    },
    postBackoffPhase: {
      attempts: 2,          // 2 retries after backoff phase
      delayMs: 10000,      // 10 seconds delay
    },
    timeoutMs: 5000,       // 5 seconds timeout per attempt
  },
  EMAIL: {
    immediateRetryPhase: {
      attempts: 1,
      delayMs: 0,
    },
    preBackoffPhase: {
      attempts: 2,
      delayMs: 2000,       // 2 seconds
    },
    backoffPhase: {
      attempts: 3,
      initialDelayMs: 3000, // 3 seconds
      maxDelayMs: 15000,   // 15 seconds
      backoffFactor: 1.5,
      jitterFactor: 0.3,
    },
    postBackoffPhase: {
      attempts: 2,
      delayMs: 15000,      // 15 seconds
    },
    timeoutMs: 10000,      // 10 seconds
  },
  SMS: {
    immediateRetryPhase: {
      attempts: 1,
      delayMs: 0,
    },
    preBackoffPhase: {
      attempts: 1,
      delayMs: 3000,       // 3 seconds
    },
    backoffPhase: {
      attempts: 2,
      initialDelayMs: 5000, // 5 seconds
      maxDelayMs: 20000,   // 20 seconds
      backoffFactor: 2.0,
      jitterFactor: 0.3,
    },
    postBackoffPhase: {
      attempts: 1,
      delayMs: 20000,      // 20 seconds
    },
    timeoutMs: 8000,       // 8 seconds
  },
  IN_APP: {
    immediateRetryPhase: {
      attempts: 2,          // 2 immediate retries
      delayMs: 0,
    },
    preBackoffPhase: {
      attempts: 1,
      delayMs: 500,        // 0.5 seconds
    },
    backoffPhase: {
      attempts: 2,
      initialDelayMs: 1000, // 1 second
      maxDelayMs: 5000,    // 5 seconds
      backoffFactor: 1.5,
      jitterFactor: 0.3,
    },
    postBackoffPhase: {
      attempts: 0,          // No post-backoff phase for in-app
      delayMs: 0,
    },
    timeoutMs: 3000,       // 3 seconds
  },
};