/**
 * Enum representing the possible states of a retry operation.
 * 
 * Used throughout the retry module to track the status of operations being retried
 * and to determine appropriate actions based on the current status.
 */
export enum RetryStatus {
  /**
   * The retry operation is scheduled but has not yet been executed.
   * This is the initial state for operations that are queued for retry.
   */
  PENDING = 'PENDING',

  /**
   * The retry operation is currently being executed.
   * This state indicates an active retry attempt in progress.
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * The retry operation has completed successfully.
   * No further retry attempts are needed.
   */
  SUCCEEDED = 'SUCCEEDED',

  /**
   * The retry operation has failed temporarily but is eligible for another retry attempt.
   * This state indicates a transient error that may be resolved in subsequent attempts.
   */
  FAILED = 'FAILED',

  /**
   * The retry operation has permanently failed after exhausting all retry attempts.
   * This state indicates that the maximum number of retries has been reached
   * or that the error is non-recoverable.
   */
  EXHAUSTED = 'EXHAUSTED'
}