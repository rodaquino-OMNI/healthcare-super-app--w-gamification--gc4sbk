import { HttpStatus } from '@nestjs/common';
import { BaseRewardException } from './base-reward.exception';
import { RewardErrorType } from './reward-exception.types';

/**
 * Exception thrown when a user's reward relationship cannot be found.
 * This is a client error (404) that includes both user ID and reward ID in the error context.
 * 
 * Used when attempting to access, update, or unlock a user-reward relationship that doesn't exist.
 */
export class UserRewardNotFoundException extends BaseRewardException {
  /**
   * Creates a new UserRewardNotFoundException.
   * 
   * @param profileId - The ID of the user's game profile
   * @param rewardId - The ID of the reward
   * @param message - Optional custom error message (defaults to a standard message)
   * @param journey - Optional journey context (health, care, plan)
   */
  constructor(
    profileId: string,
    rewardId: string,
    message?: string,
    journey?: string
  ) {
    const errorMessage = message || `User reward relationship not found for profile ${profileId} and reward ${rewardId}`;
    
    super(
      errorMessage,
      RewardErrorType.USER_REWARD_NOT_FOUND,
      'REW-404',
      { profileId, rewardId, journey },
      HttpStatus.NOT_FOUND
    );
    
    // Set the name explicitly for better error identification in logs
    this.name = 'UserRewardNotFoundException';
  }
}