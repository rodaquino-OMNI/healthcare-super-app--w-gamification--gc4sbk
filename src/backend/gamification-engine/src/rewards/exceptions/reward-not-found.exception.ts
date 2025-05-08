import { HttpStatus } from '@nestjs/common';
import { AppException } from '@app/shared/exceptions/exceptions.types';
import { ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Exception thrown when a requested reward cannot be found.
 * This is a client error (404) that occurs when attempting to retrieve,
 * update, or delete a reward that doesn't exist in the system.
 */
export class RewardNotFoundException extends AppException {
  /**
   * Creates a new RewardNotFoundException.
   * 
   * @param rewardId - The ID of the reward that was not found
   * @param journey - Optional journey context (health, care, plan)
   */
  constructor(
    rewardId: string,
    journey?: string
  ) {
    const message = `Reward with ID ${rewardId} not found`;
    const errorCode = 'GAME_404';
    const metadata = { rewardId, journey };
    
    super(
      message,
      ErrorType.BUSINESS,
      errorCode,
      metadata,
      undefined,
      HttpStatus.NOT_FOUND
    );
    
    // Set the name explicitly for better error identification in logs
    this.name = 'RewardNotFoundException';
  }
}