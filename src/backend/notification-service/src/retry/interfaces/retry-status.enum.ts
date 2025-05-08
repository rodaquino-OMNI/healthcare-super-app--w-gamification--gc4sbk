/**
 * Enum representing the possible states of a retry operation.
 * 
 * This enum is used throughout the retry module to track the status of operations
 * being retried and to determine appropriate actions. It provides type safety and
 * consistency for retry status references across the notification service.
 */
export enum RetryStatus {
  /**
   * The retry operation is scheduled but has not yet been executed.
   * Operations in this state are waiting in the retry queue for their next attempt.
   */
  PENDING = 'PENDING',

  /**
   * The retry operation is currently being executed.
   * Operations in this state are actively being processed by the retry service.
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * The retry operation has completed successfully.
   * Operations in this state have been successfully processed after one or more retry attempts.
   */
  SUCCEEDED = 'SUCCEEDED',

  /**
   * The retry operation has failed but can be retried again.
   * Operations in this state have encountered a temporary failure and will be
   * scheduled for another retry attempt if the maximum retry count has not been reached.
   */
  FAILED = 'FAILED',

  /**
   * The retry operation has permanently failed after exhausting all retry attempts.
   * Operations in this state will be moved to the dead-letter queue (DLQ) for
   * manual inspection and potential resolution.
   */
  EXHAUSTED = 'EXHAUSTED'
}