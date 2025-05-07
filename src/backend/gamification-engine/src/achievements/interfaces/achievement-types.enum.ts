/**
 * Enum representing different types of achievements within the gamification system.
 * Used for categorizing, filtering, and displaying achievements appropriately.
 */
export enum AchievementType {
  /**
   * Achievements specific to a single journey (Health, Care, or Plan).
   * These are earned through activities within that journey only.
   */
  JOURNEY = 'JOURNEY',

  /**
   * Achievements that span multiple journeys and require activities
   * across different parts of the application.
   */
  CROSS_JOURNEY = 'CROSS_JOURNEY',

  /**
   * Special achievements for limited-time events, seasonal activities,
   * or other unique circumstances.
   */
  SPECIAL = 'SPECIAL',

  /**
   * Hidden achievements that are not visible to users until unlocked.
   * Used for surprise elements and easter eggs.
   */
  HIDDEN = 'HIDDEN',

  /**
   * Achievements that can be earned multiple times.
   * Often used for recurring activities or milestone achievements.
   */
  REPEATABLE = 'REPEATABLE'
}