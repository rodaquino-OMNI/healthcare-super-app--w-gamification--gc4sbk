/**
 * Represents the status of a retry operation for event processing.
 */
export enum RetryStatus {
  /**
   * The operation should be retried after an appropriate delay.
   * Used for transient errors that may resolve on retry.
   */
  RETRY = 'retry',

  /**
   * The operation has failed permanently and should be sent to the dead letter queue.
   * Used for non-retryable errors or when maximum retry attempts have been exhausted.
   */
  DEAD_LETTER = 'dead_letter',

  /**
   * The operation has failed but should be ignored (not retried or sent to DLQ).
   * Used for events that are no longer relevant or have been superseded.
   */
  IGNORE = 'ignore',
}