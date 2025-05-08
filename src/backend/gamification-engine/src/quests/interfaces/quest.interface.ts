/**
 * Interface representing challenges that users can undertake within the gamification system.
 * This interface provides a standardized contract for quest data structures that define
 * the core properties of quests across the gamification engine, ensuring type safety
 * and consistent data handling in all quest-related operations.
 */
export interface QuestInterface {
  /**
   * Unique identifier for the quest.
   * Generated as a UUID when a new quest is created.
   */
  id: string;

  /**
   * The title of the quest that will be displayed to users.
   * This should be concise and descriptive of the quest's objective.
   */
  title: string;

  /**
   * A detailed description of what the quest entails.
   * This provides users with information about how to complete the quest.
   */
  description: string;

  /**
   * The journey to which the quest belongs (e.g., 'health', 'care', 'plan').
   * This allows for journey-specific quests and filtering.
   */
  journey: string;

  /**
   * The name of the icon to display for the quest.
   * This references an icon in the design system.
   */
  icon: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   * Limited to a maximum of 1000 XP per quest.
   */
  xpReward: number;
}