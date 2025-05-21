import { JourneyType } from '@austa/interfaces/common';

/**
 * Interface representing an achievement that a user can earn in the gamification system.
 * This interface ensures type safety when manipulating achievement data throughout the application.
 * It is used by both backend services and frontend applications to maintain consistent data models.
 */
export interface IAchievement {
  /**
   * Unique identifier for the achievement, stored as a UUID.
   */
  id: string;

  /**
   * The title of the achievement displayed to users.
   * Should be concise and descriptive of the accomplishment.
   */
  title: string;

  /**
   * A detailed description of the achievement explaining how to earn it
   * and its significance within the journey context.
   */
  description: string;

  /**
   * The journey to which the achievement belongs.
   * Must be one of the three core journeys: 'health', 'care', or 'plan'.
   */
  journey: JourneyType;

  /**
   * The name of the icon to display for the achievement.
   * References an icon in the design system.
   */
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   * Must be a non-negative integer between 0 and 1000.
   */
  xpReward: number;
}