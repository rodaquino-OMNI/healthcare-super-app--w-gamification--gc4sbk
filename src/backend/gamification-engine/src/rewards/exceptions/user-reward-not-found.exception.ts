import { HttpStatus } from '@nestjs/common';
import { AppException } from '@app/shared/exceptions/exceptions.types';
import { ErrorType } from '@app/shared/exceptions/exceptions.types';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Exception thrown when a user's reward relationship cannot be found.
 * This is a client error (404) that occurs when attempting to access, update,
 * or unlock a user-reward relationship that doesn't exist.
 */
export class UserRewardNotFoundException extends AppException {
  /**
   * Creates a new UserRewardNotFoundException.
   * 
   * @param profileId - The ID of the user's game profile
   * @param rewardId - The ID of the reward
   * @param journey - Optional journey context (health, care, plan)
   */
  constructor(
    profileId: string,
    rewardId: string,
    journey?: JourneyType
  ) {
    const message = `User reward relationship not found for profile ID ${profileId} and reward ID ${rewardId}`;
    const errorCode = 'REWARD_404';
    const metadata = { profileId, rewardId, journey };
    
    super(
      message,
      ErrorType.BUSINESS,
      errorCode,
      metadata,
      undefined,
      HttpStatus.NOT_FOUND
    );
    
    // Set the name explicitly for better error identification in logs
    this.name = 'UserRewardNotFoundException';
  }
}