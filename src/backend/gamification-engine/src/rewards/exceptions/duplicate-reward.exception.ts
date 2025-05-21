import { HttpStatus } from '@nestjs/common';
import { Reward } from '../entities/reward.entity';
import { HttpException } from '@nestjs/common';

/**
 * Exception thrown when attempting to create a reward that already exists.
 * This is a client error (409 Conflict) that includes details about the conflicting reward.
 */
export class DuplicateRewardException extends HttpException {
  /**
   * Creates a new DuplicateRewardException.
   * 
   * @param existingReward - The reward that already exists in the system
   * @param attemptedData - The data that was attempted to be used for creating a new reward
   * @param duplicateField - The field that caused the duplication conflict (e.g., 'title', 'id')
   */
  constructor(
    private readonly existingReward: Partial<Reward>,
    private readonly attemptedData: Partial<Reward>,
    private readonly duplicateField: string = 'title'
  ) {
    const message = `Reward with ${duplicateField} '${attemptedData[duplicateField]}' already exists`;
    
    // Create a response object with helpful information
    const response = {
      statusCode: HttpStatus.CONFLICT,
      error: 'Duplicate Reward',
      message,
      code: 'GAME_REWARD_DUPLICATE',
      details: {
        existingReward: {
          id: existingReward.id,
          title: existingReward.title,
          journey: existingReward.journey
        },
        duplicateField,
        duplicateValue: attemptedData[duplicateField]
      },
      resolution: `Please use a different ${duplicateField} or update the existing reward instead.`
    };
    
    super(response, HttpStatus.CONFLICT);
  }

  /**
   * Gets the existing reward that caused the conflict.
   */
  getExistingReward(): Partial<Reward> {
    return this.existingReward;
  }

  /**
   * Gets the attempted reward data that caused the conflict.
   */
  getAttemptedData(): Partial<Reward> {
    return this.attemptedData;
  }

  /**
   * Gets the field that caused the duplication conflict.
   */
  getDuplicateField(): string {
    return this.duplicateField;
  }
}