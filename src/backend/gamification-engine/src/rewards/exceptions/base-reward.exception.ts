import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Base exception class for all reward-related errors in the gamification engine.
 * Extends the application's core exception framework to provide consistent error
 * handling for reward operations.
 *
 * This class ensures all reward exceptions follow the same pattern for logging,
 * serialization, and client response generation with reward-specific context.
 */
export class BaseRewardException extends AppException {
  /**
   * Creates a new BaseRewardException instance.
   *
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "REWARD_001")
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
    // Ensure all reward error codes have the REWARD_ prefix for consistency
    const rewardCode = code.startsWith('REWARD_') ? code : `REWARD_${code}`;
    
    // Add reward context to details if not already present
    const enrichedDetails = {
      ...details,
      domain: 'reward',
      component: 'gamification-engine',
      correlationId: correlationId || 'unknown',
    };
    
    super(message, type, rewardCode, enrichedDetails, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseRewardException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with reward-specific context.
   * Extends the base AppException serialization with additional reward metadata.
   * 
   * @returns JSON object with standardized error structure and reward context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        domain: 'reward',
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
      domain: 'reward',
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
  withCorrelationId(correlationId: string): BaseRewardException {
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
  withJourneyContext(journey: string): BaseRewardException {
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
  withUserContext(userId: string): BaseRewardException {
    this.details.userId = userId;
    return this;
  }

  /**
   * Adds reward-specific context to the exception details.
   * Useful for associating the error with a specific reward.
   * 
   * @param rewardId - The unique identifier of the reward
   * @returns The exception instance for method chaining
   */
  withRewardContext(rewardId: string): BaseRewardException {
    this.details.rewardId = rewardId;
    return this;
  }
}