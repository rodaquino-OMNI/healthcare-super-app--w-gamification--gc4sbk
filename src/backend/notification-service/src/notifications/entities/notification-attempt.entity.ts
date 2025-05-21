import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'; // typeorm v0.3.0+
import { Notification } from './notification.entity';

/**
 * Enum representing the possible statuses of a notification delivery attempt
 */
export enum AttemptStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILURE = 'failure'
}

/**
 * NotificationAttempt entity - tracks individual notification delivery attempts
 * 
 * Stores detailed information about each attempt to deliver a notification, including:
 * - The channel used for delivery
 * - Timestamp of the attempt
 * - Sequential attempt number
 * - Status outcome (pending, success, failure)
 * - Error details if the attempt failed
 * - Provider-specific response data for troubleshooting
 */
@Entity()
@Index(['notificationId', 'attemptNumber'])
@Index(['status', 'createdAt'])
@Index(['channel', 'status'])
export class NotificationAttempt {
  /**
   * Unique identifier for the notification attempt
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Reference to the parent notification
   */
  @Column()
  @Index()
  notificationId: number;

  /**
   * Many-to-one relationship with the Notification entity
   */
  @ManyToOne(() => Notification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  /**
   * Sequential number of this attempt (1 for first attempt, 2 for first retry, etc.)
   */
  @Column()
  attemptNumber: number;

  /**
   * Delivery channel used for this attempt (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @Column()
  @Index()
  channel: string;

  /**
   * Status of this delivery attempt
   */
  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.PENDING
  })
  @Index()
  status: AttemptStatus;

  /**
   * Error message if the attempt failed
   */
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  /**
   * Error code if the attempt failed
   * Useful for categorizing and analyzing failures
   */
  @Column({ nullable: true })
  errorCode?: string;

  /**
   * Provider-specific error code (if available)
   */
  @Column({ nullable: true })
  providerErrorCode?: string;

  /**
   * Raw response data from the provider
   * Stored as JSON for troubleshooting and auditing
   */
  @Column({ type: 'json', nullable: true })
  providerResponse?: Record<string, any>;

  /**
   * Duration of the attempt in milliseconds
   * Useful for performance monitoring and SLA tracking
   */
  @Column({ nullable: true })
  durationMs?: number;

  /**
   * Timestamp when the attempt was created/initiated
   */
  @CreateDateColumn()
  createdAt: Date;
}