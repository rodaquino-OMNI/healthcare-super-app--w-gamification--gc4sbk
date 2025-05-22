import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { IDlqEntry } from '../interfaces/dlq-entry.interface';
import { Notification } from '../../notifications/entities/notification.entity';

/**
 * Dead Letter Queue Entry Entity
 * 
 * Represents a failed notification that has exhausted all retry attempts and has been
 * moved to the dead letter queue for manual inspection and potential reprocessing.
 * 
 * This entity stores comprehensive information about the failure including:
 * - Original notification details
 * - Complete error information
 * - Retry history with timestamps and error messages
 * - Metadata for analysis and troubleshooting
 */
@Entity('dlq_entries')
@Index('idx_dlq_notification_id', ['notificationId'])
@Index('idx_dlq_user_id', ['userId'])
@Index('idx_dlq_channel', ['channel'])
// Note: For indexing jsonb properties like error_details->>'type', a custom migration is required
// as TypeORM doesn't directly support this. Example SQL for migration:
// CREATE INDEX idx_dlq_error_type ON dlq_entries ((error_details->>'type'));
export class DlqEntry implements IDlqEntry {
  /**
   * Unique identifier for the DLQ entry
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the notification that failed
   */
  @Column({ name: 'notification_id' })
  notificationId: number;

  /**
   * ID of the user who was the intended recipient of the notification
   */
  @Column({ name: 'user_id' })
  userId: string;

  /**
   * Notification delivery channel that failed (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @Column()
  channel: string;

  /**
   * Original notification payload that failed to be delivered
   * Stored as JSONB to preserve the exact data that failed while enabling efficient querying
   */
  @Column('jsonb')
  payload: Record<string, any>;

  /**
   * Detailed error information including:
   * - Error type (client, system, transient, external)
   * - Error code
   * - Error message
   * - Stack trace (if available)
   * - Provider-specific error details
   */
  @Column('jsonb', { name: 'error_details' })
  errorDetails: {
    type: string;
    code: string;
    message: string;
    stack?: string;
    providerDetails?: Record<string, any>;
  };

  /**
   * Complete history of retry attempts including:
   * - Timestamps for each attempt
   * - Error messages for each failure
   * - Retry policy used for each attempt
   * - Delay between attempts
   */
  @Column('jsonb', { name: 'retry_history' })
  retryHistory: Array<{
    timestamp: string;
    errorMessage: string;
    policyType: string;
    attemptNumber: number;
    delay?: number;
  }>;

  /**
   * Relationship to the original notification entity
   * Allows for easy access to the complete notification record
   */
  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  /**
   * Timestamp when the entry was added to the DLQ
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the entry was last updated
   * (e.g., when manual resolution was attempted)
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Optional resolution status for entries that have been manually processed
   */
  @Column({ nullable: true, name: 'resolution_status' })
  resolutionStatus?: string;

  /**
   * Optional notes added during manual resolution attempts
   */
  @Column('text', { nullable: true, name: 'resolution_notes' })
  resolutionNotes?: string;

  /**
   * Optional timestamp when the entry was resolved
   */
  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date;

  /**
   * Optional ID of the user who resolved this entry
   */
  @Column({ nullable: true, name: 'resolved_by' })
  resolvedBy?: string;
}