import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@austa/errors';
import { ErrorType, RetryableError } from '@austa/errors/types';

/**
 * Exception thrown when errors occur during rule loading from database or configuration sources.
 * This exception handles various failure scenarios including database connectivity issues,
 * schema inconsistencies, and initialization failures during rule loading processes.
 */
export class RuleLoadingException extends BaseError implements RetryableError {
  /**
   * Indicates whether this error is transient and can be retried.
   * Database connectivity issues and temporary unavailability are considered transient.
   */
  public readonly isTransient: boolean;

  /**
   * The number of milliseconds to wait before retrying, if applicable.
   * Will be undefined for non-transient errors.
   */
  public readonly retryAfter?: number;

  /**
   * Creates a new RuleLoadingException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization (e.g., "GAME_101")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @param isTransient - Whether this error is transient and can be retried (default: false)
   * @param retryAfter - Suggested delay in milliseconds before retry (optional)
   */
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    cause?: Error,
    isTransient: boolean = false,
    retryAfter?: number
  ) {
    super(
      message,
      ErrorType.TECHNICAL, // Rule loading errors are technical errors
      code,
      details,
      cause,
      isTransient ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR
    );
    
    this.isTransient = isTransient;
    this.retryAfter = retryAfter;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RuleLoadingException.prototype);
  }

  /**
   * Factory method to create a RuleLoadingException for database connectivity issues.
   * These are considered transient errors that can be retried.
   * 
   * @param details - Additional details about the database error
   * @param cause - Original database error
   * @param retryAfter - Suggested delay in milliseconds before retry (default: 5000)
   * @returns A new RuleLoadingException instance configured for database connectivity issues
   */
  static databaseConnectivity(
    details?: Record<string, any>,
    cause?: Error,
    retryAfter: number = 5000
  ): RuleLoadingException {
    return new RuleLoadingException(
      'Failed to load rules due to database connectivity issues',
      'GAME_101',
      details,
      cause,
      true, // Database connectivity issues are transient
      retryAfter
    );
  }

  /**
   * Factory method to create a RuleLoadingException for schema inconsistencies.
   * These are not considered transient errors and require manual intervention.
   * 
   * @param details - Additional details about the schema inconsistency
   * @param cause - Original error that identified the schema issue
   * @returns A new RuleLoadingException instance configured for schema inconsistencies
   */
  static schemaInconsistency(
    details?: Record<string, any>,
    cause?: Error
  ): RuleLoadingException {
    return new RuleLoadingException(
      'Failed to load rules due to schema inconsistencies',
      'GAME_102',
      details,
      cause,
      false // Schema inconsistencies are not transient
    );
  }

  /**
   * Factory method to create a RuleLoadingException for initialization failures.
   * These may be transient depending on the underlying cause.
   * 
   * @param details - Additional details about the initialization failure
   * @param cause - Original error that caused the initialization failure
   * @param isTransient - Whether this initialization error is transient (default: false)
   * @param retryAfter - Suggested delay in milliseconds before retry (default: 3000)
   * @returns A new RuleLoadingException instance configured for initialization failures
   */
  static initializationFailure(
    details?: Record<string, any>,
    cause?: Error,
    isTransient: boolean = false,
    retryAfter: number = 3000
  ): RuleLoadingException {
    return new RuleLoadingException(
      'Failed to initialize rules engine',
      'GAME_103',
      details,
      cause,
      isTransient,
      isTransient ? retryAfter : undefined
    );
  }

  /**
   * Factory method to create a RuleLoadingException for temporary unavailability.
   * These are considered transient errors that can be retried.
   * 
   * @param details - Additional details about the unavailability
   * @param cause - Original error that caused the unavailability
   * @param retryAfter - Suggested delay in milliseconds before retry (default: 2000)
   * @returns A new RuleLoadingException instance configured for temporary unavailability
   */
  static temporaryUnavailability(
    details?: Record<string, any>,
    cause?: Error,
    retryAfter: number = 2000
  ): RuleLoadingException {
    return new RuleLoadingException(
      'Rules engine temporarily unavailable',
      'GAME_104',
      details,
      cause,
      true, // Temporary unavailability is transient
      retryAfter
    );
  }

  /**
   * Returns a JSON representation of the exception with retry information.
   * Used for consistent error responses across the application.
   * 
   * @returns JSON object with standardized error structure including retry information
   */
  override toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    // Add retry information for transient errors
    if (this.isTransient && this.retryAfter !== undefined) {
      return {
        ...baseJson,
        error: {
          ...baseJson.error,
          retry: {
            isTransient: true,
            retryAfter: this.retryAfter
          }
        }
      };
    }
    
    return baseJson;
  }

  /**
   * Determines if this error should trigger an alert.
   * Non-transient errors and repeated transient errors should trigger alerts.
   * 
   * @param occurrences - Number of times this error has occurred (default: 1)
   * @returns True if this error should trigger an alert, false otherwise
   */
  shouldAlert(occurrences: number = 1): boolean {
    // Always alert for non-transient errors
    if (!this.isTransient) {
      return true;
    }
    
    // Alert for transient errors that have occurred multiple times
    return occurrences >= 3; // Alert after 3 occurrences of the same transient error
  }
}