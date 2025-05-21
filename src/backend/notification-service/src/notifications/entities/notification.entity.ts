import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'; // typeorm v0.3.0+

/**
 * Enum representing the possible notification channels
 */
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in-app'
}

/**
 * Enum representing the possible notification statuses
 */
export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled'
}

/**
 * Entity representing a notification attempt
 * This is a forward reference to avoid circular dependencies
 */
export class NotificationAttempt {}

/**
 * Notification entity - represents a notification record stored in the database
 * 
 * Stores information about notifications sent to users including:
 * - The recipient user ID
 * - Notification type and content
 * - Delivery channel and status
 * - Retry and fallback information
 * - Delivery confirmation
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
   * Delivery channel (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP
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
   * Number of retry attempts made for this notification
   */
  @Column({ default: 0 })
  retryCount: number;

  /**
   * Maximum number of retry attempts allowed for this notification
   */
  @Column({ default: 3 })
  maxRetries: number;

  /**
   * Detailed reason for failure if the notification failed
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
   * Flag indicating whether delivery was confirmed
   */
  @Column({ default: false })
  deliveryConfirmed: boolean;

  /**
   * Timestamp when the notification was delivered
   */
  @Column({ nullable: true })
  deliveredAt: Date | null;

  /**
   * Relationship with notification attempts
   * Each notification can have multiple delivery attempts
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