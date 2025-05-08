import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * Entity representing an item in the Dead Letter Queue (DLQ).
 * Stores failed notifications that couldn't be delivered after multiple retry attempts.
 */
@Entity()
@Index(['status', 'priority', 'createdAt']) // Index for efficient retrieval of pending items
@Index(['userId', 'status']) // Index for user-specific queries
export class DlqItem {
  /**
   * Unique identifier for the DLQ item
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID of the original notification that failed
   */
  @Column({ nullable: true })
  notificationId: number;

  /**
   * ID of the user who was to receive the notification
   */
  @Column()
  @Index()
  userId: string;

  /**
   * Delivery channel that failed (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @Column()
  channel: string;

  /**
   * Serialized payload of the notification
   * Contains the content and data that was to be delivered
   */
  @Column('text')
  payload: string;

  /**
   * Serialized error details that caused the notification to fail
   * Includes error message, stack trace, and context
   */
  @Column('text')
  errorDetails: string;

  /**
   * Serialized history of retry attempts
   * Includes timestamps, error messages, and retry counts
   */
  @Column('text')
  retryHistory: string;

  /**
   * Current status of the DLQ item
   * (e.g., 'pending', 'processing', 'processed', 'failed')
   */
  @Column({ default: 'pending' })
  @Index()
  status: string;

  /**
   * Priority of the DLQ item for processing
   * Lower values indicate higher priority
   */
  @Column({ default: 5 })
  priority: number;

  /**
   * Additional metadata for the DLQ item
   * Can include journey context, processing instructions, etc.
   */
  @Column('text', { nullable: true })
  metadata: string;

  /**
   * Optional notes about the DLQ item
   * Can be used for manual troubleshooting or documentation
   */
  @Column('text', { nullable: true })
  notes: string;

  /**
   * Timestamp when the DLQ item was processed
   */
  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  /**
   * Timestamp when the DLQ item was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the DLQ item was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;
}