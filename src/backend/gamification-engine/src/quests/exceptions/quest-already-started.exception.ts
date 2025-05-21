import { HttpException, HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from 'src/backend/shared/src/exceptions/exceptions.types';

/**
 * Exception thrown when a user attempts to start a quest they have already initiated.
 * This helps clients understand the current state and avoid unnecessary requests.
 * Maps to HTTP 409 Conflict status.
 */
export class QuestAlreadyStartedException extends AppException {
  /**
   * Creates a new QuestAlreadyStartedException instance.
   * 
   * @param userId - ID of the user who attempted to start the quest
   * @param questId - ID of the quest that was already started
   * @param progress - Current progress percentage of the quest (0-100)
   * @param completed - Whether the quest has been completed
   */
  constructor(
    public readonly userId: string,
    public readonly questId: string,
    public readonly progress: number,
    public readonly completed: boolean
  ) {
    super(
      `User ${userId} has already started quest ${questId} (progress: ${progress}%)`,
      ErrorType.BUSINESS,
      'GAME_014',
      {
        userId,
        questId,
        progress,
        completed,
        suggestion: completed ? 'This quest has already been completed' : 'Continue with the existing quest progress'
      }
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, QuestAlreadyStartedException.prototype);
  }

  /**
   * Converts the AppException to an HttpException for NestJS.
   * Overrides the parent method to use CONFLICT (409) status code
   * which is more appropriate for this specific case.
   * 
   * @returns An HttpException instance with HTTP status code 409 (Conflict)
   */
  toHttpException(): HttpException {
    return new HttpException(this.toJSON(), HttpStatus.CONFLICT);
  }
}