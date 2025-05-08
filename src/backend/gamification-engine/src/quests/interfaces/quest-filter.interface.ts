/**
 * @file Quest Filter Interface
 * 
 * Defines the QuestFilterInterface that standardizes filtering criteria for quest queries.
 * This interface provides type-safe parameters for filtering quests by journey, completion status,
 * date range, and other attributes. It ensures consistent filtering behavior across controllers
 * and services.
 */

/**
 * Enum representing the possible status values for a quest
 */
export enum QuestStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

/**
 * Enum representing the journey types in the application
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Interface for sorting options
 */
export interface SortOptions {
  [key: string]: 'ASC' | 'DESC';
}

/**
 * Interface for standardized quest filtering
 * 
 * This interface provides a consistent structure for filtering quests across
 * the application, ensuring type safety and predictable behavior.
 * 
 * @example
 * // Filter quests for the health journey that are completed
 * const filter: QuestFilterInterface = {
 *   journey: JourneyType.HEALTH,
 *   status: QuestStatus.COMPLETED,
 *   page: 1,
 *   limit: 10
 * };
 */
export interface QuestFilterInterface {
  /**
   * Filter quests by journey type (health, care, plan)
   */
  journey?: JourneyType;
  
  /**
   * Filter quests by completion status
   */
  status?: QuestStatus;
  
  /**
   * Filter quests created after this date
   */
  startDate?: Date | string;
  
  /**
   * Filter quests created before this date
   */
  endDate?: Date | string;
  
  /**
   * Filter quests by title (partial match)
   */
  title?: string;
  
  /**
   * Filter quests by minimum XP reward
   */
  minXpReward?: number;
  
  /**
   * Filter quests by maximum XP reward
   */
  maxXpReward?: number;
  
  /**
   * Filter quests by tags (array of string tags)
   */
  tags?: string[];
  
  /**
   * Pagination: page number (1-based)
   * @default 1
   */
  page?: number;
  
  /**
   * Pagination: number of items per page
   * @default 10
   */
  limit?: number;
  
  /**
   * Sorting options
   * @example { createdAt: 'DESC', xpReward: 'ASC' }
   */
  orderBy?: SortOptions;
  
  /**
   * Additional filter criteria for advanced queries
   * This allows for more complex filtering beyond the standard fields
   */
  where?: Record<string, any>;
}