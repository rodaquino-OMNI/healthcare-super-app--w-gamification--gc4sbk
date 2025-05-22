/**
 * Interfaces for configuring retry operations in the notification service.
 * These interfaces define the parameters for different retry strategies,
 * enabling fine-tuned control over retry behavior for different notification channels.
 */

import { RetryPolicyType } from '../constants/policy-types.constants';

/**
 * Defines the type of jitter to apply to retry delays.
 * Jitter adds randomness to retry timing to prevent the "thundering herd" problem
 * where many clients retry at exactly the same time after a failure.
 */
export enum JitterType {
  /**
   * No jitter - retry delays are exactly as calculated
   */
  NONE = 'none',

  /**
   * Full jitter - retry delay is a random value between 0 and the calculated delay
   * Formula: delay = random(0, calculatedDelay)
   */
  FULL = 'full',

  /**
   * Equal jitter - retry delay is half the calculated delay plus a random value
   * between 0 and half the calculated delay
   * Formula: delay = (calculatedDelay / 2) + random(0, calculatedDelay / 2)
   */
  EQUAL = 'equal',

  /**
   * Decorrelated jitter - retry delay is based on the previous delay
   * Formula: delay = min(maxDelay, random(baseDelay, previousDelay * 3))
   */
  DECORRELATED = 'decorrelated',
}

/**
 * Configuration for jitter applied to retry delays.
 */
export interface IJitterOptions {
  /**
   * The type of jitter to apply
   */
  type: JitterType;

  /**
   * The factor (0-1) that determines the maximum amount of jitter to apply
   * relative to the calculated delay. Only used for EQUAL and FULL jitter types.
   * Example: 0.3 means up to 30% randomness in the delay.
   */
  factor?: number;
}

/**
 * Base interface for retry options shared across all retry strategies.
 */
export interface IRetryOptions {
  /**
   * Maximum number of retry attempts before considering the operation as failed
   * and potentially moving it to the dead-letter queue.
   */
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry attempt.
   */
  initialDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   * This caps the delay to prevent excessive wait times in backoff strategies.
   */
  maxDelay?: number;

  /**
   * Configuration for adding randomness to retry delays to prevent
   * synchronized retries from multiple clients.
   */
  jitter?: IJitterOptions;

  /**
   * Timeout in milliseconds for each retry attempt.
   * After this time, the attempt is considered failed even without a response.
   */
  timeout?: number;

  /**
   * Whether to track and log detailed retry metrics for monitoring and analysis.
   */
  trackMetrics?: boolean;

  /**
   * The notification channel this retry configuration applies to.
   * If specified, this configuration will only be used for the specified channel.
   */
  channel?: 'push' | 'email' | 'sms' | 'in-app';

  /**
   * Priority level that affects retry behavior.
   * Higher priority notifications may have more aggressive retry strategies.
   */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Options specific to the fixed delay retry strategy.
 * This strategy uses the same delay for all retry attempts.
 */
export interface IFixedDelayOptions extends IRetryOptions {
  /**
   * The policy type identifier.
   */
  policyType: RetryPolicyType.FIXED;

  /**
   * Fixed delay in milliseconds between retry attempts.
   * This value is used for all retry attempts.
   */
  delay: number;
}

/**
 * Options specific to the exponential backoff retry strategy.
 * This strategy increases the delay exponentially with each retry attempt.
 */
export interface IExponentialBackoffOptions extends IRetryOptions {
  /**
   * The policy type identifier.
   */
  policyType: RetryPolicyType.EXPONENTIAL_BACKOFF;

  /**
   * The base multiplier for the exponential calculation.
   * Formula: delay = initialDelay * (backoffFactor ^ attemptNumber)
   * Default is 2, which doubles the delay with each retry.
   */
  backoffFactor: number;
}

/**
 * Options specific to the linear backoff retry strategy.
 * This strategy increases the delay by a fixed amount with each retry attempt.
 */
export interface ILinearBackoffOptions extends IRetryOptions {
  /**
   * The policy type identifier.
   */
  policyType: RetryPolicyType.LINEAR;

  /**
   * The fixed amount in milliseconds to increase the delay by on each attempt.
   * Formula: delay = initialDelay + (increment * attemptNumber)
   */
  increment: number;
}

/**
 * Union type of all retry option interfaces.
 * This allows functions to accept any valid retry configuration.
 */
export type RetryOptions = 
  | IFixedDelayOptions 
  | IExponentialBackoffOptions 
  | ILinearBackoffOptions;

/**
 * Configuration for a single phase in a multi-phase retry strategy.
 */
export interface IRetryPhaseOptions {
  /**
   * Number of retry attempts in this phase.
   */
  attempts: number;

  /**
   * Delay in milliseconds between retry attempts in this phase.
   * For fixed phases, this is the constant delay.
   * For backoff phases, this is the initial delay.
   */
  delayMs: number;

  /**
   * Maximum delay in milliseconds for this phase (for backoff phases).
   */
  maxDelayMs?: number;

  /**
   * Backoff factor for exponential backoff phases.
   */
  backoffFactor?: number;

  /**
   * Jitter factor (0-1) to add randomness to retry delays.
   */
  jitterFactor?: number;
}

/**
 * Configuration for a multi-phase retry strategy.
 * This allows for more sophisticated retry behavior with different
 * phases, such as immediate retries followed by exponential backoff.
 */
export interface IMultiPhaseRetryOptions {
  /**
   * Configuration for immediate retry attempts with minimal or no delay.
   * Useful for transient errors that might resolve immediately.
   */
  immediateRetryPhase?: IRetryPhaseOptions;

  /**
   * Configuration for retry attempts before applying exponential backoff.
   * These attempts use a fixed delay before moving to more aggressive backoff.
   */
  preBackoffPhase?: IRetryPhaseOptions;

  /**
   * Configuration for retry attempts with exponential backoff.
   * Delay increases exponentially with each attempt in this phase.
   */
  backoffPhase?: IRetryPhaseOptions;

  /**
   * Configuration for retry attempts after the backoff phase.
   * These attempts typically use the maximum delay for final retries.
   */
  postBackoffPhase?: IRetryPhaseOptions;

  /**
   * Timeout in milliseconds for each retry attempt across all phases.
   */
  timeoutMs?: number;

  /**
   * The notification channel this retry configuration applies to.
   */
  channel?: 'push' | 'email' | 'sms' | 'in-app';

  /**
   * Priority level that affects retry behavior.
   */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Configuration for channel-specific retry options.
 * This allows different retry strategies to be applied to different
 * notification channels.
 */
export interface IChannelRetryOptions {
  /**
   * Retry options for push notifications.
   */
  push?: RetryOptions | IMultiPhaseRetryOptions;

  /**
   * Retry options for email notifications.
   */
  email?: RetryOptions | IMultiPhaseRetryOptions;

  /**
   * Retry options for SMS notifications.
   */
  sms?: RetryOptions | IMultiPhaseRetryOptions;

  /**
   * Retry options for in-app notifications.
   */
  inApp?: RetryOptions | IMultiPhaseRetryOptions;

  /**
   * Default retry options to use when channel-specific options are not provided.
   */
  default?: RetryOptions | IMultiPhaseRetryOptions;
}