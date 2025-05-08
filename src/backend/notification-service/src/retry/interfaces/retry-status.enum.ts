/**
 * Enum representing the status of a retry operation.
 */
export enum RetryStatus {
  /**
   * The retry is pending execution at a future time.
   */
  PENDING = 'pending',

  /**
   * The retry is currently in progress.
   */
  IN_PROGRESS = 'in-progress',

  /**
   * The retry succeeded.
   */
  SUCCEEDED = 'succeeded',

  /**
   * The retry failed and will be retried again.
   */
  FAILED = 'failed',

  /**
   * All retry attempts have been exhausted.
   */
  EXHAUSTED = 'exhausted',

  /**
   * The retry was cancelled.
   */
  CANCELLED = 'cancelled'
}