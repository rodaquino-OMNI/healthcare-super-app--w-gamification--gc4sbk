import { NotFoundException } from '@nestjs/common';
import { ErrorType } from '../../common/exceptions/error-types.enum';

/**
 * Exception thrown when a requested gamification rule cannot be found.
 * This is a client error (404) that includes the rule ID in the error context.
 */
export class RuleNotFoundException extends NotFoundException {
  /**
   * Creates a new RuleNotFoundException instance.
   * 
   * @param ruleId - The ID of the rule that was not found
   * @param message - Optional custom error message (defaults to a standard not found message)
   */
  constructor(
    private readonly ruleId: string,
    message: string = `Rule with ID ${ruleId} not found`
  ) {
    super({
      message,
      error: 'Rule Not Found',
      statusCode: 404,
      errorCode: 'GAME_014',
      errorType: ErrorType.BUSINESS,
      context: { ruleId }
    });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, RuleNotFoundException.prototype);
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Gets the ID of the rule that was not found.
   * 
   * @returns The rule ID
   */
  getRuleId(): string {
    return this.ruleId;
  }
}