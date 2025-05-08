import { 
  IsString, 
  IsNumber, 
  IsUUID, 
  IsOptional, 
  IsEnum, 
  Min, 
  Max, 
  IsPositive, 
  IsInt, 
  Length, 
  Matches,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { JourneyType, Reward } from '@austa/interfaces/gamification';
import { RetryPolicy, PaginationResponse } from '@austa/interfaces/common';

/**
 * Interface for reward-related error responses
 * Provides standardized error structure for reward operations
 */
export interface IRewardErrorResponse {
  /**
   * Error code for the specific error
   * @example "REWARD_001"
   */
  code: string;
  
  /**
   * Human-readable error message
   * @example "Failed to create reward"
   */
  message: string;
  
  /**
   * Error type (BUSINESS or TECHNICAL)
   * @example "BUSINESS"
   */
  type: 'BUSINESS' | 'TECHNICAL';
  
  /**
   * Additional context for the error
   */
  context?: Record<string, any>;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: string;
}

/**
 * Interface for paginated reward responses
 * Used for endpoints that return multiple rewards
 */
export interface IPaginatedRewardResponse extends PaginationResponse {
  /**
   * Array of rewards in the current page
   */
  rewards: Reward[];
  
  /**
   * Total number of rewards matching the filter criteria
   */
  total: number;
}

/**
 * Base interface for all reward-related requests
 * Provides common properties and error handling capabilities
 */
export interface IBaseRewardRequest {
  /**
   * Optional request ID for tracking and correlation
   * @example "req-123456"
   */
  requestId?: string;
}

/**
 * Interface for filtering and pagination of rewards.
 * Used in GET /rewards, GET /rewards/user/:userId, and GET /rewards/journey/:journey endpoints.
 */
export interface IFilterRewardDto extends IBaseRewardRequest {
  /**
   * Page number for pagination (starts from 1)
   * @example 1
   */
  page?: number;

  /**
   * Number of items per page
   * @example 10
   */
  limit?: number;

  /**
   * Field to sort by
   * @example "title"
   */
  sortBy?: string;

  /**
   * Sort direction (asc or desc)
   * @example "asc"
   */
  sortOrder?: 'asc' | 'desc';

  /**
   * Filter rewards by journey type
   * @example "health"
   */
  journeyFilter?: JourneyType | 'global';

  /**
   * Search rewards by title (case-insensitive)
   * @example "daily"
   */
  titleSearch?: string;
}

/**
 * Interface for creating a new reward.
 * Used in POST /rewards endpoint.
 */
export interface ICreateRewardDto extends IBaseRewardRequest {
  /**
   * Title of the reward displayed to users
   * @example "Daily Health Check"
   */
  title: string;

  /**
   * Detailed description of the reward
   * @example "Complete your daily health check to earn this reward"
   */
  description: string;

  /**
   * Amount of XP awarded when earning this reward
   * @example 100
   */
  xpReward: number;

  /**
   * Icon name/path used to visually represent the reward
   * @example "health-check-icon"
   */
  icon: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   * @example "health"
   */
  journey: JourneyType | 'global';
}

/**
 * Interface for updating an existing reward.
 * Used in PATCH /rewards/:id endpoint.
 */
export interface IUpdateRewardDto extends IBaseRewardRequest {
  /**
   * Title of the reward displayed to users
   * @example "Updated Health Check"
   */
  title?: string;

  /**
   * Detailed description of the reward
   * @example "Updated description for the health check reward"
   */
  description?: string;

  /**
   * Amount of XP awarded when earning this reward
   * @example 150
   */
  xpReward?: number;

  /**
   * Icon name/path used to visually represent the reward
   * @example "updated-health-check-icon"
   */
  icon?: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   * @example "health"
   */
  journey?: JourneyType | 'global';
}

/**
 * Interface for granting a reward to a user.
 * Used in POST /rewards/:id/grant endpoint.
 */
export interface IGrantRewardDto extends IBaseRewardRequest {
  /**
   * The UUID of the user to grant the reward to
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  userId: string;

  /**
   * Optional retry policy for handling failures when granting rewards
   * Specifies how the system should retry the operation if it fails
   */
  retryPolicy?: RetryPolicy;
}

/**
 * Base class for all reward-related request DTOs
 * Provides common properties and validation
 */
export class BaseRewardRequestDto implements IBaseRewardRequest {
  /**
   * Optional request ID for tracking and correlation
   * @example "req-123456"
   */
  @IsOptional()
  @IsString()
  @Length(1, 100)
  requestId?: string;
}

/**
 * Class implementation of IFilterRewardDto with validation decorators.
 * Used for validating and transforming request query parameters.
 */
export class FilterRewardDto extends BaseRewardRequestDto implements IFilterRewardDto {
  /**
   * Page number for pagination (starts from 1)
   * @example 1
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  /**
   * Number of items per page
   * @example 10
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  /**
   * Field to sort by
   * @example "title"
   */
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'sortBy must contain only alphanumeric characters and underscores',
  })
  sortBy?: string = 'createdAt';

  /**
   * Sort direction (asc or desc)
   * @example "asc"
   */
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  /**
   * Filter rewards by journey type
   * @example "health"
   */
  @IsOptional()
  @IsEnum([...Object.values(JourneyType), 'global'])
  journeyFilter?: JourneyType | 'global';

  /**
   * Search rewards by title (case-insensitive)
   * @example "daily"
   */
  @IsOptional()
  @IsString()
  @Length(1, 100)
  titleSearch?: string;
}

/**
 * Class implementation of ICreateRewardDto with validation decorators.
 * Used for validating and transforming request body when creating rewards.
 */
export class CreateRewardDto extends BaseRewardRequestDto implements ICreateRewardDto {
  /**
   * Title of the reward displayed to users
   * @example "Daily Health Check"
   */
  @IsString()
  @Length(3, 100)
  title: string;

  /**
   * Detailed description of the reward
   * @example "Complete your daily health check to earn this reward"
   */
  @IsString()
  @Length(10, 500)
  description: string;

  /**
   * Amount of XP awarded when earning this reward
   * @example 100
   */
  @IsNumber()
  @IsPositive()
  @Max(10000)
  @Type(() => Number)
  xpReward: number;

  /**
   * Icon name/path used to visually represent the reward
   * @example "health-check-icon"
   */
  @IsString()
  @Length(1, 200)
  icon: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   * @example "health"
   */
  @IsEnum([...Object.values(JourneyType), 'global'])
  journey: JourneyType | 'global' = 'global';
}

/**
 * Class implementation of IUpdateRewardDto with validation decorators.
 * Used for validating and transforming request body when updating rewards.
 */
export class UpdateRewardDto extends BaseRewardRequestDto implements IUpdateRewardDto {
  /**
   * Title of the reward displayed to users
   * @example "Updated Health Check"
   */
  @IsOptional()
  @IsString()
  @Length(3, 100)
  title?: string;

  /**
   * Detailed description of the reward
   * @example "Updated description for the health check reward"
   */
  @IsOptional()
  @IsString()
  @Length(10, 500)
  description?: string;

  /**
   * Amount of XP awarded when earning this reward
   * @example 150
   */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(10000)
  @Type(() => Number)
  xpReward?: number;

  /**
   * Icon name/path used to visually represent the reward
   * @example "updated-health-check-icon"
   */
  @IsOptional()
  @IsString()
  @Length(1, 200)
  icon?: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   * @example "health"
   */
  @IsOptional()
  @IsEnum([...Object.values(JourneyType), 'global'])
  journey?: JourneyType | 'global';
}

/**
 * Class implementation of IGrantRewardDto with validation decorators.
 * Used for validating and transforming request body when granting rewards to users.
 */
export class GrantRewardDto extends BaseRewardRequestDto implements IGrantRewardDto {
  /**
   * The UUID of the user to grant the reward to
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  userId: string;

  /**
   * Optional retry policy for handling failures when granting rewards
   * Specifies how the system should retry the operation if it fails
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryPolicyDto)
  retryPolicy?: RetryPolicy;
}

/**
 * DTO for batch granting rewards to multiple users
 * Used in POST /rewards/:id/grant-batch endpoint
 */
export interface IBatchGrantRewardDto extends IBaseRewardRequest {
  /**
   * Array of user IDs to grant the reward to
   * @example ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174001"]
   */
  userIds: string[];

  /**
   * Optional retry policy for handling failures when granting rewards
   * Specifies how the system should retry the operation if it fails
   */
  retryPolicy?: RetryPolicy;
}

/**
 * Class implementation of IBatchGrantRewardDto with validation decorators
 * Used for validating and transforming request body when batch granting rewards
 */
export class BatchGrantRewardDto extends BaseRewardRequestDto implements IBatchGrantRewardDto {
  /**
   * Array of user IDs to grant the reward to
   * @example ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174001"]
   */
  @IsUUID(4, { each: true })
  userIds: string[];

  /**
   * Optional retry policy for handling failures when granting rewards
   * Specifies how the system should retry the operation if it fails
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryPolicyDto)
  retryPolicy?: RetryPolicy;
}

/**
 * DTO for retry policy configuration
 * Used to specify retry behavior for operations that might fail
 */
export class RetryPolicyDto implements RetryPolicy {
  /**
   * Maximum number of retry attempts
   * @example 3
   */
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  maxRetries?: number = 3;

  /**
   * Initial delay in milliseconds before the first retry
   * @example 1000
   */
  @IsInt()
  @Min(100)
  @Max(60000)
  @IsOptional()
  initialDelayMs?: number = 1000;

  /**
   * Backoff factor for exponential retry delay calculation
   * @example 2
   */
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  backoffFactor?: number = 2;

  /**
   * Whether to use jitter (randomized delay) to prevent thundering herd problem
   * @example true
   */
  @IsOptional()
  useJitter?: boolean = true;
}