import { IAchievement } from './i-achievement.interface';

/**
 * Interface representing the relationship between a user and an achievement in the gamification system.
 * Tracks a user's progress toward unlocking achievements, including completion status and timestamps.
 */
export interface IUserAchievement {
  /**
   * The ID of the user's game profile.
   */
  profileId: string;

  /**
   * The ID of the achievement.
   */
  achievementId: string;

  /**
   * The user's game profile. Uses generic type to avoid circular dependency.
   */
  profile?: any; // References GameProfile type

  /**
   * The achievement associated with this user achievement record.
   */
  achievement?: IAchievement;

  /**
   * The user's current progress towards unlocking the achievement.
   * Values range from 0 to the achievement's required target value.
   */
  progress: number;

  /**
   * Indicates whether the achievement has been unlocked by the user.
   */
  unlocked: boolean;

  /**
   * The date and time when the achievement was unlocked.
   * Null if the achievement hasn't been unlocked yet.
   */
  unlockedAt?: Date | null;

  /**
   * The date and time when the user achievement record was created.
   */
  createdAt?: Date;

  /**
   * The date and time when the user achievement record was last updated.
   */
  updatedAt?: Date;
}