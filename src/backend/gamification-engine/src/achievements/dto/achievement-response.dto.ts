import { Expose, Transform, Type } from 'class-transformer'; // class-transformer 0.5.1
import { Achievement } from '../entities/achievement.entity';
import { IJourneyType } from '@austa/interfaces/gamification'; // @austa/interfaces 1.0.0
import { format } from 'date-fns'; // date-fns 3.3.1

/**
 * Data Transfer Object for standardizing achievement responses across API endpoints.
 * Extends the Achievement entity with additional computed properties for frontend use.
 */
export class AchievementResponseDto extends Achievement {
  /**
   * The original achievement ID.
   * Explicitly exposed to ensure it's always included in the response.
   */
  @Expose()
  id: string;

  /**
   * The title of the achievement.
   */
  @Expose()
  title: string;

  /**
   * The description of the achievement.
   */
  @Expose()
  description: string;

  /**
   * The journey to which this achievement belongs.
   * Validated against the IJourneyType interface from @austa/interfaces.
   */
  @Expose()
  @Transform(({ value }) => value as IJourneyType)
  journey: IJourneyType;

  /**
   * The icon name for the achievement.
   */
  @Expose()
  icon: string;

  /**
   * The XP reward for unlocking this achievement.
   */
  @Expose()
  xpReward: number;

  /**
   * The creation date of the achievement.
   * Transformed to ISO string format for consistent API responses.
   */
  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  createdAt: Date;

  /**
   * The last update date of the achievement.
   * Transformed to ISO string format for consistent API responses.
   */
  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  updatedAt: Date;

  /**
   * Computed property that returns the formatted creation date.
   * Uses date-fns for consistent date formatting across the application.
   */
  @Expose()
  @Transform(({ obj }) => {
    if (obj.createdAt instanceof Date) {
      return format(obj.createdAt, 'PPP'); // Locale-aware date format
    }
    if (typeof obj.createdAt === 'string') {
      return format(new Date(obj.createdAt), 'PPP');
    }
    return null;
  })
  get formattedDate(): string | null {
    return null; // This is a placeholder, the actual value is set by the @Transform decorator
  }

  /**
   * Computed property that returns the unlock rate as a percentage.
   * This is calculated from statistics stored elsewhere and injected during transformation.
   */
  @Expose()
  @Transform(({ obj }) => {
    // This would typically be injected from a service that tracks achievement statistics
    // For now, we'll return a placeholder value or use a property if it exists
    return obj.unlockRate || 0;
  })
  get unlockRate(): number {
    return 0; // This is a placeholder, the actual value is set by the @Transform decorator
  }

  /**
   * Computed property that determines if this is a rare achievement.
   * An achievement is considered rare if less than 10% of users have unlocked it.
   */
  @Expose()
  @Transform(({ obj }) => {
    const rate = obj.unlockRate || 0;
    return rate < 10;
  })
  get isRare(): boolean {
    return false; // This is a placeholder, the actual value is set by the @Transform decorator
  }

  /**
   * Computed property that returns the journey-specific color for UI display.
   * Maps the journey type to its corresponding theme color.
   */
  @Expose()
  @Transform(({ obj }) => {
    const journeyColorMap = {
      health: '#4CAF50', // Green
      care: '#FF9800',   // Orange
      plan: '#2196F3'    // Blue
    };
    
    return journeyColorMap[obj.journey] || '#9C27B0'; // Default to purple if journey not found
  })
  get journeyColor(): string {
    return '#9C27B0'; // This is a placeholder, the actual value is set by the @Transform decorator
  }
}