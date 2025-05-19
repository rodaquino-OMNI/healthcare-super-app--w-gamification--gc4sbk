import { Injectable, Logger } from '@nestjs/common';
import { JourneyType } from '@austa/interfaces/common';
import {
  Achievement,
  GameProfile,
  Quest,
  Reward,
  Rule,
  GamificationEvent
} from '@austa/interfaces/gamification';

import { PrismaService } from './prisma.service';
import { TransactionService } from './transaction.service';
import { JourneyContextService } from './journey-context.service';
import { DatabaseErrorHandlerService } from './error-handler.service';
import {
  IGamificationDatabaseService,
  IPrismaService,
  ITransactionHandler,
  IJourneyContextFactory,
  IDatabaseErrorHandler
} from './interfaces';

/**
 * Service that provides database operations for the gamification engine.
 * Implements the IGamificationDatabaseService interface to provide a consistent API
 * for accessing and manipulating gamification data.
 */
@Injectable()
export class GamificationDatabaseService implements IGamificationDatabaseService {
  private readonly logger = new Logger(GamificationDatabaseService.name);

  /**
   * Creates a new instance of GamificationDatabaseService
   * 
   * @param prismaService - Service for database access
   * @param transactionService - Service for transaction management
   * @param journeyContextService - Service for journey-specific database contexts
   * @param errorHandler - Service for handling database errors
   */
  constructor(
    private readonly prismaService: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly journeyContextService: JourneyContextService,
    private readonly errorHandler: DatabaseErrorHandlerService
  ) {}

  /**
   * Get the Prisma service for direct database access.
   * 
   * @returns The Prisma service
   */
  getPrismaService(): IPrismaService {
    return this.prismaService;
  }

  /**
   * Get the transaction handler for managing database transactions.
   * 
   * @returns The transaction handler
   */
  getTransactionHandler(): ITransactionHandler {
    return this.transactionService;
  }

  /**
   * Get the journey context factory for creating journey-specific database contexts.
   * 
   * @returns The journey context factory
   */
  getJourneyContextFactory(): IJourneyContextFactory {
    return this.journeyContextService;
  }

  /**
   * Get the database error handler for processing database errors.
   * 
   * @returns The database error handler
   */
  getErrorHandler(): IDatabaseErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get a game profile by user ID.
   * 
   * @param userId - The ID of the user
   * @returns Promise that resolves to the game profile or null if not found
   */
  async getGameProfile(userId: string): Promise<GameProfile | null> {
    this.logger.debug(`Getting game profile for user: ${userId}`);
    
    try {
      const profile = await this.errorHandler.executeWithRetry(() =>
        this.prismaService.gameProfile.findUnique({
          where: { userId },
        })
      );

      if (!profile) {
        return null;
      }

      // Transform to domain model
      return {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        level: profile.level,
        totalPoints: profile.totalPoints,
        healthPoints: profile.healthPoints,
        carePoints: profile.carePoints,
        planPoints: profile.planPoints,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      };
    } catch (error) {
      this.logger.error(`Error getting game profile for user: ${userId}`, {
        error: error.message,
        stack: error.stack,
        userId
      });

      throw this.errorHandler.handleError(error, {
        operation: 'getGameProfile',
        userId
      });
    }
  }

  /**
   * Get achievements for a user.
   * 
   * @param userId - The ID of the user
   * @param journeyType - Optional journey type to filter achievements
   * @returns Promise that resolves to an array of achievements
   */
  async getAchievements(userId: string, journeyType?: JourneyType): Promise<Achievement[]> {
    this.logger.debug(`Getting achievements for user: ${userId}`, { journeyType });
    
    try {
      if (journeyType) {
        // Get journey-specific achievements using the appropriate context
        const context = this.journeyContextService.getContext(journeyType);
        
        switch (journeyType) {
          case JourneyType.HEALTH:
            return await this.journeyContextService.getHealthContext().getHealthAchievements(userId);
          case JourneyType.CARE:
            return await this.journeyContextService.getCareContext().getCareAchievements(userId);
          case JourneyType.PLAN:
            return await this.journeyContextService.getPlanContext().getPlanAchievements(userId);
          default:
            throw new Error(`Unsupported journey type: ${journeyType}`);
        }
      }

      // Get all achievements across journeys
      const achievements = await this.errorHandler.executeWithRetry(() =>
        this.prismaService.achievement.findMany({
          where: { userId },
          include: { rule: true },
          orderBy: { achievedAt: 'desc' }
        })
      );

      // Transform to domain model
      return achievements.map(achievement => ({
        id: achievement.id,
        userId: achievement.userId,
        title: achievement.title,
        description: achievement.description,
        journeyType: achievement.journeyType as JourneyType,
        points: achievement.points,
        achievedAt: achievement.achievedAt,
        rule: achievement.rule ? {
          id: achievement.rule.id,
          name: achievement.rule.name,
          description: achievement.rule.description,
          journeyType: achievement.rule.journeyType as JourneyType,
          eventType: achievement.rule.eventType,
          condition: achievement.rule.condition as any,
          points: achievement.rule.points,
          active: achievement.rule.active
        } : undefined
      }));
    } catch (error) {
      this.logger.error(`Error getting achievements for user: ${userId}`, {
        error: error.message,
        stack: error.stack,
        userId,
        journeyType
      });

      throw this.errorHandler.handleError(error, {
        operation: 'getAchievements',
        userId,
        journeyType
      });
    }
  }

  /**
   * Get quests for a user.
   * 
   * @param userId - The ID of the user
   * @param journeyType - Optional journey type to filter quests
   * @returns Promise that resolves to an array of quests
   */
  async getQuests(userId: string, journeyType?: JourneyType): Promise<Quest[]> {
    this.logger.debug(`Getting quests for user: ${userId}`, { journeyType });
    
    try {
      if (journeyType) {
        // Get journey-specific quests using the appropriate context
        const context = this.journeyContextService.getContext(journeyType);
        
        switch (journeyType) {
          case JourneyType.HEALTH:
            return await this.journeyContextService.getHealthContext().getHealthQuests(userId);
          case JourneyType.CARE:
            return await this.journeyContextService.getCareContext().getCareQuests(userId);
          case JourneyType.PLAN:
            return await this.journeyContextService.getPlanContext().getPlanQuests(userId);
          default:
            throw new Error(`Unsupported journey type: ${journeyType}`);
        }
      }

      // Get all quests across journeys
      const quests = await this.errorHandler.executeWithRetry(() =>
        this.prismaService.quest.findMany({
          where: { userId },
          include: {
            steps: {
              include: { rule: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      );

      // Transform to domain model
      return quests.map(quest => ({
        id: quest.id,
        userId: quest.userId,
        title: quest.title,
        description: quest.description,
        journeyType: quest.journeyType as JourneyType,
        totalPoints: quest.totalPoints,
        progress: quest.progress,
        startDate: quest.startDate,
        endDate: quest.endDate,
        completedAt: quest.completedAt,
        steps: quest.steps.map(step => ({
          id: step.id,
          questId: step.questId,
          title: step.title,
          description: step.description,
          points: step.points,
          order: step.order,
          completed: step.completed,
          completedAt: step.completedAt,
          rule: step.rule ? {
            id: step.rule.id,
            name: step.rule.name,
            description: step.rule.description,
            journeyType: step.rule.journeyType as JourneyType,
            eventType: step.rule.eventType,
            condition: step.rule.condition as any,
            points: step.rule.points,
            active: step.rule.active
          } : undefined
        }))
      }));
    } catch (error) {
      this.logger.error(`Error getting quests for user: ${userId}`, {
        error: error.message,
        stack: error.stack,
        userId,
        journeyType
      });

      throw this.errorHandler.handleError(error, {
        operation: 'getQuests',
        userId,
        journeyType
      });
    }
  }

  /**
   * Get rewards for a user.
   * 
   * @param userId - The ID of the user
   * @param journeyType - Optional journey type to filter rewards
   * @returns Promise that resolves to an array of rewards
   */
  async getRewards(userId: string, journeyType?: JourneyType): Promise<Reward[]> {
    this.logger.debug(`Getting rewards for user: ${userId}`, { journeyType });
    
    try {
      // Build the query
      const where: any = { userId };
      if (journeyType) {
        where.journeyType = journeyType;
      }

      // Get rewards
      const rewards = await this.errorHandler.executeWithRetry(() =>
        this.prismaService.reward.findMany({
          where,
          include: { quest: true },
          orderBy: { awardedAt: 'desc' }
        })
      );

      // Transform to domain model
      return rewards.map(reward => ({
        id: reward.id,
        userId: reward.userId,
        title: reward.title,
        description: reward.description,
        journeyType: reward.journeyType as JourneyType,
        points: reward.points,
        awardedAt: reward.awardedAt,
        redeemedAt: reward.redeemedAt,
        questId: reward.questId,
        quest: reward.quest ? {
          id: reward.quest.id,
          title: reward.quest.title,
          description: reward.quest.description,
          journeyType: reward.quest.journeyType as JourneyType,
          totalPoints: reward.quest.totalPoints,
          progress: reward.quest.progress,
          completedAt: reward.quest.completedAt
        } : undefined
      }));
    } catch (error) {
      this.logger.error(`Error getting rewards for user: ${userId}`, {
        error: error.message,
        stack: error.stack,
        userId,
        journeyType
      });

      throw this.errorHandler.handleError(error, {
        operation: 'getRewards',
        userId,
        journeyType
      });
    }
  }

  /**
   * Get rules for a journey type.
   * 
   * @param journeyType - The journey type to get rules for
   * @returns Promise that resolves to an array of rules
   */
  async getRules(journeyType: JourneyType): Promise<Rule[]> {
    this.logger.debug(`Getting rules for journey: ${journeyType}`);
    
    try {
      // Get rules for the specified journey type
      const rules = await this.errorHandler.executeWithRetry(() =>
        this.prismaService.rule.findMany({
          where: { journeyType, active: true },
          orderBy: { createdAt: 'desc' }
        })
      );

      // Transform to domain model
      return rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        journeyType: rule.journeyType as JourneyType,
        eventType: rule.eventType,
        condition: rule.condition as any,
        points: rule.points,
        active: rule.active,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }));
    } catch (error) {
      this.logger.error(`Error getting rules for journey: ${journeyType}`, {
        error: error.message,
        stack: error.stack,
        journeyType
      });

      throw this.errorHandler.handleError(error, {
        operation: 'getRules',
        journeyType
      });
    }
  }

  /**
   * Process a gamification event.
   * 
   * @param event - The event to process
   * @returns Promise that resolves when the event is processed
   */
  async processEvent(event: GamificationEvent): Promise<void> {
    this.logger.debug(`Processing event: ${event.type}`, { eventId: event.id });
    
    try {
      // Delegate to the journey context service for processing
      await this.journeyContextService.processEvent(event);
    } catch (error) {
      this.logger.error(`Error processing event: ${event.type}`, {
        error: error.message,
        stack: error.stack,
        eventId: event.id,
        eventType: event.type,
        userId: event.userId
      });

      throw this.errorHandler.handleError(error, {
        operation: 'processEvent',
        eventId: event.id,
        eventType: event.type,
        userId: event.userId
      });
    }
  }

  /**
   * Create a new game profile for a user.
   * 
   * @param userId - The ID of the user
   * @param displayName - The display name for the profile
   * @param avatarUrl - Optional URL for the user's avatar
   * @returns Promise that resolves to the created game profile
   */
  async createGameProfile(
    userId: string,
    displayName: string,
    avatarUrl?: string
  ): Promise<GameProfile> {
    this.logger.debug(`Creating game profile for user: ${userId}`);
    
    try {
      // Create the profile in a transaction
      return await this.transactionService.executeWriteTransaction(async (client) => {
        // Check if profile already exists
        const existingProfile = await client.gameProfile.findUnique({
          where: { userId }
        });

        if (existingProfile) {
          this.logger.warn(`Game profile already exists for user: ${userId}`);
          
          // Return existing profile
          return {
            id: existingProfile.id,
            userId: existingProfile.userId,
            displayName: existingProfile.displayName,
            avatarUrl: existingProfile.avatarUrl,
            level: existingProfile.level,
            totalPoints: existingProfile.totalPoints,
            healthPoints: existingProfile.healthPoints,
            carePoints: existingProfile.carePoints,
            planPoints: existingProfile.planPoints,
            createdAt: existingProfile.createdAt,
            updatedAt: existingProfile.updatedAt
          };
        }

        // Create new profile
        const profile = await client.gameProfile.create({
          data: {
            userId,
            displayName,
            avatarUrl,
            level: 1,
            totalPoints: 0,
            healthPoints: 0,
            carePoints: 0,
            planPoints: 0
          }
        });

        // Transform to domain model
        return {
          id: profile.id,
          userId: profile.userId,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          level: profile.level,
          totalPoints: profile.totalPoints,
          healthPoints: profile.healthPoints,
          carePoints: profile.carePoints,
          planPoints: profile.planPoints,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        };
      });
    } catch (error) {
      this.logger.error(`Error creating game profile for user: ${userId}`, {
        error: error.message,
        stack: error.stack,
        userId,
        displayName
      });

      throw this.errorHandler.handleError(error, {
        operation: 'createGameProfile',
        userId,
        displayName
      });
    }
  }

  /**
   * Update a user's game profile.
   * 
   * @param userId - The ID of the user
   * @param updates - The fields to update
   * @returns Promise that resolves to the updated game profile
   */
  async updateGameProfile(
    userId: string,
    updates: Partial<Omit<GameProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<GameProfile> {
    this.logger.debug(`Updating game profile for user: ${userId}`);
    
    try {
      // Update the profile
      const profile = await this.errorHandler.executeWithRetry(() =>
        this.prismaService.gameProfile.update({
          where: { userId },
          data: updates
        })
      );

      // Transform to domain model
      return {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        level: profile.level,
        totalPoints: profile.totalPoints,
        healthPoints: profile.healthPoints,
        carePoints: profile.carePoints,
        planPoints: profile.planPoints,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      };
    } catch (error) {
      this.logger.error(`Error updating game profile for user: ${userId}`, {
        error: error.message,
        stack: error.stack,
        userId,
        updates
      });

      throw this.errorHandler.handleError(error, {
        operation: 'updateGameProfile',
        userId,
        updates
      });
    }
  }

  /**
   * Create a new rule for a journey.
   * 
   * @param rule - The rule to create
   * @returns Promise that resolves to the created rule
   */
  async createRule(rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rule> {
    this.logger.debug(`Creating rule: ${rule.name}`, { journeyType: rule.journeyType });
    
    try {
      // Create the rule
      const createdRule = await this.errorHandler.executeWithRetry(() =>
        this.prismaService.rule.create({
          data: {
            name: rule.name,
            description: rule.description,
            journeyType: rule.journeyType,
            eventType: rule.eventType,
            condition: rule.condition as any,
            points: rule.points,
            active: rule.active ?? true
          }
        })
      );

      // Transform to domain model
      return {
        id: createdRule.id,
        name: createdRule.name,
        description: createdRule.description,
        journeyType: createdRule.journeyType as JourneyType,
        eventType: createdRule.eventType,
        condition: createdRule.condition as any,
        points: createdRule.points,
        active: createdRule.active,
        createdAt: createdRule.createdAt,
        updatedAt: createdRule.updatedAt
      };
    } catch (error) {
      this.logger.error(`Error creating rule: ${rule.name}`, {
        error: error.message,
        stack: error.stack,
        rule
      });

      throw this.errorHandler.handleError(error, {
        operation: 'createRule',
        rule
      });
    }
  }

  /**
   * Create a new quest for a user.
   * 
   * @param userId - The ID of the user
   * @param quest - The quest to create
   * @param steps - The steps for the quest
   * @returns Promise that resolves to the created quest
   */
  async createQuest(
    userId: string,
    quest: Omit<Quest, 'id' | 'userId' | 'steps' | 'createdAt' | 'updatedAt'>,
    steps: Array<Omit<Quest['steps'][0], 'id' | 'questId' | 'completedAt'>>
  ): Promise<Quest> {
    this.logger.debug(`Creating quest for user: ${userId}`, { questTitle: quest.title });
    
    try {
      // Create the quest in a transaction
      return await this.transactionService.executeWriteTransaction(async (client) => {
        // Create the quest
        const createdQuest = await client.quest.create({
          data: {
            userId,
            title: quest.title,
            description: quest.description,
            journeyType: quest.journeyType,
            totalPoints: quest.totalPoints,
            progress: 0,
            startDate: quest.startDate || new Date(),
            endDate: quest.endDate
          }
        });

        // Create the steps
        const createdSteps = await Promise.all(
          steps.map(async (step, index) => {
            return client.questStep.create({
              data: {
                questId: createdQuest.id,
                title: step.title,
                description: step.description,
                points: step.points,
                order: step.order ?? index + 1,
                completed: false,
                ruleId: step.rule?.id
              },
              include: {
                rule: true
              }
            });
          })
        );

        // Transform to domain model
        return {
          id: createdQuest.id,
          userId: createdQuest.userId,
          title: createdQuest.title,
          description: createdQuest.description,
          journeyType: createdQuest.journeyType as JourneyType,
          totalPoints: createdQuest.totalPoints,
          progress: createdQuest.progress,
          startDate: createdQuest.startDate,
          endDate: createdQuest.endDate,
          completedAt: createdQuest.completedAt,
          steps: createdSteps.map(step => ({
            id: step.id,
            questId: step.questId,
            title: step.title,
            description: step.description,
            points: step.points,
            order: step.order,
            completed: step.completed,
            completedAt: step.completedAt,
            rule: step.rule ? {
              id: step.rule.id,
              name: step.rule.name,
              description: step.rule.description,
              journeyType: step.rule.journeyType as JourneyType,
              eventType: step.rule.eventType,
              condition: step.rule.condition as any,
              points: step.rule.points,
              active: step.rule.active
            } : undefined
          }))
        };
      });
    } catch (error) {
      this.logger.error(`Error creating quest for user: ${userId}`, {
        error: error.message,
        stack: error.stack,
        userId,
        quest,
        steps
      });

      throw this.errorHandler.handleError(error, {
        operation: 'createQuest',
        userId,
        quest,
        steps
      });
    }
  }
}