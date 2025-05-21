/**
 * @file Filterable Interface
 * @description Defines generic interfaces for filter criteria used throughout the gamification engine.
 * These interfaces standardize query parameters for filtering entities by various criteria,
 * ensuring consistent filtering behavior across different modules and controllers.
 */

import { JourneyType } from './journey.interface';

/**
 * Base interface for all filterable entities
 * Provides common filter criteria that can be applied to any entity
 */
export interface IFilterable {
  /**
   * Filter by unique identifier
   * @example { id: '123e4567-e89b-12d3-a456-426614174000' }
   */
  id?: string | string[];
  
  /**
   * Filter by creation date range
   * @example { createdAt: { gte: new Date('2023-01-01') } }
   */
  createdAt?: DateFilterOperators;
  
  /**
   * Filter by last update date range
   * @example { updatedAt: { lte: new Date('2023-12-31') } }
   */
  updatedAt?: DateFilterOperators;
  
  /**
   * Filter by active status
   * @example { isActive: true }
   */
  isActive?: boolean;
}

/**
 * Interface for filtering entities by user
 */
export interface IUserFilterable extends IFilterable {
  /**
   * Filter by user ID
   * @example { userId: '123e4567-e89b-12d3-a456-426614174000' }
   */
  userId?: string | string[];
}

/**
 * Interface for filtering entities by journey
 */
export interface IJourneyFilterable extends IFilterable {
  /**
   * Filter by journey type
   * @example { journeyType: JourneyType.HEALTH }
   */
  journeyType?: JourneyType | JourneyType[];
}

/**
 * Interface for filtering achievements
 */
export interface IAchievementFilterable extends IJourneyFilterable {
  /**
   * Filter by achievement category
   * @example { category: 'fitness' }
   */
  category?: string | string[];
  
  /**
   * Filter by difficulty level
   * @example { difficulty: 'easy' }
   */
  difficulty?: string | string[];
  
  /**
   * Filter by required XP to unlock
   * @example { requiredXp: { lte: 1000 } }
   */
  requiredXp?: NumberFilterOperators;
  
  /**
   * Filter by achievement name using partial text search
   * @example { name: { contains: 'fitness' } }
   */
  name?: StringFilterOperators;
  
  /**
   * Filter by achievement description using partial text search
   * @example { description: { contains: 'steps' } }
   */
  description?: StringFilterOperators;
}

/**
 * Interface for filtering user achievements
 */
export interface IUserAchievementFilterable extends IUserFilterable {
  /**
   * Filter by achievement ID
   * @example { achievementId: '123e4567-e89b-12d3-a456-426614174000' }
   */
  achievementId?: string | string[];
  
  /**
   * Filter by completion status
   * @example { isCompleted: true }
   */
  isCompleted?: boolean;
  
  /**
   * Filter by completion date range
   * @example { completedAt: { gte: new Date('2023-01-01') } }
   */
  completedAt?: DateFilterOperators;
  
  /**
   * Filter by progress percentage
   * @example { progressPercentage: { gte: 50 } }
   */
  progressPercentage?: NumberFilterOperators;
}

/**
 * Interface for filtering quests
 */
export interface IQuestFilterable extends IJourneyFilterable {
  /**
   * Filter by quest category
   * @example { category: 'daily' }
   */
  category?: string | string[];
  
  /**
   * Filter by quest name using partial text search
   * @example { name: { contains: 'steps' } }
   */
  name?: StringFilterOperators;
  
  /**
   * Filter by quest description using partial text search
   * @example { description: { contains: 'walk' } }
   */
  description?: StringFilterOperators;
  
  /**
   * Filter by XP reward amount
   * @example { xpReward: { gte: 100 } }
   */
  xpReward?: NumberFilterOperators;
  
  /**
   * Filter by start date range
   * @example { startDate: { gte: new Date('2023-01-01') } }
   */
  startDate?: DateFilterOperators;
  
  /**
   * Filter by end date range
   * @example { endDate: { lte: new Date('2023-12-31') } }
   */
  endDate?: DateFilterOperators;
  
  /**
   * Filter by recurring status
   * @example { isRecurring: true }
   */
  isRecurring?: boolean;
}

/**
 * Interface for filtering user quests
 */
export interface IUserQuestFilterable extends IUserFilterable {
  /**
   * Filter by quest ID
   * @example { questId: '123e4567-e89b-12d3-a456-426614174000' }
   */
  questId?: string | string[];
  
  /**
   * Filter by quest status
   * @example { status: 'in_progress' }
   */
  status?: string | string[];
  
  /**
   * Filter by completion date range
   * @example { completedAt: { gte: new Date('2023-01-01') } }
   */
  completedAt?: DateFilterOperators;
  
  /**
   * Filter by progress percentage
   * @example { progressPercentage: { gte: 50 } }
   */
  progressPercentage?: NumberFilterOperators;
}

/**
 * Interface for filtering rewards
 */
export interface IRewardFilterable extends IJourneyFilterable {
  /**
   * Filter by reward category
   * @example { category: 'discount' }
   */
  category?: string | string[];
  
  /**
   * Filter by reward name using partial text search
   * @example { name: { contains: 'discount' } }
   */
  name?: StringFilterOperators;
  
  /**
   * Filter by reward description using partial text search
   * @example { description: { contains: 'off' } }
   */
  description?: StringFilterOperators;
  
  /**
   * Filter by required points to redeem
   * @example { requiredPoints: { lte: 1000 } }
   */
  requiredPoints?: NumberFilterOperators;
  
  /**
   * Filter by availability status
   * @example { isAvailable: true }
   */
  isAvailable?: boolean;
  
  /**
   * Filter by start date range
   * @example { startDate: { gte: new Date('2023-01-01') } }
   */
  startDate?: DateFilterOperators;
  
  /**
   * Filter by end date range
   * @example { endDate: { lte: new Date('2023-12-31') } }
   */
  endDate?: DateFilterOperators;
}

/**
 * Interface for filtering user rewards
 */
export interface IUserRewardFilterable extends IUserFilterable {
  /**
   * Filter by reward ID
   * @example { rewardId: '123e4567-e89b-12d3-a456-426614174000' }
   */
  rewardId?: string | string[];
  
  /**
   * Filter by redemption status
   * @example { isRedeemed: true }
   */
  isRedeemed?: boolean;
  
  /**
   * Filter by redemption date range
   * @example { redeemedAt: { gte: new Date('2023-01-01') } }
   */
  redeemedAt?: DateFilterOperators;
  
  /**
   * Filter by expiration date range
   * @example { expiresAt: { gte: new Date('2023-01-01') } }
   */
  expiresAt?: DateFilterOperators;
}

/**
 * Interface for filtering leaderboard entries
 */
export interface ILeaderboardFilterable extends IJourneyFilterable {
  /**
   * Filter by leaderboard type
   * @example { type: 'weekly' }
   */
  type?: string | string[];
  
  /**
   * Filter by time period
   * @example { period: 'current_week' }
   */
  period?: string | string[];
}

/**
 * Interface for filtering events
 */
export interface IEventFilterable extends IJourneyFilterable {
  /**
   * Filter by event type
   * @example { type: 'achievement_completed' }
   */
  type?: string | string[];
  
  /**
   * Filter by event source
   * @example { source: 'health_service' }
   */
  source?: string | string[];
  
  /**
   * Filter by event timestamp range
   * @example { timestamp: { gte: new Date('2023-01-01') } }
   */
  timestamp?: DateFilterOperators;
  
  /**
   * Filter by processing status
   * @example { processed: true }
   */
  processed?: boolean;
}

/**
 * Interface for filtering rules
 */
export interface IRuleFilterable extends IJourneyFilterable {
  /**
   * Filter by rule name using partial text search
   * @example { name: { contains: 'daily' } }
   */
  name?: StringFilterOperators;
  
  /**
   * Filter by rule priority
   * @example { priority: { gte: 10 } }
   */
  priority?: NumberFilterOperators;
  
  /**
   * Filter by event type that triggers the rule
   * @example { eventType: 'steps_recorded' }
   */
  eventType?: string | string[];
}

/**
 * Interface for filtering profiles
 */
export interface IProfileFilterable extends IUserFilterable {
  /**
   * Filter by experience level
   * @example { level: { gte: 5 } }
   */
  level?: NumberFilterOperators;
  
  /**
   * Filter by total experience points
   * @example { totalXp: { gte: 1000 } }
   */
  totalXp?: NumberFilterOperators;
  
  /**
   * Filter by streak count
   * @example { streak: { gte: 7 } }
   */
  streak?: NumberFilterOperators;
}

/**
 * Utility type for string filter operations
 */
export interface StringFilterOperators {
  /**
   * Exact match
   * @example { equals: 'exact-value' }
   */
  equals?: string;
  
  /**
   * Contains substring (case-sensitive)
   * @example { contains: 'substring' }
   */
  contains?: string;
  
  /**
   * Contains substring (case-insensitive)
   * @example { containsIgnoreCase: 'substring' }
   */
  containsIgnoreCase?: string;
  
  /**
   * Starts with prefix
   * @example { startsWith: 'prefix' }
   */
  startsWith?: string;
  
  /**
   * Ends with suffix
   * @example { endsWith: 'suffix' }
   */
  endsWith?: string;
  
  /**
   * Matches regular expression
   * @example { matches: '^pattern$' }
   */
  matches?: string;
  
  /**
   * In list of values
   * @example { in: ['value1', 'value2'] }
   */
  in?: string[];
  
  /**
   * Not in list of values
   * @example { notIn: ['value1', 'value2'] }
   */
  notIn?: string[];
  
  /**
   * Is null
   * @example { isNull: true }
   */
  isNull?: boolean;
}

/**
 * Utility type for number filter operations
 */
export interface NumberFilterOperators {
  /**
   * Exact match
   * @example { equals: 100 }
   */
  equals?: number;
  
  /**
   * Greater than
   * @example { gt: 100 }
   */
  gt?: number;
  
  /**
   * Greater than or equal
   * @example { gte: 100 }
   */
  gte?: number;
  
  /**
   * Less than
   * @example { lt: 100 }
   */
  lt?: number;
  
  /**
   * Less than or equal
   * @example { lte: 100 }
   */
  lte?: number;
  
  /**
   * In list of values
   * @example { in: [100, 200, 300] }
   */
  in?: number[];
  
  /**
   * Not in list of values
   * @example { notIn: [100, 200, 300] }
   */
  notIn?: number[];
  
  /**
   * Is null
   * @example { isNull: true }
   */
  isNull?: boolean;
}

/**
 * Utility type for date filter operations
 */
export interface DateFilterOperators {
  /**
   * Exact match
   * @example { equals: new Date('2023-01-01') }
   */
  equals?: Date;
  
  /**
   * Greater than
   * @example { gt: new Date('2023-01-01') }
   */
  gt?: Date;
  
  /**
   * Greater than or equal
   * @example { gte: new Date('2023-01-01') }
   */
  gte?: Date;
  
  /**
   * Less than
   * @example { lt: new Date('2023-01-01') }
   */
  lt?: Date;
  
  /**
   * Less than or equal
   * @example { lte: new Date('2023-01-01') }
   */
  lte?: Date;
  
  /**
   * In list of values
   * @example { in: [new Date('2023-01-01'), new Date('2023-01-02')] }
   */
  in?: Date[];
  
  /**
   * Not in list of values
   * @example { notIn: [new Date('2023-01-01'), new Date('2023-01-02')] }
   */
  notIn?: Date[];
  
  /**
   * Is null
   * @example { isNull: true }
   */
  isNull?: boolean;
}

/**
 * Utility type for boolean filter operations
 */
export interface BooleanFilterOperators {
  /**
   * Exact match
   * @example { equals: true }
   */
  equals?: boolean;
  
  /**
   * Is null
   * @example { isNull: true }
   */
  isNull?: boolean;
}

/**
 * Utility type for combining multiple filters with AND logic
 * @example { AND: [{ name: { contains: 'daily' } }, { isActive: true }] }
 */
export interface AndFilter<T> {
  AND: Array<T | AndFilter<T> | OrFilter<T> | NotFilter<T>>;
}

/**
 * Utility type for combining multiple filters with OR logic
 * @example { OR: [{ name: { contains: 'daily' } }, { name: { contains: 'weekly' } }] }
 */
export interface OrFilter<T> {
  OR: Array<T | AndFilter<T> | OrFilter<T> | NotFilter<T>>;
}

/**
 * Utility type for negating a filter
 * @example { NOT: { isActive: true } }
 */
export interface NotFilter<T> {
  NOT: T | AndFilter<T> | OrFilter<T>;
}

/**
 * Utility type for creating a composite filter that can combine multiple filters
 * with AND, OR, and NOT logic
 */
export type CompositeFilter<T> = T | AndFilter<T> | OrFilter<T> | NotFilter<T>;

/**
 * Utility type for creating a filter with pagination
 */
export interface FilterWithPagination<T> {
  /**
   * Filter criteria
   */
  filter?: CompositeFilter<T>;
  
  /**
   * Pagination parameters
   */
  pagination?: {
    /**
     * Page number (1-based)
     */
    page?: number;
    
    /**
     * Items per page
     */
    limit?: number;
  };
  
  /**
   * Sorting parameters
   */
  sort?: {
    /**
     * Field to sort by
     */
    field: string;
    
    /**
     * Sort direction
     */
    direction: 'asc' | 'desc';
  } | Array<{
    /**
     * Field to sort by
     */
    field: string;
    
    /**
     * Sort direction
     */
    direction: 'asc' | 'desc';
  }>;
}

/**
 * Type for creating a filter builder function that constructs a typed filter
 * @example
 * const achievementFilter = createFilter<IAchievementFilterable>()
 *   .withJourney(JourneyType.HEALTH)
 *   .withCategory('fitness')
 *   .withName({ contains: 'steps' })
 *   .build();
 */
export type FilterBuilder<T> = {
  [K in keyof T]: (value: T[K]) => FilterBuilder<T>;
} & {
  /**
   * Builds the final filter object
   */
  build: () => CompositeFilter<T>;
  
  /**
   * Combines with another filter using AND logic
   */
  and: (filter: CompositeFilter<T>) => FilterBuilder<T>;
  
  /**
   * Combines with another filter using OR logic
   */
  or: (filter: CompositeFilter<T>) => FilterBuilder<T>;
  
  /**
   * Negates the current filter
   */
  not: () => FilterBuilder<T>;
};

/**
 * Helper function to create a typed filter builder
 * @example
 * const filter = createFilterBuilder<IAchievementFilterable>()
 *   .withJourney(JourneyType.HEALTH)
 *   .withCategory('fitness')
 *   .build();
 */
export function createFilterBuilder<T>(): FilterBuilder<T> {
  // This is just a type definition, the actual implementation would be provided elsewhere
  throw new Error('Not implemented');
}