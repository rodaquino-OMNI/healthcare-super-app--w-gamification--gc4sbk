import { Service } from '@app/shared/interfaces/service.interface';
import { PaginationDto, PaginatedResponse } from '@app/shared/dto/pagination.dto';
import { Achievement } from '../entities/achievement.entity';
import { IAchievementDto } from '@austa/interfaces/gamification/achievement.interface';

/**
 * Interface defining the contract for the AchievementsService.
 * Extends the generic Service interface with achievement-specific operations.
 * 
 * This interface ensures consistent implementation of achievement-related
 * business logic and enables proper dependency injection throughout the application.
 */
export interface IAchievementService extends Service<Achievement> {
  /**
   * Finds achievements by journey type.
   * 
   * @param journey - The journey identifier ('health', 'care', 'plan')
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of achievements
   */
  findByJourney(
    journey: string,
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
   * Unlocks an achievement for a user.
   * 
   * @param userId - The ID of the user
   * @param achievementId - The ID of the achievement to unlock
   * @param metadata - Optional metadata about the achievement unlock
   * @returns A promise resolving to the unlocked achievement with user progress
   */
  unlockAchievement(
    userId: string,
    achievementId: string,
    metadata?: Record<string, any>
  ): Promise<IAchievementDto>;

  /**
   * Checks if a user has unlocked a specific achievement.
   * 
   * @param userId - The ID of the user
   * @param achievementId - The ID of the achievement to check
   * @returns A promise resolving to true if unlocked, false otherwise
   */
  hasUnlockedAchievement(
    userId: string,
    achievementId: string
  ): Promise<boolean>;

  /**
   * Gets all achievements unlocked by a specific user.
   * 
   * @param userId - The ID of the user
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of unlocked achievements
   */
  getUserAchievements(
    userId: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<IAchievementDto>>;

  /**
   * Gets all achievements for a specific journey that a user has unlocked.
   * 
   * @param userId - The ID of the user
   * @param journey - The journey identifier ('health', 'care', 'plan')
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of unlocked achievements for the journey
   */
  getUserJourneyAchievements(
    userId: string,
    journey: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<IAchievementDto>>;

  /**
   * Processes an event that might trigger achievement unlocks.
   * 
   * @param eventType - The type of event
   * @param userId - The ID of the user who triggered the event
   * @param eventData - Additional data about the event
   * @returns A promise resolving to an array of newly unlocked achievements
   */
  processAchievementEvent(
    eventType: string,
    userId: string,
    eventData: Record<string, any>
  ): Promise<IAchievementDto[]>;
}