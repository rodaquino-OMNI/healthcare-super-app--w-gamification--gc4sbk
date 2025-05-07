/**
 * Enum representing all possible states of an achievement for a specific user.
 * Used throughout the achievement tracking system to determine achievement visibility,
 * progress display, and reward distribution.
 */
export enum AchievementStatus {
  /**
   * The achievement is locked and not yet visible to the user.
   * Typically used for sequential or hidden achievements.
   */
  LOCKED = 'LOCKED',

  /**
   * The achievement is visible to the user and they have made some progress towards it,
   * but it has not yet been unlocked.
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * The achievement has been successfully unlocked by the user.
   * XP rewards have been distributed and the achievement is displayed as completed.
   */
  UNLOCKED = 'UNLOCKED',

  /**
   * The achievement was previously unlocked but has been reset,
   * allowing the user to earn it again (for repeatable achievements).
   */
  RESET = 'RESET'
}