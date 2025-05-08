/**
 * @file Filterable Interface
 * @description Defines generic interfaces for filter criteria used throughout the gamification engine.
 * These interfaces standardize query parameters for filtering entities by various criteria,
 * ensuring consistent filtering behavior across different modules and controllers.
 */

import { FilterDto } from '@austa/interfaces/common/dto/filter.dto';
import { JourneyType } from './journey.interface';

/**
 * Base interface for filterable entities.
 * Provides common filter criteria that can be applied to any entity.
 */
export interface IFilterable {
  /**
   * Unique identifier for the entity.
   * Used for direct lookups by ID.
   */
  id?: string;

  /**
   * Creation date range for filtering entities by when they were created.
   */
  createdAt?: {
    /**
     * Start date for the creation date range.
     */
    from?: Date;

    /**
     * End date for the creation date range.
     */
    to?: Date;
  };

  /**
   * Update date range for filtering entities by when they were last updated.
   */
  updatedAt?: {
    /**
     * Start date for the update date range.
     */
    from?: Date;

    /**
     * End date for the update date range.
     */
    to?: Date;
  };

  /**
   * Journey type for filtering entities by specific journey context.
   * Allows filtering entities that belong to a specific journey (Health, Care, Plan).
   */
  journey?: JourneyType | JourneyType[];

  /**
   * Search term for filtering entities by text content.
   * Typically applied to string fields like title, description, etc.
   */
  search?: string;

  /**
   * Active status for filtering entities by their active state.
   */
  active?: boolean;

  /**
   * Custom filter criteria that don't fit into the standard properties.
   * Allows for flexible, entity-specific filtering.
   */
  [key: string]: any;
}

/**
 * Interface for achievement-specific filter criteria.
 * Extends the base IFilterable interface with achievement-specific properties.
 */
export interface IAchievementFilter extends IFilterable {
  /**
   * Filter achievements by title.
   */
  title?: string;

  /**
   * Filter achievements by description content.
   */
  description?: string;

  /**
   * Filter achievements by XP reward range.
   */
  xpReward?: {
    /**
     * Minimum XP reward value.
     */
    min?: number;

    /**
     * Maximum XP reward value.
     */
    max?: number;
  };

  /**
   * Filter achievements by icon name or pattern.
   */
  icon?: string;
}

/**
 * Interface for quest-specific filter criteria.
 * Extends the base IFilterable interface with quest-specific properties.
 */
export interface IQuestFilter extends IFilterable {
  /**
   * Filter quests by title.
   */
  title?: string;

  /**
   * Filter quests by description content.
   */
  description?: string;

  /**
   * Filter quests by their start date range.
   */
  startDate?: {
    /**
     * Start of the quest start date range.
     */
    from?: Date;

    /**
     * End of the quest start date range.
     */
    to?: Date;
  };

  /**
   * Filter quests by their end date range.
   */
  endDate?: {
    /**
     * Start of the quest end date range.
     */
    from?: Date;

    /**
     * End of the quest end date range.
     */
    to?: Date;
  };

  /**
   * Filter quests by their difficulty level.
   */
  difficulty?: string | string[];

  /**
   * Filter quests by their completion status.
   */
  completed?: boolean;
}

/**
 * Interface for reward-specific filter criteria.
 * Extends the base IFilterable interface with reward-specific properties.
 */
export interface IRewardFilter extends IFilterable {
  /**
   * Filter rewards by title.
   */
  title?: string;

  /**
   * Filter rewards by description content.
   */
  description?: string;

  /**
   * Filter rewards by point cost range.
   */
  pointCost?: {
    /**
     * Minimum point cost value.
     */
    min?: number;

    /**
     * Maximum point cost value.
     */
    max?: number;
  };

  /**
   * Filter rewards by their availability status.
   */
  available?: boolean;

  /**
   * Filter rewards by their redemption count range.
   */
  redemptionCount?: {
    /**
     * Minimum redemption count.
     */
    min?: number;

    /**
     * Maximum redemption count.
     */
    max?: number;
  };

  /**
   * Filter rewards by their expiration date range.
   */
  expirationDate?: {
    /**
     * Start of the expiration date range.
     */
    from?: Date;

    /**
     * End of the expiration date range.
     */
    to?: Date;
  };
}

/**
 * Interface for user profile-specific filter criteria.
 * Extends the base IFilterable interface with profile-specific properties.
 */
export interface IProfileFilter extends IFilterable {
  /**
   * Filter profiles by user ID.
   */
  userId?: string;

  /**
   * Filter profiles by username pattern.
   */
  username?: string;

  /**
   * Filter profiles by level range.
   */
  level?: {
    /**
     * Minimum level value.
     */
    min?: number;

    /**
     * Maximum level value.
     */
    max?: number;
  };

  /**
   * Filter profiles by total XP range.
   */
  totalXp?: {
    /**
     * Minimum total XP value.
     */
    min?: number;

    /**
     * Maximum total XP value.
     */
    max?: number;
  };

  /**
   * Filter profiles by achievement count range.
   */
  achievementCount?: {
    /**
     * Minimum achievement count.
     */
    min?: number;

    /**
     * Maximum achievement count.
     */
    max?: number;
  };
}

/**
 * Interface for rule-specific filter criteria.
 * Extends the base IFilterable interface with rule-specific properties.
 */
export interface IRuleFilter extends IFilterable {
  /**
   * Filter rules by name.
   */
  name?: string;

  /**
   * Filter rules by description content.
   */
  description?: string;

  /**
   * Filter rules by event type they apply to.
   */
  eventType?: string | string[];

  /**
   * Filter rules by their priority level range.
   */
  priority?: {
    /**
     * Minimum priority value.
     */
    min?: number;

    /**
     * Maximum priority value.
     */
    max?: number;
  };

  /**
   * Filter rules by their enabled status.
   */
  enabled?: boolean;
}

/**
 * Interface for event-specific filter criteria.
 * Extends the base IFilterable interface with event-specific properties.
 */
export interface IEventFilter extends IFilterable {
  /**
   * Filter events by user ID.
   */
  userId?: string;

  /**
   * Filter events by event type.
   */
  eventType?: string | string[];

  /**
   * Filter events by timestamp range.
   */
  timestamp?: {
    /**
     * Start of the timestamp range.
     */
    from?: Date;

    /**
     * End of the timestamp range.
     */
    to?: Date;
  };

  /**
   * Filter events by their processing status.
   */
  processed?: boolean;

  /**
   * Filter events by source system or application.
   */
  source?: string | string[];
}

/**
 * Type for converting a FilterDto from @austa/interfaces to an IFilterable interface.
 * Ensures compatibility between the shared FilterDto and the local IFilterable interface.
 * 
 * @template T - The specific filter interface type to convert to (e.g., IAchievementFilter)
 */
export type FilterDtoToFilterable<T extends IFilterable = IFilterable> = Omit<FilterDto, 'where'> & {
  where?: Partial<T>;
};

/**
 * Type for combining multiple filter interfaces.
 * Allows creating complex filters that span multiple entity types.
 * 
 * @template T - The array of filter interface types to combine
 */
export type CombinedFilter<T extends IFilterable[]> = T[number];

/**
 * Type for creating a filter with required fields.
 * Useful when certain filter criteria must be present.
 * 
 * @template T - The filter interface type
 * @template K - The keys of T that should be required
 */
export type RequiredFilter<T extends IFilterable, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Type for creating a filter with excluded fields.
 * Useful when certain filter criteria should not be used in specific contexts.
 * 
 * @template T - The filter interface type
 * @template K - The keys of T that should be excluded
 */
export type ExcludeFromFilter<T extends IFilterable, K extends keyof T> = Omit<T, K>;

/**
 * Type for creating a journey-specific filter.
 * Automatically sets the journey field to the specified journey type.
 * 
 * @template T - The filter interface type
 * @template J - The journey type to filter by
 */
export type JourneyFilter<T extends IFilterable, J extends JourneyType> = Omit<T, 'journey'> & {
  journey: J;
};