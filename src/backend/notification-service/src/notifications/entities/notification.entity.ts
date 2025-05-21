import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'; // typeorm v0.3.0+

/**
 * Notification entity - represents a notification record stored in the database
 * 
 * Stores information about notifications sent to users including:
 * - The recipient user ID
 * - Notification type and content
 * - Delivery channel and status
 * - Retry information and failure tracking
 * - Timestamps for creation and updates
 */
@Entity()
@Index(['userId', 'status'])
@Index(['channel', 'status'])
@Index(['journeyContext', 'status'])
export class Notification {
  /**
   * Unique identifier for the notification
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID of the user who will receive this notification
   */
  @Column()
  @Index()
  userId: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment-reminder', 'claim-status')
   */
  @Column()
  @Index()
  type: string;

  /**
   * Notification title/headline
   */
  @Column()
  title: string;

  /**
   * Notification body content
   */
  @Column('text')
  body: string;

  /**
   * Delivery channel (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @Column()
  @Index()
  channel: string;

  /**
   * Current status of the notification
   * Possible values:
   * - 'pending': Initial state, notification is being processed
   * - 'sent': Successfully sent to the delivery channel
   * - 'delivered': Confirmed delivery to the user
   * - 'read': User has viewed the notification
   * - 'failed': Failed to deliver after all retry attempts
   * - 'retry-scheduled': Failed but scheduled for retry
   * - 'retry-in-progress': Currently being retried
   */
  @Column()
  @Index()
  status: string;

  /**
   * Detailed status message providing additional context about the current status
   * Especially useful for debugging failures and tracking retry progress
   */
  @Column({ type: 'text', nullable: true })
  statusMessage?: string;

  /**
   * Number of retry attempts made for this notification
   * Incremented each time a retry is attempted
   */
  @Column({ default: 0 })
  retryCount: number;

  /**
   * Timestamp when the next retry is scheduled
   * Null if no retry is scheduled or retries are exhausted
   */
  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt?: Date;

  /**
   * Error code if the notification failed
   * Useful for categorizing and analyzing failures
   */
  @Column({ nullable: true })
  errorCode?: string;

  /**
   * Journey context this notification belongs to (health, care, plan, game)
   * Used for filtering and analytics
   */
  @Column({ nullable: true })
  @Index()
  journeyContext?: string;

  /**
   * Timestamp when the notification was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the notification was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;
}