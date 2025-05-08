import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Updated imports using TypeScript path aliases
import { Quest } from './entities/quest.entity';
import { UserQuest } from './entities/user-quest.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { AchievementsService } from '../achievements/achievements.service';

// Import standardized interfaces from @austa/interfaces
import { QuestStartedEvent, QuestCompletedEvent, QuestStatus } from '@austa/interfaces/gamification';

// Import error handling from @austa/errors
import { 
  BusinessError, 
  TechnicalError, 
  ResourceNotFoundError,
  ErrorContext 
} from '@austa/errors';

// Import quest-specific exceptions
import { QuestAlreadyCompletedException } from './exceptions/quest-already-completed.exception';

// Import transaction management from @austa/database
import { TransactionService, Transactional, TransactionIsolationLevel } from '@austa/database/transactions';

// Import Kafka producer with retry support from @austa/events
import { KafkaProducerService } from '@austa/events/kafka';

// Import enhanced logging with correlation IDs
import { LoggerService } from '@austa/logging';

// Import retry utilities
import { RetryableOperation, ExponentialBackoffPolicy } from '@austa/events/retry';

/**
 * Service for managing quests in the gamification engine.
 * Handles quest retrieval, starting quests for users, and processing quest completion.
 */
@Injectable()
export class QuestsService {
  // Retry policy for external service calls
  private readonly retryPolicy = new ExponentialBackoffPolicy({
    initialDelay: 100, // ms
    maxDelay: 10000, // 10 seconds
    maxRetries: 3,
    backoffFactor: 2,
    jitter: true
  });

  /**
   * Injects the Quest and UserQuest repositories, ProfilesService, AchievementsService,
   * KafkaProducerService, TransactionService and LoggerService.
   */
  constructor(
    @InjectRepository(Quest)
    private readonly questRepository: Repository<Quest>,
    @InjectRepository(UserQuest)
    private readonly userQuestRepository: Repository<UserQuest>,
    private readonly profilesService: ProfilesService,
    private readonly achievementsService: AchievementsService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly transactionService: TransactionService,
    private readonly logger: LoggerService
  ) {}

  /**
   * Retrieves all quests with optional filtering and pagination.
   * @param filter Optional filter criteria
   * @param pagination Optional pagination parameters
   * @returns A promise that resolves to an array of quests
   */
  async findAll(filter?: Record<string, any>, pagination?: { page: number; limit: number }): Promise<Quest[]> {
    try {
      this.logger.debug('Retrieving all quests', { filter, pagination });
      
      const queryBuilder = this.questRepository.createQueryBuilder('quest');
      
      // Apply filters if provided
      if (filter?.journey) {
        queryBuilder.where('quest.journey = :journey', { journey: filter.journey });
      }
      
      // Apply pagination if provided
      if (pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
      }
      
      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error('Failed to retrieve quests', { 
        error: error.message,
        stack: error.stack,
        filter,
        pagination
      });
      
      throw new TechnicalError(
        'Failed to retrieve quests',
        'GAME_009',
        { filter, pagination },
        error
      );
    }
  }

  /**
   * Retrieves a single quest by its ID.
   * @param id The unique identifier of the quest
   * @returns A promise that resolves to a single quest
   * @throws ResourceNotFoundError if the quest is not found
   */
  async findOne(id: string): Promise<Quest> {
    try {
      this.logger.debug('Retrieving quest by ID', { questId: id });
      
      const quest = await this.questRepository.findOneBy({ id });
      
      if (!quest) {
        throw new ResourceNotFoundError(
          'Quest not found',
          'GAME_010',
          { questId: id }
        );
      }
      
      return quest;
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve quest with ID ${id}`, { 
        error: error.message,
        stack: error.stack,
        questId: id 
      });
      
      throw new TechnicalError(
        `Failed to retrieve quest with ID ${id}`,
        'GAME_010',
        { questId: id },
        error
      );
    }
  }

  /**
   * Starts a quest for a user with transaction support.
   * @param userId The ID of the user
   * @param questId The ID of the quest to start
   * @returns A promise that resolves to the created UserQuest
   */
  @Transactional({ isolationLevel: TransactionIsolationLevel.READ_COMMITTED })
  async startQuest(userId: string, questId: string): Promise<UserQuest> {
    const correlationId = `start-quest-${userId}-${questId}-${Date.now()}`;
    
    try {
      this.logger.debug('Starting quest for user', { 
        userId, 
        questId,
        correlationId 
      });
      
      // Get the user's game profile with retry for transient errors
      const profileOperation = new RetryableOperation(
        () => this.profilesService.findById(userId),
        this.retryPolicy,
        { operationName: 'findProfileById', metadata: { userId, questId } }
      );
      
      const profile = await profileOperation.execute();
      
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
        this.logger.debug('User already has this quest in progress', { 
          userId, 
          questId,
          userQuestId: existingUserQuest.id,
          correlationId
        });
        
        return existingUserQuest;
      }
      
      // Create a new UserQuest instance
      const userQuest = this.userQuestRepository.create({
        profile,
        quest,
        progress: 0,
        completed: false
      });
      
      // Save to database
      const savedUserQuest = await this.userQuestRepository.save(userQuest);
      
      // Create standardized event payload
      const questStartedEvent: QuestStartedEvent = {
        eventId: correlationId,
        eventType: 'quest.started',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        source: 'gamification-engine',
        payload: {
          userId,
          questId,
          questTitle: quest.title,
          journey: quest.journey,
          userQuestId: savedUserQuest.id
        },
        metadata: {
          correlationId
        }
      };
      
      // Publish event with retry and dead-letter queue support
      await this.kafkaProducer.send({
        topic: 'quest.started',
        messages: [{ value: JSON.stringify(questStartedEvent) }],
        options: {
          retries: 3,
          deadLetterQueue: 'gamification.dlq',
          headers: {
            correlationId
          }
        }
      });
      
      this.logger.info(`User ${userId} started quest ${questId}`, { 
        userId, 
        questId,
        userQuestId: savedUserQuest.id,
        correlationId
      });
      
      return savedUserQuest;
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to start quest ${questId} for user ${userId}`, { 
        error: error.message,
        stack: error.stack,
        userId, 
        questId,
        correlationId
      });
      
      throw new TechnicalError(
        `Failed to start quest ${questId} for user ${userId}`,
        'GAME_011',
        { userId, questId, correlationId },
        error
      );
    }
  }

  /**
   * Completes a quest for a user with transaction support.
   * @param userId The ID of the user
   * @param questId The ID of the quest to complete
   * @returns A promise that resolves to the updated UserQuest
   */
  @Transactional({ isolationLevel: TransactionIsolationLevel.READ_COMMITTED })
  async completeQuest(userId: string, questId: string): Promise<UserQuest> {
    const correlationId = `complete-quest-${userId}-${questId}-${Date.now()}`;
    
    try {
      this.logger.debug('Completing quest for user', { 
        userId, 
        questId,
        correlationId 
      });
      
      // Get the user's game profile with retry for transient errors
      const profileOperation = new RetryableOperation(
        () => this.profilesService.findById(userId),
        this.retryPolicy,
        { operationName: 'findProfileById', metadata: { userId, questId } }
      );
      
      const profile = await profileOperation.execute();
      
      // Get the user quest
      const userQuest = await this.userQuestRepository.findOne({
        where: {
          profile: { id: profile.id },
          quest: { id: questId }
        },
        relations: ['quest']
      });
      
      if (!userQuest) {
        throw new BusinessError(
          `User ${userId} has not started quest ${questId}`,
          'GAME_012',
          { userId, questId, correlationId }
        );
      }
      
      if (userQuest.status === QuestStatus.COMPLETED) {
        this.logger.debug('Quest already completed', { 
          userId, 
          questId,
          userQuestId: userQuest.id,
          correlationId
        });
        
        // Throw specialized exception for already completed quests
        throw new QuestAlreadyCompletedException(
          userId,
          questId,
          userQuest.completedAt || new Date() // Use the recorded completion time or current time as fallback
        );
      }
      
      // Update the UserQuest to mark it as completed
      userQuest.complete(); // This will set progress to 100, status to COMPLETED, and completedAt to current date
      
      // Save the updated UserQuest
      const updatedUserQuest = await this.userQuestRepository.save(userQuest);
      
      // Award XP to the user with retry for transient errors
      const updateProfileOperation = new RetryableOperation(
        () => this.profilesService.update(userId, {
          xp: profile.xp + userQuest.quest.xpReward
        }),
        this.retryPolicy,
        { operationName: 'updateProfileXp', metadata: { userId, questId, xpReward: userQuest.quest.xpReward } }
      );
      
      await updateProfileOperation.execute();
      
      // Check if completing this quest unlocks any achievements with retry for transient errors
      const findAchievementsOperation = new RetryableOperation(
        () => this.achievementsService.findByJourney(userQuest.quest.journey),
        this.retryPolicy,
        { operationName: 'findAchievementsByJourney', metadata: { journey: userQuest.quest.journey } }
      );
      
      const unlockedAchievements = await findAchievementsOperation.execute();
      
      // Create standardized event payload
      const questCompletedEvent: QuestCompletedEvent = {
        eventId: correlationId,
        eventType: 'quest.completed',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        source: 'gamification-engine',
        payload: {
          userId,
          questId,
          questTitle: userQuest.quest.title,
          journey: userQuest.quest.journey,
          userQuestId: updatedUserQuest.id,
          xpAwarded: userQuest.quest.xpReward,
          unlockedAchievements: unlockedAchievements.map(a => ({
            achievementId: a.id,
            achievementTitle: a.title
          }))
        },
        metadata: {
          correlationId
        }
      };
      
      // Publish event with retry and dead-letter queue support
      await this.kafkaProducer.send({
        topic: 'quest.completed',
        messages: [{ value: JSON.stringify(questCompletedEvent) }],
        options: {
          retries: 3,
          deadLetterQueue: 'gamification.dlq',
          headers: {
            correlationId
          }
        }
      });
      
      this.logger.info(
        `User ${userId} completed quest ${questId} and earned ${userQuest.quest.xpReward} XP`, 
        { 
          userId, 
          questId,
          userQuestId: updatedUserQuest.id,
          xpAwarded: userQuest.quest.xpReward,
          correlationId
        }
      );
      
      return updatedUserQuest;
    } catch (error) {
      if (error instanceof BusinessError || error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to complete quest ${questId} for user ${userId}`, { 
        error: error.message,
        stack: error.stack,
        userId, 
        questId,
        correlationId
      });
      
      throw new TechnicalError(
        `Failed to complete quest ${questId} for user ${userId}`,
        'GAME_012',
        { userId, questId, correlationId },
        error
      );
    }
  }

  /**
   * Updates the progress of a user's quest.
   * @param userId The ID of the user
   * @param questId The ID of the quest to update
   * @param progress The new progress value (0-100)
   * @returns A promise that resolves to the updated UserQuest
   */
  @Transactional({ isolationLevel: TransactionIsolationLevel.READ_COMMITTED })
  async updateQuestProgress(userId: string, questId: string, progress: number): Promise<UserQuest> {
    const correlationId = `update-quest-progress-${userId}-${questId}-${Date.now()}`;
    
    try {
      this.logger.debug('Updating quest progress for user', { 
        userId, 
        questId,
        progress,
        correlationId 
      });
      
      // Validate progress value
      if (progress < 0 || progress > 100) {
        throw new BusinessError(
          'Progress value must be between 0 and 100',
          'GAME_013',
          { userId, questId, progress, correlationId }
        );
      }
      
      // Get the user's game profile with retry for transient errors
      const profileOperation = new RetryableOperation(
        () => this.profilesService.findById(userId),
        this.retryPolicy,
        { operationName: 'findProfileById', metadata: { userId, questId } }
      );
      
      const profile = await profileOperation.execute();
      
      // Get the user quest
      const userQuest = await this.userQuestRepository.findOne({
        where: {
          profile: { id: profile.id },
          quest: { id: questId }
        },
        relations: ['quest']
      });
      
      if (!userQuest) {
        throw new BusinessError(
          `User ${userId} has not started quest ${questId}`,
          'GAME_012',
          { userId, questId, correlationId }
        );
      }
      
      if (userQuest.status === QuestStatus.COMPLETED) {
        this.logger.debug('Cannot update progress for completed quest', { 
          userId, 
          questId,
          userQuestId: userQuest.id,
          correlationId
        });
        
        // Throw specialized exception for already completed quests
        throw new QuestAlreadyCompletedException(
          userId,
          questId,
          userQuest.completedAt || new Date() // Use the recorded completion time or current time as fallback
        );
      }
      
      // Update the UserQuest progress
      userQuest.progress = progress;
      
      // If progress is 100, mark as completed
      if (progress === 100) {
        return this.completeQuest(userId, questId);
      }
      
      // Save the updated UserQuest
      const updatedUserQuest = await this.userQuestRepository.save(userQuest);
      
      this.logger.info(
        `Updated progress for user ${userId} on quest ${questId} to ${progress}%`, 
        { 
          userId, 
          questId,
          userQuestId: updatedUserQuest.id,
          progress,
          correlationId
        }
      );
      
      return updatedUserQuest;
    } catch (error) {
      if (error instanceof BusinessError || error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to update progress for quest ${questId} for user ${userId}`, { 
        error: error.message,
        stack: error.stack,
        userId, 
        questId,
        progress,
        correlationId
      });
      
      throw new TechnicalError(
        `Failed to update progress for quest ${questId} for user ${userId}`,
        'GAME_013',
        { userId, questId, progress, correlationId },
        error
      );
    }
  }

  /**
   * Retrieves all quests for a specific user with their progress.
   * @param userId The ID of the user
   * @param filter Optional filter criteria
   * @param pagination Optional pagination parameters
   * @returns A promise that resolves to an array of UserQuest objects
   */
  async findUserQuests(
    userId: string, 
    filter?: { completed?: boolean; journey?: string }, 
    pagination?: { page: number; limit: number }
  ): Promise<UserQuest[]> {
    try {
      this.logger.debug('Retrieving quests for user', { userId, filter, pagination });
      
      // Get the user's game profile with retry for transient errors
      const profileOperation = new RetryableOperation(
        () => this.profilesService.findById(userId),
        this.retryPolicy,
        { operationName: 'findProfileById', metadata: { userId } }
      );
      
      const profile = await profileOperation.execute();
      
      const queryBuilder = this.userQuestRepository.createQueryBuilder('userQuest')
        .leftJoinAndSelect('userQuest.quest', 'quest')
        .where('userQuest.profileId = :profileId', { profileId: profile.id });
      
      // Apply filters if provided
      if (filter?.completed !== undefined) {
        queryBuilder.andWhere('userQuest.completed = :completed', { completed: filter.completed });
      }
      
      if (filter?.journey) {
        queryBuilder.andWhere('quest.journey = :journey', { journey: filter.journey });
      }
      
      // Apply pagination if provided
      if (pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
      }
      
      return await queryBuilder.getMany();
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      this.logger.error('Failed to retrieve quests for user', { 
        error: error.message,
        stack: error.stack,
        userId,
        filter,
        pagination
      });
      
      throw new TechnicalError(
        `Failed to retrieve quests for user ${userId}`,
        'GAME_014',
        { userId, filter, pagination },
        error
      );
    }
  }
}