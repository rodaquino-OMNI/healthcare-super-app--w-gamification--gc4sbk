import { FilterDto } from '@austa/interfaces/common/dto';

/**
 * QuestFilterInterface - Standardizes filtering criteria for quest queries
 * across the gamification engine.
 *
 * This interface extends the base FilterDto with quest-specific filtering options
 * to provide type-safe parameters for filtering quests by journey, completion status,
 * date range, and other attributes.
 */
export interface QuestFilterInterface extends FilterDto {
  /**
   * Filter quests by journey type (health, care, plan)
   * @example "health"
   */
  journey?: string;

  /**
   * Filter quests by completion status
   * @example true (completed quests)
   * @example false (incomplete quests)
   */
  completed?: boolean;

  /**
   * Search term to filter quests by title or description
   * @example "daily exercise"
   */
  search?: string;

  /**
   * Filter quests by start date range (ISO string format)
   * @example { startDate: "2023-01-01T00:00:00Z", endDate: "2023-12-31T23:59:59Z" }
   */
  dateRange?: {
    /**
     * Start date for filtering (inclusive)
     * @example "2023-01-01T00:00:00Z"
     */
    startDate?: string;

    /**
     * End date for filtering (inclusive)
     * @example "2023-12-31T23:59:59Z"
     */
    endDate?: string;
  };

  /**
   * Filter quests by difficulty level
   * @example "easy"
   * @example "medium"
   * @example "hard"
   */
  difficulty?: 'easy' | 'medium' | 'hard';

  /**
   * Filter quests by required XP level to start
   * @example { min: 10, max: 50 }
   */
  requiredLevel?: {
    /**
     * Minimum required level (inclusive)
     * @example 10
     */
    min?: number;

    /**
     * Maximum required level (inclusive)
     * @example 50
     */
    max?: number;
  };

  /**
   * Filter quests by XP reward range
   * @example { min: 100, max: 500 }
   */
  xpReward?: {
    /**
     * Minimum XP reward (inclusive)
     * @example 100
     */
    min?: number;

    /**
     * Maximum XP reward (inclusive)
     * @example 500
     */
    max?: number;
  };

  /**
   * Filter quests by tags
   * @example ["daily", "exercise", "nutrition"]
   */
  tags?: string[];

  /**
   * Filter quests by availability status
   * @example true (available quests)
   * @example false (unavailable quests)
   */
  available?: boolean;

  /**
   * Filter quests by whether they are repeatable
   * @example true (repeatable quests)
   * @example false (one-time quests)
   */
  repeatable?: boolean;

  /**
   * Default sorting options for quests
   * @default { createdAt: "desc" }
   */
  orderBy?: Record<string, 'asc' | 'desc'>;
}