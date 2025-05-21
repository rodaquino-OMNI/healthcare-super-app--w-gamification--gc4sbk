/**
 * Defines the available retry policy types used throughout the notification service.
 * These policies determine how the system handles retry attempts for failed operations,
 * particularly for notification delivery across different channels.
 */
export enum RetryPolicyType {
  /**
   * Exponential backoff increases the delay between retry attempts exponentially (typically doubling)
   * after each failed attempt. This approach is ideal for handling transient failures by
   * progressively giving the system more time to recover, while reducing load during periods
   * of high contention or service degradation.
   * 
   * Formula: delay = initialDelay * (multiplier ^ attemptNumber)
   * Example: 100ms, 200ms, 400ms, 800ms, 1600ms, etc.
   */
  EXPONENTIAL_BACKOFF = 'exponential_backoff',

  /**
   * Linear backoff increases the delay between retry attempts by a fixed amount after each
   * failed attempt. This provides a more gradual and predictable increase in wait time
   * compared to exponential backoff, suitable for services with known recovery patterns.
   * 
   * Formula: delay = initialDelay + (increment * attemptNumber)
   * Example: 100ms, 200ms, 300ms, 400ms, 500ms, etc.
   */
  LINEAR = 'linear',

  /**
   * Fixed interval maintains a constant delay between retry attempts. This is the simplest
   * form of retry policy, appropriate for operations with consistent recovery times or
   * when predictable timing is required.
   * 
   * Formula: delay = fixedDelay
   * Example: 500ms, 500ms, 500ms, 500ms, etc.
   */
  FIXED = 'fixed',
}

/**
 * Interface for retry policy configuration options.
 * Provides type safety for policy-specific parameters.
 */
export interface RetryPolicyOptions {
  /**
   * Maximum number of retry attempts before considering the operation as failed
   */
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry attempt
   */
  initialDelayMs: number;

  /**
   * Maximum delay in milliseconds between retry attempts (applies to exponential and linear policies)
   * to prevent extremely long wait times
   */
  maxDelayMs?: number;

  /**
   * For LINEAR policy: The fixed amount in milliseconds to increase delay by on each attempt
   * For EXPONENTIAL_BACKOFF policy: The multiplier to apply to the delay on each attempt (typically 2)
   */
  factor?: number;

  /**
   * Whether to apply jitter (randomness) to the delay to prevent synchronized retries
   * from multiple clients, which can cause additional load spikes
   */
  useJitter?: boolean;

  /**
   * Maximum jitter in milliseconds to apply to the delay (if useJitter is true)
   * The actual jitter will be a random value between 0 and this value
   */
  jitterMaxMs?: number;
}

/**
 * Maps retry policy types to their default configuration values.
 * These defaults can be overridden when creating a retry policy instance.
 */
export const DEFAULT_RETRY_POLICY_OPTIONS: Record<RetryPolicyType, RetryPolicyOptions> = {
  [RetryPolicyType.EXPONENTIAL_BACKOFF]: {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 30000, // 30 seconds
    factor: 2, // Double the delay on each attempt
    useJitter: true,
    jitterMaxMs: 100,
  },
  [RetryPolicyType.LINEAR]: {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 10000, // 10 seconds
    factor: 500, // Increase delay by 500ms on each attempt
    useJitter: true,
    jitterMaxMs: 50,
  },
  [RetryPolicyType.FIXED]: {
    maxRetries: 3,
    initialDelayMs: 1000, // Fixed 1 second delay between attempts
    useJitter: false,
  },
};

/**
 * Type guard to check if a string is a valid RetryPolicyType
 * @param type The string to check
 * @returns True if the string is a valid RetryPolicyType, false otherwise
 */
export function isValidRetryPolicyType(type: string): type is RetryPolicyType {
  return Object.values(RetryPolicyType).includes(type as RetryPolicyType);
}

/**
 * Returns the appropriate retry policy options for the given policy type,
 * with optional custom overrides.
 * 
 * @param policyType The type of retry policy to use
 * @param overrides Optional custom configuration to override defaults
 * @returns The combined retry policy options
 */
export function getRetryPolicyOptions(
  policyType: RetryPolicyType,
  overrides?: Partial<RetryPolicyOptions>
): RetryPolicyOptions {
  const defaultOptions = DEFAULT_RETRY_POLICY_OPTIONS[policyType];
  return {
    ...defaultOptions,
    ...overrides,
  };
}