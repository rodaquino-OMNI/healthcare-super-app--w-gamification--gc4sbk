/**
 * @file game-profile.interface.ts
 * @description Defines the GameProfile interface for the gamification engine.
 * 
 * This interface is also exported from @austa/interfaces/gamification package
 * to ensure type consistency across services. Local services should import
 * from this file, while external services should import from @austa/interfaces.
 */

import { IUserAchievement } from '@app/achievements/interfaces/i-user-achievement.interface';
import { UserQuest } from '@app/quests/entities/user-quest.entity';

/**
 * GameProfile Interface
 * 
 * Represents a user's gamification profile, tracking their level, experience points (XP),
 * and associated achievements and quests. This interface is central to the gamification system
 * and serves as the foundation for tracking user progression across all journeys.
 * 
 * This standardized interface ensures consistency between backend storage and frontend display,
 * providing type safety for profile data across the application.
 * 
 * @note This interface is also exported from @austa/interfaces/gamification for use across services
 */
export interface GameProfile {
  /**
   * Unique identifier for the game profile
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * Reference to the user who owns this game profile
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string;

  /**
   * The user's current level in the gamification system
   * Starts at level 1 and increases as the user gains XP
   * @default 1
   * @minimum 1
   */
  level: number;

  /**
   * The user's current experience points
   * Accumulates as the user completes actions, achievements, and quests
   * @default 0
   * @minimum 0
   */
  xp: number;

  /**
   * The total XP required to reach the next level
   * This is calculated based on the current level
   * @default 100
   * @minimum 100
   */
  nextLevelXp: number;

  /**
   * Date when the profile was created
   */
  createdAt: Date;

  /**
   * Date when the profile was last updated
   */
  updatedAt: Date;

  /**
   * Optional metadata for additional profile properties
   * Stored as a JSON object
   * @example { "lastJourney": "health", "preferences": { "notifications": true } }
   */
  metadata?: Record<string, any>;

  /**
   * Version number, automatically incremented when the entity is updated
   * Used for optimistic concurrency control
   */
  version: number;

  /**
   * Collection of achievements associated with this user profile
   * Represents all achievements that the user has unlocked or is progressing towards
   */
  achievements: IUserAchievement[];

  /**
   * Collection of quests associated with this user profile
   * Represents all quests that the user has started or completed
   */
  quests: UserQuest[];
}