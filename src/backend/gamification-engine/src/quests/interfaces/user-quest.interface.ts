/**
 * Interface representing the relationship between users and quests, tracking progress and completion status.
 * This interface provides type definitions for user quest records with properties including id,
 * profileId, questId, progress, and completed status.
 */
export interface UserQuestInterface {
  /**
   * Unique identifier for the user quest.
   */
  id: string;

  /**
   * The ID of the game profile of the user participating in the quest.
   * This replaces the entity relationship with an explicit ID reference.
   */
  profileId: string;

  /**
   * The ID of the quest being undertaken by the user.
   * This replaces the entity relationship with an explicit ID reference.
   */
  questId: string;

  /**
   * The user's current progress toward completing the quest (0-100).
   * This allows tracking partial completion of quests that require
   * multiple steps or actions.
   */
  progress: number;

  /**
   * Indicates whether the user has completed the quest.
   * When true, the quest is considered fully completed and rewards are granted.
   */
  completed: boolean;
}