import { HttpStatus } from '@nestjs/common';
import { AppException } from '@app/shared/exceptions/exceptions.types';
import { ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Exception thrown when a user's achievement relationship cannot be found.
 * This is a client error (404) that occurs when attempting to access, update,
 * or unlock a user-achievement relationship that doesn't exist.
 */
export class UserAchievementNotFoundException extends AppException {
  /**
   * Creates a new UserAchievementNotFoundException.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement
   * @param journey - Optional journey context (health, care, plan)
   */
  constructor(
    profileId: string,
    achievementId: string,
    journey?: string
  ) {
    const message = `User achievement relationship not found for profile ID ${profileId} and achievement ID ${achievementId}`;
    const errorCode = 'GAME_404';
    const metadata = { profileId, achievementId, journey };
    
    super(
      message,
      ErrorType.BUSINESS,
      errorCode,
      metadata,
      undefined,
      HttpStatus.NOT_FOUND
    );
    
    // Set the name explicitly for better error identification in logs
    this.name = 'UserAchievementNotFoundException';
  }
}