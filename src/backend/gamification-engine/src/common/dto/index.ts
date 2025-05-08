/**
 * @file Common DTO barrel file
 * @description Exports all common DTOs for clean and consistent imports throughout the gamification engine.
 * Acts as a single entry point for accessing all common data transfer objects, improving code organization
 * and reducing import verbosity.
 */

// Re-export from pagination.dto.ts
export {
  /**
   * Data transfer object for pagination request parameters.
   * Used across all modules in the gamification engine to standardize
   * pagination handling in API endpoints.
   */
  PaginationRequestDto,
  
  /**
   * Metadata for paginated responses providing information about
   * total items, pages, and current pagination state.
   */
  PaginationMetaDto,
  
  /**
   * Generic paginated response DTO that wraps any entity collection
   * with standardized pagination metadata.
   */
  PaginationResponseDto,
  
  /**
   * Type function to create a class with pagination response structure
   * for a specific entity type. Useful for Swagger documentation.
   */
  createPaginatedType,
  
  /**
   * Default pagination values used throughout the gamification engine
   */
  DEFAULT_PAGINATION,
} from './pagination.dto';

// Re-export from base-response.dto.ts
export {
  /**
   * Base response DTO class that provides a standardized structure for all API responses
   */
  BaseResponseDto,
  
  /**
   * Enum representing the status of an API response
   */
  ResponseStatus,
  
  /**
   * Interface for metadata that can be included in API responses
   */
  ResponseMetadata,
} from './base-response.dto';

// Re-export from error-response.dto.ts
export {
  /**
   * Standardized error response format used throughout the gamification engine
   */
  ErrorResponseDto,
  
  /**
   * Enum representing the severity level of an error
   */
  ErrorSeverity,
  
  /**
   * Enum representing the source of an error
   */
  ErrorSource,
} from './error-response.dto';

// Re-export from api-query.dto.ts
export {
  /**
   * Base DTO for common API query parameters used across all endpoints
   * in the gamification engine. Combines pagination, filtering, and sorting
   * into a single DTO.
   */
  ApiQueryDto,
} from './api-query.dto';

// Re-export from filter.dto.ts
export {
  /**
   * DTO for flexible filtering of entities across the gamification engine.
   * Supports complex filter conditions with various operators.
   */
  FilterDto,
  
  /**
   * Enum representing filter operators for query conditions
   */
  FilterOperator,
  
  /**
   * Interface for a single filter condition
   */
  FilterCondition,
} from './filter.dto';

// Re-export from sort.dto.ts
export {
  /**
   * DTO for sorting results in list operations
   */
  SortDto,
  
  /**
   * DTO for multi-field sorting with direction control
   */
  MultiSortDto,
  
  /**
   * Enum representing sort directions (ascending/descending)
   */
  SortDirection,
} from './sort.dto';

// Re-export from @austa/interfaces/gamification
import {
  // Event interfaces
  GamificationEventType,
  BaseGamificationEvent,
  AchievementEvent,
  QuestEvent,
  RewardEvent,
  LevelUpEvent,
  
  // Common interfaces
  Achievement,
  AchievementCategory,
  AchievementProgress,
  Quest,
  QuestCategory,
  QuestStatus,
  Reward,
  RewardCategory,
  RewardStatus,
  GameProfile,
  ExperienceLevel,
  LeaderboardEntry,
  LeaderboardTimeFrame,
  Rule,
  RuleCondition,
  RuleAction,
} from '@austa/interfaces/gamification';

// Re-export all interfaces from @austa/interfaces/gamification
export {
  // Event interfaces
  /**
   * Enum of all possible gamification event types
   */
  GamificationEventType,
  
  /**
   * Base interface for all gamification events
   */
  BaseGamificationEvent,
  
  /**
   * Interface for achievement-related events
   */
  AchievementEvent,
  
  /**
   * Interface for quest-related events
   */
  QuestEvent,
  
  /**
   * Interface for reward-related events
   */
  RewardEvent,
  
  /**
   * Interface for level-up events
   */
  LevelUpEvent,
  
  // Common interfaces
  /**
   * Interface representing an achievement that users can unlock
   */
  Achievement,
  
  /**
   * Enum of achievement categories for organization and filtering
   */
  AchievementCategory,
  
  /**
   * Interface for tracking achievement progress
   */
  AchievementProgress,
  
  /**
   * Interface representing a quest that users can complete
   */
  Quest,
  
  /**
   * Enum of quest categories for organization and filtering
   */
  QuestCategory,
  
  /**
   * Enum representing the status of a quest
   */
  QuestStatus,
  
  /**
   * Interface representing a reward that users can earn
   */
  Reward,
  
  /**
   * Enum of reward categories (virtual, physical, discount)
   */
  RewardCategory,
  
  /**
   * Enum representing the status of a reward
   */
  RewardStatus,
  
  /**
   * Interface representing a user's game profile
   */
  GameProfile,
  
  /**
   * Interface mapping level thresholds for user progression
   */
  ExperienceLevel,
  
  /**
   * Interface for an entry in the leaderboard
   */
  LeaderboardEntry,
  
  /**
   * Enum for temporal filtering of leaderboards
   */
  LeaderboardTimeFrame,
  
  /**
   * Interface for gamification rules that determine when achievements are unlocked
   */
  Rule,
  
  /**
   * Interface for rule trigger conditions
   */
  RuleCondition,
  
  /**
   * Interface for actions triggered when rules are met
   */
  RuleAction,
};

// TypeScript utility types for working with DTOs

/**
 * Utility type to extract the data type from a BaseResponseDto
 */
export type ExtractResponseData<T> = T extends BaseResponseDto<infer U> ? U : never;

/**
 * Utility type to extract the items type from a PaginationResponseDto
 */
export type ExtractPaginatedItems<T> = T extends PaginationResponseDto<infer U> ? U : never;

/**
 * Utility type to create a paginated version of a type
 */
export type Paginated<T> = PaginationResponseDto<T>;

/**
 * Utility type to create a response version of a type
 */
export type Response<T> = BaseResponseDto<T>;

/**
 * Utility type for partial update DTOs (commonly used in PATCH operations)
 */
export type PartialUpdateDto<T> = Partial<T>;

/**
 * Utility type for creating a DTO with only specific fields
 */
export type PickDto<T, K extends keyof T> = Pick<T, K>;

/**
 * Utility type for creating a DTO without specific fields
 */
export type OmitDto<T, K extends keyof T> = Omit<T, K>;