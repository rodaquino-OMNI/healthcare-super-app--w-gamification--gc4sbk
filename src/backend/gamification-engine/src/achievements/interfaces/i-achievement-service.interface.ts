import { Service } from '@app/shared/interfaces/service.interface';
import { PaginatedResponse, PaginationDto } from '@app/shared/dto/pagination.dto';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { IAchievement } from './i-achievement.interface';
import { IUserAchievement } from './i-user-achievement.interface';

/**
 * Interface defining the contract for the AchievementsService.
 * Extends the generic Service interface with achievement-specific operations.
 */
export interface IAchievementService extends Service<IAchievement> {
  /**
   * Retrieves all achievements with optional filtering and pagination.
   * 
   * @param pagination - Optional pagination parameters
   * @param filter - Optional filtering criteria
   * @returns A promise resolving to a paginated response containing achievements
   */
  findAll(pagination?: PaginationDto, filter?: FilterDto): Promise<PaginatedResponse<IAchievement>>;

  /**
   * Retrieves a single achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement
   * @returns A promise resolving to the found achievement
   */
  findById(id: string): Promise<IAchievement>;

  /**
   * Creates a new achievement.
   * 
   * @param achievementData - The data for the new achievement
   * @returns A promise resolving to the created achievement
   */
  create(achievementData: Partial<IAchievement>): Promise<IAchievement>;

  /**
   * Updates an existing achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement to update
   * @param achievementData - The data to update the achievement with
   * @returns A promise resolving to the updated achievement
   */
  update(id: string, achievementData: Partial<IAchievement>): Promise<IAchievement>;

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
  findByJourney(journey: string, pagination?: PaginationDto): Promise<PaginatedResponse<IAchievement>>;

  /**
   * Finds achievements by their XP reward value.
   * 
   * @param xpReward - The XP value to search for
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of achievements
   */
  findByXpReward(xpReward: number, pagination?: PaginationDto): Promise<PaginatedResponse<IAchievement>>;

  /**
   * Searches achievements by title or description.
   * 
   * @param searchTerm - The text to search for
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of matching achievements
   */
  search(searchTerm: string, pagination?: PaginationDto): Promise<PaginatedResponse<IAchievement>>;

  /**
   * Retrieves a user's progress for a specific achievement.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement
   * @returns A promise resolving to the user achievement data
   */
  getUserAchievement(profileId: string, achievementId: string): Promise<IUserAchievement>;

  /**
   * Updates a user's progress for a specific achievement.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement
   * @param progress - The new progress value
   * @returns A promise resolving to the updated user achievement data
   */
  updateUserProgress(profileId: string, achievementId: string, progress: number): Promise<IUserAchievement>;

  /**
   * Unlocks an achievement for a user.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement
   * @returns A promise resolving to the updated user achievement data
   */
  unlockAchievement(profileId: string, achievementId: string): Promise<IUserAchievement>;

  /**
   * Resets a user's progress for a specific achievement.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement
   * @returns A promise resolving to the updated user achievement data
   */
  resetUserProgress(profileId: string, achievementId: string): Promise<IUserAchievement>;
}