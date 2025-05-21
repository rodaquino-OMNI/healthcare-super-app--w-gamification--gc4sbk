import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Exception thrown when a user attempts to complete a quest that has already been marked as completed.
 * This is a business logic error that maps to HTTP 409 Conflict status code.
 * 
 * Captures the user ID, quest ID, and completion timestamp to provide context for debugging
 * and client feedback.
 */
export class QuestAlreadyCompletedException extends AppException {
  /**
   * Creates a new QuestAlreadyCompletedException instance.
   * 
   * @param userId - The ID of the user attempting to complete the quest
   * @param questId - The ID of the quest that is already completed
   * @param completionTimestamp - The timestamp when the quest was originally completed
   * @param correlationId - Optional correlation ID for tracking the error across services
   */
  constructor(
    private readonly userId: string,
    private readonly questId: string,
    private readonly completionTimestamp: Date,
    correlationId?: string
  ) {
    const message = `Quest ${questId} has already been completed by user ${userId} at ${completionTimestamp.toISOString()}`;
    
    // Create detailed context for debugging and client feedback
    const details = {
      userId,
      questId,
      completionTimestamp: completionTimestamp.toISOString(),
      correlationId: correlationId || 'unknown',
      domain: 'gamification',
      component: 'quests'
    };
    
    super(message, ErrorType.BUSINESS, 'GAME_015', details);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, QuestAlreadyCompletedException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with quest-specific context.
   * Extends the base AppException serialization with additional quest metadata.
   * 
   * @returns JSON object with standardized error structure and quest context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        statusCode: HttpStatus.CONFLICT,
        suggestion: 'This quest has already been completed. Check the user\'s quest history or try a different quest.'
      }
    };
  }

  /**
   * Gets the ID of the user who already completed the quest.
   * 
   * @returns The user ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Gets the ID of the quest that was already completed.
   * 
   * @returns The quest ID
   */
  getQuestId(): string {
    return this.questId;
  }

  /**
   * Gets the timestamp when the quest was originally completed.
   * 
   * @returns The completion timestamp
   */
  getCompletionTimestamp(): Date {
    return this.completionTimestamp;
  }

  /**
   * Converts the exception to an HttpException with the appropriate status code.
   * Maps this business exception to HTTP 409 Conflict.
   * 
   * @returns An HttpException with status code 409 Conflict
   */
  toHttpException(): HttpException {
    return new HttpException(this.toJSON(), HttpStatus.CONFLICT);
  }
}