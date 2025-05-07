import { JourneyType } from '@austa/interfaces/common';

/**
 * Interface representing an achievement that a user can earn in the gamification system.
 */
export interface IAchievement {
  /**
   * Unique identifier for the achievement.
   */
  id: string;

  /**
   * The title of the achievement.
   */
  title: string;

  /**
   * A description of the achievement.
   */
  description: string;

  /**
   * The journey to which the achievement belongs (e.g., 'health', 'care', 'plan').
   */
  journey: JourneyType;

  /**
   * The name of the icon to display for the achievement.
   */
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   */
  xpReward: number;
}