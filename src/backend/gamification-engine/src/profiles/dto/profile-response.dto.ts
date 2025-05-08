import { Expose, Type } from 'class-transformer'; // class-transformer 0.5.1
import { GameProfile } from '@austa/interfaces/gamification'; // @austa/interfaces 1.0.0
import { UserAchievement } from '../../achievements/entities/user-achievement.entity';
import { UserQuest } from '../../quests/entities/user-quest.entity';

/**
 * Data Transfer Object for game profile responses.
 *
 * This DTO standardizes the structure of game profile data returned by API endpoints.
 * It includes all game profile attributes, timestamps, and relationships to achievements
 * and quests with proper serialization. The class uses class-transformer decorators
 * to control which properties are exposed in the API response and how nested objects
 * are transformed.
 *
 * @implements {GameProfile} GameProfile interface from @austa/interfaces
 */
export class ProfileResponseDto implements GameProfile {
  /**
   * Unique identifier for the game profile
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @Expose()
  id: string;

  /**
   * Reference to the user who owns this game profile
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @Expose()
  userId: string;

  /**
   * The user's current level in the gamification system
   * @example 5
   */
  @Expose()
  level: number;

  /**
   * The user's current experience points
   * @example 750
   */
  @Expose()
  xp: number;

  /**
   * The total XP required to reach the next level
   * @example 1118
   */
  @Expose()
  nextLevelXp: number;

  /**
   * Date when the profile was created
   * @example "2023-04-01T12:00:00.000Z"
   */
  @Expose()
  createdAt: Date;

  /**
   * Date when the profile was last updated
   * @example "2023-04-15T14:30:00.000Z"
   */
  @Expose()
  updatedAt: Date;

  /**
   * Optional metadata for additional profile properties
   * @example { "lastJourney": "health", "preferences": { "notifications": true } }
   */
  @Expose()
  metadata?: Record<string, any>;

  /**
   * Version number for optimistic concurrency control
   * @example 3
   */
  @Expose()
  version: number;

  /**
   * Collection of achievements that the user has unlocked or is progressing towards
   * Uses Type decorator to ensure proper nested object transformation
   */
  @Expose()
  @Type(() => UserAchievement)
  achievements: UserAchievement[];

  /**
   * Collection of quests that the user is participating in
   * Uses Type decorator to ensure proper nested object transformation
   */
  @Expose()
  @Type(() => UserQuest)
  quests: UserQuest[];

  /**
   * Calculated property that returns the percentage progress to the next level
   * @example 67.5
   */
  @Expose()
  get levelProgress(): number {
    if (!this.nextLevelXp) return 0;
    return Math.min(100, (this.xp / this.nextLevelXp) * 100);
  }

  /**
   * Calculated property that returns the total number of unlocked achievements
   * @example 12
   */
  @Expose()
  get unlockedAchievementsCount(): number {
    if (!this.achievements || !this.achievements.length) return 0;
    return this.achievements.filter(achievement => achievement.unlocked).length;
  }

  /**
   * Calculated property that returns the total number of completed quests
   * @example 8
   */
  @Expose()
  get completedQuestsCount(): number {
    if (!this.quests || !this.quests.length) return 0;
    return this.quests.filter(quest => quest.completed).length;
  }
}