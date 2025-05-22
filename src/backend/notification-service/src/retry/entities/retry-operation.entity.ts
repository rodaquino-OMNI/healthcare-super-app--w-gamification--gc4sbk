import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'; // typeorm v0.3.0+
import { Notification } from '../../notifications/entities/notification.entity';

/**
 * Enum representing the possible statuses of a retry operation
 */
export enum RetryStatus {
  PENDING = 'pending',    // Retry is scheduled but not yet attempted
  IN_PROGRESS = 'in_progress', // Retry is currently being processed
  SUCCEEDED = 'succeeded',  // Retry was successful
  FAILED = 'failed',      // Retry failed but may be retried again
  EXHAUSTED = 'exhausted',  // All retry attempts have been exhausted
  CANCELLED = 'cancelled'   // Retry was cancelled manually or by system
}

/**
 * Enum representing the types of operations that can be retried
 */
export enum OperationType {
  PUSH_NOTIFICATION = 'push_notification',
  EMAIL_DELIVERY = 'email_delivery',
  SMS_DELIVERY = 'sms_delivery',
  IN_APP_NOTIFICATION = 'in_app_notification',
  TEMPLATE_RENDERING = 'template_rendering',
  PREFERENCE_CHECK = 'preference_check',
  EXTERNAL_SERVICE_CALL = 'external_service_call'
}

/**
 * RetryOperation entity - represents a retry operation record stored in the database
 * 
 * Tracks retry attempts for notification delivery operations that may fail transiently.
 * Implements retry with exponential backoff for transient errors while maintaining
 * an audit trail of retry attempts, which is critical for meeting the notification
 * service's delivery time SLA of <30s (95th percentile).
 */
@Entity()
export class RetryOperation {
  /**
   * Unique identifier for the retry operation
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
   * Type of operation being retried
   */
  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.PUSH_NOTIFICATION
  })
  operationType: OperationType;

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
   * Maximum number of retry attempts allowed
   */
  @Column({ default: 5 })
  maxAttempts: number;

  /**
   * Base delay in milliseconds for exponential backoff calculation
   */
  @Column({ default: 1000 }) // 1 second base delay
  baseDelayMs: number;

  /**
   * Timestamp when the next retry should be attempted
   */
  @Column({ nullable: true })
  nextRetryAt: Date;

  /**
   * Error message from the last failed attempt
   */
  @Column({ type: 'text', nullable: true })
  lastErrorMessage: string;

  /**
   * Error code from the last failed attempt
   */
  @Column({ nullable: true })
  lastErrorCode: string;

  /**
   * Structured error context data from the last failed attempt
   * Stored as JSON string for flexibility
   */
  @Column({ type: 'text', nullable: true })
  errorContext: string;

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
   * Calculate the next retry time using exponential backoff
   * Formula: baseDelay * (2 ^ attemptCount) + random jitter
   * 
   * @returns Date object representing when the next retry should occur
   */
  calculateNextRetryTime(): Date {
    // Exponential backoff formula with jitter
    const exponentialDelay = this.baseDelayMs * Math.pow(2, this.attemptCount);
    
    // Add random jitter (0-20% of the delay) to prevent thundering herd problem
    const jitter = Math.random() * 0.2 * exponentialDelay;
    
    // Calculate total delay with jitter
    const totalDelayMs = exponentialDelay + jitter;
    
    // Create new date object with the calculated delay
    const nextRetryTime = new Date();
    nextRetryTime.setTime(nextRetryTime.getTime() + totalDelayMs);
    
    return nextRetryTime;
  }

  /**
   * Update the retry operation for the next attempt
   * Increments attempt count and calculates the next retry time
   */
  prepareForNextAttempt(): void {
    this.attemptCount += 1;
    this.status = RetryStatus.PENDING;
    this.nextRetryAt = this.calculateNextRetryTime();
    
    // Check if we've exhausted all retry attempts
    if (this.attemptCount >= this.maxAttempts) {
      this.status = RetryStatus.EXHAUSTED;
      this.nextRetryAt = null;
    }
  }

  /**
   * Record a failed retry attempt with error details
   * 
   * @param errorMessage The error message from the failed attempt
   * @param errorCode The error code from the failed attempt
   * @param context Additional context about the error (will be JSON stringified)
   */
  recordFailure(errorMessage: string, errorCode?: string, context?: Record<string, any>): void {
    this.status = RetryStatus.FAILED;
    this.lastErrorMessage = errorMessage;
    this.lastErrorCode = errorCode || 'UNKNOWN_ERROR';
    
    if (context) {
      this.errorContext = JSON.stringify(context);
    }
    
    this.prepareForNextAttempt();
  }

  /**
   * Mark the retry operation as successful
   */
  markAsSucceeded(): void {
    this.status = RetryStatus.SUCCEEDED;
    this.nextRetryAt = null;
  }

  /**
   * Cancel the retry operation
   * 
   * @param reason Optional reason for cancellation
   */
  cancel(reason?: string): void {
    this.status = RetryStatus.CANCELLED;
    this.nextRetryAt = null;
    
    if (reason) {
      this.lastErrorMessage = `Cancelled: ${reason}`;
    }
  }
}