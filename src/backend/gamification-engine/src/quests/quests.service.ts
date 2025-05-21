import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import entities
import { Quest } from '../entities/quest.entity';
import { UserQuest } from '../entities/user-quest.entity';

// Import services
import { ProfilesService } from '../profiles/profiles.service';
import { AchievementsService } from '../achievements/achievements.service';

// Import from @austa packages
import { AppError, ErrorType, ErrorCategory } from '@austa/errors';
import { KafkaProducer } from '@austa/events/kafka';
import { LoggerService } from '@austa/logging';
import { TransactionService, Transactional } from '@austa/database/transactions';

// Import interfaces and DTOs
import { QuestStartedEvent, QuestCompletedEvent } from '@austa/interfaces/gamification/quests';
import { FilterDto } from '@austa/interfaces/common/dto';
import { PaginationDto } from '@austa/interfaces/common/dto';

/**
 * Service for managing quests in the gamification engine.
 * Handles quest retrieval, starting quests for users, and processing quest completion.
 */
@Injectable()
export class QuestsService {
  /**
   * Injects the Quest and UserQuest repositories, ProfilesService, AchievementsService, 
   * KafkaProducer, LoggerService, and TransactionService.
   */
  constructor(
    @InjectRepository(Quest)
    private readonly questRepository: Repository<Quest>,
    @InjectRepository(UserQuest)
    private readonly userQuestRepository: Repository<UserQuest>,
    private readonly profilesService: ProfilesService,
    private readonly achievementsService: AchievementsService,
    private readonly kafkaProducer: KafkaProducer,
    private readonly logger: LoggerService,
    private readonly transactionService: TransactionService
  ) {}

  /**
   * Retrieves all quests with optional filtering and pagination.
   * @param filterDto Optional filter criteria for quests
   * @param paginationDto Optional pagination parameters
   * @returns A promise that resolves to an array of quests.
   */
  async findAll(filterDto?: FilterDto, paginationDto?: PaginationDto): Promise<Quest[]> {
    try {
      const query = this.questRepository.createQueryBuilder('quest');
      
      // Apply filters if provided
      if (filterDto?.search) {
        query.where('quest.title LIKE :search OR quest.description LIKE :search', {
          search: `%${filterDto.search}%`
        });
      }
      
      if (filterDto?.journey) {
        query.andWhere('quest.journey = :journey', { journey: filterDto.journey });
      }
      
      // Apply pagination if provided
      if (paginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        query.skip((page - 1) * limit).take(limit);
      }
      
      return await query.getMany();
    } catch (error) {
      this.logger.error('Failed to retrieve quests', {
        error: error.stack,
        context: 'QuestsService.findAll',
        filterDto,
        paginationDto
      });
      
      throw new AppError({
        message: 'Failed to retrieve quests',
        errorType: ErrorType.TECHNICAL,
        errorCategory: ErrorCategory.DATABASE,
        code: 'GAME_009',
        context: { filterDto, paginationDto },
        cause: error
      });
    }
  }

  /**
   * Retrieves a single quest by its ID.
   * @param id The unique identifier of the quest.
   * @returns A promise that resolves to a single quest.
   * @throws NotFoundException if the quest is not found
   * @throws AppError if there's a technical error during retrieval
   */
  async findOne(id: string): Promise<Quest> {
    try {
      const quest = await this.questRepository.findOneBy({ id });
      
      if (!quest) {
        this.logger.warn(`Quest with ID ${id} not found`, {
          context: 'QuestsService.findOne',
          questId: id
        });
        throw new NotFoundException(`Quest with ID ${id} not found`);
      }
      
      return quest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve quest with ID ${id}`, {
        error: error.stack,
        context: 'QuestsService.findOne',
        questId: id
      });
      
      throw new AppError({
        message: `Failed to retrieve quest with ID ${id}`,
        errorType: ErrorType.TECHNICAL,
        errorCategory: ErrorCategory.DATABASE,
        code: 'GAME_010',
        context: { id },
        cause: error
      });
    }
  }

  /**
   * Starts a quest for a user.
   * @param userId The ID of the user.
   * @param questId The ID of the quest to start.
   * @returns A promise that resolves to the created UserQuest.
   * @throws NotFoundException if the user or quest is not found
   * @throws AppError if there's a technical error during the operation
   */
  @Transactional()
  async startQuest(userId: string, questId: string): Promise<UserQuest> {
    try {
      // Get the user's game profile
      const profile = await this.profilesService.findById(userId);
      
      // Get the quest
      const quest = await this.findOne(questId);
      
      // Check if the user already has this quest in progress
      const existingUserQuest = await this.userQuestRepository.findOne({
        where: {
          profile: { id: profile.id },
          quest: { id: questId }
        }
      });
      
      if (existingUserQuest) {
        return existingUserQuest;
      }
      
      // Create a new UserQuest instance
      const userQuest = this.userQuestRepository.create({
        profile,
        quest,
        progress: 0,
        completed: false,
        startedAt: new Date()
      });
      
      // Save to database within transaction
      const savedUserQuest = await this.userQuestRepository.save(userQuest);
      
      // Create standardized event payload
      const questStartedEvent: QuestStartedEvent = {
        userId,
        questId,
        questTitle: quest.title,
        journey: quest.journey,
        timestamp: new Date().toISOString(),
        metadata: {
          correlationId: `quest-${questId}-user-${userId}`,
          version: '1.0.0',
          source: 'gamification-engine'
        }
      };
      
      // Log and publish event with retry
      this.logger.log(`User ${userId} started quest ${questId}`, {
        context: 'QuestsService.startQuest',
        userId,
        questId,
        questTitle: quest.title
      });
      
      await this.kafkaProducer.produce({
        topic: 'quest.started',
        messages: [{ value: JSON.stringify(questStartedEvent) }],
        retryConfig: {
          retries: 3,
          initialDelay: 100,
          maxDelay: 1000,
          factor: 2,
          useExponentialBackoff: true
        },
        deadLetterQueue: {
          topic: 'quest.started.dlq',
          reason: 'Failed to publish quest.started event after retries'
        }
      });
      
      return savedUserQuest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to start quest ${questId} for user ${userId}`, {
        error: error.stack,
        context: 'QuestsService.startQuest',
        userId,
        questId
      });
      
      throw new AppError({
        message: `Failed to start quest ${questId} for user ${userId}`,
        errorType: ErrorType.TECHNICAL,
        errorCategory: ErrorCategory.DATABASE,
        code: 'GAME_011',
        context: { userId, questId },
        cause: error
      });
    }
  }

  /**
   * Completes a quest for a user.
   * @param userId The ID of the user.
   * @param questId The ID of the quest to complete.
   * @returns A promise that resolves to the updated UserQuest.
   * @throws NotFoundException if the user quest is not found
   * @throws AppError if there's a technical error during the operation
   */
  @Transactional()
  async completeQuest(userId: string, questId: string): Promise<UserQuest> {
    try {
      // Get the user's game profile
      const profile = await this.profilesService.findById(userId);
      
      // Get the user quest
      const userQuest = await this.userQuestRepository.findOne({
        where: {
          profile: { id: profile.id },
          quest: { id: questId }
        },
        relations: ['quest']
      });
      
      if (!userQuest) {
        this.logger.warn(`User ${userId} has not started quest ${questId}`, {
          context: 'QuestsService.completeQuest',
          userId,
          questId
        });
        throw new NotFoundException(`User ${userId} has not started quest ${questId}`);
      }
      
      if (userQuest.completed) {
        return userQuest; // Already completed
      }
      
      // Update the UserQuest to mark it as completed
      userQuest.progress = 100;
      userQuest.completed = true;
      userQuest.completedAt = new Date();
      
      // Save the updated UserQuest within transaction
      const updatedUserQuest = await this.userQuestRepository.save(userQuest);
      
      // Award XP to the user
      await this.profilesService.update(userId, {
        xp: profile.xp + userQuest.quest.xpReward
      });
      
      // Check if completing this quest unlocks any achievements
      const unlockedAchievements = await this.achievementsService.checkQuestAchievements(
        userId, 
        userQuest.quest.journey
      );
      
      // Create standardized event payload
      const questCompletedEvent: QuestCompletedEvent = {
        userId,
        questId,
        questTitle: userQuest.quest.title,
        journey: userQuest.quest.journey,
        xpAwarded: userQuest.quest.xpReward,
        timestamp: new Date().toISOString(),
        unlockedAchievements: unlockedAchievements.map(a => ({
          id: a.id,
          title: a.title,
          xpAwarded: a.xpReward
        })),
        metadata: {
          correlationId: `quest-${questId}-user-${userId}`,
          version: '1.0.0',
          source: 'gamification-engine'
        }
      };
      
      // Log and publish event with retry
      this.logger.log(
        `User ${userId} completed quest ${questId} and earned ${userQuest.quest.xpReward} XP`, 
        {
          context: 'QuestsService.completeQuest',
          userId,
          questId,
          questTitle: userQuest.quest.title,
          xpAwarded: userQuest.quest.xpReward,
          unlockedAchievements: unlockedAchievements.map(a => a.title)
        }
      );
      
      await this.kafkaProducer.produce({
        topic: 'quest.completed',
        messages: [{ value: JSON.stringify(questCompletedEvent) }],
        retryConfig: {
          retries: 3,
          initialDelay: 100,
          maxDelay: 1000,
          factor: 2,
          useExponentialBackoff: true
        },
        deadLetterQueue: {
          topic: 'quest.completed.dlq',
          reason: 'Failed to publish quest.completed event after retries'
        }
      });
      
      return updatedUserQuest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to complete quest ${questId} for user ${userId}`, {
        error: error.stack,
        context: 'QuestsService.completeQuest',
        userId,
        questId
      });
      
      throw new AppError({
        message: `Failed to complete quest ${questId} for user ${userId}`,
        errorType: ErrorType.TECHNICAL,
        errorCategory: ErrorCategory.DATABASE,
        code: 'GAME_012',
        context: { userId, questId },
        cause: error
      });
    }
  }
  
  /**
   * Updates the progress of a user's quest.
   * @param userId The ID of the user.
   * @param questId The ID of the quest to update.
   * @param progress The new progress value (0-100).
   * @returns A promise that resolves to the updated UserQuest.
   * @throws NotFoundException if the user quest is not found
   * @throws AppError if there's a technical error during the operation
   */
  @Transactional()
  async updateQuestProgress(userId: string, questId: string, progress: number): Promise<UserQuest> {
    try {
      // Validate progress value
      if (progress < 0 || progress > 100) {
        throw new AppError({
          message: 'Progress value must be between 0 and 100',
          errorType: ErrorType.VALIDATION,
          errorCategory: ErrorCategory.INPUT_VALIDATION,
          code: 'GAME_013',
          context: { userId, questId, progress }
        });
      }
      
      // Get the user's game profile
      const profile = await this.profilesService.findById(userId);
      
      // Get the user quest
      const userQuest = await this.userQuestRepository.findOne({
        where: {
          profile: { id: profile.id },
          quest: { id: questId }
        },
        relations: ['quest']
      });
      
      if (!userQuest) {
        this.logger.warn(`User ${userId} has not started quest ${questId}`, {
          context: 'QuestsService.updateQuestProgress',
          userId,
          questId
        });
        throw new NotFoundException(`User ${userId} has not started quest ${questId}`);
      }
      
      if (userQuest.completed) {
        return userQuest; // Already completed, no need to update progress
      }
      
      // Update the progress
      userQuest.progress = progress;
      
      // If progress is 100%, mark as completed
      if (progress === 100) {
        userQuest.completed = true;
        userQuest.completedAt = new Date();
      }
      
      // Save the updated UserQuest
      const updatedUserQuest = await this.userQuestRepository.save(userQuest);
      
      // If quest is now completed, handle completion logic
      if (progress === 100) {
        // Complete the quest using the existing method to ensure consistent behavior
        return await this.completeQuest(userId, questId);
      }
      
      return updatedUserQuest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to update progress for quest ${questId} for user ${userId}`, {
        error: error.stack,
        context: 'QuestsService.updateQuestProgress',
        userId,
        questId,
        progress
      });
      
      throw new AppError({
        message: `Failed to update progress for quest ${questId} for user ${userId}`,
        errorType: ErrorType.TECHNICAL,
        errorCategory: ErrorCategory.DATABASE,
        code: 'GAME_014',
        context: { userId, questId, progress },
        cause: error
      });
    }
  }
  
  /**
   * Retrieves all quests for a specific user with their progress.
   * @param userId The ID of the user.
   * @param filterDto Optional filter criteria for quests
   * @param paginationDto Optional pagination parameters
   * @returns A promise that resolves to an array of UserQuest objects.
   */
  async findUserQuests(
    userId: string, 
    filterDto?: FilterDto, 
    paginationDto?: PaginationDto
  ): Promise<UserQuest[]> {
    try {
      // Get the user's game profile
      const profile = await this.profilesService.findById(userId);
      
      const query = this.userQuestRepository.createQueryBuilder('userQuest')
        .leftJoinAndSelect('userQuest.quest', 'quest')
        .where('userQuest.profile.id = :profileId', { profileId: profile.id });
      
      // Apply filters if provided
      if (filterDto?.journey) {
        query.andWhere('quest.journey = :journey', { journey: filterDto.journey });
      }
      
      if (filterDto?.search) {
        query.andWhere('quest.title LIKE :search OR quest.description LIKE :search', {
          search: `%${filterDto.search}%`
        });
      }
      
      // Filter by completion status if specified
      if (filterDto?.completed !== undefined) {
        query.andWhere('userQuest.completed = :completed', { completed: filterDto.completed });
      }
      
      // Apply pagination if provided
      if (paginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        query.skip((page - 1) * limit).take(limit);
      }
      
      // Order by completion status and then by start date
      query.orderBy('userQuest.completed', 'ASC')
        .addOrderBy('userQuest.startedAt', 'DESC');
      
      return await query.getMany();
    } catch (error) {
      this.logger.error(`Failed to retrieve quests for user ${userId}`, {
        error: error.stack,
        context: 'QuestsService.findUserQuests',
        userId,
        filterDto,
        paginationDto
      });
      
      throw new AppError({
        message: `Failed to retrieve quests for user ${userId}`,
        errorType: ErrorType.TECHNICAL,
        errorCategory: ErrorCategory.DATABASE,
        code: 'GAME_015',
        context: { userId, filterDto, paginationDto },
        cause: error
      });
    }
  }
}