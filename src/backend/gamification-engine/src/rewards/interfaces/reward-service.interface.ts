import { Reward } from 'src/backend/gamification-engine/src/rewards/entities/reward.entity';
import { UserReward } from 'src/backend/gamification-engine/src/rewards/entities/user-reward.entity';
import { FilterDto } from 'src/backend/shared/src/dto/filter.dto';
import { IErrorResponse } from 'src/backend/gamification-engine/src/common/interfaces/error.interface';
import { IRetryPolicy } from 'src/backend/gamification-engine/src/common/interfaces/retry-policy.interface';
// Import from @austa/interfaces package for standardized types
import { IReward, IUserReward, JourneyType } from '@austa/interfaces/gamification';

/**
 * Interface for the RewardsService.
 * Defines the contract for all reward management operations within the gamification engine.
 * This interface ensures consistent implementation of reward business logic across the codebase
 * and enables strong typing for dependency injection consumers.
 *
 * This interface is part of the gamification engine's reward management feature (F-303)
 * that handles distribution of digital and physical rewards based on user achievements and progress.
 * It integrates with the @austa/interfaces package for standardized type definitions and
 * implements consistent error handling patterns through typed exceptions.
 */
export interface IRewardsService {
  /**
   * Creates a new reward in the system.
   * 
   * @param reward - The reward data to create
   * @returns A promise that resolves to the created reward
   * @throws AppException with code REWARD_001 if creation fails
   */
  create(reward: Omit<Reward, 'id'>): Promise<Reward>;
  
  /**
   * Creates multiple rewards in a batch operation.
   * 
   * @param rewards - Array of reward data to create
   * @param options - Optional batch processing options including retry policy
   * @returns A promise that resolves to an array of created rewards
   * @throws AppException with code REWARD_006 if batch creation fails
   */
  createBatch(rewards: Omit<Reward, 'id'>[], options?: { retryPolicy?: IRetryPolicy }): Promise<Reward[]>;

  /**
   * Retrieves all rewards from the system.
   * 
   * @param filter - Optional filter criteria for the rewards
   * @returns A promise that resolves to an array of rewards
   * @throws AppException with code REWARD_002 if retrieval fails
   */
  findAll(filter?: FilterDto): Promise<Reward[]>;
  
  /**
   * Retrieves rewards with pagination support.
   * 
   * @param page - The page number to retrieve (starting from 1)
   * @param limit - The number of items per page
   * @param filter - Optional filter criteria for the rewards
   * @returns A promise that resolves to a paginated result containing rewards and count
   * @throws AppException with code REWARD_010 if retrieval fails
   */
  findAllPaginated(page: number, limit: number, filter?: FilterDto): Promise<{
    items: Reward[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>;

  /**
   * Retrieves a single reward by its ID.
   * 
   * @param id - The reward ID to find
   * @returns A promise that resolves to a single reward
   * @throws AppException with code REWARD_003 if the reward is not found
   * @throws AppException with code REWARD_004 if retrieval fails due to a technical error
   */
  findOne(id: string): Promise<Reward>;

  /**
   * Grants a reward to a user.
   * This operation creates a UserReward record and publishes a REWARD_GRANTED event to Kafka.
   * 
   * @param userId - The ID of the user to grant the reward to
   * @param rewardId - The ID of the reward to grant
   * @param options - Optional configuration for the grant operation
   * @returns A promise that resolves to the granted user reward
   * @throws AppException with code REWARD_005 if the grant operation fails
   */
  grantReward(userId: string, rewardId: string, options?: { 
    skipNotification?: boolean;
    retryPolicy?: IRetryPolicy;
  }): Promise<UserReward>;
  
  /**
   * Retrieves all rewards earned by a specific user.
   * 
   * @param userId - The ID of the user to retrieve rewards for
   * @param filter - Optional filter criteria for the rewards
   * @returns A promise that resolves to an array of user rewards
   * @throws AppException with code REWARD_007 if retrieval fails
   */
  findUserRewards(userId: string, filter?: FilterDto): Promise<UserReward[]>;
  
  /**
   * Checks if a user has earned a specific reward.
   * 
   * @param userId - The ID of the user to check
   * @param rewardId - The ID of the reward to check
   * @returns A promise that resolves to a boolean indicating if the user has the reward
   * @throws AppException with code REWARD_008 if the check operation fails
   */
  hasUserEarnedReward(userId: string, rewardId: string): Promise<boolean>;
  
  /**
   * Retrieves rewards by journey type.
   * 
   * @param journey - The journey type to filter by (from JourneyType enum)
   * @param filter - Optional filter criteria for the rewards
   * @returns A promise that resolves to an array of rewards for the specified journey
   * @throws AppException with code REWARD_009 if retrieval fails
   */
  findByJourney(journey: JourneyType, filter?: FilterDto): Promise<Reward[]>;
  
  /**
   * Handles errors that occur during reward operations.
   * Implements the centralized error handling strategy with proper classification,
   * logging, and client-friendly error responses.
   * 
   * @param error - The error that occurred
   * @param context - Additional context about the operation that failed
   * @returns A standardized error response object
   */
  handleError(error: Error, context: Record<string, any>): IErrorResponse;
}