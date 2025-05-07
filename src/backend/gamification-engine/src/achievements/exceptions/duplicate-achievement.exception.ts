import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';
import { Achievement } from '../entities/achievement.entity';

/**
 * Exception thrown when attempting to create an achievement that already exists.
 * This is a client error (409 Conflict) that includes details about the conflicting achievement.
 */
export class DuplicateAchievementException extends AppException {
  /**
   * Creates a new DuplicateAchievementException.
   * 
   * @param existingAchievement - The achievement that already exists in the system
   * @param newAchievementData - The achievement data that was attempted to be created
   */
  constructor(
    existingAchievement: Achievement,
    newAchievementData: Partial<Achievement>
  ) {
    const conflictField = DuplicateAchievementException.determineConflictField(
      existingAchievement,
      newAchievementData
    );

    const message = DuplicateAchievementException.createErrorMessage(
      existingAchievement,
      conflictField
    );

    super(
      message,
      ErrorType.BUSINESS,
      'GAME_ACHIEVEMENT_409',
      {
        existingAchievement,
        newAchievementData,
        conflictField,
        statusCode: HttpStatus.CONFLICT
      }
    );
  }

  /**
   * Determines which field caused the conflict between the existing and new achievement.
   * 
   * @param existingAchievement - The achievement that already exists
   * @param newAchievementData - The achievement data that was attempted to be created
   * @returns The name of the field that caused the conflict
   */
  private static determineConflictField(
    existingAchievement: Achievement,
    newAchievementData: Partial<Achievement>
  ): string {
    if (newAchievementData.title && existingAchievement.title === newAchievementData.title) {
      return 'title';
    }

    // If we can't determine the specific field, default to title
    return 'title';
  }

  /**
   * Creates a user-friendly error message based on the conflict details.
   * 
   * @param existingAchievement - The achievement that already exists
   * @param conflictField - The field that caused the conflict
   * @returns A formatted error message with resolution suggestions
   */
  private static createErrorMessage(
    existingAchievement: Achievement,
    conflictField: string
  ): string {
    let message = `Cannot create achievement: An achievement with this ${conflictField} already exists.`;
    
    if (conflictField === 'title') {
      message += ` An achievement titled "${existingAchievement.title}" already exists with ID ${existingAchievement.id}.`;
    }

    message += ' Please use a different title or update the existing achievement instead.';
    
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