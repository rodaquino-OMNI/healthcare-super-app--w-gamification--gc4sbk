import { BaseEntity } from '@austa/interfaces/common/base-entity.interface';
import { JourneyType } from '@austa/interfaces/journey/journey-type.interface';

/**
 * Interface representing an achievement in the gamification system.
 * Achievements are earned by users when they complete specific actions or reach milestones
 * across any of the three journeys (health, care, plan).
 */
export interface IAchievement extends BaseEntity {
  /**
   * Unique identifier for the achievement.
   * Generated as a UUID when the achievement is created.
   */
  id: string;

  /**
   * The title of the achievement displayed to users.
   * Should be concise, descriptive, and engaging.
   */
  title: string;

  /**
   * A detailed description of the achievement explaining how to earn it
   * and its significance within the journey context.
   */
  description: string;

  /**
   * The journey to which the achievement belongs.
   * Achievements are categorized by journey to enable journey-specific filtering and reporting.
   */
  journey: JourneyType;

  /**
   * The name of the icon to display for the achievement.
   * References an icon in the design system's icon library.
   */
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   * XP contributes to the user's overall level in the gamification system.
   * Value must be between 0 and 1000.
   */
  xpReward: number;
}