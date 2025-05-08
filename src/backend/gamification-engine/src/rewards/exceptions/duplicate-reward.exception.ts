import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';
import { Reward } from '../entities/reward.entity';

/**
 * Exception thrown when attempting to create a reward that already exists.
 * This is a client error (409 Conflict) that includes details about the conflicting reward.
 */
export class DuplicateRewardException extends AppException {
  /**
   * Creates a new DuplicateRewardException.
   * 
   * @param existingReward - The reward that already exists in the system
   * @param newRewardData - The reward data that was attempted to be created
   */
  constructor(
    existingReward: Reward,
    newRewardData: Partial<Reward>
  ) {
    const conflictField = DuplicateRewardException.determineConflictField(
      existingReward,
      newRewardData
    );

    const message = DuplicateRewardException.createErrorMessage(
      existingReward,
      conflictField
    );

    super(
      message,
      ErrorType.BUSINESS,
      'GAME_REWARD_409',
      {
        existingReward,
        newRewardData,
        conflictField,
        statusCode: HttpStatus.CONFLICT
      }
    );
  }

  /**
   * Determines which field caused the conflict between the existing and new reward.
   * 
   * @param existingReward - The reward that already exists
   * @param newRewardData - The reward data that was attempted to be created
   * @returns The name of the field that caused the conflict
   */
  private static determineConflictField(
    existingReward: Reward,
    newRewardData: Partial<Reward>
  ): string {
    if (newRewardData.title && existingReward.title === newRewardData.title) {
      return 'title';
    }

    // If we can't determine the specific field, default to title
    return 'title';
  }

  /**
   * Creates a user-friendly error message based on the conflict details.
   * 
   * @param existingReward - The reward that already exists
   * @param conflictField - The field that caused the conflict
   * @returns A formatted error message with resolution suggestions
   */
  private static createErrorMessage(
    existingReward: Reward,
    conflictField: string
  ): string {
    let message = `Cannot create reward: A reward with this ${conflictField} already exists.`;
    
    if (conflictField === 'title') {
      message += ` A reward titled "${existingReward.title}" already exists with ID ${existingReward.id}.`;
    }

    message += ' Please use a different title or update the existing reward instead.';
    
    return message;
  }

  /**
   * Gets the HTTP status code for this exception.
   * 
   * @returns The HTTP status code (409 Conflict)
   */
  getStatus(): number {
    return HttpStatus.CONFLICT;
  }
}