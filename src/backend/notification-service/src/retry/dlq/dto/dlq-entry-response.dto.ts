import { ErrorType } from '../../constants/error-types.constants';
import { RetryPolicyType } from '../../constants/policy-types.constants';
import { IRetryAttempt } from '../../interfaces/dlq-entry.interface';

/**
 * Data transfer object for Dead Letter Queue (DLQ) entries when returned through the API.
 * This DTO represents failed notifications that have exhausted their retry attempts
 * and provides comprehensive information for debugging and resolution.
 */
export class DlqEntryResponseDto {
  /**
   * Unique identifier for this DLQ entry
   */
  id: string;

  /**
   * ID of the notification that failed to be delivered
   */
  notificationId: number;

  /**
   * ID of the user who was the intended recipient of the notification
   */
  userId: string;

  /**
   * Original payload that was being processed when the failure occurred.
   * This contains all the data needed to potentially retry the operation manually.
   */
  originalPayload: Record<string, any>;

  /**
   * Type of notification (e.g., 'achievement', 'appointment-reminder', 'claim-status')
   */
  notificationType: string;

  /**
   * Delivery channel that failed (e.g., 'push', 'email', 'sms', 'in-app')
   */
  channel: string;

  /**
   * Classification of the error that caused the operation to fail
   */
  errorType: ErrorType;

  /**
   * Detailed error message from the last failed attempt
   */
  errorMessage: string;

  /**
   * Error stack trace if available
   */
  errorStack?: string;

  /**
   * HTTP status code if the error was related to an HTTP request
   */
  statusCode?: number;

  /**
   * Additional context about the error to aid in debugging and resolution
   */
  errorContext?: Record<string, any>;

  /**
   * Type of retry policy that was used for this operation
   */
  retryPolicyType: RetryPolicyType;

  /**
   * Configuration options that were used for the retry policy
   */
  retryPolicyOptions: Record<string, any>;

  /**
   * Total number of retry attempts that were made before giving up
   */
  totalAttempts: number;

  /**
   * Maximum number of retry attempts that were allowed
   */
  maxAttempts: number;

  /**
   * Detailed history of all retry attempts, including timestamps, durations, and error details
   */
  retryHistory: IRetryAttempt[];

  /**
   * Timestamp when the operation was first attempted
   */
  firstAttemptAt: Date;

  /**
   * Timestamp when the operation was last attempted
   */
  lastAttemptAt: Date;

  /**
   * Timestamp when the entry was added to the DLQ
   */
  enqueuedAt: Date;

  /**
   * Reason code providing more specific information about the failure
   * These codes are channel-specific and defined in reason-codes.constants.ts
   */
  reasonCode: string;

  /**
   * Flag indicating whether this entry has been manually processed or resolved
   */
  isResolved: boolean;

  /**
   * Timestamp when the entry was resolved, if applicable
   */
  resolvedAt?: Date;

  /**
   * User ID of the administrator who resolved this entry, if applicable
   */
  resolvedBy?: string;

  /**
   * Notes added during manual resolution, if applicable
   */
  resolutionNotes?: string;

  /**
   * Flag indicating whether this entry should be automatically retried during DLQ reprocessing
   */
  canRetry: boolean;

  /**
   * Priority level of the notification, used for prioritizing manual reprocessing
   */
  priority: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Journey context information to provide business context for the notification
   */
  journeyContext?: {
    /**
     * Journey type (health, care, plan)
     */
    journeyType: 'health' | 'care' | 'plan';
    
    /**
     * Specific journey event that triggered the notification
     */
    journeyEvent: string;
    
    /**
     * Additional journey-specific metadata
     */
    metadata?: Record<string, any>;
  };

  /**
   * Tags for categorizing and filtering DLQ entries
   */
  tags?: string[];

  /**
   * Human-readable error summary for display in admin interfaces
   */
  errorSummary?: string;

  /**
   * Time spent in the DLQ, formatted as a human-readable string
   */
  timeInQueue?: string;

  /**
   * Formatted timestamp strings for easier display in UI
   */
  timestamps?: {
    firstAttempt: string;
    lastAttempt: string;
    enqueued: string;
    resolved?: string;
  };

  /**
   * Formatted retry history for easier display in UI
   */
  formattedRetryHistory?: {
    attemptNumber: number;
    timestamp: string;
    durationMs?: number;
    errorMessage?: string;
    status: string;
  }[];

  /**
   * Suggested resolution actions based on error type and context
   */
  suggestedActions?: string[];

  /**
   * Formatted error type for display (e.g., "Transient Error" instead of "TRANSIENT")
   */
  errorTypeDisplay?: string;

  /**
   * Flag indicating if this is a critical error that requires immediate attention
   */
  isCritical?: boolean;
}