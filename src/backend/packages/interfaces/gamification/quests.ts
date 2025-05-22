/**
 * @file Quest interfaces for the gamification system
 * @description Defines TypeScript interfaces for quests in the gamification engine,
 * including Quest, UserQuest, and related types. These interfaces provide a standardized
 * contract for time-limited challenges that users can complete to earn rewards, and for
 * tracking user progress on these quests.
 */

// Import related interfaces
import { GameProfile } from './profiles';

/**
 * Represents a journey type in the application.
 * Used to categorize quests by their associated journey.
 */
export type JourneyType = 'health' | 'care' | 'plan';

/**
 * Represents a quest in the gamification system.
 * Quests are time-limited challenges that users can complete to earn rewards.
 */
/**
 * Represents a quest in the gamification system.
 * Quests are time-limited challenges that users can complete to earn rewards.
 */
export interface Quest {
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
  journey: JourneyType;

  /**
   * The name of the icon to display for the quest.
   */
  icon: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   * Limited to a maximum of 1000 XP per quest.
   */
  xpReward: number;

  /**
   * Optional start date for time-limited quests.
   * If not provided, the quest is considered always available.
   */
  startDate?: Date;

  /**
   * Optional end date for time-limited quests.
   * If not provided, the quest does not expire.
   */
  endDate?: Date;

  /**
   * Optional difficulty level of the quest (1-5).
   * Higher difficulty typically corresponds to higher rewards.
   */
  difficulty?: number;

  /**
   * Optional tags for categorizing and filtering quests.
   */
  tags?: string[];
}

/**
 * Represents a health-specific quest in the gamification system.
 * Extends the base Quest interface with health-specific properties.
 */
export interface HealthQuest extends Quest {
  /**
   * The journey type is always 'health' for health quests.
   */
  journey: 'health';
  
  /**
   * Optional health metric target associated with this quest.
   * For example, steps, calories, heart rate, etc.
   */
  metricTarget?: {
    /**
     * The type of health metric to track.
     */
    type: string;
    
    /**
     * The target value to achieve.
     */
    value: number;
    
    /**
     * The unit of measurement for the target value.
     */
    unit: string;
  };
}

/**
 * Represents a care-specific quest in the gamification system.
 * Extends the base Quest interface with care-specific properties.
 */
export interface CareQuest extends Quest {
  /**
   * The journey type is always 'care' for care quests.
   */
  journey: 'care';
  
  /**
   * Optional care action associated with this quest.
   * For example, booking an appointment, completing a telemedicine session, etc.
   */
  careAction?: {
    /**
     * The type of care action to complete.
     */
    type: string;
    
    /**
     * Optional provider type required for the action.
     */
    providerType?: string;
  };
}

/**
 * Represents a plan-specific quest in the gamification system.
 * Extends the base Quest interface with plan-specific properties.
 */
export interface PlanQuest extends Quest {
  /**
   * The journey type is always 'plan' for plan quests.
   */
  journey: 'plan';
  
  /**
   * Optional plan action associated with this quest.
   * For example, submitting a claim, reviewing benefits, etc.
   */
  planAction?: {
    /**
     * The type of plan action to complete.
     */
    type: string;
    
    /**
     * Optional benefit type associated with the action.
     */
    benefitType?: string;
  };
}

/**
 * Represents a user's participation in a quest, tracking their progress and completion status.
 * This interface establishes the relationship between a user's game profile and a specific quest,
 * allowing the system to track quest progress as part of the gamification engine.
 */
export interface UserQuest {
  /**
   * Unique identifier for the user quest.
   */
  id: string;

  /**
   * The game profile of the user participating in the quest.
   * This can be either the full GameProfile object or just the profile ID.
   */
  profile: GameProfile | string;

  /**
   * The quest being undertaken by the user.
   * This can be either the full Quest object or just the quest ID.
   */
  quest: Quest | string;

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
  
  /**
   * Optional date when the user started the quest.
   */
  startedAt?: Date;
  
  /**
   * Optional date when the user completed the quest.
   */
  completedAt?: Date;
}

/**
 * Interface for quest creation request data.
 * Used when creating a new quest in the system.
 */
export interface CreateQuestDto {
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
   */
  journey: JourneyType;

  /**
   * The name of the icon to display for the quest.
   */
  icon: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   */
  xpReward: number;

  /**
   * Optional start date for time-limited quests.
   */
  startDate?: Date;

  /**
   * Optional end date for time-limited quests.
   */
  endDate?: Date;

  /**
   * Optional difficulty level of the quest (1-5).
   */
  difficulty?: number;

  /**
   * Optional tags for categorizing and filtering quests.
   */
  tags?: string[];
}

/**
 * Interface for quest update request data.
 * Used when updating an existing quest in the system.
 */
export interface UpdateQuestDto {
  /**
   * The title of the quest that will be displayed to users.
   */
  title?: string;

  /**
   * A detailed description of what the quest entails.
   */
  description?: string;

  /**
   * The name of the icon to display for the quest.
   */
  icon?: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   */
  xpReward?: number;

  /**
   * Optional start date for time-limited quests.
   */
  startDate?: Date;

  /**
   * Optional end date for time-limited quests.
   */
  endDate?: Date;

  /**
   * Optional difficulty level of the quest (1-5).
   */
  difficulty?: number;

  /**
   * Optional tags for categorizing and filtering quests.
   */
  tags?: string[];
}

/**
 * Interface for quest progress update request data.
 * Used when updating a user's progress on a quest.
 */
export interface UpdateQuestProgressDto {
  /**
   * The user's current progress toward completing the quest (0-100).
   */
  progress: number;

  /**
   * Indicates whether the user has completed the quest.
   */
  completed?: boolean;
}

/**
 * Interface for quest filter options.
 * Used when retrieving quests from the system.
 */
export interface QuestFilterOptions {
  /**
   * Filter quests by journey type.
   */
  journey?: JourneyType;

  /**
   * Filter quests by completion status.
   */
  completed?: boolean;

  /**
   * Filter quests by tags.
   */
  tags?: string[];

  /**
   * Filter quests by difficulty level.
   */
  difficulty?: number;

  /**
   * Filter quests that are currently active (within start and end dates).
   */
  active?: boolean;

  /**
   * Limit the number of quests returned.
   */
  limit?: number;

  /**
   * Skip a number of quests (for pagination).
   */
  offset?: number;
}