import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Notification } from './notification.entity';

/**
 * Enum representing the possible statuses of a notification delivery attempt
 */
export enum AttemptStatus {
  /**
   * The attempt is scheduled or in progress
   */
  PENDING = 'pending',
  
  /**
   * The attempt was successful and the notification was delivered
   */
  SUCCESS = 'success',
  
  /**
   * The attempt failed to deliver the notification
   */
  FAILURE = 'failure'
}

/**
 * NotificationAttempt entity - represents a single attempt to deliver a notification
 * 
 * This entity tracks detailed information about each individual attempt to deliver
 * a notification, including the channel used, timestamp, status, and any error details.
 * It enables comprehensive tracking of the notification delivery lifecycle and provides
 * the data needed for retry logic, troubleshooting, and delivery analytics.
 */
@Entity()
export class NotificationAttempt {
  /**
   * Unique identifier for the notification attempt
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Reference to the parent notification this attempt is for
   */
  @Column()
  notificationId: number;

  /**
   * Many-to-one relationship with the Notification entity
   */
  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  /**
   * Delivery channel used for this attempt (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @Column()
  channel: string;

  /**
   * The attempt number in the sequence (1 for first attempt, 2+ for retries)
   */
  @Column()
  attemptNumber: number;

  /**
   * Current status of this delivery attempt
   */
  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.PENDING
  })
  status: AttemptStatus;

  /**
   * Error message if the attempt failed
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /**
   * Error code if the attempt failed (provider-specific)
   */
  @Column({ nullable: true })
  errorCode: string | null;

  /**
   * Stack trace or detailed error information for troubleshooting
   */
  @Column({ type: 'text', nullable: true })
  errorDetails: string | null;

  /**
   * Provider-specific response data as JSON string
   * This can include delivery receipts, message IDs, or other provider metadata
   */
  @Column({ type: 'text', nullable: true })
  providerResponse: string | null;

  /**
   * Timestamp when this attempt was initiated
   */
  @CreateDateColumn()
  attemptedAt: Date;

  /**
   * Timestamp when the notification was delivered (only for successful attempts)
   */
  @Column({ nullable: true })
  deliveredAt: Date | null;

  /**
   * Time taken to process this attempt in milliseconds
   * Useful for performance monitoring and SLA tracking
   */
  @Column({ nullable: true })
  processingTimeMs: number | null;

  /**
   * Provider-specific identifier for this delivery attempt
   * (e.g., AWS SNS message ID, SendGrid message ID, etc.)
   */
  @Column({ nullable: true })
  providerMessageId: string | null;

  /**
   * IP address or endpoint used for delivery
   */
  @Column({ nullable: true })
  deliveryEndpoint: string | null;

  /**
   * Additional metadata about this attempt as JSON string
   * Can include device info, email client details, etc.
   */
  @Column({ type: 'text', nullable: true })
  metadata: string | null;
}