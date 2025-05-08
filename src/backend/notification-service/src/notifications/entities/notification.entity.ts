import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'; // typeorm v0.3.0+
import { NotificationAttempt } from './notification-attempt.entity';

/**
 * Enum representing the possible notification channels
 */
export enum NotificationChannel {
  /**
   * Push notification to mobile device
   */
  PUSH = 'push',
  
  /**
   * Email notification
   */
  EMAIL = 'email',
  
  /**
   * SMS text message
   */
  SMS = 'sms',
  
  /**
   * In-app notification displayed within the application
   */
  IN_APP = 'in-app'
}

/**
 * Enum representing the possible statuses of a notification
 */
export enum NotificationStatus {
  /**
   * Notification is created but not yet processed
   */
  PENDING = 'pending',
  
  /**
   * Notification is currently being processed for delivery
   */
  PROCESSING = 'processing',
  
  /**
   * Notification has been sent but delivery confirmation is pending
   */
  SENT = 'sent',
  
  /**
   * Notification has been successfully delivered to the recipient
   */
  DELIVERED = 'delivered',
  
  /**
   * Notification delivery has failed after all retry attempts
   */
  FAILED = 'failed',
  
  /**
   * Notification has been cancelled before delivery
   */
  CANCELLED = 'cancelled',
  
  /**
   * Notification is scheduled for future delivery
   */
  SCHEDULED = 'scheduled'
}

/**
 * Notification entity - represents a notification record stored in the database
 * 
 * Stores information about notifications sent to users including:
 * - The recipient user ID
 * - Notification type and content
 * - Delivery channel and status
 * - Retry and fallback configuration
 * - Delivery tracking and confirmation
 * - Timestamps for creation, updates, and delivery
 */
@Entity()
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
  userId: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment-reminder', 'claim-status')
   */
  @Column()
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
   * Primary delivery channel for this notification
   */
  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.PUSH
  })
  channel: NotificationChannel;

  /**
   * Current status of the notification
   */
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING
  })
  status: NotificationStatus;

  /**
   * Number of delivery attempts made so far
   * Incremented after each attempt, regardless of success or failure
   */
  @Column({ default: 0 })
  retryCount: number;

  /**
   * Maximum number of delivery attempts allowed
   * After this many failures, the notification will be marked as FAILED
   * and moved to the dead-letter queue
   */
  @Column({ default: 3 })
  maxRetries: number;

  /**
   * Detailed reason for failure if delivery was unsuccessful
   * Stores the most recent error message
   */
  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  /**
   * Array of fallback channels to try if the primary channel fails
   * Stored as a JSON array of NotificationChannel enum values
   */
  @Column({ type: 'simple-array', nullable: true })
  fallbackChannels: NotificationChannel[] | null;

  /**
   * Flag indicating whether delivery has been confirmed
   * Set to true when a delivery receipt is received
   */
  @Column({ default: false })
  deliveryConfirmed: boolean;

  /**
   * Timestamp when the notification was successfully delivered
   * Only set when delivery is confirmed
   */
  @Column({ nullable: true })
  deliveredAt: Date | null;

  /**
   * Timestamp when the notification is scheduled to be sent
   * Only used for SCHEDULED notifications
   */
  @Column({ nullable: true })
  scheduledFor: Date | null;

  /**
   * Priority level of the notification (higher values indicate higher priority)
   * Used for ordering notification processing
   */
  @Column({ default: 1 })
  priority: number;

  /**
   * Additional data related to the notification as a JSON string
   * Can include journey-specific context, deep links, or other metadata
   */
  @Column({ type: 'text', nullable: true })
  metadata: string | null;

  /**
   * ID of the event that triggered this notification
   * Used for tracing and correlation with event sources
   */
  @Column({ nullable: true })
  eventId: string | null;

  /**
   * Source journey or service that generated this notification
   * (e.g., 'health', 'care', 'plan', 'gamification')
   */
  @Column({ nullable: true })
  source: string | null;

  /**
   * One-to-many relationship with NotificationAttempt entities
   * Tracks all delivery attempts for this notification
   */
  @OneToMany(() => NotificationAttempt, attempt => attempt.notification)
  attempts: NotificationAttempt[];

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