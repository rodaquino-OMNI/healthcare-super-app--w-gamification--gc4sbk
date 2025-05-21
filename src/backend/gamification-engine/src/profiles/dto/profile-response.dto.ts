import { Expose, Type } from 'class-transformer';
import { IGameProfile, IUserAchievement, IUserQuest } from '@austa/interfaces/gamification';
import { IUser } from '@austa/interfaces/auth';

/**
 * Data Transfer Object for game profile responses.
 * Standardizes the structure of game profile data returned by API endpoints.
 * Includes all game profile attributes, timestamps, and relationships with proper serialization.
 */
export class ProfileResponseDto implements Partial<IGameProfile> {
  /**
   * Unique identifier for the game profile
   */
  @Expose()
  id: string;

  /**
   * ID of the user this profile belongs to
   * References the User entity from the auth service
   */
  @Expose()
  userId: IUser['id'];

  /**
   * Current level of the user
   * Starts at 1 and increases as the user gains XP
   */
  @Expose()
  level: number;

  /**
   * Current experience points of the user
   * Accumulates as the user completes actions and unlocks achievements
   */
  @Expose()
  xp: number;

  /**
   * Collection of achievements unlocked by the user
   * Managed through the UserAchievement entity
   */
  @Expose()
  @Type(() => Object) // Will be properly typed when UserAchievementResponseDto is available
  achievements?: IUserAchievement[];

  /**
   * Collection of quests the user is participating in
   * Managed through the UserQuest entity
   */
  @Expose()
  @Type(() => Object) // Will be properly typed when UserQuestResponseDto is available
  quests?: IUserQuest[];

  /**
   * Timestamp when the profile was created
   */
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  /**
   * Timestamp when the profile was last updated
   */
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  /**
   * Calculates the XP required to reach the next level
   * Uses a progressive scaling formula based on current level
   * @returns The XP required for the next level
   */
  @Expose()
  getNextLevelXp(): number {
    // Simple formula: 100 * level^1.5
    return Math.floor(100 * Math.pow(this.level, 1.5));
  }

  /**
   * Calculates the percentage progress towards the next level
   * @returns Progress percentage (0-100)
   */
  @Expose()
  getLevelProgress(): number {
    const nextLevelXp = this.getNextLevelXp();
    const currentLevelXp = Math.floor(100 * Math.pow(this.level - 1, 1.5)) || 0;
    const levelDiff = nextLevelXp - currentLevelXp;
    const currentProgress = this.xp - currentLevelXp;
    
    return Math.min(Math.floor((currentProgress / levelDiff) * 100), 100);
  }

  /**
   * Returns the remaining XP needed to reach the next level
   * @returns Remaining XP needed
   */
  @Expose()
  getRemainingXp(): number {
    const nextLevelXp = this.getNextLevelXp();
    const currentLevelXp = Math.floor(100 * Math.pow(this.level - 1, 1.5)) || 0;
    const totalNeeded = nextLevelXp - currentLevelXp;
    const currentProgress = this.xp - currentLevelXp;
    
    return Math.max(totalNeeded - currentProgress, 0);
  }
}