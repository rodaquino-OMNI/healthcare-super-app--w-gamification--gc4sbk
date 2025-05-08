import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@backend/packages/errors';

/**
 * Exception thrown when a quest cannot be found by its ID.
 * Maps to HTTP 404 Not Found status code.
 */
export class QuestNotFoundException extends AppException {
  /**
   * Creates a new instance of QuestNotFoundException.
   * 
   * @param questId - The ID of the quest that could not be found
   * @param additionalInfo - Optional additional information about the context of the error
   */
  constructor(
    questId: string,
    additionalInfo?: string
  ) {
    const message = additionalInfo
      ? `Quest with ID ${questId} not found: ${additionalInfo}`
      : `Quest with ID ${questId} not found`;
    
    super(
      message,
      ErrorType.BUSINESS,
      'GAME_013',
      { questId },
      null,
      HttpStatus.NOT_FOUND
    );
    
    this.name = 'QuestNotFoundException';
  }
}