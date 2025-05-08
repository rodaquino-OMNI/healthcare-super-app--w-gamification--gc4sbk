import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';

/**
 * Interface for Dead Letter Queue entries
 * Represents notifications that have failed delivery after exhausting retry attempts
 */
export interface IDlqEntry {
  id: number;
  notificationId: number;
  userId: string;
  channel: string;
  payload: Record<string, any>;
  errorDetails: {
    message: string;
    code: string;
    type: string;
    stack?: string;
    context?: Record<string, any>;
  };
  retryHistory: {
    timestamp: Date;
    attempt: number;
    error: string;
    policy: string;
    delayMs?: number;
  }[];
  maxRetryCount: number;
  lastRetryAttempt: number;
  journeyContext?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dead Letter Queue Entry Entity
 * 
 * Stores information about notification delivery attempts that have permanently failed
 * after exhausting all retry attempts. This entity is used for:
 * - Error tracking and analysis
 * - Manual intervention and reprocessing
 * - Notification reliability monitoring
 * - Identifying patterns in delivery failures
 * - Journey-specific error classification and reporting
 */
@Entity('dlq_entries')
@Index(['userId', 'channel'], { name: 'idx_dlq_user_channel' })
@Index(['notificationId'], { name: 'idx_dlq_notification_id' })
@Index(['errorDetails.type'], { name: 'idx_dlq_error_type' })
@Index(['journeyContext'], { name: 'idx_dlq_journey_context' })
export class DlqEntry implements IDlqEntry {
  /**
   * Unique identifier for the DLQ entry
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Reference to the original notification ID that failed
   */
  @Column()
  notificationId: number;

  /**
   * ID of the user who was the intended recipient of the notification
   */
  @Column()
  userId: string;

  /**
   * Delivery channel that failed (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @Column()
  channel: string;

  /**
   * Original notification payload that failed to deliver
   * Stored as JSON to preserve the exact data that failed
   */
  @Column('jsonb')
  payload: Record<string, any>;

  /**
   * Detailed error information about the final failure
   * Includes error message, code, type, stack trace, and context
   * Error types follow the classification in the error handling strategy:
   * - Client errors (4xx): Invalid input, authentication issues
   * - System errors (5xx): Internal failures, database errors
   * - Transient errors: Network timeouts, temporary unavailability
   * - External dependency errors: Third-party system failures
   */
  @Column('jsonb')
  errorDetails: {
    message: string;
    code: string;
    type: string;
    stack?: string;
    context?: Record<string, any>;
  };

  /**
   * Complete history of retry attempts for this notification
   * Each entry includes timestamp, attempt number, error message, retry policy used, and delay
   */
  @Column('jsonb')
  retryHistory: {
    timestamp: Date;
    attempt: number;
    error: string;
    policy: string;
    delayMs?: number;
  }[];
  
  /**
   * Maximum number of retry attempts configured for this notification
   */
  @Column({ default: 3 })
  maxRetryCount: number;
  
  /**
   * The last retry attempt number that was executed
   */
  @Column({ default: 0 })
  lastRetryAttempt: number;
  
  /**
   * The journey context this notification belongs to (health, care, plan)
   * Used for journey-specific error reporting and analysis
   */
  @Column({ nullable: true })
  journeyContext?: string;

  /**
   * Relationship to the original notification entity
   * Allows for comprehensive tracking and potential reprocessing
   */
  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  /**
   * Timestamp when the entry was added to the DLQ
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the entry was last updated
   * Used for tracking manual resolution attempts
   */
  @UpdateDateColumn()
  updatedAt: Date;
}