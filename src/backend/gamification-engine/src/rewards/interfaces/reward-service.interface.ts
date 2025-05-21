import { Reward } from 'src/backend/gamification-engine/src/rewards/entities/reward.entity';
import { UserReward } from 'src/backend/gamification-engine/src/rewards/entities/user-reward.entity';
import { FilterDto } from 'src/backend/shared/src/dto/filter.dto';
import { RewardEventSchema, RewardGrantedEventDto, LeaderboardEntryDto } from '@austa/interfaces/gamification';
import { AppException, ErrorType } from '@austa/interfaces/common';

/**
 * Interface defining the contract for the RewardsService.
 * Establishes a strict contract for all reward management operations
 * including creating rewards, retrieving rewards, and granting rewards to users.
 * 
 * This interface ensures consistent implementation of reward business logic
 * across the codebase and enables strong typing for dependency injection consumers.
 */
export interface IRewardsService {
  /**
   * Creates a new reward.
   * @param reward The reward data to create
   * @returns A promise that resolves to the created reward.
   * @throws AppException with error code REWARD_001 if creation fails
   */
  create(reward: Omit<Reward, 'id'>): Promise<Reward>;

  /**
   * Retrieves all rewards with optional filtering.
   * @param filter Optional filtering criteria
   * @returns A promise that resolves to an array of rewards.
   * @throws AppException with error code REWARD_002 if retrieval fails
   */
  findAll(filter?: FilterDto): Promise<Reward[]>;

  /**
   * Retrieves a single reward by its ID.
   * @param id The reward ID to find
   * @returns A promise that resolves to a single reward.
   * @throws AppException with error code REWARD_003 if reward not found
   * @throws AppException with error code REWARD_004 if retrieval fails for technical reasons
   */
  findOne(id: string): Promise<Reward>;

  /**
   * Grants a reward to a user.
   * Uses standardized event schemas from @austa/interfaces/gamification for publishing events.
   * Implements retry policies and circuit breakers for resilient event publishing.
   * 
   * @param userId The ID of the user to grant the reward to
   * @param rewardId The ID of the reward to grant
   * @returns A promise that resolves to the granted user reward.
   * @throws AppException with error code REWARD_005 if granting fails
   */
  grantReward(userId: string, rewardId: string): Promise<UserReward>;
  
  /**
   * Retrieves the leaderboard for rewards.
   * Uses Redis Sorted Sets for efficient leaderboard caching and retrieval.
   * Implements fallback strategies for Redis connection failures.
   * 
   * @param journeyType Optional journey type to filter leaderboard by (health, care, plan, or global)
   * @param limit Optional limit for number of results (default: 10)
   * @returns A promise that resolves to an array of leaderboard entries.
   * @throws AppException with error code REWARD_006 if retrieval fails
   */
  getRewardLeaderboard(journeyType?: string, limit?: number): Promise<LeaderboardEntryDto[]>;
}