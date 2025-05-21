/**
 * Interface defining the structure of a Quest in the gamification system.
 * Quests are challenges that users can undertake within specific journeys
 * and provide XP rewards upon completion.
 */
export interface QuestInterface {
  /**
   * Unique identifier for the quest.
   */
  id: string;

  /**
   * The title of the quest that will be displayed to users.
   */
  title: string;

  /**
   * A detailed description of what the quest entails.
   */
  description: string;

  /**
   * The journey to which the quest belongs (e.g., 'health', 'care', 'plan').
   * This allows for journey-specific quests and filtering.
   */
  journey: string;

  /**
   * The name of the icon to display for the quest.
   */
  icon: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   * Limited to a maximum of 1000 XP per quest.
   */
  xpReward: number;
}