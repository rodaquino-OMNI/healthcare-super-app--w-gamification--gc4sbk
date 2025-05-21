import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database/prisma.service';
import { TransactionService } from '@app/database/transaction.service';
import { JourneyContextService } from '@app/database/journey-context.service';
import { ErrorHandlerService } from '@app/database/error-handler.service';
import { ProfilesService } from '../profiles/profiles.service';
import { Achievement } from '@prisma/client';
import { IAchievementService } from './interfaces/i-achievement-service.interface';
import { IAchievement } from './interfaces/i-achievement.interface';
import { IUserAchievement } from './interfaces/i-user-achievement.interface';
import { AchievementType } from './interfaces/achievement-types.enum';
import { AchievementStatus } from './interfaces/achievement-status.enum';
import { CreateAchievementDto, UpdateAchievementDto, AchievementEventDto } from './dto';
import { PaginatedResponse, PaginationDto } from '@austa/interfaces/common/dto';
import { FilterDto } from '@austa/interfaces/common/dto';
import { IJourneyType } from '@austa/interfaces/journey';
import { IEventPayload } from '@austa/interfaces/gamification';
import { 
  BaseAchievementException,
  AchievementNotFoundException,
  DuplicateAchievementException,
  InvalidAchievementDataException,
  UserAchievementNotFoundException,
  AchievementEventProcessingException,
  AchievementExternalServiceException
} from './exceptions';
import { AchievementErrorType } from './exceptions/achievement-exception.types';

/**
 * Service responsible for managing achievements in the gamification system.
 * Handles CRUD operations and business logic for achievements across all journeys.
 */
@Injectable()
export class AchievementsService implements IAchievementService {
  private readonly logger = new Logger(AchievementsService.name);
  
  /**
   * Creates an instance of the AchievementsService.
   * 
   * @param prisma - PrismaService for database operations
   * @param transactionService - Service for managing database transactions
   * @param journeyContextService - Service for journey-specific database contexts
   * @param errorHandler - Service for handling database errors
   * @param profilesService - Service for managing user profiles and XP
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly journeyContextService: JourneyContextService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly profilesService: ProfilesService
  ) {}

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
      const where: any = {};
      
      // Apply journey filter if provided
      if (filter?.journey) {
        where.journey = filter.journey;
      }

      // Apply where conditions if provided
      if (filter?.where) {
        Object.entries(filter.where).forEach(([key, value]) => {
          where[key] = value;
        });
      }

      // Apply search filter if provided
      if (filter?.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } }
        ];
      }
      
      // Get journey-specific database context if journey filter is provided
      const db = filter?.journey 
        ? this.journeyContextService.getContext(filter.journey as IJourneyType)
        : this.prisma;

      // Apply order by if provided or use default
      const orderBy = {};
      if (filter?.orderBy) {
        Object.entries(filter.orderBy).forEach(([key, direction]) => {
          orderBy[key] = direction;
        });
      } else {
        orderBy['title'] = 'asc';
      }

      // Get total count for pagination
      const totalItems = await db.achievement.count({ where });
      
      // Execute query with pagination
      const achievements = await db.achievement.findMany({
        where,
        orderBy,
        skip,
        take: limit
      });

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
    } catch (error) {
      this.logger.error(`Failed to retrieve achievements: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          'Failed to retrieve achievements',
          AchievementErrorType.DATABASE_READ_ERROR,
          { filter }
        )
      );
    }
  }

  /**
   * Retrieves a single achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement
   * @returns A promise resolving to the found achievement
   * @throws AchievementNotFoundException if the achievement is not found
   */
  async findById(id: string): Promise<Achievement> {
    try {
      const achievement = await this.prisma.achievement.findUnique({
        where: { id }
      });
      
      if (!achievement) {
        throw new AchievementNotFoundException(id);
      }
      
      return achievement;
    } catch (error) {
      if (error instanceof AchievementNotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve achievement with ID ${id}: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          `Failed to retrieve achievement with ID ${id}`,
          AchievementErrorType.DATABASE_READ_ERROR,
          { id }
        )
      );
    }
  }

  /**
   * Creates a new achievement.
   * 
   * @param achievementData - The data for the new achievement
   * @returns A promise resolving to the created achievement
   * @throws InvalidAchievementDataException if validation fails
   * @throws DuplicateAchievementException if an achievement with the same title already exists
   */
  async create(achievementData: CreateAchievementDto): Promise<Achievement> {
    try {
      // Check for duplicate title
      const existingAchievement = await this.prisma.achievement.findFirst({
        where: { title: achievementData.title }
      });

      if (existingAchievement) {
        throw new DuplicateAchievementException(achievementData.title);
      }

      // Get journey-specific database context if journey is provided
      const db = achievementData.journey 
        ? this.journeyContextService.getContext(achievementData.journey as IJourneyType)
        : this.prisma;

      // Create the achievement
      return await db.achievement.create({
        data: achievementData
      });
    } catch (error) {
      if (error instanceof DuplicateAchievementException) {
        throw error;
      }
      
      this.logger.error(`Failed to create achievement: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          'Failed to create achievement',
          AchievementErrorType.DATABASE_WRITE_ERROR,
          { achievementData }
        )
      );
    }
  }

  /**
   * Updates an existing achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement to update
   * @param achievementData - The data to update the achievement with
   * @returns A promise resolving to the updated achievement
   * @throws AchievementNotFoundException if the achievement is not found
   * @throws InvalidAchievementDataException if validation fails
   * @throws DuplicateAchievementException if updating would create a duplicate title
   */
  async update(id: string, achievementData: UpdateAchievementDto): Promise<Achievement> {
    try {
      // First, verify the achievement exists
      const existingAchievement = await this.findById(id);
      
      // If title is being updated, check for duplicates
      if (achievementData.title && achievementData.title !== existingAchievement.title) {
        const duplicateCheck = await this.prisma.achievement.findFirst({
          where: { 
            title: achievementData.title,
            id: { not: id }
          }
        });

        if (duplicateCheck) {
          throw new DuplicateAchievementException(achievementData.title);
        }
      }

      // Get journey-specific database context if journey is provided
      const journey = achievementData.journey || existingAchievement.journey;
      const db = this.journeyContextService.getContext(journey as IJourneyType);

      // Update the achievement
      return await db.achievement.update({
        where: { id },
        data: achievementData
      });
    } catch (error) {
      if (error instanceof AchievementNotFoundException || 
          error instanceof DuplicateAchievementException) {
        throw error;
      }
      
      this.logger.error(`Failed to update achievement with ID ${id}: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          `Failed to update achievement with ID ${id}`,
          AchievementErrorType.DATABASE_WRITE_ERROR,
          { id, achievementData }
        )
      );
    }
  }

  /**
   * Deletes an achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement to delete
   * @returns A promise resolving to true if deleted, false otherwise
   * @throws AchievementNotFoundException if the achievement is not found
   */
  async delete(id: string): Promise<boolean> {
    try {
      // First, verify the achievement exists
      const achievement = await this.findById(id);
      
      // Get journey-specific database context
      const db = this.journeyContextService.getContext(achievement.journey as IJourneyType);
      
      // Delete the achievement with transaction to ensure consistency
      await this.transactionService.executeTransaction(async (tx) => {
        // Delete related user achievements first to maintain referential integrity
        await tx.userAchievement.deleteMany({
          where: { achievementId: id }
        });
        
        // Delete the achievement
        await tx.achievement.delete({
          where: { id }
        });
      });
      
      return true;
    } catch (error) {
      if (error instanceof AchievementNotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to delete achievement with ID ${id}: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          `Failed to delete achievement with ID ${id}`,
          AchievementErrorType.DATABASE_WRITE_ERROR,
          { id }
        )
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
      const where: any = {};
      
      // Apply journey filter if provided
      if (filter?.journey) {
        where.journey = filter.journey;
      }

      // Apply where conditions if provided
      if (filter?.where) {
        Object.entries(filter.where).forEach(([key, value]) => {
          where[key] = value;
        });
      }

      // Get journey-specific database context if journey filter is provided
      const db = filter?.journey 
        ? this.journeyContextService.getContext(filter.journey as IJourneyType)
        : this.prisma;
      
      return await db.achievement.count({ where });
    } catch (error) {
      this.logger.error(`Failed to count achievements: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          'Failed to count achievements',
          AchievementErrorType.DATABASE_READ_ERROR,
          { filter }
        )
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
    journey: IJourneyType,
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
    return this.findAll(pagination, { search: searchTerm });
  }

  /**
   * Processes an achievement event from any journey service.
   * 
   * @param event - The achievement event data
   * @returns A promise resolving to the processed event result
   * @throws AchievementEventProcessingException if event processing fails
   */
  async processAchievementEvent(event: AchievementEventDto): Promise<IEventPayload> {
    try {
      this.logger.log(`Processing achievement event: ${event.eventType} for user ${event.userId}`);
      
      // Validate event data
      if (!event.userId || !event.eventType) {
        throw new InvalidAchievementDataException('Invalid event data: missing required fields');
      }

      // Process the event based on its type
      switch (event.eventType) {
        case 'ACHIEVEMENT_UNLOCKED':
          return await this.handleAchievementUnlocked(event);
        case 'ACHIEVEMENT_PROGRESS':
          return await this.handleAchievementProgress(event);
        default:
          throw new AchievementEventProcessingException(
            `Unsupported event type: ${event.eventType}`,
            { eventType: event.eventType }
          );
      }
    } catch (error) {
      this.logger.error(`Failed to process achievement event: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new AchievementEventProcessingException(
          'Failed to process achievement event',
          { event }
        )
      );
    }
  }

  /**
   * Handles an achievement unlocked event.
   * 
   * @param event - The achievement event data
   * @returns A promise resolving to the event processing result
   * @private
   */
  private async handleAchievementUnlocked(event: AchievementEventDto): Promise<IEventPayload> {
    // Use transaction to ensure data consistency
    return await this.transactionService.executeTransaction(async (tx) => {
      // Get the achievement
      const achievement = await tx.achievement.findUnique({
        where: { id: event.achievementId }
      });

      if (!achievement) {
        throw new AchievementNotFoundException(event.achievementId);
      }

      // Check if user already has this achievement
      const existingUserAchievement = await tx.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: event.userId,
            achievementId: event.achievementId
          }
        }
      });

      // If already unlocked, return early
      if (existingUserAchievement?.status === AchievementStatus.UNLOCKED) {
        return {
          success: true,
          message: 'Achievement already unlocked',
          data: { achievement, alreadyUnlocked: true }
        };
      }

      // Create or update user achievement record
      const userAchievement = await tx.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: event.userId,
            achievementId: event.achievementId
          }
        },
        create: {
          userId: event.userId,
          achievementId: event.achievementId,
          status: AchievementStatus.UNLOCKED,
          progress: 100,
          unlockedAt: new Date(),
          metadata: event.metadata || {}
        },
        update: {
          status: AchievementStatus.UNLOCKED,
          progress: 100,
          unlockedAt: new Date(),
          metadata: event.metadata || {}
        }
      });

      // Award XP to user profile
      try {
        await this.profilesService.awardXp(event.userId, achievement.xpReward, {
          source: 'achievement',
          achievementId: achievement.id,
          journey: achievement.journey
        });
      } catch (error) {
        // Log error but don't fail the transaction
        this.logger.error(
          `Failed to award XP for achievement ${achievement.id} to user ${event.userId}: ${error.message}`,
          error.stack
        );
        // Throw a specific exception for external service failure
        throw new AchievementExternalServiceException(
          'Failed to award XP for achievement',
          { service: 'ProfilesService', operation: 'awardXp', userId: event.userId }
        );
      }

      return {
        success: true,
        message: 'Achievement unlocked successfully',
        data: { achievement, userAchievement }
      };
    });
  }

  /**
   * Handles an achievement progress event.
   * 
   * @param event - The achievement event data
   * @returns A promise resolving to the event processing result
   * @private
   */
  private async handleAchievementProgress(event: AchievementEventDto): Promise<IEventPayload> {
    // Validate progress data
    if (!event.metadata?.progress || typeof event.metadata.progress !== 'number') {
      throw new InvalidAchievementDataException('Invalid progress data: missing or invalid progress value');
    }

    const progress = Math.min(Math.max(0, event.metadata.progress), 100);

    // Use transaction to ensure data consistency
    return await this.transactionService.executeTransaction(async (tx) => {
      // Get the achievement
      const achievement = await tx.achievement.findUnique({
        where: { id: event.achievementId }
      });

      if (!achievement) {
        throw new AchievementNotFoundException(event.achievementId);
      }

      // Check if user already has this achievement
      const existingUserAchievement = await tx.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: event.userId,
            achievementId: event.achievementId
          }
        }
      });

      // If already unlocked, return early
      if (existingUserAchievement?.status === AchievementStatus.UNLOCKED) {
        return {
          success: true,
          message: 'Achievement already unlocked',
          data: { achievement, alreadyUnlocked: true }
        };
      }

      // Determine if the achievement should be unlocked
      const shouldUnlock = progress >= 100;
      const status = shouldUnlock ? AchievementStatus.UNLOCKED : AchievementStatus.IN_PROGRESS;
      const unlockedAt = shouldUnlock ? new Date() : null;

      // Create or update user achievement record
      const userAchievement = await tx.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: event.userId,
            achievementId: event.achievementId
          }
        },
        create: {
          userId: event.userId,
          achievementId: event.achievementId,
          status,
          progress,
          unlockedAt,
          metadata: event.metadata || {}
        },
        update: {
          status,
          progress,
          unlockedAt,
          metadata: {
            ...existingUserAchievement?.metadata || {},
            ...event.metadata || {}
          }
        }
      });

      // If achievement is now unlocked, award XP
      if (shouldUnlock && (!existingUserAchievement || existingUserAchievement.status !== AchievementStatus.UNLOCKED)) {
        try {
          await this.profilesService.awardXp(event.userId, achievement.xpReward, {
            source: 'achievement',
            achievementId: achievement.id,
            journey: achievement.journey
          });
        } catch (error) {
          // Log error but don't fail the transaction
          this.logger.error(
            `Failed to award XP for achievement ${achievement.id} to user ${event.userId}: ${error.message}`,
            error.stack
          );
          // Throw a specific exception for external service failure
          throw new AchievementExternalServiceException(
            'Failed to award XP for achievement',
            { service: 'ProfilesService', operation: 'awardXp', userId: event.userId }
          );
        }
      }

      return {
        success: true,
        message: shouldUnlock ? 'Achievement unlocked successfully' : 'Achievement progress updated',
        data: { achievement, userAchievement, unlocked: shouldUnlock }
      };
    });
  }

  /**
   * Gets all achievements for a specific user with their unlock status.
   * 
   * @param userId - The user ID to get achievements for
   * @param pagination - Optional pagination parameters
   * @param filter - Optional filtering criteria
   * @returns A promise resolving to a paginated response of user achievements
   */
  async getUserAchievements(
    userId: string,
    pagination?: PaginationDto,
    filter?: FilterDto
  ): Promise<PaginatedResponse<IUserAchievement>> {
    try {
      // Set default pagination if not provided
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      // Build the query with filters
      const where: any = { userId };
      
      // Apply journey filter if provided
      if (filter?.journey) {
        where.achievement = { journey: filter.journey };
      }

      // Apply status filter if provided
      if (filter?.where?.status) {
        where.status = filter.where.status;
      }

      // Get journey-specific database context if journey filter is provided
      const db = filter?.journey 
        ? this.journeyContextService.getContext(filter.journey as IJourneyType)
        : this.prisma;

      // Get total count for pagination
      const totalItems = await db.userAchievement.count({ where });
      
      // Execute query with pagination and include achievement data
      const userAchievements = await db.userAchievement.findMany({
        where,
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
        skip,
        take: limit
      });

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
    } catch (error) {
      this.logger.error(`Failed to retrieve user achievements: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          'Failed to retrieve user achievements',
          AchievementErrorType.DATABASE_READ_ERROR,
          { userId, filter }
        )
      );
    }
  }

  /**
   * Gets cross-journey achievements for a user.
   * These are achievements that span multiple journeys.
   * 
   * @param userId - The user ID to get achievements for
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of cross-journey achievements
   */
  async getCrossJourneyAchievements(
    userId: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<IUserAchievement>> {
    try {
      // Find achievements with type CROSS_JOURNEY
      return await this.getUserAchievements(userId, pagination, {
        where: { type: AchievementType.CROSS_JOURNEY }
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve cross-journey achievements: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          'Failed to retrieve cross-journey achievements',
          AchievementErrorType.DATABASE_READ_ERROR,
          { userId }
        )
      );
    }
  }

  /**
   * Gets the user's achievement progress for a specific achievement.
   * 
   * @param userId - The user ID to get progress for
   * @param achievementId - The achievement ID to get progress for
   * @returns A promise resolving to the user achievement data or null if not found
   */
  async getUserAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<IUserAchievement | null> {
    try {
      // Get the achievement first to determine the journey context
      const achievement = await this.findById(achievementId);
      
      // Get journey-specific database context
      const db = this.journeyContextService.getContext(achievement.journey as IJourneyType);
      
      // Find the user achievement record
      const userAchievement = await db.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        },
        include: { achievement: true }
      });

      return userAchievement;
    } catch (error) {
      if (error instanceof AchievementNotFoundException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to retrieve user achievement progress: ${error.message}`,
        error.stack
      );
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          'Failed to retrieve user achievement progress',
          AchievementErrorType.DATABASE_READ_ERROR,
          { userId, achievementId }
        )
      );
    }
  }

  /**
   * Manually unlocks an achievement for a user.
   * This is typically used for administrative purposes or testing.
   * 
   * @param userId - The user ID to unlock the achievement for
   * @param achievementId - The achievement ID to unlock
   * @param metadata - Optional metadata to store with the achievement
   * @returns A promise resolving to the unlocked user achievement
   */
  async unlockAchievement(
    userId: string,
    achievementId: string,
    metadata?: Record<string, any>
  ): Promise<IUserAchievement> {
    try {
      // Create an unlock event and process it
      const event: AchievementEventDto = {
        userId,
        achievementId,
        eventType: 'ACHIEVEMENT_UNLOCKED',
        metadata,
        timestamp: new Date()
      };

      const result = await this.processAchievementEvent(event);
      
      if (!result.success) {
        throw new AchievementEventProcessingException(
          'Failed to unlock achievement',
          { userId, achievementId, metadata }
        );
      }

      // Get the updated user achievement
      const userAchievement = await this.getUserAchievementProgress(userId, achievementId);
      
      if (!userAchievement) {
        throw new UserAchievementNotFoundException(userId, achievementId);
      }

      return userAchievement;
    } catch (error) {
      this.logger.error(`Failed to unlock achievement: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          'Failed to unlock achievement',
          AchievementErrorType.DATABASE_WRITE_ERROR,
          { userId, achievementId, metadata }
        )
      );
    }
  }

  /**
   * Updates the progress of an achievement for a user.
   * 
   * @param userId - The user ID to update progress for
   * @param achievementId - The achievement ID to update progress for
   * @param progress - The progress value (0-100)
   * @param metadata - Optional metadata to store with the progress update
   * @returns A promise resolving to the updated user achievement
   */
  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number,
    metadata?: Record<string, any>
  ): Promise<IUserAchievement> {
    try {
      // Validate progress value
      if (progress < 0 || progress > 100) {
        throw new InvalidAchievementDataException('Progress must be between 0 and 100');
      }

      // Create a progress event and process it
      const event: AchievementEventDto = {
        userId,
        achievementId,
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: { ...metadata, progress },
        timestamp: new Date()
      };

      const result = await this.processAchievementEvent(event);
      
      if (!result.success) {
        throw new AchievementEventProcessingException(
          'Failed to update achievement progress',
          { userId, achievementId, progress, metadata }
        );
      }

      // Get the updated user achievement
      const userAchievement = await this.getUserAchievementProgress(userId, achievementId);
      
      if (!userAchievement) {
        throw new UserAchievementNotFoundException(userId, achievementId);
      }

      return userAchievement;
    } catch (error) {
      this.logger.error(`Failed to update achievement progress: ${error.message}`, error.stack);
      throw this.errorHandler.handleError(
        error,
        new BaseAchievementException(
          'Failed to update achievement progress',
          AchievementErrorType.DATABASE_WRITE_ERROR,
          { userId, achievementId, progress, metadata }
        )
      );
    }
  }
}