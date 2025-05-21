/**
 * Enum defining the available retry policy types used throughout the notification service.
 * These policies determine how retry intervals are calculated for failed operations.
 */
export enum PolicyType {
  /**
   * Exponential backoff policy increases the delay between retry attempts exponentially.
   * Each retry attempt waits longer than the previous one, helping to prevent overwhelming
   * the system or external service that's experiencing issues.
   * Formula: delay = initialDelay * (backoffFactor ^ attemptNumber)
   */
  EXPONENTIAL_BACKOFF = 'EXPONENTIAL_BACKOFF',

  /**
   * Linear policy increases the delay between retry attempts linearly.
   * Each retry attempt waits a fixed additional amount of time compared to the previous one.
   * Formula: delay = initialDelay + (attemptNumber * backoffFactor)
   */
  LINEAR = 'LINEAR',

  /**
   * Fixed interval policy uses the same delay between all retry attempts.
   * This is simpler but less adaptive to ongoing system issues.
   * Formula: delay = initialDelay (constant for all attempts)
   */
  FIXED = 'FIXED',
}