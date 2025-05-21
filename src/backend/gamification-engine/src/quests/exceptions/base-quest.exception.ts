import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Base exception class for all quest-related errors in the gamification engine.
 * Extends the application's core exception framework to provide consistent error
 * handling for quest operations.
 *
 * This class ensures all quest exceptions follow the same pattern for logging,
 * serialization, and client response generation with quest-specific context.
 */
export abstract class BaseQuestException extends AppException {
  /**
   * Creates a new BaseQuestException instance.
   *
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "GAME_001")
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
    // Ensure all quest error codes have the GAME_ prefix for consistency
    const questCode = code.startsWith('GAME_') ? code : `GAME_${code}`;
    
    // Add quest context to details if not already present
    const enrichedDetails = {
      ...details,
      domain: 'quest',
      component: 'gamification-engine',
      correlationId: correlationId || 'unknown',
    };
    
    super(message, type, questCode, enrichedDetails, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseQuestException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with quest-specific context.
   * Extends the base AppException serialization with additional quest metadata.
   * 
   * @returns JSON object with standardized error structure and quest context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        domain: 'quest',
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
      domain: 'quest',
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
  withCorrelationId(correlationId: string): BaseQuestException {
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
  withJourneyContext(journey: string): BaseQuestException {
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
  withUserContext(userId: string): BaseQuestException {
    this.details.userId = userId;
    return this;
  }

  /**
   * Adds quest-specific context to the exception details.
   * Useful for associating the error with a specific quest.
   * 
   * @param questId - The unique identifier of the quest
   * @returns The exception instance for method chaining
   */
  withQuestContext(questId: string): BaseQuestException {
    this.details.questId = questId;
    return this;
  }
}