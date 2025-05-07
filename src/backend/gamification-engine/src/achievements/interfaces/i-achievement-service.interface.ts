import { Service } from '@app/shared/interfaces/service.interface';
import { PaginatedResponse, PaginationDto } from '@app/shared/dto/pagination.dto';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { Achievement } from '../entities/achievement.entity';

// Import from @austa/interfaces for type-safe data models
import { 
  IAchievement, 
  IAchievementCriteria, 
  IAchievementUnlockResult,
  IAchievementEvent
} from '@austa/interfaces/gamification';
import { IRetryOptions } from '@austa/interfaces/common';
import { IJourneyType } from '@austa/interfaces/journey';

/**
 * Interface defining the contract for the AchievementsService.
 * Extends the generic Service interface with achievement-specific operations.
 * Ensures consistent implementation of achievement-related business logic.
 * 
 * This interface integrates with @austa/interfaces for type-safe data models
 * and implements standardized error handling with centralized retry policies.
 */
export interface IAchievementService extends Service<Achievement> {
  /**
   * Retrieves all achievements with optional filtering and pagination.
   * 
   * @param pagination - Optional pagination parameters
   * @param filter - Optional filtering criteria
   * @returns A promise resolving to a paginated response containing achievements
   */
  findAll(
    pagination?: PaginationDto,
    filter?: FilterDto
  ): Promise<PaginatedResponse<Achievement>>;

  /**
   * Retrieves a single achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement
   * @returns A promise resolving to the found achievement
   */
  findById(id: string): Promise<Achievement>;

  /**
   * Creates a new achievement.
   * 
   * @param achievementData - The data for the new achievement
   * @returns A promise resolving to the created achievement
   */
  create(achievementData: Partial<Achievement>): Promise<Achievement>;

  /**
   * Updates an existing achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement to update
   * @param achievementData - The data to update the achievement with
   * @returns A promise resolving to the updated achievement
   */
  update(id: string, achievementData: Partial<Achievement>): Promise<Achievement>;

  /**
   * Deletes an achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement to delete
   * @returns A promise resolving to true if deleted, false otherwise
   */
  delete(id: string): Promise<boolean>;

  /**
   * Counts achievements matching the provided filter.
   * 
   * @param filter - Optional filtering criteria
   * @returns A promise resolving to the count of matching achievements
   */
  count(filter?: FilterDto): Promise<number>;

  /**
   * Finds achievements by journey type.
   * 
   * @param journey - The journey identifier ('health', 'care', 'plan')
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of achievements
   */
  findByJourney(
    journey: IJourneyType,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Achievement>>;

  /**
   * Finds achievements by their XP reward value.
   * 
   * @param xpReward - The XP value to search for
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of achievements
   */
  findByXpReward(
    xpReward: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Achievement>>;

  /**
   * Searches achievements by title or description.
   * 
   * @param searchTerm - The text to search for
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of matching achievements
   */
  search(
    searchTerm: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Achievement>>;

  /**
   * Processes an achievement event and determines if any achievements are unlocked.
   * Implements standardized error handling with retry policies.
   * 
   * @param event - The achievement event to process
   * @param retryOptions - Optional retry configuration for error handling
   * @returns A promise resolving to the achievement unlock result
   */
  processAchievementEvent(
    event: IAchievementEvent,
    retryOptions?: IRetryOptions
  ): Promise<IAchievementUnlockResult>;

  /**
   * Checks if a user has met the criteria for a specific achievement.
   * 
   * @param userId - The ID of the user to check
   * @param achievementId - The ID of the achievement to check
   * @param criteria - Optional additional criteria to evaluate
   * @returns A promise resolving to true if criteria are met, false otherwise
   */
  checkAchievementCriteria(
    userId: string,
    achievementId: string,
    criteria?: IAchievementCriteria
  ): Promise<boolean>;

  /**
   * Unlocks an achievement for a user if they meet the criteria.
   * Implements standardized error handling with retry policies.
   * 
   * @param userId - The ID of the user
   * @param achievementId - The ID of the achievement to unlock
   * @param retryOptions - Optional retry configuration for error handling
   * @returns A promise resolving to the unlocked achievement or null if criteria not met
   */
  unlockAchievement(
    userId: string,
    achievementId: string,
    retryOptions?: IRetryOptions
  ): Promise<Achievement | null>;

  /**
   * Retrieves all achievements unlocked by a specific user.
   * 
   * @param userId - The ID of the user
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of unlocked achievements
   */
  getUserAchievements(
    userId: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Achievement>>;
}