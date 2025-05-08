/**
 * @file Defines TypeScript interfaces for quests in the gamification engine.
 * These interfaces provide a standardized contract for time-limited challenges
 * that users can complete to earn rewards, and for tracking user progress on these quests.
 */

import { GameProfile } from './profiles';

/**
 * Represents the journey types available in the application.
 * Each quest is associated with a specific journey.
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'cross-journey';

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
   * Optional difficulty level of the quest (e.g., 'easy', 'medium', 'hard').
   * Can be used for filtering and sorting quests.
   */
  difficulty?: string;

  /**
   * Optional tags for categorizing quests.
   * Useful for filtering and grouping related quests.
   */
  tags?: string[];
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
   */
  profile: GameProfile;

  /**
   * The quest being undertaken by the user.
   */
  quest: Quest;

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
 * Represents a health-specific quest in the gamification system.
 * Extends the base Quest interface with health-specific properties.
 */
export interface HealthQuest extends Quest {
  /**
   * The journey type is always 'health' for health quests.
   */
  journey: 'health';

  /**
   * Optional health metric target associated with this quest (e.g., steps, calories, etc.).
   */
  metricTarget?: number;

  /**
   * Optional type of health metric being tracked (e.g., 'steps', 'weight', 'heart_rate').
   */
  metricType?: string;
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
   * Optional type of care activity associated with this quest
   * (e.g., 'appointment', 'medication', 'telemedicine').
   */
  careActivityType?: string;
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
   * Optional type of plan activity associated with this quest
   * (e.g., 'claim', 'benefit', 'coverage').
   */
  planActivityType?: string;
}

/**
 * Represents a cross-journey quest that spans multiple journey types.
 * These quests encourage users to engage with multiple aspects of the platform.
 */
export interface CrossJourneyQuest extends Quest {
  /**
   * The journey type is always 'cross-journey' for cross-journey quests.
   */
  journey: 'cross-journey';

  /**
   * Array of journey types that this quest spans.
   * Must include at least two different journey types.
   */
  journeys: JourneyType[];
}

/**
 * Options for retrieving quests from the system.
 * Allows filtering and pagination of quest results.
 */
export interface QuestOptions {
  /**
   * Optional filter by journey type.
   */
  journey?: JourneyType;

  /**
   * Optional filter for active quests (not expired).
   */
  active?: boolean;

  /**
   * Optional filter by difficulty level.
   */
  difficulty?: string;

  /**
   * Optional filter by tags.
   */
  tags?: string[];

  /**
   * Optional pagination limit.
   */
  limit?: number;

  /**
   * Optional pagination offset.
   */
  offset?: number;
}

/**
 * Response structure for quest operations that return multiple quests.
 */
export interface QuestResponse {
  /**
   * Array of quests matching the query criteria.
   */
  quests: Quest[];

  /**
   * Total count of quests matching the criteria (for pagination).
   */
  total: number;
}

/**
 * Response structure for user quest operations that return multiple user quests.
 */
export interface UserQuestResponse {
  /**
   * Array of user quests matching the query criteria.
   */
  userQuests: UserQuest[];

  /**
   * Total count of user quests matching the criteria (for pagination).
   */
  total: number;
}