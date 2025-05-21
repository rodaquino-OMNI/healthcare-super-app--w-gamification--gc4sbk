import { Entity, Column, PrimaryColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DlqEntryStatus } from '../types/dlq.types';

/**
 * Entity representing a Dead Letter Queue entry for failed Kafka message processing
 */
@Entity('dlq_entries')
export class DlqEntry {
  /**
   * Unique identifier for the DLQ entry
   */
  @PrimaryColumn('uuid')
  id: string;

  /**
   * The original topic the message was consumed from
   */
  @Column()
  @Index()
  originalTopic: string;

  /**
   * The DLQ topic the message was sent to
   */
  @Column()
  dlqTopic: string;

  /**
   * The consumer group that was processing the message
   */
  @Column()
  consumerGroup: string;

  /**
   * Correlation ID for distributed tracing
   */
  @Column({ nullable: true })
  @Index()
  correlationId?: string;

  /**
   * User ID associated with the message, if available
   */
  @Column({ nullable: true })
  @Index()
  userId?: string;

  /**
   * Journey type associated with the message (health, care, plan)
   */
  @Column({ nullable: true })
  @Index()
  journeyType?: string;

  /**
   * The serialized message payload
   */
  @Column('text')
  payload: string;

  /**
   * The serialized message headers
   */
  @Column('text')
  headers: string;

  /**
   * The message key, if available
   */
  @Column({ nullable: true })
  key?: string;

  /**
   * The partition the message was consumed from
   */
  @Column({ nullable: true })
  partition?: number;

  /**
   * The offset of the message in the partition
   */
  @Column({ nullable: true })
  offset?: string;

  /**
   * The timestamp of the original message
   */
  @Column({ type: 'timestamp', nullable: true })
  timestamp?: Date;

  /**
   * The classified error type
   */
  @Column()
  @Index()
  errorType: string;

  /**
   * The error message
   */
  @Column('text')
  errorMessage: string;

  /**
   * The error stack trace
   */
  @Column('text', { nullable: true })
  errorStack?: string;

  /**
   * The number of retry attempts that were made
   */
  @Column({ default: 0 })
  retryCount: number;

  /**
   * The current status of the DLQ entry
   */
  @Column({
    type: 'enum',
    enum: DlqEntryStatus,
    default: DlqEntryStatus.PENDING
  })
  @Index()
  status: DlqEntryStatus;

  /**
   * Timestamp when the entry was reprocessed
   */
  @Column({ type: 'timestamp', nullable: true })
  reprocessedAt?: Date;

  /**
   * Error message from reprocessing attempt, if any
   */
  @Column('text', { nullable: true })
  reprocessingErrorMessage?: string;

  /**
   * Error stack trace from reprocessing attempt, if any
   */
  @Column('text', { nullable: true })
  reprocessingErrorStack?: string;

  /**
   * Timestamp when the entry was resolved
   */
  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  /**
   * Resolution notes or explanation
   */
  @Column('text', { nullable: true })
  resolution?: string;

  /**
   * Creation timestamp
   */
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  /**
   * Last update timestamp
   */
  @UpdateDateColumn()
  updatedAt: Date;
}