import { NotFoundException } from '@nestjs/common';
import { ErrorType } from '../../common/exceptions/error-types.enum';

/**
 * Exception thrown when an achievement cannot be found.
 * This is a client error (404) that includes the achievement ID in the error context.
 */
export class AchievementNotFoundException extends NotFoundException {
  /**
   * Creates a new AchievementNotFoundException instance.
   * 
   * @param achievementId - The ID of the achievement that was not found
   * @param message - Optional custom error message (defaults to a standard not found message)
   */
  constructor(
    private readonly achievementId: string,
    message: string = `Achievement with ID ${achievementId} not found`
  ) {
    super({
      message,
      error: 'Achievement Not Found',
      statusCode: 404,
      errorCode: 'GAME_004',
      errorType: ErrorType.BUSINESS,
      context: { achievementId }
    });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, AchievementNotFoundException.prototype);
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Gets the ID of the achievement that was not found.
   * 
   * @returns The achievement ID
   */
  getAchievementId(): string {
    return this.achievementId;
  }
}