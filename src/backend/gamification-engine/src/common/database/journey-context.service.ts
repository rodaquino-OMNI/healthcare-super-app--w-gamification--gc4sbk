import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
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
import { DatabaseErrorHandlerService } from './error-handler.service';
import {
  IJourneyContextFactory,
  IJourneyContext,
  IHealthJourneyContext,
  ICareJourneyContext,
  IPlanJourneyContext,
  ITransactionOptions
} from './interfaces';
import {
  TRANSACTION_ISOLATION,
  OPERATION_TIMEOUTS,
  RETRY_STRATEGY,
  BATCH_OPERATIONS,
  QUERY_LOGGING
} from './constants';

/**
 * Base implementation of a journey context.
 * Provides common functionality for all journey contexts.
 */
@Injectable()
class BaseJourneyContext implements IJourneyContext {
  protected readonly logger: Logger;

  /**
   * Creates a new instance of BaseJourneyContext
   * 
   * @param journeyType - The type of journey this context is for
   * @param prismaService - Service for database access
   * @param transactionService - Service for transaction management
   * @param errorHandler - Service for handling database errors
   */
  constructor(
    public readonly journeyType: JourneyType,
    protected readonly prismaService: PrismaService,
    protected readonly transactionService: TransactionService,
    protected readonly errorHandler: DatabaseErrorHandlerService
  ) {
    this.logger = new Logger(`${journeyType}JourneyContext`);
  }

  /**
   * Get the Prisma client for this journey context.
   * 
   * @returns The Prisma client for this journey
   */
  getClient(): PrismaClient {
    return this.prismaService;
  }

  /**
   * Execute a function within this journey context.
   * 
   * @param fn - The function to execute
   * @returns Promise that resolves to the result of the function
   */
  async execute<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
    try {
      this.logger.debug(`Executing operation in ${this.journeyType} journey context`);
      const startTime = Date.now();

      // Execute the function with the client
      const result = await this.errorHandler.executeWithRetry(
        () => fn(this.prismaService),
        { journeyType: this.journeyType, operation: 'execute' },
        this.journeyType
      );

      // Log performance metrics
      const duration = Date.now() - startTime;
      if (duration > QUERY_LOGGING.SLOW_QUERY_THRESHOLD_MS) {
        this.logger.warn(`Slow operation in ${this.journeyType} journey context: ${duration}ms`);
      } else {
        this.logger.debug(`Operation in ${this.journeyType} journey context completed in ${duration}ms`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error executing operation in ${this.journeyType} journey context`, {
        error: error.message,
        stack: error.stack,
        journeyType: this.journeyType
      });

      throw this.errorHandler.handleError(error, {
        journeyType: this.journeyType,
        operation: 'execute'
      });
    }
  }

  /**
   * Execute a function within a transaction in this journey context.
   * 
   * @param fn - The function to execute within the transaction
   * @param options - Configuration options for the transaction
   * @returns Promise that resolves to the result of the function
   */
  async executeInTransaction<T>(
    fn: (client: Prisma.TransactionClient) => Promise<T>,
    options?: ITransactionOptions
  ): Promise<T> {
    try {
      this.logger.debug(`Executing transaction in ${this.journeyType} journey context`);
      
      // Execute the function within a transaction
      return await this.transactionService.executeForJourney(
        this.journeyType,
        fn,
        {
          ...options,
          context: {
            journeyType: this.journeyType,
            ...(options?.context || {})
          }
        }
      );
    } catch (error) {
      this.logger.error(`Error executing transaction in ${this.journeyType} journey context`, {
        error: error.message,
        stack: error.stack,
        journeyType: this.journeyType
      });

      throw this.errorHandler.handleError(error, {
        journeyType: this.journeyType,
        operation: 'executeInTransaction'
      });
    }
  }

  /**
   * Execute a batch operation with journey-specific batch size.
   * 
   * @param items - The items to process in batches
   * @param batchFn - The function to execute for each batch
   * @returns Promise that resolves to an array of results, one for each batch
   */
  protected async executeBatch<T, R>(
    items: T[],
    batchFn: (batch: T[], client: PrismaClient) => Promise<R>
  ): Promise<R[]> {
    // Get journey-specific batch size
    const batchSize = BATCH_OPERATIONS.JOURNEY_BATCH_SIZES[this.journeyType] || 
                     BATCH_OPERATIONS.DEFAULT_BATCH_SIZE;
    
    // Split items into batches
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    this.logger.debug(`Processing ${items.length} items in ${batches.length} batches for ${this.journeyType} journey`);

    // Process each batch
    const results: R[] = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.debug(`Processing batch ${i + 1}/${batches.length} with ${batch.length} items`);

      // Execute the batch function
      const result = await this.execute(client => batchFn(batch, client));
      results.push(result);

      // Add delay between batches to prevent database overload
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, BATCH_OPERATIONS.BATCH_DELAY_MS));
      }
    }

    return results;
  }
}

/**
 * Implementation of the Health journey context.
 * Provides health-specific database operations.
 */
@Injectable()
class HealthJourneyContext extends BaseJourneyContext implements IHealthJourneyContext {
  /**
   * Creates a new instance of HealthJourneyContext
   */
  constructor(
    prismaService: PrismaService,
    transactionService: TransactionService,
    errorHandler: DatabaseErrorHandlerService
  ) {
    super(JourneyType.HEALTH, prismaService, transactionService, errorHandler);
  }

  /**
   * Process a health-related gamification event.
   * 
   * @param event - The health event to process
   * @returns Promise that resolves when the event is processed
   */
  async processHealthEvent(event: GamificationEvent): Promise<void> {
    this.logger.debug(`Processing health event: ${event.type}`, { eventId: event.id });
    
    // Execute in a transaction to ensure data consistency
    await this.executeInTransaction(async (client) => {
      // Store the event
      await client.gamificationEvent.create({
        data: {
          id: event.id,
          userId: event.userId,
          type: event.type,
          journeyType: JourneyType.HEALTH,
          payload: event.payload as any,
          timestamp: event.timestamp || new Date(),
          processed: false
        }
      });

      // Process the event based on its type
      switch (event.type) {
        case 'HEALTH_METRIC_RECORDED':
          await this.processHealthMetricEvent(event, client);
          break;
        case 'HEALTH_GOAL_ACHIEVED':
          await this.processHealthGoalEvent(event, client);
          break;
        case 'DEVICE_CONNECTED':
          await this.processDeviceConnectedEvent(event, client);
          break;
        default:
          this.logger.warn(`Unknown health event type: ${event.type}`, { eventId: event.id });
      }

      // Mark the event as processed
      await client.gamificationEvent.update({
        where: { id: event.id },
        data: { processed: true, processedAt: new Date() }
      });
    });
  }

  /**
   * Get health-specific achievements for a user.
   * 
   * @param userId - The ID of the user
   * @returns Promise that resolves to an array of health achievements
   */
  async getHealthAchievements(userId: string): Promise<Achievement[]> {
    this.logger.debug(`Getting health achievements for user: ${userId}`);
    
    return this.execute(async (client) => {
      const achievements = await client.achievement.findMany({
        where: {
          userId,
          journeyType: JourneyType.HEALTH
        },
        include: {
          rule: true
        },
        orderBy: {
          achievedAt: 'desc'
        }
      });

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
    });
  }

  /**
   * Get health-specific quests for a user.
   * 
   * @param userId - The ID of the user
   * @returns Promise that resolves to an array of health quests
   */
  async getHealthQuests(userId: string): Promise<Quest[]> {
    this.logger.debug(`Getting health quests for user: ${userId}`);
    
    return this.execute(async (client) => {
      const quests = await client.quest.findMany({
        where: {
          userId,
          journeyType: JourneyType.HEALTH
        },
        include: {
          steps: {
            include: {
              rule: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

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
    });
  }

  /**
   * Process a health metric event.
   * 
   * @param event - The health metric event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processHealthMetricEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing health metric event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.HEALTH,
        eventType: event.type,
        active: true
      }
    });

    // Check each rule against the event
    for (const rule of rules) {
      try {
        const condition = rule.condition as Record<string, any>;
        const payload = event.payload as Record<string, any>;
        
        // Evaluate the rule condition against the event payload
        const matches = this.evaluateRuleCondition(condition, payload);
        
        if (matches) {
          this.logger.debug(`Rule ${rule.id} matched for event ${event.id}`);
          
          // Check if the user already has this achievement
          const existingAchievement = await client.achievement.findFirst({
            where: {
              userId: event.userId,
              ruleId: rule.id
            }
          });
          
          if (!existingAchievement) {
            // Create a new achievement for the user
            await client.achievement.create({
              data: {
                userId: event.userId,
                title: rule.name,
                description: rule.description,
                journeyType: JourneyType.HEALTH,
                points: rule.points,
                achievedAt: new Date(),
                ruleId: rule.id,
                eventId: event.id
              }
            });
            
            // Update user's game profile with the points
            await client.gameProfile.update({
              where: { userId: event.userId },
              data: {
                totalPoints: { increment: rule.points },
                healthPoints: { increment: rule.points }
              }
            });
          }
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.id} for event ${event.id}`, {
          error: error.message,
          stack: error.stack,
          ruleId: rule.id,
          eventId: event.id
        });
      }
    }
  }

  /**
   * Process a health goal event.
   * 
   * @param event - The health goal event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processHealthGoalEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing health goal event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.HEALTH,
        eventType: event.type,
        active: true
      }
    });

    // Check each rule against the event
    for (const rule of rules) {
      try {
        const condition = rule.condition as Record<string, any>;
        const payload = event.payload as Record<string, any>;
        
        // Evaluate the rule condition against the event payload
        const matches = this.evaluateRuleCondition(condition, payload);
        
        if (matches) {
          this.logger.debug(`Rule ${rule.id} matched for event ${event.id}`);
          
          // Check if the user already has this achievement
          const existingAchievement = await client.achievement.findFirst({
            where: {
              userId: event.userId,
              ruleId: rule.id
            }
          });
          
          if (!existingAchievement) {
            // Create a new achievement for the user
            await client.achievement.create({
              data: {
                userId: event.userId,
                title: rule.name,
                description: rule.description,
                journeyType: JourneyType.HEALTH,
                points: rule.points,
                achievedAt: new Date(),
                ruleId: rule.id,
                eventId: event.id
              }
            });
            
            // Update user's game profile with the points
            await client.gameProfile.update({
              where: { userId: event.userId },
              data: {
                totalPoints: { increment: rule.points },
                healthPoints: { increment: rule.points }
              }
            });
            
            // Check if this completes any quest steps
            await this.updateQuestProgress(event.userId, rule.id, client);
          }
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.id} for event ${event.id}`, {
          error: error.message,
          stack: error.stack,
          ruleId: rule.id,
          eventId: event.id
        });
      }
    }
  }

  /**
   * Process a device connected event.
   * 
   * @param event - The device connected event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processDeviceConnectedEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing device connected event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.HEALTH,
        eventType: event.type,
        active: true
      }
    });

    // Check each rule against the event
    for (const rule of rules) {
      try {
        const condition = rule.condition as Record<string, any>;
        const payload = event.payload as Record<string, any>;
        
        // Evaluate the rule condition against the event payload
        const matches = this.evaluateRuleCondition(condition, payload);
        
        if (matches) {
          this.logger.debug(`Rule ${rule.id} matched for event ${event.id}`);
          
          // Check if the user already has this achievement
          const existingAchievement = await client.achievement.findFirst({
            where: {
              userId: event.userId,
              ruleId: rule.id
            }
          });
          
          if (!existingAchievement) {
            // Create a new achievement for the user
            await client.achievement.create({
              data: {
                userId: event.userId,
                title: rule.name,
                description: rule.description,
                journeyType: JourneyType.HEALTH,
                points: rule.points,
                achievedAt: new Date(),
                ruleId: rule.id,
                eventId: event.id
              }
            });
            
            // Update user's game profile with the points
            await client.gameProfile.update({
              where: { userId: event.userId },
              data: {
                totalPoints: { increment: rule.points },
                healthPoints: { increment: rule.points }
              }
            });
          }
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.id} for event ${event.id}`, {
          error: error.message,
          stack: error.stack,
          ruleId: rule.id,
          eventId: event.id
        });
      }
    }
  }

  /**
   * Update quest progress when a rule is matched.
   * 
   * @param userId - The ID of the user
   * @param ruleId - The ID of the matched rule
   * @param client - The transaction client
   * @returns Promise that resolves when quest progress is updated
   */
  private async updateQuestProgress(
    userId: string,
    ruleId: string,
    client: Prisma.TransactionClient
  ): Promise<void> {
    // Find quest steps that depend on this rule
    const questSteps = await client.questStep.findMany({
      where: {
        quest: {
          userId,
          journeyType: JourneyType.HEALTH,
          completedAt: null
        },
        ruleId,
        completed: false
      },
      include: {
        quest: true
      }
    });

    if (questSteps.length === 0) {
      return;
    }

    this.logger.debug(`Updating ${questSteps.length} quest steps for user ${userId} and rule ${ruleId}`);

    // Update each quest step
    for (const step of questSteps) {
      // Mark the step as completed
      await client.questStep.update({
        where: { id: step.id },
        data: {
          completed: true,
          completedAt: new Date()
        }
      });

      // Check if all steps in the quest are completed
      const remainingSteps = await client.questStep.count({
        where: {
          questId: step.questId,
          completed: false
        }
      });

      if (remainingSteps === 0) {
        // All steps are completed, mark the quest as completed
        await client.quest.update({
          where: { id: step.questId },
          data: {
            completedAt: new Date(),
            progress: 100
          }
        });

        // Award the quest completion reward
        await client.reward.create({
          data: {
            userId,
            title: `Completed: ${step.quest.title}`,
            description: `Reward for completing the quest: ${step.quest.description}`,
            journeyType: JourneyType.HEALTH,
            points: step.quest.totalPoints,
            awardedAt: new Date(),
            questId: step.questId
          }
        });

        // Update user's game profile with the points
        await client.gameProfile.update({
          where: { userId },
          data: {
            totalPoints: { increment: step.quest.totalPoints },
            healthPoints: { increment: step.quest.totalPoints }
          }
        });
      } else {
        // Update quest progress
        const totalSteps = await client.questStep.count({
          where: {
            questId: step.questId
          }
        });

        const completedSteps = totalSteps - remainingSteps;
        const progress = Math.floor((completedSteps / totalSteps) * 100);

        await client.quest.update({
          where: { id: step.questId },
          data: {
            progress
          }
        });
      }
    }
  }

  /**
   * Evaluate a rule condition against an event payload.
   * 
   * @param condition - The rule condition to evaluate
   * @param payload - The event payload to check against
   * @returns Boolean indicating if the condition matches the payload
   */
  private evaluateRuleCondition(
    condition: Record<string, any>,
    payload: Record<string, any>
  ): boolean {
    // Simple condition evaluation logic
    // In a real implementation, this would be more sophisticated
    for (const [key, value] of Object.entries(condition)) {
      // Check if the key exists in the payload
      if (!(key in payload)) {
        return false;
      }

      // Check if the value matches
      if (typeof value === 'object' && value !== null) {
        // Handle operators like $gt, $lt, etc.
        if ('$gt' in value && !(payload[key] > value.$gt)) {
          return false;
        }
        if ('$lt' in value && !(payload[key] < value.$lt)) {
          return false;
        }
        if ('$gte' in value && !(payload[key] >= value.$gte)) {
          return false;
        }
        if ('$lte' in value && !(payload[key] <= value.$lte)) {
          return false;
        }
        if ('$eq' in value && payload[key] !== value.$eq) {
          return false;
        }
        if ('$ne' in value && payload[key] === value.$ne) {
          return false;
        }
        if ('$in' in value && !value.$in.includes(payload[key])) {
          return false;
        }
        if ('$nin' in value && value.$nin.includes(payload[key])) {
          return false;
        }
      } else if (payload[key] !== value) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Implementation of the Care journey context.
 * Provides care-specific database operations.
 */
@Injectable()
class CareJourneyContext extends BaseJourneyContext implements ICareJourneyContext {
  /**
   * Creates a new instance of CareJourneyContext
   */
  constructor(
    prismaService: PrismaService,
    transactionService: TransactionService,
    errorHandler: DatabaseErrorHandlerService
  ) {
    super(JourneyType.CARE, prismaService, transactionService, errorHandler);
  }

  /**
   * Process a care-related gamification event.
   * 
   * @param event - The care event to process
   * @returns Promise that resolves when the event is processed
   */
  async processCareEvent(event: GamificationEvent): Promise<void> {
    this.logger.debug(`Processing care event: ${event.type}`, { eventId: event.id });
    
    // Execute in a transaction to ensure data consistency
    await this.executeInTransaction(async (client) => {
      // Store the event
      await client.gamificationEvent.create({
        data: {
          id: event.id,
          userId: event.userId,
          type: event.type,
          journeyType: JourneyType.CARE,
          payload: event.payload as any,
          timestamp: event.timestamp || new Date(),
          processed: false
        }
      });

      // Process the event based on its type
      switch (event.type) {
        case 'APPOINTMENT_BOOKED':
          await this.processAppointmentEvent(event, client);
          break;
        case 'TELEMEDICINE_SESSION_COMPLETED':
          await this.processTelemedicineEvent(event, client);
          break;
        case 'MEDICATION_ADHERENCE':
          await this.processMedicationEvent(event, client);
          break;
        default:
          this.logger.warn(`Unknown care event type: ${event.type}`, { eventId: event.id });
      }

      // Mark the event as processed
      await client.gamificationEvent.update({
        where: { id: event.id },
        data: { processed: true, processedAt: new Date() }
      });
    });
  }

  /**
   * Get care-specific achievements for a user.
   * 
   * @param userId - The ID of the user
   * @returns Promise that resolves to an array of care achievements
   */
  async getCareAchievements(userId: string): Promise<Achievement[]> {
    this.logger.debug(`Getting care achievements for user: ${userId}`);
    
    return this.execute(async (client) => {
      const achievements = await client.achievement.findMany({
        where: {
          userId,
          journeyType: JourneyType.CARE
        },
        include: {
          rule: true
        },
        orderBy: {
          achievedAt: 'desc'
        }
      });

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
    });
  }

  /**
   * Get care-specific quests for a user.
   * 
   * @param userId - The ID of the user
   * @returns Promise that resolves to an array of care quests
   */
  async getCareQuests(userId: string): Promise<Quest[]> {
    this.logger.debug(`Getting care quests for user: ${userId}`);
    
    return this.execute(async (client) => {
      const quests = await client.quest.findMany({
        where: {
          userId,
          journeyType: JourneyType.CARE
        },
        include: {
          steps: {
            include: {
              rule: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

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
    });
  }

  /**
   * Process an appointment event.
   * 
   * @param event - The appointment event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processAppointmentEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing appointment event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.CARE,
        eventType: event.type,
        active: true
      }
    });

    // Process rules similar to health events
    // Implementation details omitted for brevity
  }

  /**
   * Process a telemedicine event.
   * 
   * @param event - The telemedicine event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processTelemedicineEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing telemedicine event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.CARE,
        eventType: event.type,
        active: true
      }
    });

    // Process rules similar to health events
    // Implementation details omitted for brevity
  }

  /**
   * Process a medication event.
   * 
   * @param event - The medication event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processMedicationEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing medication event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.CARE,
        eventType: event.type,
        active: true
      }
    });

    // Process rules similar to health events
    // Implementation details omitted for brevity
  }
}

/**
 * Implementation of the Plan journey context.
 * Provides plan-specific database operations.
 */
@Injectable()
class PlanJourneyContext extends BaseJourneyContext implements IPlanJourneyContext {
  /**
   * Creates a new instance of PlanJourneyContext
   */
  constructor(
    prismaService: PrismaService,
    transactionService: TransactionService,
    errorHandler: DatabaseErrorHandlerService
  ) {
    super(JourneyType.PLAN, prismaService, transactionService, errorHandler);
  }

  /**
   * Process a plan-related gamification event.
   * 
   * @param event - The plan event to process
   * @returns Promise that resolves when the event is processed
   */
  async processPlanEvent(event: GamificationEvent): Promise<void> {
    this.logger.debug(`Processing plan event: ${event.type}`, { eventId: event.id });
    
    // Execute in a transaction to ensure data consistency
    await this.executeInTransaction(async (client) => {
      // Store the event
      await client.gamificationEvent.create({
        data: {
          id: event.id,
          userId: event.userId,
          type: event.type,
          journeyType: JourneyType.PLAN,
          payload: event.payload as any,
          timestamp: event.timestamp || new Date(),
          processed: false
        }
      });

      // Process the event based on its type
      switch (event.type) {
        case 'CLAIM_SUBMITTED':
          await this.processClaimEvent(event, client);
          break;
        case 'BENEFIT_UTILIZED':
          await this.processBenefitEvent(event, client);
          break;
        case 'PLAN_SELECTED':
          await this.processPlanSelectionEvent(event, client);
          break;
        default:
          this.logger.warn(`Unknown plan event type: ${event.type}`, { eventId: event.id });
      }

      // Mark the event as processed
      await client.gamificationEvent.update({
        where: { id: event.id },
        data: { processed: true, processedAt: new Date() }
      });
    });
  }

  /**
   * Get plan-specific achievements for a user.
   * 
   * @param userId - The ID of the user
   * @returns Promise that resolves to an array of plan achievements
   */
  async getPlanAchievements(userId: string): Promise<Achievement[]> {
    this.logger.debug(`Getting plan achievements for user: ${userId}`);
    
    return this.execute(async (client) => {
      const achievements = await client.achievement.findMany({
        where: {
          userId,
          journeyType: JourneyType.PLAN
        },
        include: {
          rule: true
        },
        orderBy: {
          achievedAt: 'desc'
        }
      });

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
    });
  }

  /**
   * Get plan-specific quests for a user.
   * 
   * @param userId - The ID of the user
   * @returns Promise that resolves to an array of plan quests
   */
  async getPlanQuests(userId: string): Promise<Quest[]> {
    this.logger.debug(`Getting plan quests for user: ${userId}`);
    
    return this.execute(async (client) => {
      const quests = await client.quest.findMany({
        where: {
          userId,
          journeyType: JourneyType.PLAN
        },
        include: {
          steps: {
            include: {
              rule: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

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
    });
  }

  /**
   * Process a claim event.
   * 
   * @param event - The claim event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processClaimEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing claim event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.PLAN,
        eventType: event.type,
        active: true
      }
    });

    // Process rules similar to health events
    // Implementation details omitted for brevity
  }

  /**
   * Process a benefit event.
   * 
   * @param event - The benefit event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processBenefitEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing benefit event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.PLAN,
        eventType: event.type,
        active: true
      }
    });

    // Process rules similar to health events
    // Implementation details omitted for brevity
  }

  /**
   * Process a plan selection event.
   * 
   * @param event - The plan selection event
   * @param client - The transaction client
   * @returns Promise that resolves when the event is processed
   */
  private async processPlanSelectionEvent(
    event: GamificationEvent,
    client: Prisma.TransactionClient
  ): Promise<void> {
    this.logger.debug(`Processing plan selection event: ${event.id}`);
    
    // Find applicable rules for this event type
    const rules = await client.rule.findMany({
      where: {
        journeyType: JourneyType.PLAN,
        eventType: event.type,
        active: true
      }
    });

    // Process rules similar to health events
    // Implementation details omitted for brevity
  }
}

/**
 * Service that provides journey-specific database contexts for the gamification engine.
 * Enables isolation of database operations by journey (health, care, plan) while maintaining
 * consistent access patterns, allowing for journey-specific query optimizations and data segregation.
 */
@Injectable()
export class JourneyContextService implements IJourneyContextFactory {
  private readonly logger = new Logger(JourneyContextService.name);
  private readonly contextMap: Map<JourneyType, IJourneyContext>;

  /**
   * Creates a new instance of JourneyContextService
   * 
   * @param prismaService - Service for database access
   * @param transactionService - Service for transaction management
   * @param errorHandler - Service for handling database errors
   */
  constructor(
    private readonly prismaService: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly errorHandler: DatabaseErrorHandlerService
  ) {
    // Initialize journey contexts
    this.contextMap = new Map<JourneyType, IJourneyContext>();
    this.contextMap.set(
      JourneyType.HEALTH,
      new HealthJourneyContext(prismaService, transactionService, errorHandler)
    );
    this.contextMap.set(
      JourneyType.CARE,
      new CareJourneyContext(prismaService, transactionService, errorHandler)
    );
    this.contextMap.set(
      JourneyType.PLAN,
      new PlanJourneyContext(prismaService, transactionService, errorHandler)
    );

    this.logger.log('Journey context service initialized');
  }

  /**
   * Get a journey context for the specified journey type.
   * 
   * @param journeyType - The type of journey to get a context for
   * @returns The journey context for the specified journey type
   */
  getContext(journeyType: JourneyType): IJourneyContext {
    const context = this.contextMap.get(journeyType);
    if (!context) {
      throw new Error(`Journey context not found for journey type: ${journeyType}`);
    }
    return context;
  }

  /**
   * Get a health journey context.
   * 
   * @returns The health journey context
   */
  getHealthContext(): IHealthJourneyContext {
    return this.contextMap.get(JourneyType.HEALTH) as IHealthJourneyContext;
  }

  /**
   * Get a care journey context.
   * 
   * @returns The care journey context
   */
  getCareContext(): ICareJourneyContext {
    return this.contextMap.get(JourneyType.CARE) as ICareJourneyContext;
  }

  /**
   * Get a plan journey context.
   * 
   * @returns The plan journey context
   */
  getPlanContext(): IPlanJourneyContext {
    return this.contextMap.get(JourneyType.PLAN) as IPlanJourneyContext;
  }

  /**
   * Execute a function across all journey contexts.
   * 
   * @param fn - The function to execute for each journey context
   * @returns Promise that resolves to an array of results, one for each journey context
   */
  async executeAcrossJourneys<T>(
    fn: (context: IJourneyContext) => Promise<T>
  ): Promise<Record<JourneyType, T>> {
    this.logger.debug('Executing operation across all journey contexts');
    
    const results: Partial<Record<JourneyType, T>> = {};
    const errors: Record<JourneyType, Error> = {} as Record<JourneyType, Error>;
    
    // Execute the function for each journey context
    await Promise.all(
      Array.from(this.contextMap.entries()).map(async ([journeyType, context]) => {
        try {
          results[journeyType] = await fn(context);
        } catch (error) {
          this.logger.error(`Error executing operation for journey ${journeyType}`, {
            error: error.message,
            stack: error.stack,
            journeyType
          });
          errors[journeyType] = this.errorHandler.handleError(error, {
            journeyType,
            operation: 'executeAcrossJourneys'
          });
        }
      })
    );
    
    // Check if any errors occurred
    const errorJourneys = Object.keys(errors);
    if (errorJourneys.length > 0) {
      this.logger.error(`Errors occurred in ${errorJourneys.length} journey contexts`, {
        errorJourneys
      });
      
      // If all journeys failed, throw the first error
      if (errorJourneys.length === this.contextMap.size) {
        throw errors[errorJourneys[0] as unknown as JourneyType];
      }
    }
    
    return results as Record<JourneyType, T>;
  }

  /**
   * Process a gamification event in the appropriate journey context.
   * 
   * @param event - The event to process
   * @returns Promise that resolves when the event is processed
   */
  async processEvent(event: GamificationEvent): Promise<void> {
    this.logger.debug(`Processing event: ${event.type}`, { eventId: event.id });
    
    // Determine the journey type from the event
    const journeyType = event.journeyType || this.determineJourneyTypeFromEvent(event);
    
    // Get the appropriate journey context
    const context = this.getContext(journeyType);
    
    // Process the event in the appropriate journey context
    switch (journeyType) {
      case JourneyType.HEALTH:
        await (context as IHealthJourneyContext).processHealthEvent(event);
        break;
      case JourneyType.CARE:
        await (context as ICareJourneyContext).processCareEvent(event);
        break;
      case JourneyType.PLAN:
        await (context as IPlanJourneyContext).processPlanEvent(event);
        break;
      default:
        throw new Error(`Unsupported journey type: ${journeyType}`);
    }
  }

  /**
   * Determine the journey type from an event based on its type.
   * 
   * @param event - The event to determine the journey type for
   * @returns The determined journey type
   */
  private determineJourneyTypeFromEvent(event: GamificationEvent): JourneyType {
    const eventType = event.type.toLowerCase();
    
    // Determine journey type based on event type prefix or content
    if (eventType.startsWith('health_') || 
        eventType.includes('metric') || 
        eventType.includes('device')) {
      return JourneyType.HEALTH;
    }
    
    if (eventType.startsWith('care_') || 
        eventType.includes('appointment') || 
        eventType.includes('telemedicine') || 
        eventType.includes('medication')) {
      return JourneyType.CARE;
    }
    
    if (eventType.startsWith('plan_') || 
        eventType.includes('claim') || 
        eventType.includes('benefit') || 
        eventType.includes('coverage')) {
      return JourneyType.PLAN;
    }
    
    // Default to health if we can't determine
    this.logger.warn(`Could not determine journey type for event: ${event.type}, defaulting to HEALTH`, {
      eventId: event.id
    });
    return JourneyType.HEALTH;
  }
}