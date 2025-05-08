import { HttpStatus } from '@nestjs/common';
import { NotFoundExceptionBase } from '../../common/exceptions/not-found.exception';

/**
 * Exception thrown when a requested rule cannot be found.
 * Extends the base not found exception and provides rule-specific context.
 */
export class RuleNotFoundException extends NotFoundExceptionBase {
  /**
   * Creates a new RuleNotFoundException instance.
   * 
   * @param ruleId - The ID of the rule that was not found
   * @param message - Optional custom error message (defaults to a standard message)
   * @param cause - Optional cause of the exception
   */
  constructor(
    ruleId: string,
    message: string = `Rule with ID ${ruleId} not found`,
    cause?: Error
  ) {
    super(
      message,
      {
        ruleId,
        errorCode: 'GAME_RULE_001',
        statusCode: HttpStatus.NOT_FOUND,
        errorType: 'CLIENT.NOT_FOUND.RULE',
      },
      cause
    );
    
    // Set the name explicitly for better error identification in logs
    this.name = 'RuleNotFoundException';
  }
}