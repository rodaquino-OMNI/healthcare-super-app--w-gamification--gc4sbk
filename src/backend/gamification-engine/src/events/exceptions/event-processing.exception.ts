import { SystemException } from '../../common/exceptions/system.exception';
import { ErrorType } from '../../common/exceptions/error-types.enum';

/**
 * Exception thrown when an error occurs during the internal processing of valid events.
 * 
 * This exception is used for system errors that occur during event processing, such as:
 * - Rule evaluation errors
 * - Achievement processing failures
 * - Database transaction issues
 * - Internal service communication failures
 * 
 * Unlike validation exceptions which indicate client errors, this exception represents
 * internal system failures that require technical intervention and should trigger alerts.
 */
export class EventProcessingException extends SystemException {
  /**
   * Creates a new EventProcessingException instance.
   * 
   * @param message - Detailed error message describing what went wrong
   * @param context - Additional context about the processing pipeline stage and data
   * @param correlationId - Unique identifier to trace this error across services
   * @param cause - Original error that caused this exception (preserves stack trace)
   */
  constructor(
    message: string,
    private readonly context?: Record<string, any>,
    private readonly correlationId?: string,
    cause?: Error
  ) {
    super(
      message,
      'EVENT_PROCESSING_ERROR',
      ErrorType.TECHNICAL,
      {
        // Include additional metadata for error aggregation and analysis
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
   * Gets the processing context associated with this exception.
   * This provides detailed information about what was being processed
   * when the error occurred, aiding in debugging complex pipelines.
   */
  getContext(): Record<string, any> | undefined {
    return this.context;
  }

  /**
   * Gets the correlation ID for tracing this error across services.
   * This ID can be used to correlate logs from different services
   * that were involved in processing the same event.
   */
  getCorrelationId(): string | undefined {
    return this.correlationId;
  }

  /**
   * Creates a string representation of this exception including context
   * and correlation ID for comprehensive logging.
   */
  toString(): string {
    return `EventProcessingException: ${this.message}
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
      correlationId: this.correlationId,
      context: this.context,
      timestamp: this.getMetadata()?.timestamp,
      stack: this.stack,
    };
  }
}