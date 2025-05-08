import { BusinessError } from '@austa/errors';
import { HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when a user attempts to complete a quest that they have not yet started.
 * This is a business logic error that indicates a sequence validation failure.
 * 
 * @class QuestNotStartedException
 * @extends {BusinessError}
 */
export class QuestNotStartedException extends BusinessError {
  /**
   * Creates an instance of QuestNotStartedException.
   * 
   * @param {string} userId - The ID of the user attempting to complete the quest
   * @param {string} questId - The ID of the quest that hasn't been started
   * @param {string} [correlationId] - Optional correlation ID for tracking the request
   */
  constructor(userId: string, questId: string, correlationId?: string) {
    const message = `Cannot complete quest ${questId} because it hasn't been started yet. Please start the quest first.`;
    const errorCode = 'GAME_016';
    const context = { userId, questId, correlationId };
    
    // Pass HTTP 422 Unprocessable Entity status code to indicate a request sequence error
    super(message, errorCode, context, HttpStatus.UNPROCESSABLE_ENTITY);
    
    // Set the name explicitly for better error identification in logs
    this.name = 'QuestNotStartedException';
  }
}