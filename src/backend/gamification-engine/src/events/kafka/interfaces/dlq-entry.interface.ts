import { ProcessEventDto } from '../../dto/process-event.dto';
import { DlqEntryStatus } from './dlq-entry-status.enum';
import { ErrorType } from './error-type.enum';

/**
 * Interface representing an entry in the Dead Letter Queue
 */
export interface IDlqEntry {
  /**
   * Unique identifier for the DLQ entry
   */
  id: string;

  /**
   * Type of the event that failed processing
   */
  eventType: string;

  /**
   * User ID associated with the event
   */
  userId: string;

  /**
   * Journey context of the event (health, care, plan)
   */
  journey: string;

  /**
   * Original event payload that failed processing
   */
  payload: ProcessEventDto;

  /**
   * Error message from the exception
   */
  errorMessage: string;

  /**
   * Error stack trace for debugging
   */
  errorStack?: string;

  /**
   * Classified type of the error
   */
  errorType: ErrorType;

  /**
   * Number of retry attempts made
   */
  retryCount: number;

  /**
   * Current status of the DLQ entry
   */
  status: DlqEntryStatus;

  /**
   * Trace ID for distributed tracing
   */
  traceId?: string;

  /**
   * Timestamp when the entry was processed (resolved, reprocessed, or ignored)
   */
  processedAt?: Date;

  /**
   * Timestamp when the entry was successfully resolved
   */
  resolvedAt?: Date;

  /**
   * Comment explaining the processing action
   */
  processingComment?: string;

  /**
   * Details about the resolution (e.g., result of reprocessing)
   */
  resolutionDetails?: string;

  /**
   * Timestamp when the entry was created
   */
  createdAt: Date;

  /**
   * Timestamp when the entry was last updated
   */
  updatedAt: Date;
}