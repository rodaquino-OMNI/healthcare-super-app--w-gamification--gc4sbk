import { HttpStatus } from '@nestjs/common';
import { BaseAchievementException } from './base-achievement.exception';
import { AchievementErrorType } from './achievement-exception.types';

/**
 * Exception thrown when a user's achievement relationship cannot be found.
 * This is a client error (404) that includes both user ID and achievement ID in the error context.
 * 
 * Used when attempting to access, update, or unlock a user-achievement relationship that doesn't exist.
 */
export class UserAchievementNotFoundException extends BaseAchievementException {
  /**
   * Creates a new UserAchievementNotFoundException.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement
   * @param message - Optional custom error message (defaults to a standard message)
   * @param journey - Optional journey context (health, care, plan)
   */
  constructor(
    profileId: string,
    achievementId: string,
    message?: string,
    journey?: string
  ) {
    const errorMessage = message || `User achievement relationship not found for profile ${profileId} and achievement ${achievementId}`;
    
    super(
      errorMessage,
      AchievementErrorType.USER_ACHIEVEMENT_NOT_FOUND,
      'ACH-404',
      { profileId, achievementId, journey },
      HttpStatus.NOT_FOUND
    );
    
    // Set the name explicitly for better error identification in logs
    this.name = 'UserAchievementNotFoundException';
  }
}