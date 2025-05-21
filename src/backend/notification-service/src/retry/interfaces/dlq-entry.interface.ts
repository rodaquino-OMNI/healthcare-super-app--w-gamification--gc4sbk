import { ErrorType } from '../constants/error-types.constants';
import { RetryPolicyType } from '../constants/policy-types.constants';
import { RetryStatus } from './retry-status.enum';

/**
 * Interface representing a retry attempt for a notification operation.
 * Used to track the history of retry attempts for a notification.
 */
export interface IRetryAttempt {
  /**
   * Sequential number of this retry attempt (1-based)
   */
  attemptNumber: number;

  /**
   * Timestamp when this retry attempt was executed
   */
  timestamp: Date;

  /**
   * Duration of the retry attempt in milliseconds
   */
  durationMs?: number;

  /**
   * Error message if the retry attempt failed
   */
  errorMessage?: string;

  /**
   * Error stack trace if available
   */
  errorStack?: string;

  /**
   * HTTP status code if the error was related to an HTTP request
   */
  statusCode?: number;

  /**
   * Delay that was applied before this retry attempt
   */
  delayBeforeMs: number;

  /**
   * Result status of this retry attempt
   */
  status: RetryStatus;
}

/**
 * Interface representing an entry in the dead-letter queue (DLQ) for failed notification operations
 * that have exhausted their retry attempts. This interface captures comprehensive information about
 * the failed operation, including the original payload, error details, retry history, and metadata.
 * 
 * DLQ entries are used for:
 * - Persistence of failed operations for later analysis
 * - Manual reprocessing of failed notifications
 * - Error trend analysis and reporting
 * - Monitoring of notification delivery reliability
 */
export interface IDlqEntry {
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
}