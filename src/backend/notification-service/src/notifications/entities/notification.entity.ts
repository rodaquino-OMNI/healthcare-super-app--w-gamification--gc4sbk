import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'; // typeorm v0.3.0+
import { NotificationStatus, NotificationPriority } from '@austa/interfaces/notification/types';

/**
 * Notification entity - represents a notification record stored in the database
 * 
 * Stores information about notifications sent to users including:
 * - The recipient user ID
 * - Notification type and content
 * - Delivery channel and status
 * - Timestamps for creation and updates
 * - Retry tracking and failure information
 */
@Entity()
@Index(['userId', 'status']) // Index for faster queries by user and status
@Index(['status', 'updatedAt']) // Index for retry processing
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
   * (e.g., 'pending', 'sent', 'delivered', 'read', 'failed', 'retry-scheduled', 'retry-in-progress')
   */
  @Column({
    type: 'varchar',
    default: NotificationStatus.PENDING
  })
  @Index()
  status: string;

  /**
   * Priority level of the notification
   * Affects retry policies and delivery strategies
   */
  @Column({
    type: 'varchar',
    default: NotificationPriority.MEDIUM
  })
  priority: string;

  /**
   * Number of retry attempts made for this notification
   */
  @Column({ default: 0 })
  retryCount: number;

  /**
   * Last error message if notification delivery failed
   */
  @Column({ type: 'text', nullable: true })
  lastError: string;

  /**
   * Scheduled time for the next retry attempt
   */
  @Column({ type: 'timestamp', nullable: true })
  nextRetryTime: Date;

  /**
   * JSON string containing additional metadata for the notification
   * Can include journey context, retry information, and delivery tracking
   */
  @Column({ type: 'text', nullable: true })
  metadata: string;

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