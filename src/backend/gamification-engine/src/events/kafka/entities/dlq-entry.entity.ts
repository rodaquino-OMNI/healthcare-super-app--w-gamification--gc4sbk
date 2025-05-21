import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { JourneyType } from '@austa/interfaces';
import { ErrorType } from '@app/shared/errors/error-type.enum';

/**
 * Entity representing an entry in the Dead Letter Queue (DLQ) for failed events
 * that have exhausted their retry attempts or encountered non-retryable errors.
 */
@Entity('gamification_dlq_entries')
export class DlqEntry {
  /**
   * Unique identifier for the DLQ entry
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the original event that failed processing
   */
  @Column({ name: 'event_id' })
  @Index()
  eventId: string;

  /**
   * User ID associated with the event
   */
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  /**
   * Type of the event that failed processing
   */
  @Column({ name: 'event_type' })
  @Index()
  eventType: string;

  /**
   * Journey context of the event (Health, Care, Plan)
   */
  @Column({
    name: 'journey_type',
    type: 'enum',
    enum: JourneyType,
    default: JourneyType.HEALTH,
  })
  @Index()
  journeyType: JourneyType;

  /**
   * Classification of the error that caused the event to be sent to DLQ
   */
  @Column({
    name: 'error_type',
    type: 'enum',
    enum: ErrorType,
    default: ErrorType.SYSTEM,
  })
  @Index()
  errorType: ErrorType;

  /**
   * Error message from the exception
   */
  @Column({ name: 'error_message', type: 'text' })
  errorMessage: string;

  /**
   * Error stack trace for debugging
   */
  @Column({ name: 'error_stack', type: 'text', nullable: true })
  errorStack?: string;

  /**
   * Number of retry attempts made before sending to DLQ
   */
  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  /**
   * Status of the DLQ entry
   * - PENDING: Awaiting resolution
   * - RESOLVED: Manually resolved without reprocessing
   * - REPROCESSED: Sent back to the original topic for processing
   */
  @Column({
    type: 'enum',
    enum: ['PENDING', 'RESOLVED', 'REPROCESSED'],
    default: 'PENDING',
  })
  @Index()
  status: 'PENDING' | 'RESOLVED' | 'REPROCESSED';

  /**
   * Timestamp when the entry was resolved or reprocessed
   */
  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt?: Date;

  /**
   * Notes about the resolution (e.g., manual action taken)
   */
  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes?: string;

  /**
   * Original event payload stored as JSON
   */
  @Column({ type: 'jsonb', name: 'payload' })
  payload: Record<string, any>;

  /**
   * Additional metadata about the failure
   */
  @Column({ type: 'jsonb', name: 'metadata', default: {} })
  metadata: Record<string, any>;

  /**
   * Timestamp when the entry was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the entry was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}