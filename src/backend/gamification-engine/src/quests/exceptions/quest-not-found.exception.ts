import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from 'src/backend/shared/src/exceptions/exceptions.types';

/**
 * Exception thrown when a quest cannot be found by its ID.
 * Maps to HTTP 404 Not Found status code.
 */
export class QuestNotFoundException extends AppException {
  /**
   * Creates a new QuestNotFoundException instance.
   * 
   * @param questId - The ID of the quest that could not be found
   * @param message - Optional custom error message (defaults to a standard message)
   */
  constructor(
    public readonly questId: string,
    message: string = `Quest with ID ${questId} not found`
  ) {
    super(
      message,
      ErrorType.VALIDATION, // Client error related to invalid input
      'GAME_013', // Standardized error code for quest not found
      { questId } // Include quest ID in details for debugging
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, QuestNotFoundException.prototype);
  }

  /**
   * Overrides the base getHttpStatusCode method to return 404 Not Found.
   * @returns HTTP 404 Not Found status code
   */
  protected getHttpStatusCode(): HttpStatus {
    return HttpStatus.NOT_FOUND;
  }

  /**
   * Returns a JSON representation of the exception with additional quest-specific context.
   * @returns JSON object with standardized error structure and quest context
   */
  toJSON(): Record<string, any> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        details: {
          questId: this.questId,
          ...this.details
        }
      }
    };
  }
}