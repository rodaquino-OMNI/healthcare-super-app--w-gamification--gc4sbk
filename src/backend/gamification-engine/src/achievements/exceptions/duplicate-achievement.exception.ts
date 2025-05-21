import { HttpStatus } from '@nestjs/common';
import { Achievement } from '../entities/achievement.entity';
import { HttpException } from '@nestjs/common';

/**
 * Exception thrown when attempting to create an achievement that already exists.
 * This is a client error (409 Conflict) that includes details about the conflicting achievement.
 */
export class DuplicateAchievementException extends HttpException {
  /**
   * Creates a new DuplicateAchievementException.
   * 
   * @param existingAchievement - The achievement that already exists in the system
   * @param attemptedData - The data that was attempted to be used for creating a new achievement
   * @param duplicateField - The field that caused the duplication conflict (e.g., 'title', 'id')
   */
  constructor(
    private readonly existingAchievement: Partial<Achievement>,
    private readonly attemptedData: Partial<Achievement>,
    private readonly duplicateField: string = 'title'
  ) {
    const message = `Achievement with ${duplicateField} '${attemptedData[duplicateField]}' already exists`;
    
    // Create a response object with helpful information
    const response = {
      statusCode: HttpStatus.CONFLICT,
      error: 'Duplicate Achievement',
      message,
      code: 'GAME_ACHIEVEMENT_DUPLICATE',
      details: {
        existingAchievement: {
          id: existingAchievement.id,
          title: existingAchievement.title,
          journey: existingAchievement.journey
        },
        duplicateField,
        duplicateValue: attemptedData[duplicateField]
      },
      resolution: `Please use a different ${duplicateField} or update the existing achievement instead.`
    };
    
    super(response, HttpStatus.CONFLICT);
  }

  /**
   * Gets the existing achievement that caused the conflict.
   */
  getExistingAchievement(): Partial<Achievement> {
    return this.existingAchievement;
  }

  /**
   * Gets the attempted achievement data that caused the conflict.
   */
  getAttemptedData(): Partial<Achievement> {
    return this.attemptedData;
  }

  /**
   * Gets the field that caused the duplication conflict.
   */
  getDuplicateField(): string {
    return this.duplicateField;
  }
}