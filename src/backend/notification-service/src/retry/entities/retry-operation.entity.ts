import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';
import { RetryStatus } from '../interfaces/retry-status.enum';
import { ErrorType } from '../constants/error-types.constants';
import { RetryPolicyType } from '../constants/policy-types.constants';

/**
 * Entity for tracking retry operations before they potentially end up in the dead-letter queue.
 * 
 * This entity stores essential retry metadata including:
 * - Operation ID and notification ID
 * - Operation type and retry status
 * - Attempt count and next scheduled retry time
 * - Error details from previous attempts
 * - Timestamps for auditing
 * 
 * It enables the notification service to implement retry with exponential backoff
 * for transient errors while maintaining an audit trail of retry attempts, which is
 * critical for meeting the notification service's delivery time SLA of <30s (95th percentile).
 */
@Entity()
export class RetryOperation {
  /**
   * Unique identifier for the retry operation
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID of the notification this retry operation is associated with
   */
  @Column()
  notificationId: number;

  /**
   * Relationship to the notification entity
   */
  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  /**
   * Type of operation being retried (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @Column()
  operationType: string;

  /**
   * Current status of the retry operation
   */
  @Column({
    type: 'enum',
    enum: RetryStatus,
    default: RetryStatus.PENDING
  })
  status: RetryStatus;

  /**
   * Number of retry attempts made so far
   */
  @Column({ default: 0 })
  attemptCount: number;

  /**
   * Maximum number of retry attempts allowed for this operation
   */
  @Column({ default: 3 })
  maxAttempts: number;

  /**
   * Scheduled time for the next retry attempt
   */
  @Column({ nullable: true, type: 'timestamp' })
  nextRetryTime: Date;

  /**
   * Type of error that caused the retry
   */
  @Column({
    type: 'enum',
    enum: ErrorType,
    nullable: true
  })
  errorType: ErrorType;

  /**
   * Error message from the last failed attempt
   */
  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  /**
   * Detailed error information in JSON format
   */
  @Column({ nullable: true, type: 'json' })
  errorDetails: Record<string, any>;

  /**
   * Type of retry policy being used
   */
  @Column({
    type: 'enum',
    enum: RetryPolicyType,
    default: RetryPolicyType.EXPONENTIAL_BACKOFF
  })
  retryPolicyType: RetryPolicyType;

  /**
   * Retry policy configuration in JSON format
   */
  @Column({ nullable: true, type: 'json' })
  retryPolicyConfig: Record<string, any>;

  /**
   * Original payload that was being processed when the error occurred
   */
  @Column({ nullable: true, type: 'json' })
  originalPayload: Record<string, any>;

  /**
   * Timestamp when the retry operation was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the retry operation was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Timestamp when the retry operation was completed (succeeded, exhausted, or cancelled)
   */
  @Column({ nullable: true, type: 'timestamp' })
  completedAt: Date;

  /**
   * Checks if the retry operation has been completed
   */
  isCompleted(): boolean {
    return [
      RetryStatus.SUCCEEDED,
      RetryStatus.EXHAUSTED,
      RetryStatus.CANCELLED
    ].includes(this.status);
  }

  /**
   * Checks if the retry operation can be retried again
   */
  canRetry(): boolean {
    return (
      this.status === RetryStatus.FAILED &&
      this.attemptCount < this.maxAttempts &&
      this.nextRetryTime <= new Date()
    );
  }

  /**
   * Checks if the retry operation has exhausted all retry attempts
   */
  isExhausted(): boolean {
    return this.attemptCount >= this.maxAttempts;
  }

  /**
   * Marks the retry operation as in progress
   */
  markInProgress(): void {
    this.status = RetryStatus.IN_PROGRESS;
  }

  /**
   * Marks the retry operation as succeeded
   */
  markSucceeded(): void {
    this.status = RetryStatus.SUCCEEDED;
    this.completedAt = new Date();
  }

  /**
   * Marks the retry operation as failed and increments the attempt count
   * 
   * @param errorType - Type of error that caused the failure
   * @param errorMessage - Error message from the failed attempt
   * @param errorDetails - Detailed error information
   * @param nextRetryTime - Scheduled time for the next retry attempt
   */
  markFailed(
    errorType: ErrorType,
    errorMessage: string,
    errorDetails: Record<string, any>,
    nextRetryTime: Date
  ): void {
    this.status = RetryStatus.FAILED;
    this.attemptCount += 1;
    this.errorType = errorType;
    this.errorMessage = errorMessage;
    this.errorDetails = errorDetails;
    this.nextRetryTime = nextRetryTime;

    if (this.isExhausted()) {
      this.markExhausted();
    }
  }

  /**
   * Marks the retry operation as exhausted (all retry attempts have been used)
   */
  markExhausted(): void {
    this.status = RetryStatus.EXHAUSTED;
    this.completedAt = new Date();
  }

  /**
   * Marks the retry operation as cancelled
   */
  markCancelled(): void {
    this.status = RetryStatus.CANCELLED;
    this.completedAt = new Date();
  }
}