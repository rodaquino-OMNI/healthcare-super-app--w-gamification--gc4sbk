import { NotFoundException } from '@nestjs/common';
import { ErrorType } from '../../common/exceptions/error-types.enum';

/**
 * Exception thrown when a reward cannot be found.
 * This is a client error (404) that includes the reward ID in the error context.
 * 
 * Used when attempting to retrieve, update, or delete a reward that doesn't exist,
 * ensuring consistent error handling and appropriate HTTP status codes.
 */
export class RewardNotFoundException extends NotFoundException {
  /**
   * Creates a new RewardNotFoundException instance.
   * 
   * @param rewardId - The ID of the reward that was not found
   * @param message - Optional custom error message (defaults to a standard not found message)
   */
  constructor(
    private readonly rewardId: string,
    message: string = `Reward with ID ${rewardId} not found`
  ) {
    super({
      message,
      error: 'Reward Not Found',
      statusCode: 404,
      errorCode: 'REWARD_003',
      errorType: ErrorType.BUSINESS,
      context: { rewardId }
    });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, RewardNotFoundException.prototype);
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Gets the ID of the reward that was not found.
   * 
   * @returns The reward ID
   */
  getRewardId(): string {
    return this.rewardId;
  }
}