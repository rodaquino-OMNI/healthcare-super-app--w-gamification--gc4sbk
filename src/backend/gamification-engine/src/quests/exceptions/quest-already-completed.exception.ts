import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@backend/packages/errors';

/**
 * Exception thrown when a user attempts to complete a quest that has already been completed.
 * Maps to HTTP 409 Conflict status code.
 */
export class QuestAlreadyCompletedException extends AppException {
  /**
   * Creates a new instance of QuestAlreadyCompletedException.
   * 
   * @param userId - The ID of the user attempting to complete the quest
   * @param questId - The ID of the quest that is already completed
   * @param completedAt - The timestamp when the quest was originally completed
   */
  constructor(
    userId: string,
    questId: string,
    completedAt: Date
  ) {
    const message = `Quest ${questId} has already been completed by user ${userId} at ${completedAt.toISOString()}`;
    
    super(
      message,
      ErrorType.BUSINESS,
      'GAME_015',
      {
        userId,
        questId,
        completedAt: completedAt.toISOString(),
      },
      null,
      HttpStatus.CONFLICT
    );
    
    this.name = 'QuestAlreadyCompletedException';
  }
}