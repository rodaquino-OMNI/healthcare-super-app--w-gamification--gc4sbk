import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { LOGGER_SERVICE } from '@app/shared/logging/logger.constants';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { RewardsService } from '../rewards.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { AchievementsService } from '../../achievements/achievements.service';
import { BaseConsumer } from './base.consumer';
import { DlqService } from '../../common/kafka/dlq.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { IBaseEvent, IEventResponse } from '../../events/interfaces';
import { EventErrorCategory } from '../../common/enums/event-error-category.enum';
import { JourneyType } from '@austa/interfaces/common/dto';
import {
  IRewardEvent,
  RewardEventType,
  PlanRewardTriggeredPayload,
  isPlanRewardTriggeredPayload,
  validateRewardEvent
} from './reward-events.types';

/**
 * Kafka consumer that processes reward-related events from the Plan Journey service.
 * Handles claim submissions, benefit utilization, plan selection/comparison, and reward redemption events.
 * Extends BaseConsumer with plan-specific reward processing logic.
 *
 * This consumer is responsible for:
 * - Processing claim submission reward events
 * - Handling benefit utilization reward distribution
 * - Managing plan selection reward events
 * - Processing reward redemption events
 * - Integrating with the cross-journey achievement system
 */
@Injectable()
export class PlanJourneyConsumer extends BaseConsumer {
  /**
   * Creates a new instance of the PlanJourneyConsumer
   * 
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for structured logging
   * @param tracingService - Service for distributed tracing
   * @param configService - Service for accessing configuration
   * @param rewardsService - Service for managing rewards
   * @param profilesService - Service for managing user profiles
   * @param achievementsService - Service for managing achievements
   * @param dlqService - Service for managing the dead letter queue
   * @param metricsService - Service for recording metrics
   */
  constructor(
    private readonly kafkaService: KafkaService,
    @Inject(LOGGER_SERVICE) private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
    private readonly configService: ConfigService,
    private readonly rewardsService: RewardsService,
    private readonly profilesService: ProfilesService,
    private readonly achievementsService: AchievementsService,
    private readonly dlqService: DlqService,
    private readonly metricsService: MetricsService,
  ) {
    super(
      kafkaService,
      loggerService,
      tracingService,
      configService,
      achievementsService,
      profilesService,
      null, // RulesService not needed for reward consumers
      dlqService,
      metricsService,
      {
        topic: configService.get<string>('KAFKA_PLAN_REWARD_TOPICS', 'plan-reward-events'),
        groupId: configService.get<string>('KAFKA_CONSUMER_GROUP_PLAN_REWARDS', 'gamification-plan-rewards'),
        maxRetries: configService.get<number>('KAFKA_MAX_RETRIES', 3),
        initialRetryDelay: configService.get<number>('KAFKA_INITIAL_RETRY_DELAY', 1000),
        maxRetryDelay: configService.get<number>('KAFKA_MAX_RETRY_DELAY', 30000),
        useJitter: configService.get<boolean>('KAFKA_USE_RETRY_JITTER', true),
      }
    );
  }

  /**
   * Processes a plan journey reward event.
   * Validates the event, determines the event type, and delegates to the appropriate handler.
   * 
   * @param event - The event to process
   * @returns A promise that resolves to the event processing result
   */
  protected async processEvent(event: IBaseEvent): Promise<IEventResponse> {
    // Validate that this is a reward event
    if (!this.isSupportedEvent(event)) {
      throw new Error(`Unsupported event type: ${event.type}`);
    }

    const rewardEvent = event as IRewardEvent;
    
    // Validate the reward event structure
    try {
      validateRewardEvent(rewardEvent);
    } catch (error) {
      this.loggerService.error(
        `Invalid reward event structure: ${error.message}`,
        { eventId: rewardEvent.eventId, eventType: rewardEvent.type },
        'PlanJourneyConsumer'
      );
      
      return {
        success: false,
        error: `Invalid reward event structure: ${error.message}`,
        errorCategory: EventErrorCategory.VALIDATION,
      };
    }

    // Process the event based on its type
    switch (rewardEvent.type) {
      case RewardEventType.PLAN_CLAIM_REWARD:
        return this.processClaimReward(rewardEvent);
        
      case RewardEventType.PLAN_BENEFIT_REWARD:
        return this.processBenefitReward(rewardEvent);
        
      case RewardEventType.PLAN_SELECTION_REWARD:
        return this.processPlanSelectionReward(rewardEvent);
        
      case RewardEventType.PLAN_DOCUMENT_REWARD:
        return this.processDocumentReward(rewardEvent);
        
      case RewardEventType.REWARD_GRANTED:
      case RewardEventType.REWARD_CLAIMED:
      case RewardEventType.REWARD_EXPIRED:
      case RewardEventType.REWARD_REVOKED:
        return this.processRewardLifecycleEvent(rewardEvent);
        
      default:
        this.loggerService.warn(
          `Unhandled plan reward event type: ${rewardEvent.type}`,
          { eventId: rewardEvent.eventId },
          'PlanJourneyConsumer'
        );
        
        return {
          success: false,
          error: `Unhandled plan reward event type: ${rewardEvent.type}`,
          errorCategory: EventErrorCategory.VALIDATION,
        };
    }
  }

  /**
   * Checks if an event is supported by this consumer.
   * 
   * @param event - The event to check
   * @returns True if the event is supported, false otherwise
   */
  protected isSupportedEvent(event: IBaseEvent): boolean {
    // Check if this is a reward event
    if (!('type' in event && 'journey' in event && 'payload' in event)) {
      return false;
    }

    const rewardEvent = event as IRewardEvent;
    
    // Check if this is a plan journey event or a general reward lifecycle event
    const isPlanJourneyEvent = rewardEvent.journey === JourneyType.PLAN;
    const isPlanRewardType = [
      RewardEventType.PLAN_CLAIM_REWARD,
      RewardEventType.PLAN_BENEFIT_REWARD,
      RewardEventType.PLAN_SELECTION_REWARD,
      RewardEventType.PLAN_DOCUMENT_REWARD,
    ].includes(rewardEvent.type as RewardEventType);
    
    const isRewardLifecycleEvent = [
      RewardEventType.REWARD_GRANTED,
      RewardEventType.REWARD_CLAIMED,
      RewardEventType.REWARD_EXPIRED,
      RewardEventType.REWARD_REVOKED,
    ].includes(rewardEvent.type as RewardEventType);
    
    return (isPlanJourneyEvent && isPlanRewardType) || isRewardLifecycleEvent;
  }

  /**
   * Maps an event to the appropriate payload type based on the event type.
   * 
   * @param event - The event to map
   * @returns The typed event payload
   */
  protected mapEventToPayload<T>(event: IBaseEvent): T {
    return (event as IRewardEvent).payload as T;
  }

  /**
   * Processes a claim submission reward event.
   * Awards rewards to users who submit insurance claims.
   * 
   * @param event - The claim reward event
   * @returns The event processing result
   */
  private async processClaimReward(event: IRewardEvent): Promise<IEventResponse> {
    try {
      const payload = this.mapEventToPayload<PlanRewardTriggeredPayload>(event);
      
      if (!isPlanRewardTriggeredPayload(payload)) {
        return {
          success: false,
          error: 'Invalid plan reward payload',
          errorCategory: EventErrorCategory.VALIDATION,
        };
      }
      
      this.loggerService.log(
        `Processing claim reward for user ${event.userId}`,
        { 
          eventId: event.eventId, 
          claimId: payload.planContext.claimId,
          xpValue: payload.xpValue
        },
        'PlanJourneyConsumer'
      );
      
      // Find or create user profile
      const profile = await this.profilesService.findOrCreateProfile(event.userId);
      
      // Grant the reward if it should be granted
      if (payload.granted) {
        // Find the reward by ID
        const reward = await this.rewardsService.findOne(payload.rewardId);
        
        // Grant the reward to the user
        const userReward = await this.rewardsService.grantReward(profile.id, reward.id);
        
        // Check if this claim reward triggers any achievements
        await this.achievementsService.processJourneyEvent({
          userId: event.userId,
          journeyType: JourneyType.PLAN,
          eventType: 'claim_submitted',
          eventData: {
            claimId: payload.planContext.claimId,
            rewardId: payload.rewardId,
            xpValue: payload.xpValue,
            timestamp: event.timestamp,
          },
        });
        
        return {
          success: true,
          points: payload.xpValue,
          rewards: [userReward.id],
        };
      }
      
      // If the reward shouldn't be granted, just process the event for achievements
      await this.achievementsService.processJourneyEvent({
        userId: event.userId,
        journeyType: JourneyType.PLAN,
        eventType: 'claim_submitted',
        eventData: {
          claimId: payload.planContext.claimId,
          timestamp: event.timestamp,
        },
      });
      
      return {
        success: true,
        points: 0,
        message: 'Event processed for achievements, but no reward granted',
      };
    } catch (error) {
      this.loggerService.error(
        `Error processing claim reward: ${error.message}`,
        { eventId: event.eventId, stack: error.stack },
        'PlanJourneyConsumer'
      );
      
      throw error;
    }
  }

  /**
   * Processes a benefit utilization reward event.
   * Awards rewards to users who utilize their insurance benefits.
   * 
   * @param event - The benefit reward event
   * @returns The event processing result
   */
  private async processBenefitReward(event: IRewardEvent): Promise<IEventResponse> {
    try {
      const payload = this.mapEventToPayload<PlanRewardTriggeredPayload>(event);
      
      if (!isPlanRewardTriggeredPayload(payload)) {
        return {
          success: false,
          error: 'Invalid plan reward payload',
          errorCategory: EventErrorCategory.VALIDATION,
        };
      }
      
      this.loggerService.log(
        `Processing benefit reward for user ${event.userId}`,
        { 
          eventId: event.eventId, 
          benefitId: payload.planContext.benefitId,
          xpValue: payload.xpValue
        },
        'PlanJourneyConsumer'
      );
      
      // Find or create user profile
      const profile = await this.profilesService.findOrCreateProfile(event.userId);
      
      // Grant the reward if it should be granted
      if (payload.granted) {
        // Find the reward by ID
        const reward = await this.rewardsService.findOne(payload.rewardId);
        
        // Grant the reward to the user
        const userReward = await this.rewardsService.grantReward(profile.id, reward.id);
        
        // Check if this benefit utilization triggers any achievements
        await this.achievementsService.processJourneyEvent({
          userId: event.userId,
          journeyType: JourneyType.PLAN,
          eventType: 'benefit_utilized',
          eventData: {
            benefitId: payload.planContext.benefitId,
            rewardId: payload.rewardId,
            xpValue: payload.xpValue,
            timestamp: event.timestamp,
          },
        });
        
        return {
          success: true,
          points: payload.xpValue,
          rewards: [userReward.id],
        };
      }
      
      // If the reward shouldn't be granted, just process the event for achievements
      await this.achievementsService.processJourneyEvent({
        userId: event.userId,
        journeyType: JourneyType.PLAN,
        eventType: 'benefit_utilized',
        eventData: {
          benefitId: payload.planContext.benefitId,
          timestamp: event.timestamp,
        },
      });
      
      return {
        success: true,
        points: 0,
        message: 'Event processed for achievements, but no reward granted',
      };
    } catch (error) {
      this.loggerService.error(
        `Error processing benefit reward: ${error.message}`,
        { eventId: event.eventId, stack: error.stack },
        'PlanJourneyConsumer'
      );
      
      throw error;
    }
  }

  /**
   * Processes a plan selection reward event.
   * Awards rewards to users who select or compare insurance plans.
   * 
   * @param event - The plan selection reward event
   * @returns The event processing result
   */
  private async processPlanSelectionReward(event: IRewardEvent): Promise<IEventResponse> {
    try {
      const payload = this.mapEventToPayload<PlanRewardTriggeredPayload>(event);
      
      if (!isPlanRewardTriggeredPayload(payload)) {
        return {
          success: false,
          error: 'Invalid plan reward payload',
          errorCategory: EventErrorCategory.VALIDATION,
        };
      }
      
      this.loggerService.log(
        `Processing plan selection reward for user ${event.userId}`,
        { 
          eventId: event.eventId, 
          planId: payload.planContext.planId,
          xpValue: payload.xpValue
        },
        'PlanJourneyConsumer'
      );
      
      // Find or create user profile
      const profile = await this.profilesService.findOrCreateProfile(event.userId);
      
      // Grant the reward if it should be granted
      if (payload.granted) {
        // Find the reward by ID
        const reward = await this.rewardsService.findOne(payload.rewardId);
        
        // Grant the reward to the user
        const userReward = await this.rewardsService.grantReward(profile.id, reward.id);
        
        // Check if this plan selection triggers any achievements
        await this.achievementsService.processJourneyEvent({
          userId: event.userId,
          journeyType: JourneyType.PLAN,
          eventType: 'plan_selected',
          eventData: {
            planId: payload.planContext.planId,
            rewardId: payload.rewardId,
            xpValue: payload.xpValue,
            timestamp: event.timestamp,
          },
        });
        
        return {
          success: true,
          points: payload.xpValue,
          rewards: [userReward.id],
        };
      }
      
      // If the reward shouldn't be granted, just process the event for achievements
      await this.achievementsService.processJourneyEvent({
        userId: event.userId,
        journeyType: JourneyType.PLAN,
        eventType: 'plan_selected',
        eventData: {
          planId: payload.planContext.planId,
          timestamp: event.timestamp,
        },
      });
      
      return {
        success: true,
        points: 0,
        message: 'Event processed for achievements, but no reward granted',
      };
    } catch (error) {
      this.loggerService.error(
        `Error processing plan selection reward: ${error.message}`,
        { eventId: event.eventId, stack: error.stack },
        'PlanJourneyConsumer'
      );
      
      throw error;
    }
  }

  /**
   * Processes a document reward event.
   * Awards rewards to users who upload or manage insurance documents.
   * 
   * @param event - The document reward event
   * @returns The event processing result
   */
  private async processDocumentReward(event: IRewardEvent): Promise<IEventResponse> {
    try {
      const payload = this.mapEventToPayload<PlanRewardTriggeredPayload>(event);
      
      if (!isPlanRewardTriggeredPayload(payload)) {
        return {
          success: false,
          error: 'Invalid plan reward payload',
          errorCategory: EventErrorCategory.VALIDATION,
        };
      }
      
      this.loggerService.log(
        `Processing document reward for user ${event.userId}`,
        { 
          eventId: event.eventId,
          documentType: payload.planContext.additionalData?.documentType,
          xpValue: payload.xpValue
        },
        'PlanJourneyConsumer'
      );
      
      // Find or create user profile
      const profile = await this.profilesService.findOrCreateProfile(event.userId);
      
      // Grant the reward if it should be granted
      if (payload.granted) {
        // Find the reward by ID
        const reward = await this.rewardsService.findOne(payload.rewardId);
        
        // Grant the reward to the user
        const userReward = await this.rewardsService.grantReward(profile.id, reward.id);
        
        // Check if this document upload triggers any achievements
        await this.achievementsService.processJourneyEvent({
          userId: event.userId,
          journeyType: JourneyType.PLAN,
          eventType: 'document_uploaded',
          eventData: {
            documentType: payload.planContext.additionalData?.documentType,
            rewardId: payload.rewardId,
            xpValue: payload.xpValue,
            timestamp: event.timestamp,
          },
        });
        
        return {
          success: true,
          points: payload.xpValue,
          rewards: [userReward.id],
        };
      }
      
      // If the reward shouldn't be granted, just process the event for achievements
      await this.achievementsService.processJourneyEvent({
        userId: event.userId,
        journeyType: JourneyType.PLAN,
        eventType: 'document_uploaded',
        eventData: {
          documentType: payload.planContext.additionalData?.documentType,
          timestamp: event.timestamp,
        },
      });
      
      return {
        success: true,
        points: 0,
        message: 'Event processed for achievements, but no reward granted',
      };
    } catch (error) {
      this.loggerService.error(
        `Error processing document reward: ${error.message}`,
        { eventId: event.eventId, stack: error.stack },
        'PlanJourneyConsumer'
      );
      
      throw error;
    }
  }

  /**
   * Processes a reward lifecycle event (granted, claimed, expired, revoked).
   * Updates the user's profile and triggers any relevant achievements.
   * 
   * @param event - The reward lifecycle event
   * @returns The event processing result
   */
  private async processRewardLifecycleEvent(event: IRewardEvent): Promise<IEventResponse> {
    try {
      this.loggerService.log(
        `Processing reward lifecycle event: ${event.type} for user ${event.userId}`,
        { eventId: event.eventId },
        'PlanJourneyConsumer'
      );
      
      // Find the user profile
      const profile = await this.profilesService.findOrCreateProfile(event.userId);
      
      // Process the event based on its type
      switch (event.type) {
        case RewardEventType.REWARD_GRANTED:
          // This is handled by the specific journey reward events
          return {
            success: true,
            message: 'Reward granted event processed',
          };
          
        case RewardEventType.REWARD_CLAIMED:
          // Update the reward status to claimed
          await this.rewardsService.claimReward(profile.id, event.payload.rewardId);
          
          // Check if claiming this reward triggers any achievements
          await this.achievementsService.processJourneyEvent({
            userId: event.userId,
            journeyType: JourneyType.PLAN,
            eventType: 'reward_claimed',
            eventData: {
              rewardId: event.payload.rewardId,
              timestamp: event.timestamp,
            },
          });
          
          return {
            success: true,
            message: 'Reward claimed successfully',
          };
          
        case RewardEventType.REWARD_EXPIRED:
          // Update the reward status to expired
          await this.rewardsService.expireReward(profile.id, event.payload.rewardId);
          
          return {
            success: true,
            message: 'Reward expired successfully',
          };
          
        case RewardEventType.REWARD_REVOKED:
          // Update the reward status to revoked
          await this.rewardsService.revokeReward(
            profile.id,
            event.payload.rewardId,
            event.payload.reason,
            event.payload.deductXp
          );
          
          return {
            success: true,
            message: 'Reward revoked successfully',
          };
          
        default:
          return {
            success: false,
            error: `Unhandled reward lifecycle event: ${event.type}`,
            errorCategory: EventErrorCategory.VALIDATION,
          };
      }
    } catch (error) {
      this.loggerService.error(
        `Error processing reward lifecycle event: ${error.message}`,
        { eventId: event.eventId, eventType: event.type, stack: error.stack },
        'PlanJourneyConsumer'
      );
      
      throw error;
    }
  }

  /**
   * Connects to Kafka and subscribes to the configured topics.
   * This method is called during module initialization.
   */
  async connect(): Promise<void> {
    try {
      const topics = this.configService.get<string[]>('KAFKA_PLAN_REWARD_TOPICS', [
        'plan-claim-rewards',
        'plan-benefit-rewards',
        'plan-selection-rewards',
        'plan-redemption-rewards',
      ]);
      
      this.loggerService.log(
        `Connecting to Kafka topics: ${topics.join(', ')}`,
        {},
        'PlanJourneyConsumer'
      );
      
      // Subscribe to all configured topics
      for (const topic of topics) {
        await this.kafkaService.consume(
          topic,
          this.options.groupId,
          this.processMessage.bind(this)
        );
      }
      
      this.loggerService.log(
        'Successfully connected to all plan reward topics',
        {},
        'PlanJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to connect to Kafka: ${error.message}`,
        { stack: error.stack },
        'PlanJourneyConsumer'
      );
      
      throw error;
    }
  }
}