import { IUser } from '@austa/interfaces/auth';
import { UserAchievement } from '../../achievements/entities/user-achievement.entity';
import { UserQuest } from '../../quests/entities/user-quest.entity';

/**
 * Interface representing a user's gamification profile.
 * Defines the core structure for tracking a user's progress, level, experience points,
 * achievements, and quests within the gamification system.
 *
 * This interface is implemented by the GameProfile entity and used throughout
 * the gamification engine to ensure type safety and consistent data structure.
 */
export interface GameProfile {
  /**
   * Unique identifier for the game profile
   */
  id: string;

  /**
   * ID of the user this profile belongs to
   * References the User entity from the auth service
   */
  userId: IUser['id'];

  /**
   * Current level of the user
   * Starts at 1 and increases as the user gains XP
   */
  level: number;

  /**
   * Current experience points of the user
   * Accumulates as the user completes actions and unlocks achievements
   */
  xp: number;

  /**
   * Collection of achievements unlocked by the user
   * Managed through the UserAchievement entity
   */
  achievements?: UserAchievement[];

  /**
   * Collection of quests the user is participating in or has completed
   * Managed through the UserQuest entity
   */
  quests?: UserQuest[];

  /**
   * Timestamp when the profile was created
   */
  createdAt: Date;

  /**
   * Timestamp when the profile was last updated
   */
  updatedAt: Date;

  /**
   * Calculates the XP required to reach the next level
   * Uses a progressive scaling formula based on current level
   * @returns The XP required for the next level
   */
  getNextLevelXp(): number;

  /**
   * Adds XP to the user's profile and levels up if necessary
   * @param amount The amount of XP to add
   * @returns True if the user leveled up, false otherwise
   */
  addXp(amount: number): boolean;

  /**
   * Resets the user's level and XP to default values
   * Used for testing or administrative purposes
   */
  resetProgress(): void;
}