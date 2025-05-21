import { SystemException } from '../../common/exceptions/system.exception';
import { ErrorType } from '../../common/exceptions/error-types.enum';

/**
 * Exception thrown when an error occurs during the internal processing of quest operations.
 * 
 * This exception is used for system errors that occur during quest processing, such as:
 * - Quest progress calculation failures
 * - Quest completion processing errors
 * - XP reward distribution issues
 * - Achievement unlocking failures related to quests
 * - Database transaction issues during quest operations
 * 
 * Unlike business logic exceptions which indicate client errors, this exception represents
 * internal system failures that require technical intervention and should trigger alerts.
 */
export class QuestProcessingException extends SystemException {
  /**
   * Creates a new QuestProcessingException instance.
   * 
   * @param message - Detailed error message describing what went wrong
   * @param operation - The specific operation that was being performed (e.g., 'startQuest', 'completeQuest')
   * @param context - Additional context about the quest processing state and data
   * @param correlationId - Unique identifier to trace this error across services
   * @param cause - Original error that caused this exception (preserves stack trace)
   */
  constructor(
    message: string,
    private readonly operation: string,
    private readonly context?: Record<string, any>,
    private readonly correlationId?: string,
    cause?: Error
  ) {
    super(
      message,
      'GAME_017', // Standardized error code for quest processing errors
      ErrorType.TECHNICAL,
      {
        // Include additional metadata for error aggregation and analysis
        operation,
        context,
        correlationId,
        timestamp: new Date().toISOString(),
        // Add specific flags for monitoring and alerting systems
        requiresAlert: true,
        severity: 'high',
      },
      cause
    );

    // Ensure stack trace is preserved for root cause analysis
    if (cause && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  /**
   * Gets the operation that was being performed when the error occurred.
   * This helps identify which part of the quest processing pipeline failed.
   */
  getOperation(): string {
    return this.operation;
  }

  /**
   * Gets the processing context associated with this exception.
   * This provides detailed information about what was being processed
   * when the error occurred, aiding in debugging complex quest operations.
   */
  getContext(): Record<string, any> | undefined {
    return this.context;
  }

  /**
   * Gets the correlation ID for tracing this error across services.
   * This ID can be used to correlate logs from different services
   * that were involved in processing the same quest operation.
   */
  getCorrelationId(): string | undefined {
    return this.correlationId;
  }

  /**
   * Creates a string representation of this exception including operation,
   * context, and correlation ID for comprehensive logging.
   */
  toString(): string {
    return `QuestProcessingException: ${this.message}
` +
      `Operation: ${this.operation}
` +
      `CorrelationId: ${this.correlationId || 'none'}
` +
      `Context: ${JSON.stringify(this.context || {}, null, 2)}`;
  }

  /**
   * Creates a serialized version of this exception suitable for logging
   * and error tracking systems.
   */
  toJSON(): Record<string, any> {
    return {
      name: this.constructor.name,
      message: this.message,
      code: this.getCode(),
      type: this.getType(),
      operation: this.operation,
      correlationId: this.correlationId,
      context: this.context,
      timestamp: this.getMetadata()?.timestamp,
      stack: this.stack,
    };
  }
}