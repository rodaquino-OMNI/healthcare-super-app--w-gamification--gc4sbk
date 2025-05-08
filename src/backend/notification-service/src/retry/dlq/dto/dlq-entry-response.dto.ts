import { ErrorType } from '../../constants/error-types.constants';
import { RetryStatus } from '../../interfaces/retry-status.enum';

/**
 * DTO representing a retry attempt in the retry history for API responses.
 */
export class RetryAttemptDto {
  /**
   * Timestamp when the retry attempt was made
   */
  timestamp: Date;

  /**
   * Error message from the failed attempt
   */
  errorMessage: string;

  /**
   * Status of the retry attempt
   */
  status: RetryStatus;

  /**
   * Duration of the retry attempt in milliseconds
   */
  duration?: number;

  /**
   * Retry policy used for this attempt
   */
  policy?: string;

  /**
   * Delay in milliseconds before this retry attempt was executed
   */
  delayMs?: number;

  /**
   * Additional context about the retry attempt
   */
  context?: Record<string, any>;
}

/**
 * DTO representing error details for API responses.
 */
export class ErrorDetailsDto {
  /**
   * Classification of the error (CLIENT, SYSTEM, TRANSIENT, EXTERNAL)
   */
  type: ErrorType;

  /**
   * Error message
   */
  message: string;

  /**
   * Error stack trace for debugging
   */
  stack?: string;

  /**
   * Error code or reason code for categorization
   */
  code?: string;

  /**
   * Additional context about the error
   */
  context?: Record<string, any>;
}

/**
 * DTO representing journey context information for API responses.
 */
export class JourneyContextDto {
  /**
   * Journey type (health, care, plan)
   */
  journey: 'health' | 'care' | 'plan';
  
  /**
   * Journey-specific context data
   */
  data?: Record<string, any>;
}

/**
 * Data Transfer Object for Dead Letter Queue (DLQ) entries when returned through the API.
 * 
 * This DTO represents the structure of failed notifications that have exhausted their retry attempts
 * and provides all essential information for monitoring, troubleshooting, and potentially reprocessing
 * these notifications.
 * 
 * It includes:
 * - Unique identifiers for the DLQ entry and related notification
 * - User information for the intended recipient
 * - Notification details including type, title, and payload
 * - Comprehensive error information with type classification, message, and stack trace
 * - Complete retry history with timestamps and error messages for each attempt
 * - Channel information and timestamps for tracking and analysis
 * - Resolution status and comments for administrative actions
 */
export class DlqEntryResponseDto {
  /**
   * Unique identifier for the DLQ entry
   */
  id: string;

  /**
   * ID of the notification that failed
   */
  notificationId: string;

  /**
   * ID of the user who was the intended recipient of the notification
   */
  userId: string;

  /**
   * Delivery channel that failed (e.g., 'push', 'email', 'sms', 'in-app')
   */
  channel: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment-reminder', 'claim-status')
   */
  type: string;

  /**
   * Notification title/headline
   */
  title: string;

  /**
   * Original payload that was being processed when the failure occurred
   */
  payload: Record<string, any>;

  /**
   * Detailed information about the error that caused the notification to be moved to the DLQ
   */
  errorDetails: ErrorDetailsDto;

  /**
   * History of retry attempts made before the notification was moved to the DLQ
   */
  retryHistory: RetryAttemptDto[];

  /**
   * Maximum number of retry attempts that were configured for this notification
   */
  maxRetries: number;

  /**
   * Current status of the DLQ entry
   */
  status: 'pending' | 'resolved' | 'reprocessed' | 'ignored';

  /**
   * Optional comments added during manual resolution
   */
  resolutionComments?: string;

  /**
   * Timestamp when the entry was resolved or reprocessed (if applicable)
   */
  resolvedAt?: Date;

  /**
   * User ID of the administrator who resolved the entry (if applicable)
   */
  resolvedBy?: string;

  /**
   * Journey context information (health, care, plan) for analytics and filtering
   */
  journeyContext?: JourneyContextDto;

  /**
   * Timestamp when the DLQ entry was created
   */
  createdAt: Date;

  /**
   * Timestamp when the DLQ entry was last updated
   */
  updatedAt: Date;

  /**
   * Number of retry attempts that were made before moving to the DLQ
   */
  attemptCount: number;

  /**
   * Time elapsed between first attempt and final failure in milliseconds
   */
  totalDuration?: number;

  /**
   * Metadata for error classification and handling guidance
   */
  errorMetadata?: {
    /**
     * Whether this error type is generally retryable
     */
    isRetryable: boolean;
    
    /**
     * Recommended maximum retry attempts for this error type
     */
    recommendedMaxRetries: number;
    
    /**
     * Description of the error type for administrative interfaces
     */
    description: string;
  };
}