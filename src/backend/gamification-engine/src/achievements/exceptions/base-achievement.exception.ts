import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Interface for achievement-specific error context
 * Provides additional metadata for achievement-related errors
 */
export interface AchievementErrorContext {
  /** Optional achievement ID related to the error */
  achievementId?: string;
  /** Optional user ID related to the error */
  userId?: string;
  /** Optional journey type related to the error */
  journey?: string;
  /** Optional correlation ID for distributed tracing */
  correlationId?: string;
  /** Any additional context-specific data */
  [key: string]: any;
}

/**
 * Base exception class for all achievement-related errors.
 * Extends the application's core exception framework with achievement-specific context.
 * All achievement exceptions should extend this class to ensure consistent error handling.
 */
export class BaseAchievementException extends AppException {
  /**
   * Creates a new BaseAchievementException instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "GAME_001")
   * @param context - Achievement-specific error context
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    public readonly context: AchievementErrorContext = {},
    cause?: Error
  ) {
    super(message, type, code, context, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseAchievementException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with achievement-specific context.
   * Used for consistent error responses across the application.
   * 
   * @returns JSON object with standardized error structure and achievement context
   */
  override toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    // Add achievement-specific context to the error details
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        context: {
          achievement: this.context.achievementId ? { id: this.context.achievementId } : undefined,
          user: this.context.userId ? { id: this.context.userId } : undefined,
          journey: this.context.journey,
          correlationId: this.context.correlationId
        }
      }
    };
  }

  /**
   * Creates a log-friendly representation of the exception.
   * Includes achievement-specific context for better error tracking and analysis.
   * 
   * @returns Object suitable for structured logging
   */
  toLog(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      stack: this.stack,
      context: this.context,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  /**
   * Enriches the exception with additional context information.
   * Useful for adding request-specific data like correlation IDs.
   * 
   * @param additionalContext - Additional context to add to the exception
   * @returns This exception instance for method chaining
   */
  withContext(additionalContext: Partial<AchievementErrorContext>): this {
    this.context = {
      ...this.context,
      ...additionalContext
    };
    return this;
  }

  /**
   * Adds correlation ID to the exception context for distributed tracing.
   * 
   * @param correlationId - Correlation ID for tracing this error across services
   * @returns This exception instance for method chaining
   */
  withCorrelationId(correlationId: string): this {
    this.context.correlationId = correlationId;
    return this;
  }

  /**
   * Adds user ID to the exception context.
   * 
   * @param userId - ID of the user related to this error
   * @returns This exception instance for method chaining
   */
  withUserId(userId: string): this {
    this.context.userId = userId;
    return this;
  }

  /**
   * Adds achievement ID to the exception context.
   * 
   * @param achievementId - ID of the achievement related to this error
   * @returns This exception instance for method chaining
   */
  withAchievementId(achievementId: string): this {
    this.context.achievementId = achievementId;
    return this;
  }

  /**
   * Adds journey type to the exception context.
   * 
   * @param journey - Journey type ('health', 'care', 'plan')
   * @returns This exception instance for method chaining
   */
  withJourney(journey: string): this {
    this.context.journey = journey;
    return this;
  }
}