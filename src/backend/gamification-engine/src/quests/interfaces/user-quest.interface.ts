/**
 * Interface representing the relationship between users and quests, tracking progress and completion status.
 * This interface provides a standardized contract for user quest records that establish the relationship
 * between a user's game profile and a specific quest, allowing the system to track quest progress
 * as part of the gamification engine.
 */
export interface UserQuestInterface {
  /**
   * Unique identifier for the user quest record.
   */
  id: string;

  /**
   * The ID of the game profile of the user participating in the quest.
   * This establishes a relationship with the user's GameProfile.
   */
  profileId: string;

  /**
   * The ID of the quest being undertaken by the user.
   * This establishes a relationship with the Quest entity.
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