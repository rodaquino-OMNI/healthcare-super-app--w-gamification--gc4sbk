import { AppException, ErrorType } from 'src/backend/shared/src/exceptions/exceptions.types';

/**
 * Exception thrown when a user attempts to complete a quest that they have not yet started.
 * Maps to HTTP 422 Unprocessable Entity to indicate a request sequence error.
 */
export class QuestNotStartedException extends AppException {
  /**
   * Creates a new QuestNotStartedException instance.
   * 
   * @param userId - ID of the user attempting to complete the quest
   * @param questId - ID of the quest that hasn't been started
   */
  constructor(userId: string, questId: string) {
    const message = `Cannot complete quest ${questId} because it hasn't been started yet. Please start the quest first.`;
    
    super(
      message,
      ErrorType.BUSINESS,
      'GAME_016',
      { userId, questId }
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, QuestNotStartedException.prototype);
  }
}