import { AppException, ErrorType } from 'src/backend/shared/src/exceptions/exceptions.types';

/**
 * Exception thrown when an internal error occurs during reward processing operations.
 * This is a technical exception that indicates a system failure rather than a business rule violation.
 * 
 * Used to capture detailed error contexts including the operation being performed,
 * affected rewards, and system state for comprehensive debugging and root cause analysis.
 * 
 * Maps to HTTP 500 Internal Server Error.
 */
export class RewardProcessingException extends AppException {
  /**
   * Creates a new RewardProcessingException instance.
   * 
   * @param message - Human-readable error message describing the processing failure
   * @param operation - The specific operation that was being performed (e.g., 'grant', 'distribute', 'calculate')
   * @param context - Additional context about the reward processing operation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    public readonly operation: string,
    public readonly context: RewardProcessingContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      'REWARD_501', // Standardized error code for monitoring and alerting
      { operation, ...context },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RewardProcessingException.prototype);
  }

  /**
   * Returns a detailed string representation of the exception for logging purposes.
   * Includes the operation and context information for comprehensive error tracking.
   * 
   * @returns Detailed error message with context
   */
  toString(): string {
    return `RewardProcessingException [REWARD_501]: ${this.message} | Operation: ${this.operation} | Context: ${JSON.stringify(this.context)}`;
  }
}

/**
 * Interface defining the context information captured during reward processing errors.
 * Provides structured data about the state of the system when the error occurred.
 */
export interface RewardProcessingContext {
  /**
   * ID of the reward being processed, if available
   */
  rewardId?: string;
  
  /**
   * Title of the reward being processed, if available
   */
  rewardTitle?: string;
  
  /**
   * ID of the user receiving the reward, if applicable
   */
  userId?: string;
  
  /**
   * The journey context in which the reward was being processed
   * (e.g., 'health', 'care', 'plan')
   */
  journey?: string;
  
  /**
   * The processing stage where the error occurred
   * (e.g., 'validation', 'database', 'notification')
   */
  processingStage?: string;
  
  /**
   * Any additional data relevant to debugging the issue
   */
  additionalData?: Record<string, any>;
}