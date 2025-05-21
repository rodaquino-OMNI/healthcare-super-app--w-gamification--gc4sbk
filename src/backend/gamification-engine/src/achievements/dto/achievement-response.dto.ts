import { Expose, Transform } from 'class-transformer';
import { Achievement } from '../entities/achievement.entity';
import { format } from 'date-fns';
import { IJourneyType } from '@austa/interfaces/gamification';

/**
 * Data Transfer Object for standardizing achievement responses across all API endpoints.
 * Extends the Achievement entity with additional computed properties and controls serialization.
 * 
 * This DTO ensures consistent response formatting for achievement data and enhances
 * the API contract with computed properties that are useful for frontend display.
 */
export class AchievementResponseDto extends Achievement {
  /**
   * The unique identifier of the achievement.
   */
  @Expose()
  id: string;

  /**
   * The title of the achievement.
   */
  @Expose()
  title: string;

  /**
   * A description of the achievement.
   */
  @Expose()
  description: string;

  /**
   * The journey to which the achievement belongs (e.g., 'health', 'care', 'plan').
   * Uses the standardized journey types from @austa/interfaces to ensure type safety
   * and consistent journey identification across services.
   */
  @Expose()
  @Transform(({ value }) => value as IJourneyType)
  journey: IJourneyType;

  /**
   * The name of the icon to display for the achievement.
   */
  @Expose()
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   */
  @Expose()
  xpReward: number;

  /**
   * The creation date of the achievement, formatted for display.
   * This is a computed property that formats the createdAt timestamp using date-fns.
   * Returns a localized date string in the format "January 1, 2023" (varies by locale).
   */
  @Expose()
  @Transform(({ obj }) => {
    if (obj.createdAt) {
      return format(new Date(obj.createdAt), 'PPP'); // Localized date format
    }
    return null;
  })
  formattedDate: string;

  /**
   * The percentage of users who have unlocked this achievement (0-100).
   * This is a computed property based on user achievement data that helps
   * frontend applications display achievement rarity and popularity.
   */
  @Expose()
  @Transform(({ obj }) => {
    // Default to 0 if not provided
    return obj.unlockRate || 0;
  })
  unlockRate: number;

  /**
   * Indicates if the achievement is new (created within the last 7 days).
   * This is a computed property based on the creation date.
   */
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.createdAt) return false;
    
    const createdAt = new Date(obj.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 7;
  })
  isNew: boolean;

  /**
   * The difficulty level of the achievement (easy, medium, hard).
   * This is a computed property derived from the xpReward value to provide
   * frontend applications with a standardized way to display achievement difficulty.
   */
  @Expose()
  @Transform(({ obj }) => {
    const xp = obj.xpReward;
    if (xp <= 100) return 'easy';
    if (xp <= 500) return 'medium';
    return 'hard';
  })
  difficulty: string;

  /**
   * Creates an AchievementResponseDto instance from an Achievement entity.
   * This static method simplifies the transformation process in services and controllers.
   * 
   * @param achievement - The achievement entity to transform
   * @param unlockRate - Optional unlock rate percentage (0-100)
   * @returns A new AchievementResponseDto instance
   */
  static fromEntity(achievement: Achievement, unlockRate?: number): AchievementResponseDto {
    const responseDto = new AchievementResponseDto();
    
    // Copy all properties from the achievement entity
    Object.assign(responseDto, achievement);
    
    // Set the unlock rate if provided
    if (unlockRate !== undefined) {
      responseDto['unlockRate'] = unlockRate;
    }
    
    return responseDto;
  }
}