/**
 * @file reward-response.interface.ts
 * @description Defines response data transfer objects (DTOs) for all reward-related API endpoints.
 * These interfaces ensure type safety between the service layer and API consumers,
 * facilitating consistent data structure across journey services that consume reward data.
 * 
 * Key features:
 * - Standardized response structures for all reward endpoints
 * - Pagination support for listing rewards
 * - Journey-specific reward filtering capabilities
 * - Comprehensive error handling with fallback information
 */

import { Reward as RewardInterface, UserReward as UserRewardInterface, RewardCategory } from '@austa/interfaces/gamification';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import { PaginatedResponseDto } from '@app/shared/dto/paginated-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorType } from '@app/shared/errors/error-type.enum';

/**
 * Response DTO for a single reward.
 * Used when returning reward data from API endpoints.
 * 
 * This interface supports the standardized response structure requirement,
 * ensuring consistent data format when returning information about rewards
 * across different API endpoints and journey services.
 */
export class RewardResponseDto implements Partial<RewardInterface> {
  @ApiProperty({ description: 'Unique identifier for the reward', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Title of the reward', example: 'Health Champion' })
  title: string;

  @ApiProperty({ description: 'Detailed description of the reward', example: 'Awarded for maintaining a perfect health streak for 30 days' })
  description: string;

  @ApiProperty({ description: 'Amount of XP awarded when earning this reward', example: 500 })
  xpReward: number;

  @ApiProperty({ description: 'Icon name/path used to visually represent the reward', example: 'rewards/health-champion.svg' })
  icon: string;

  @ApiProperty({ 
    description: 'The journey this reward is associated with', 
    example: 'health',
    enum: JourneyType
  })
  journey: string;
  
  @ApiProperty({ 
    description: 'Category of the reward', 
    example: 'DIGITAL',
    enum: RewardCategory
  })
  category: RewardCategory;
  
  @ApiPropertyOptional({ 
    description: 'Availability period start date', 
    example: '2023-01-01T00:00:00.000Z' 
  })
  availableFrom?: Date;
  
  @ApiPropertyOptional({ 
    description: 'Availability period end date', 
    example: '2023-12-31T23:59:59.999Z' 
  })
  availableTo?: Date;
  
  @ApiProperty({ 
    description: 'Flag indicating if the reward is currently active', 
    example: true 
  })
  isActive: boolean;

  @ApiPropertyOptional({ 
    description: 'Creation date of the reward', 
    example: '2023-01-01T00:00:00.000Z' 
  })
  createdAt?: Date;

  @ApiPropertyOptional({ 
    description: 'Last update date of the reward', 
    example: '2023-01-01T00:00:00.000Z' 
  })
  updatedAt?: Date;
}

/**
 * Response DTO for a paginated list of rewards.
 * Provides standardized pagination metadata along with the rewards data.
 * 
 * This interface supports the pagination requirement for listing rewards,
 * allowing clients to efficiently navigate through large sets of rewards
 * with consistent performance.
 */
export class PaginatedRewardsResponseDto extends PaginatedResponseDto<RewardResponseDto> {
  @ApiProperty({ 
    description: 'Array of rewards', 
    type: [RewardResponseDto] 
  })
  data: RewardResponseDto[];
  
  @ApiProperty({
    description: 'Total number of rewards matching the query',
    example: 150
  })
  total: number;
  
  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  page: number;
  
  @ApiProperty({
    description: 'Number of items per page',
    example: 20
  })
  limit: number;
  
  @ApiProperty({
    description: 'Total number of pages',
    example: 8
  })
  totalPages: number;
  
  @ApiPropertyOptional({
    description: 'Filter criteria applied to the results',
    example: { journey: 'health', isActive: true }
  })
  filters?: Record<string, any>;
}

/**
 * Response DTO for a user reward.
 * Used when returning data about rewards earned by a specific user.
 * 
 * This interface supports the standardized response structure requirement,
 * ensuring consistent data format when returning information about rewards
 * that have been granted to users across different journeys.
 */
export class UserRewardResponseDto implements Partial<UserRewardInterface> {
  @ApiProperty({ 
    description: 'Unique identifier for the user reward', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  id: string;

  @ApiProperty({ 
    description: 'The ID of the associated game profile', 
    example: '123e4567-e89b-12d3-a456-426614174001' 
  })
  profileId: string;

  @ApiProperty({ 
    description: 'The ID of the earned reward', 
    example: '123e4567-e89b-12d3-a456-426614174002' 
  })
  rewardId: string;

  @ApiProperty({ 
    description: 'The date and time when the reward was earned', 
    example: '2023-01-15T14:30:00.000Z' 
  })
  earnedAt: Date;

  @ApiPropertyOptional({ 
    description: 'The journey type associated with this reward', 
    example: 'health',
    enum: JourneyType
  })
  journeyType?: JourneyType;

  @ApiProperty({ 
    description: 'The reward details', 
    type: RewardResponseDto 
  })
  reward: RewardResponseDto;
}

/**
 * Response DTO for a paginated list of user rewards.
 * Provides standardized pagination metadata along with the user rewards data.
 * 
 * This interface supports the pagination requirement for listing user rewards,
 * allowing clients to efficiently navigate through large sets of user rewards
 * with consistent performance across all journeys.
 */
export class PaginatedUserRewardsResponseDto extends PaginatedResponseDto<UserRewardResponseDto> {
  @ApiProperty({ 
    description: 'Array of user rewards', 
    type: [UserRewardResponseDto] 
  })
  data: UserRewardResponseDto[];
  
  @ApiProperty({
    description: 'Total number of user rewards matching the query',
    example: 42
  })
  total: number;
  
  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  page: number;
  
  @ApiProperty({
    description: 'Number of items per page',
    example: 20
  })
  limit: number;
  
  @ApiProperty({
    description: 'Total number of pages',
    example: 3
  })
  totalPages: number;
  
  @ApiPropertyOptional({
    description: 'Filter criteria applied to the results',
    example: { journey: 'health', earnedAfter: '2023-01-01T00:00:00.000Z' }
  })
  filters?: Record<string, any>;
  
  @ApiPropertyOptional({
    description: 'Journey-specific aggregations',
    example: { health: 15, care: 12, plan: 10, global: 5 }
  })
  journeyCounts?: Record<JourneyType, number>;
}

/**
 * Response DTO for granting a reward to a user.
 * Includes both the reward details and information about when it was earned.
 * 
 * This interface supports the standardized response structure requirement,
 * providing a consistent format for the response when a reward is granted to a user,
 * including additional context about XP and level progression.
 */
export class GrantRewardResponseDto {
  @ApiProperty({ 
    description: 'The user reward details', 
    type: UserRewardResponseDto 
  })
  userReward: UserRewardResponseDto;

  @ApiProperty({ 
    description: 'The amount of XP granted with this reward', 
    example: 500 
  })
  xpGranted: number;

  @ApiProperty({ 
    description: 'Whether this reward triggered a level up', 
    example: false 
  })
  leveledUp: boolean;

  @ApiPropertyOptional({ 
    description: 'New level if the user leveled up', 
    example: 5 
  })
  newLevel?: number;
}

/**
 * Response DTO for journey-specific rewards.
 * Allows filtering rewards by journey type.
 * 
 * This interface supports the journey-specific reward filtering requirement,
 * enabling clients to retrieve rewards that are relevant to a specific journey
 * (health, care, plan) without having to filter client-side.
 */
export class JourneyRewardsResponseDto {
  @ApiProperty({ 
    description: 'The journey type', 
    example: 'health',
    enum: JourneyType
  })
  journey: JourneyType;

  @ApiProperty({ 
    description: 'Array of rewards for this journey', 
    type: [RewardResponseDto] 
  })
  rewards: RewardResponseDto[];
  
  @ApiPropertyOptional({
    description: 'Total count of rewards for this journey',
    example: 42
  })
  totalCount?: number;
  
  @ApiPropertyOptional({
    description: 'Count of active rewards for this journey',
    example: 35
  })
  activeCount?: number;
  
  @ApiPropertyOptional({
    description: 'Additional journey-specific metadata',
    example: { featuredRewardId: '123e4567-e89b-12d3-a456-426614174000' }
  })
  metadata?: Record<string, any>;
}

/**
 * Response DTO for reward statistics.
 * Provides aggregated data about rewards across the system.
 * 
 * This interface supports the journey-specific filtering requirement,
 * offering aggregated statistics about rewards across different journeys
 * and categories for administrative and reporting purposes.
 */
export class RewardStatsResponseDto {
  @ApiProperty({ 
    description: 'Total number of rewards in the system', 
    example: 150 
  })
  totalRewards: number;

  @ApiProperty({ 
    description: 'Number of active rewards', 
    example: 120 
  })
  activeRewards: number;

  @ApiProperty({ 
    description: 'Rewards by journey type', 
    example: { health: 50, care: 40, plan: 30, global: 30 } 
  })
  rewardsByJourney: Record<string, number>;

  @ApiProperty({ 
    description: 'Rewards by category', 
    example: { DIGITAL: 100, PHYSICAL: 20, DISCOUNT: 30 } 
  })
  rewardsByCategory: Record<string, number>;
}

/**
 * Error response DTO for reward operations.
 * Provides standardized error information for reward-related API endpoints.
 * 
 * This interface supports the enhanced error handling requirement,
 * providing detailed error information that can be used for troubleshooting
 * and implementing fallback strategies in client applications.
 */
/**
 * Response DTO for filtered rewards.
 * Supports advanced filtering capabilities for rewards across journeys.
 * 
 * This interface specifically addresses the journey-specific reward filtering requirement,
 * providing a flexible structure for filtering rewards based on various criteria
 * including journey type, category, and availability.
 */
export class FilteredRewardsResponseDto {
  @ApiProperty({ 
    description: 'Array of rewards matching the filter criteria', 
    type: [RewardResponseDto] 
  })
  rewards: RewardResponseDto[];
  
  @ApiProperty({
    description: 'Total count of rewards matching the filter criteria',
    example: 42
  })
  totalCount: number;
  
  @ApiProperty({
    description: 'Applied filter criteria',
    example: {
      journeys: ['health', 'care'],
      categories: ['DIGITAL'],
      isActive: true,
      availableNow: true
    }
  })
  appliedFilters: Record<string, any>;
  
  @ApiPropertyOptional({
    description: 'Available filter options for refining the search',
    example: {
      journeys: [
        { value: 'health', label: 'Health Journey', count: 20 },
        { value: 'care', label: 'Care Journey', count: 15 },
        { value: 'plan', label: 'Plan Journey', count: 7 }
      ],
      categories: [
        { value: 'DIGITAL', label: 'Digital Rewards', count: 30 },
        { value: 'PHYSICAL', label: 'Physical Rewards', count: 12 }
      ]
    }
  })
  availableFilters?: Record<string, Array<{value: string, label: string, count: number}>>;
}

/**
 * Error response DTO for reward operations.
 * Provides standardized error information for reward-related API endpoints.
 * 
 * This interface supports the enhanced error handling requirement,
 * providing detailed error information that can be used for troubleshooting
 * and implementing fallback strategies in client applications.
 */
export class RewardErrorResponseDto {
  @ApiProperty({ 
    description: 'Error code for the failed operation', 
    example: 'REWARD_001' 
  })
  code: string;

  @ApiProperty({ 
    description: 'Human-readable error message', 
    example: 'Failed to create reward' 
  })
  message: string;
  
  @ApiProperty({
    description: 'Type of error (technical, business, validation)',
    example: 'TECHNICAL',
    enum: ErrorType
  })
  errorType: ErrorType;

  @ApiPropertyOptional({ 
    description: 'Additional error details', 
    example: { rewardId: '123e4567-e89b-12d3-a456-426614174000' } 
  })
  details?: Record<string, any>;

  @ApiProperty({ 
    description: 'Timestamp when the error occurred', 
    example: '2023-01-15T14:30:00.000Z' 
  })
  timestamp: string = new Date().toISOString();
  
  @ApiPropertyOptional({
    description: 'Suggested fallback action for the client',
    example: 'RETRY' 
  })
  fallbackAction?: 'RETRY' | 'ABORT' | 'USE_CACHED' | 'DELAYED_RETRY';
  
  @ApiPropertyOptional({
    description: 'Time in milliseconds to wait before retrying (if applicable)',
    example: 5000
  })
  retryAfterMs?: number;
  
  @ApiPropertyOptional({
    description: 'Circuit breaker status if applicable',
    example: 'OPEN'
  })
  circuitStatus?: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
}