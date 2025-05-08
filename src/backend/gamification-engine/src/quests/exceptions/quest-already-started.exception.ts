import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Exception thrown when a user attempts to start a quest they have already initiated.
 * This is a business logic error (409 Conflict) that includes details about the user, quest, and current progress.
 */
export class QuestAlreadyStartedException extends AppException {
  /**
   * Creates a new QuestAlreadyStartedException.
   * 
   * @param userId - The ID of the user attempting to start the quest
   * @param questId - The ID of the quest that was already started
   * @param progress - The current progress of the user on this quest (0-100)
   * @param completed - Whether the quest has been completed
   */
  constructor(
    userId: string,
    questId: string,
    progress: number,
    completed: boolean = false
  ) {
    const message = QuestAlreadyStartedException.createErrorMessage(
      userId,
      questId,
      progress,
      completed
    );

    super(
      message,
      ErrorType.BUSINESS,
      'GAME_014',
      {
        userId,
        questId,
        progress,
        completed,
        statusCode: HttpStatus.CONFLICT
      }
    );
  }

  /**
   * Creates a user-friendly error message based on the quest and progress details.
   * 
   * @param userId - The ID of the user attempting to start the quest
   * @param questId - The ID of the quest that was already started
   * @param progress - The current progress of the user on this quest (0-100)
   * @param completed - Whether the quest has been completed
   * @returns A formatted error message with current status and suggestions
   */
  private static createErrorMessage(
    userId: string,
    questId: string,
    progress: number,
    completed: boolean
  ): string {
    let message = `User ${userId} has already started quest ${questId}`;
    
    if (completed) {
      message += ` and has already completed it (100% progress).`;
      message += ` If you want to restart this quest, please use the reset quest endpoint instead.`;
    } else if (progress > 0) {
      message += ` and has made ${progress}% progress.`;
      message += ` To continue this quest, use the update quest progress endpoint instead.`;
    } else {
      message += ` but has not made any progress yet (0%).`;
      message += ` You can continue with this quest or use the reset quest endpoint to start over.`;
    }
    
    return message;
  }

  /**
   * Gets the HTTP status code for this exception.
   * 
   * @returns The HTTP status code (409 Conflict)
   */
  getStatus(): number {
    return HttpStatus.CONFLICT;
  }
}