import { HttpStatus } from '@nestjs/common';
import { AppException } from '@app/shared/exceptions/exceptions.types';
import { ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Exception thrown when a requested achievement cannot be found.
 * This is a client error (404) that occurs when attempting to retrieve,
 * update, or delete an achievement that doesn't exist in the system.
 */
export class AchievementNotFoundException extends AppException {
  /**
   * Creates a new AchievementNotFoundException.
   * 
   * @param achievementId - The ID of the achievement that was not found
   * @param journey - Optional journey context (health, care, plan)
   */
  constructor(
    achievementId: string,
    journey?: string
  ) {
    const message = `Achievement with ID ${achievementId} not found`;
    const errorCode = 'GAME_404';
    const metadata = { achievementId, journey };
    
    super(
      message,
      ErrorType.BUSINESS,
      errorCode,
      metadata,
      undefined,
      HttpStatus.NOT_FOUND
    );
    
    // Set the name explicitly for better error identification in logs
    this.name = 'AchievementNotFoundException';
  }
}