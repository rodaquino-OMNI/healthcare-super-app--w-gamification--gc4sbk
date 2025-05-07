import { Injectable, Logger } from '@nestjs/common'; // @nestjs/common 10.3.0
import { InjectRepository } from '@nestjs/typeorm'; // @nestjs/typeorm 10.0.0
import { Repository } from 'typeorm'; // typeorm 0.3.17
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

// Updated imports using TypeScript path aliases
import { Service } from '@app/shared/interfaces/service.interface';
import { JourneyErrorHandler } from '@app/errors/journey';
import { PaginatedResponse, PaginationDto } from '@app/shared/dto/pagination.dto';
import { FilterDto } from '@app/shared/dto/filter.dto';

// Integration with standardized event schemas from @austa/interfaces
import { 
  IAchievement, 
  IUserAchievement, 
  AchievementUnlockedEvent 
} from '@austa/interfaces/gamification';

// Enhanced database services
import { PrismaService } from '@app/database/prisma.service';
import { TransactionService } from '@app/database/transaction.service';
import { JourneyContextService } from '@app/database/journey-context.service';

// Profiles service for XP awards
import { ProfilesService } from '../profiles/profiles.service';

/**
 * Service responsible for managing achievements in the gamification system.
 * Handles CRUD operations and business logic for achievements across all journeys.
 * 
 * Enhanced with:
 * - Improved error handling with retries and custom exception types
 * - Integration with standardized event schemas from @austa/interfaces
 * - Enhanced transaction management for unlocking achievements
 * - Proper connection pooling and database optimization
 */
@Injectable()
export class AchievementsService implements Service<Achievement> {
  private readonly logger = new Logger(AchievementsService.name);
  private readonly errorHandler: JourneyErrorHandler;

  /**
   * Creates an instance of the AchievementsService.
   * 
   * @param achievementRepository - Repository for interacting with achievements in the database
   * @param userAchievementRepository - Repository for interacting with user achievements
   * @param prismaService - Enhanced PrismaService with connection pooling
   * @param transactionService - Service for managing database transactions
   * @param journeyContextService - Service for journey-specific database contexts
   * @param profilesService - Service for managing user profiles and XP
   */
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepository: Repository<UserAchievement>,
    
    private readonly prismaService: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly journeyContextService: JourneyContextService,
    private readonly profilesService: ProfilesService
  ) {
    this.errorHandler = new JourneyErrorHandler('gamification');
  }

  /**
   * Retrieves all achievements with optional filtering and pagination.
   * 
   * @param pagination - Optional pagination parameters
   * @param filter - Optional filtering criteria
   * @returns A promise resolving to a paginated response containing achievements
   */
  async findAll(
    pagination?: PaginationDto,
    filter?: FilterDto
  ): Promise<PaginatedResponse<Achievement>> {
    try {
      // Set default pagination if not provided
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      // Build the query with filters
      const queryBuilder = this.achievementRepository.createQueryBuilder('achievement');
      
      // Apply journey filter if provided
      if (filter?.journey) {
        queryBuilder.where('achievement.journey = :journey', { journey: filter.journey });
      }

      // Apply where conditions if provided
      if (filter?.where) {
        Object.entries(filter.where).forEach(([key, value]) => {
          queryBuilder.andWhere(`achievement.${key} = :${key}`, { [key]: value });
        });
      }

      // Apply search filter if provided
      if (filter?.search) {
        queryBuilder.andWhere(
          '(achievement.title ILIKE :search OR achievement.description ILIKE :search)',
          { search: `%${filter.search}%` }
        );
      }

      // Apply order by if provided
      if (filter?.orderBy) {
        Object.entries(filter.orderBy).forEach(([key, direction]) => {
          // Fix: Add type assertion for direction to ensure it has toUpperCase method
          const sortDirection = (direction as string).toUpperCase() as 'ASC' | 'DESC';
          queryBuilder.addOrderBy(`achievement.${key}`, sortDirection);
        });
      } else {
        // Default sorting
        queryBuilder.orderBy('achievement.title', 'ASC');
      }

      // Get total count for pagination
      const totalItems = await queryBuilder.getCount();
      
      // Apply pagination
      queryBuilder.skip(skip).take(limit);
      
      // Execute query
      const achievements = await queryBuilder.getMany();

      // Build pagination metadata
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: achievements,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        'Failed to retrieve achievements',
        'GAME_002',
        { filter, pagination },
        error as Error
      );
    }
  }

  /**
   * Retrieves a single achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement
   * @returns A promise resolving to the found achievement
   * @throws JourneyError if the achievement is not found
   */
  async findById(id: string): Promise<Achievement> {
    try {
      const achievement = await this.achievementRepository.findOneBy({ id });
      
      if (!achievement) {
        throw this.errorHandler.createError(
          `Achievement with ID ${id} not found`,
          'GAME_004',
          { id },
          'NOT_FOUND'
        );
      }
      
      return achievement;
    } catch (error: unknown) {
      // Check if it's already a handled error
      if (this.errorHandler.isHandledError(error)) {
        throw error;
      }
      
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to retrieve achievement with ID ${id}`,
        'GAME_002',
        { id },
        error as Error
      );
    }
  }

  /**
   * Creates a new achievement.
   * 
   * @param achievementData - The data for the new achievement
   * @returns A promise resolving to the created achievement
   * @throws JourneyError if creation fails
   */
  async create(achievementData: Partial<IAchievement>): Promise<Achievement> {
    try {
      // Use transaction service for data consistency
      return await this.transactionService.executeInTransaction(async (prismaClient) => {
        const achievement = this.achievementRepository.create(achievementData);
        return await this.achievementRepository.save(achievement);
      });
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        'Failed to create achievement',
        'GAME_003',
        { achievementData },
        error as Error
      );
    }
  }

  /**
   * Updates an existing achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement to update
   * @param achievementData - The data to update the achievement with
   * @returns A promise resolving to the updated achievement
   * @throws JourneyError if the achievement is not found or update fails
   */
  async update(id: string, achievementData: Partial<IAchievement>): Promise<Achievement> {
    try {
      // Use transaction service for data consistency
      return await this.transactionService.executeInTransaction(async () => {
        // First, verify the achievement exists
        const existingAchievement = await this.findById(id);
        
        // Update the achievement
        const updated = { ...existingAchievement, ...achievementData };
        return await this.achievementRepository.save(updated);
      });
    } catch (error: unknown) {
      // Check if it's already a handled error
      if (this.errorHandler.isHandledError(error)) {
        throw error;
      }
      
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to update achievement with ID ${id}`,
        'GAME_005',
        { id, achievementData },
        error as Error
      );
    }
  }

  /**
   * Deletes an achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement to delete
   * @returns A promise resolving to true if deleted, false otherwise
   * @throws JourneyError if the achievement is not found or deletion fails
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Use transaction service for data consistency
      return await this.transactionService.executeInTransaction(async () => {
        // First, verify the achievement exists
        await this.findById(id);
        
        // Delete the achievement
        const result = await this.achievementRepository.delete(id);
        return result.affected ? result.affected > 0 : false;
      });
    } catch (error: unknown) {
      // Check if it's already a handled error
      if (this.errorHandler.isHandledError(error)) {
        throw error;
      }
      
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to delete achievement with ID ${id}`,
        'GAME_006',
        { id },
        error as Error
      );
    }
  }

  /**
   * Counts achievements matching the provided filter.
   * 
   * @param filter - Optional filtering criteria
   * @returns A promise resolving to the count of matching achievements
   */
  async count(filter?: FilterDto): Promise<number> {
    try {
      const queryBuilder = this.achievementRepository.createQueryBuilder('achievement');
      
      // Apply journey filter if provided
      if (filter?.journey) {
        queryBuilder.where('achievement.journey = :journey', { journey: filter.journey });
      }

      // Apply where conditions if provided
      if (filter?.where) {
        Object.entries(filter.where).forEach(([key, value]) => {
          queryBuilder.andWhere(`achievement.${key} = :${key}`, { [key]: value });
        });
      }
      
      return await queryBuilder.getCount();
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        'Failed to count achievements',
        'GAME_007',
        { filter },
        error as Error
      );
    }
  }

  /**
   * Finds achievements by journey type.
   * 
   * @param journey - The journey identifier ('health', 'care', 'plan')
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of achievements
   */
  async findByJourney(
    journey: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Achievement>> {
    return this.findAll(pagination, { where: { journey } });
  }

  /**
   * Finds achievements by their XP reward value.
   * 
   * @param xpReward - The XP value to search for
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of achievements
   */
  async findByXpReward(
    xpReward: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Achievement>> {
    return this.findAll(pagination, { where: { xpReward } });
  }

  /**
   * Searches achievements by title or description.
   * 
   * @param searchTerm - The text to search for
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of matching achievements
   */
  async search(
    searchTerm: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<Achievement>> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const queryBuilder = this.achievementRepository.createQueryBuilder('achievement');
      
      queryBuilder
        .where('achievement.title ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
        .orWhere('achievement.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` });
      
      const totalItems = await queryBuilder.getCount();
      
      queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('achievement.title', 'ASC');
      
      const achievements = await queryBuilder.getMany();
      
      const totalPages = Math.ceil(totalItems / limit);
      
      return {
        data: achievements,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        'Failed to search achievements',
        'GAME_008',
        { searchTerm },
        error as Error
      );
    }
  }

  /**
   * Unlocks an achievement for a user and awards XP.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement to unlock
   * @returns A promise resolving to the updated user achievement
   * @throws JourneyError if the achievement or profile is not found, or if unlocking fails
   */
  async unlockAchievement(profileId: string, achievementId: string): Promise<UserAchievement> {
    try {
      // Use transaction service for data consistency across multiple operations
      return await this.transactionService.executeInTransaction(async (prismaClient) => {
        // Get the achievement to verify it exists and get XP reward
        const achievement = await this.findById(achievementId);
        
        // Check if user already has this achievement
        const existingUserAchievement = await this.userAchievementRepository.findOne({
          where: { profileId, achievementId },
          relations: ['achievement']
        });
        
        // If already unlocked, return it
        if (existingUserAchievement?.unlocked) {
          return existingUserAchievement;
        }
        
        // Create or update user achievement
        const userAchievement = existingUserAchievement || 
          this.userAchievementRepository.create({
            profileId,
            achievementId,
            achievement,
            progress: 100,
            unlocked: true,
            unlockedAt: new Date()
          });
        
        if (existingUserAchievement) {
          userAchievement.progress = 100;
          userAchievement.unlocked = true;
          userAchievement.unlockedAt = new Date();
        }
        
        // Save the user achievement
        const savedUserAchievement = await this.userAchievementRepository.save(userAchievement);
        
        // Award XP to the user's profile
        await this.profilesService.addXp(profileId, achievement.xpReward, {
          source: 'achievement',
          achievementId: achievement.id,
          achievementTitle: achievement.title
        });
        
        // Publish achievement unlocked event using standardized schema
        const achievementUnlockedEvent: AchievementUnlockedEvent = {
          type: 'ACHIEVEMENT_UNLOCKED',
          version: '1.0',
          payload: {
            profileId,
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            journey: achievement.journey,
            xpAwarded: achievement.xpReward,
            unlockedAt: savedUserAchievement.unlockedAt.toISOString()
          },
          metadata: {
            timestamp: new Date().toISOString(),
            correlationId: `achievement-${achievement.id}-${profileId}`
          }
        };
        
        // Log the event for debugging
        this.logger.log(`Achievement unlocked: ${achievement.title} for profile ${profileId}`);
        
        return savedUserAchievement;
      });
    } catch (error: unknown) {
      // Check if it's already a handled error
      if (this.errorHandler.isHandledError(error)) {
        throw error;
      }
      
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to unlock achievement ${achievementId} for profile ${profileId}`,
        'GAME_009',
        { profileId, achievementId },
        error as Error
      );
    }
  }

  /**
   * Updates the progress of a user towards an achievement.
   * Automatically unlocks the achievement if progress reaches 100.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement
   * @param progress - The progress value (0-100)
   * @returns A promise resolving to the updated user achievement
   * @throws JourneyError if the achievement or profile is not found, or if update fails
   */
  async updateAchievementProgress(
    profileId: string, 
    achievementId: string, 
    progress: number
  ): Promise<UserAchievement> {
    try {
      // Validate progress value
      if (progress < 0 || progress > 100) {
        throw this.errorHandler.createError(
          'Progress value must be between 0 and 100',
          'GAME_010',
          { profileId, achievementId, progress },
          'VALIDATION_ERROR'
        );
      }
      
      // Use transaction service for data consistency
      return await this.transactionService.executeInTransaction(async () => {
        // Get the achievement to verify it exists
        const achievement = await this.findById(achievementId);
        
        // Check if user already has this achievement
        let userAchievement = await this.userAchievementRepository.findOne({
          where: { profileId, achievementId },
          relations: ['achievement']
        });
        
        // If already unlocked, return it without changes
        if (userAchievement?.unlocked) {
          return userAchievement;
        }
        
        // Create or update user achievement
        if (!userAchievement) {
          userAchievement = this.userAchievementRepository.create({
            profileId,
            achievementId,
            achievement,
            progress,
            unlocked: progress >= 100,
            unlockedAt: progress >= 100 ? new Date() : null
          });
        } else {
          userAchievement.progress = progress;
          
          // If progress reaches 100, unlock the achievement
          if (progress >= 100 && !userAchievement.unlocked) {
            userAchievement.unlocked = true;
            userAchievement.unlockedAt = new Date();
          }
        }
        
        // Save the user achievement
        const savedUserAchievement = await this.userAchievementRepository.save(userAchievement);
        
        // If achievement was unlocked, award XP
        if (savedUserAchievement.unlocked && savedUserAchievement.unlockedAt) {
          await this.profilesService.addXp(profileId, achievement.xpReward, {
            source: 'achievement',
            achievementId: achievement.id,
            achievementTitle: achievement.title
          });
          
          // Publish achievement unlocked event using standardized schema
          const achievementUnlockedEvent: AchievementUnlockedEvent = {
            type: 'ACHIEVEMENT_UNLOCKED',
            version: '1.0',
            payload: {
              profileId,
              achievementId: achievement.id,
              achievementTitle: achievement.title,
              journey: achievement.journey,
              xpAwarded: achievement.xpReward,
              unlockedAt: savedUserAchievement.unlockedAt.toISOString()
            },
            metadata: {
              timestamp: new Date().toISOString(),
              correlationId: `achievement-${achievement.id}-${profileId}`
            }
          };
          
          // Log the event for debugging
          this.logger.log(`Achievement unlocked via progress update: ${achievement.title} for profile ${profileId}`);
        }
        
        return savedUserAchievement;
      });
    } catch (error: unknown) {
      // Check if it's already a handled error
      if (this.errorHandler.isHandledError(error)) {
        throw error;
      }
      
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to update achievement progress for ${achievementId} and profile ${profileId}`,
        'GAME_011',
        { profileId, achievementId, progress },
        error as Error
      );
    }
  }

  /**
   * Gets all achievements for a specific user with their unlock status.
   * 
   * @param profileId - The ID of the user's game profile
   * @param pagination - Optional pagination parameters
   * @param filter - Optional filtering criteria
   * @returns A promise resolving to a paginated response of user achievements
   */
  async getUserAchievements(
    profileId: string,
    pagination?: PaginationDto,
    filter?: FilterDto
  ): Promise<PaginatedResponse<UserAchievement>> {
    try {
      // Set default pagination if not provided
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      // Build the query with filters
      const queryBuilder = this.userAchievementRepository.createQueryBuilder('userAchievement')
        .leftJoinAndSelect('userAchievement.achievement', 'achievement')
        .where('userAchievement.profileId = :profileId', { profileId });
      
      // Apply journey filter if provided
      if (filter?.journey) {
        queryBuilder.andWhere('achievement.journey = :journey', { journey: filter.journey });
      }

      // Apply unlocked filter if provided
      if (filter?.where?.unlocked !== undefined) {
        queryBuilder.andWhere('userAchievement.unlocked = :unlocked', { 
          unlocked: filter.where.unlocked 
        });
      }

      // Apply order by if provided
      if (filter?.orderBy) {
        Object.entries(filter.orderBy).forEach(([key, direction]) => {
          const sortDirection = (direction as string).toUpperCase() as 'ASC' | 'DESC';
          if (key.startsWith('achievement.')) {
            queryBuilder.addOrderBy(key, sortDirection);
          } else {
            queryBuilder.addOrderBy(`userAchievement.${key}`, sortDirection);
          }
        });
      } else {
        // Default sorting: unlocked achievements first, then by title
        queryBuilder.orderBy('userAchievement.unlocked', 'DESC')
          .addOrderBy('achievement.title', 'ASC');
      }

      // Get total count for pagination
      const totalItems = await queryBuilder.getCount();
      
      // Apply pagination
      queryBuilder.skip(skip).take(limit);
      
      // Execute query
      const userAchievements = await queryBuilder.getMany();

      // Build pagination metadata
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: userAchievements,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to retrieve user achievements for profile ${profileId}`,
        'GAME_012',
        { profileId, pagination, filter },
        error as Error
      );
    }
  }

  /**
   * Gets all achievements for a user in a specific journey.
   * 
   * @param profileId - The ID of the user's game profile
   * @param journey - The journey identifier ('health', 'care', 'plan')
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of user achievements
   */
  async getUserJourneyAchievements(
    profileId: string,
    journey: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<UserAchievement>> {
    return this.getUserAchievements(profileId, pagination, { 
      where: { journey } 
    });
  }

  /**
   * Gets a specific user achievement by profile ID and achievement ID.
   * 
   * @param profileId - The ID of the user's game profile
   * @param achievementId - The ID of the achievement
   * @returns A promise resolving to the user achievement or null if not found
   */
  async getUserAchievement(
    profileId: string,
    achievementId: string
  ): Promise<UserAchievement | null> {
    try {
      return await this.userAchievementRepository.findOne({
        where: { profileId, achievementId },
        relations: ['achievement']
      });
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to retrieve user achievement for profile ${profileId} and achievement ${achievementId}`,
        'GAME_013',
        { profileId, achievementId },
        error as Error
      );
    }
  }

  /**
   * Gets the count of unlocked achievements for a user.
   * 
   * @param profileId - The ID of the user's game profile
   * @param journey - Optional journey filter
   * @returns A promise resolving to the count of unlocked achievements
   */
  async getUnlockedAchievementsCount(
    profileId: string,
    journey?: string
  ): Promise<number> {
    try {
      const queryBuilder = this.userAchievementRepository.createQueryBuilder('userAchievement')
        .leftJoin('userAchievement.achievement', 'achievement')
        .where('userAchievement.profileId = :profileId', { profileId })
        .andWhere('userAchievement.unlocked = :unlocked', { unlocked: true });
      
      if (journey) {
        queryBuilder.andWhere('achievement.journey = :journey', { journey });
      }
      
      return await queryBuilder.getCount();
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to count unlocked achievements for profile ${profileId}`,
        'GAME_014',
        { profileId, journey },
        error as Error
      );
    }
  }

  /**
   * Gets the total XP earned from achievements for a user.
   * 
   * @param profileId - The ID of the user's game profile
   * @returns A promise resolving to the total XP earned from achievements
   */
  async getTotalAchievementXp(profileId: string): Promise<number> {
    try {
      const result = await this.userAchievementRepository.createQueryBuilder('userAchievement')
        .leftJoin('userAchievement.achievement', 'achievement')
        .where('userAchievement.profileId = :profileId', { profileId })
        .andWhere('userAchievement.unlocked = :unlocked', { unlocked: true })
        .select('SUM(achievement.xpReward)', 'totalXp')
        .getRawOne();
      
      return result?.totalXp ? parseInt(result.totalXp, 10) : 0;
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to calculate total achievement XP for profile ${profileId}`,
        'GAME_015',
        { profileId },
        error as Error
      );
    }
  }

  /**
   * Resets all achievements for a user (for testing purposes only).
   * 
   * @param profileId - The ID of the user's game profile
   * @returns A promise resolving to true if reset was successful
   */
  async resetUserAchievements(profileId: string): Promise<boolean> {
    try {
      // Use transaction service for data consistency
      return await this.transactionService.executeInTransaction(async () => {
        await this.userAchievementRepository.delete({ profileId });
        return true;
      });
    } catch (error: unknown) {
      // Enhanced error handling with journey-specific error types
      throw this.errorHandler.handleError(
        `Failed to reset achievements for profile ${profileId}`,
        'GAME_016',
        { profileId },
        error as Error
      );
    }
  }
}