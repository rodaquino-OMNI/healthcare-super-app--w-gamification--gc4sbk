import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Base exception class for all achievement-related errors in the gamification engine.
 * Extends the application's core exception framework to provide consistent error
 * handling for achievement operations.
 *
 * This class ensures all achievement exceptions follow the same pattern for logging,
 * serialization, and client response generation with achievement-specific context.
 */
export class BaseAchievementException extends AppException {
  /**
   * Creates a new BaseAchievementException instance.
   *
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "ACH_001")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @param correlationId - Unique identifier for tracking the error across services (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    details?: any,
    cause?: Error,
    private readonly correlationId?: string
  ) {
    // Ensure all achievement error codes have the ACH_ prefix for consistency
    const achievementCode = code.startsWith('ACH_') ? code : `ACH_${code}`;
    
    // Add achievement context to details if not already present
    const enrichedDetails = {
      ...details,
      domain: 'achievement',
      component: 'gamification-engine',
      correlationId: correlationId || 'unknown',
    };
    
    super(message, type, achievementCode, enrichedDetails, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseAchievementException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with achievement-specific context.
   * Extends the base AppException serialization with additional achievement metadata.
   * 
   * @returns JSON object with standardized error structure and achievement context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        domain: 'achievement',
        component: 'gamification-engine',
        correlationId: this.correlationId || 'unknown',
      }
    };
  }

  /**
   * Creates a log-friendly representation of the exception with structured data
   * for consistent log aggregation and analysis.
   * 
   * @returns A structured object suitable for logging systems
   */
  toLogFormat(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      domain: 'achievement',
      component: 'gamification-engine',
      correlationId: this.correlationId || 'unknown',
      details: this.details,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  /**
   * Sets the correlation ID for tracking the error across services.
   * Useful for associating the error with a specific request or transaction.
   * 
   * @param correlationId - Unique identifier for the request or transaction
   * @returns The exception instance for method chaining
   */
  withCorrelationId(correlationId: string): BaseAchievementException {
    this.details.correlationId = correlationId;
    return this;
  }

  /**
   * Adds journey context to the exception details.
   * Useful for associating the error with a specific user journey.
   * 
   * @param journey - The journey identifier ('health', 'care', 'plan')
   * @returns The exception instance for method chaining
   */
  withJourneyContext(journey: string): BaseAchievementException {
    this.details.journey = journey;
    return this;
  }

  /**
   * Adds user context to the exception details.
   * Useful for associating the error with a specific user.
   * 
   * @param userId - The unique identifier of the user
   * @returns The exception instance for method chaining
   */
  withUserContext(userId: string): BaseAchievementException {
    this.details.userId = userId;
    return this;
  }
}