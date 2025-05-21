/**
 * @file plan-journey.consumer.ts
 * @description Kafka consumer that processes reward-related events from the Plan Journey service.
 * Handles claim submissions, benefit utilization, plan selection/comparison, and reward redemption events.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

import { LoggerService } from '@austa/logging';
import { BaseError, ErrorType } from '@austa/errors';
import { JourneyType } from '@austa/interfaces/gamification';

import { DlqService } from '../../common/kafka/dlq.service';
import { RewardsService } from '../rewards.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { EventProcessingError } from '../../common/exceptions/event-processing.error';
import { BaseConsumer } from './base.consumer';
import {
  RewardEventType,
  PlanJourney,
  isValidRewardEvent,
  migrateRewardEvent,
} from './reward-events.types';

/**
 * Consumer options specific to the Plan Journey
 */
const PLAN_JOURNEY_CONSUMER_OPTIONS = {
  groupId: 'gamification-plan-rewards-consumer',
  topics: ['plan.reward.events', 'plan.journey.events'],
  maxRetries: 5,
  initialRetryDelay: 1000,
  maxRetryDelay: 60000,
  jitterFactor: 0.1,
};

/**
 * Kafka consumer that processes reward-related events from the Plan Journey service.
 * Handles claim submissions, benefit utilization, plan selection/comparison, and reward redemption events.
 * Extends BaseConsumer with plan-specific reward processing logic.
 */
@Injectable()
export class PlanJourneyConsumer extends BaseConsumer {
  private readonly logger = new Logger(PlanJourneyConsumer.name);

  /**
   * Creates a new PlanJourneyConsumer instance
   * 
   * @param kafkaClient - Kafka client for message consumption
   * @param rewardsService - Service for reward management
   * @param profilesService - Service for user profile management
   * @param dlqService - Dead letter queue service for failed messages
   * @param loggerService - Logger service for structured logging
   * @param configService - Configuration service for consumer settings
   */
  constructor(
    protected readonly kafkaClient: Kafka,
    protected readonly rewardsService: RewardsService,
    protected readonly profilesService: ProfilesService,
    protected readonly dlqService: DlqService,
    protected readonly loggerService: LoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(
      kafkaClient,
      rewardsService,
      dlqService,
      loggerService,
      {
        ...PLAN_JOURNEY_CONSUMER_OPTIONS,
        // Allow overriding default options from config
        maxRetries: configService.get<number>('gamificationEngine.kafka.planJourney.maxRetries', PLAN_JOURNEY_CONSUMER_OPTIONS.maxRetries),
        initialRetryDelay: configService.get<number>('gamificationEngine.kafka.planJourney.retryDelay', PLAN_JOURNEY_CONSUMER_OPTIONS.initialRetryDelay),
        topics: configService.get<string[]>('gamificationEngine.kafka.planJourney.topics', PLAN_JOURNEY_CONSUMER_OPTIONS.topics),
      }
    );
  }

  /**
   * Processes Plan Journey events and distributes rewards accordingly
   * 
   * @param payload - The event payload to process
   * @param correlationId - Correlation ID for tracing
   */
  protected async processEvent(payload: any, correlationId: string): Promise<void> {
    try {
      // Validate the event structure
      if (!isValidRewardEvent(payload)) {
        throw new EventProcessingError(
          'Invalid Plan Journey event format',
          ErrorType.VALIDATION_ERROR,
          { correlationId, eventType: payload?.type }
        );
      }

      // Migrate event to latest version if needed
      const event = migrateRewardEvent(payload);

      // Process based on event type
      switch (event.type) {
        case RewardEventType.REWARD_GRANTED:
          await this.processRewardGrantedEvent(event, correlationId);
          break;

        case RewardEventType.REWARD_REDEEMED:
          await this.processRewardRedeemedEvent(event, correlationId);
          break;

        default:
          // For other event types, check if they are Plan Journey specific events
          await this.processPlanJourneySpecificEvent(event, correlationId);
      }

      this.loggerService.debug(
        `Successfully processed Plan Journey event: ${event.type}`,
        { correlationId, eventType: event.type, userId: event.payload.userId }
      );
    } catch (error) {
      const baseError = error instanceof BaseError
        ? error
        : new EventProcessingError(
          `Error processing Plan Journey event: ${error.message}`,
          ErrorType.SYSTEM_ERROR,
          { correlationId, cause: error }
        );

      this.loggerService.error(
        `Failed to process Plan Journey event: ${baseError.message}`,
        baseError.stack,
        { correlationId, errorType: baseError.type, errorContext: baseError.context }
      );

      throw baseError;
    }
  }

  /**
   * Processes reward granted events from the Plan Journey
   * 
   * @param event - The reward granted event
   * @param correlationId - Correlation ID for tracing
   */
  private async processRewardGrantedEvent(event: any, correlationId: string): Promise<void> {
    const { userId, rewardId, journey } = event.payload;

    // Verify this is a Plan Journey event
    if (journey !== JourneyType.PLAN && journey !== JourneyType.GLOBAL) {
      this.loggerService.warn(
        `Received non-Plan Journey reward event in Plan Journey consumer`,
        { correlationId, journey, eventType: event.type }
      );
      return;
    }

    // Grant the reward to the user
    await this.rewardsService.grantReward(userId, rewardId);

    this.loggerService.log(
      `Granted reward ${rewardId} to user ${userId} from Plan Journey`,
      { correlationId, rewardId, userId, journey }
    );
  }

  /**
   * Processes reward redeemed events from the Plan Journey
   * 
   * @param event - The reward redeemed event
   * @param correlationId - Correlation ID for tracing
   */
  private async processRewardRedeemedEvent(event: any, correlationId: string): Promise<void> {
    const { userId, rewardId, journey, redemptionStatus } = event.payload;

    // Verify this is a Plan Journey event
    if (journey !== JourneyType.PLAN && journey !== JourneyType.GLOBAL) {
      this.loggerService.warn(
        `Received non-Plan Journey reward redemption event in Plan Journey consumer`,
        { correlationId, journey, eventType: event.type }
      );
      return;
    }

    // Update the reward redemption status
    // Implementation depends on how redemptions are tracked in the system
    this.loggerService.log(
      `Processed reward redemption for user ${userId}, reward ${rewardId} with status ${redemptionStatus}`,
      { correlationId, rewardId, userId, journey, redemptionStatus }
    );

    // Additional logic for handling redemptions could be added here
  }

  /**
   * Processes Plan Journey specific events that may trigger rewards
   * 
   * @param event - The Plan Journey specific event
   * @param correlationId - Correlation ID for tracing
   */
  private async processPlanJourneySpecificEvent(event: any, correlationId: string): Promise<void> {
    // Extract common fields from the payload
    const { userId, journey } = event.payload;

    // Verify this is a Plan Journey event
    if (journey !== JourneyType.PLAN) {
      this.loggerService.warn(
        `Received non-Plan Journey event in Plan Journey consumer`,
        { correlationId, journey, eventType: event.type }
      );
      return;
    }

    // Process based on the specific event payload type
    if (this.isClaimSubmissionEvent(event)) {
      await this.processClaimSubmissionEvent(event, correlationId);
    } else if (this.isBenefitUtilizationEvent(event)) {
      await this.processBenefitUtilizationEvent(event, correlationId);
    } else if (this.isPlanSelectionEvent(event)) {
      await this.processPlanSelectionEvent(event, correlationId);
    } else {
      this.loggerService.warn(
        `Unhandled Plan Journey event type: ${event.type}`,
        { correlationId, eventType: event.type, userId }
      );
    }
  }

  /**
   * Processes claim submission events and grants appropriate rewards
   * 
   * @param event - The claim submission event
   * @param correlationId - Correlation ID for tracing
   */
  private async processClaimSubmissionEvent(event: PlanJourney.IClaimSubmissionRewardEvent, correlationId: string): Promise<void> {
    const { userId, claimId, claimType, totalClaimsSubmitted } = event.payload;

    this.loggerService.log(
      `Processing claim submission event for user ${userId}, claim ${claimId}`,
      { correlationId, userId, claimId, claimType, totalClaimsSubmitted }
    );

    // Check for first-time claim submission
    if (totalClaimsSubmitted === 1) {
      // Grant first claim submission reward
      // This would be a predefined reward in the system
      const firstClaimRewardId = this.configService.get<string>('gamificationEngine.rewards.firstClaimSubmission');
      if (firstClaimRewardId) {
        await this.rewardsService.grantReward(userId, firstClaimRewardId);
        this.loggerService.log(
          `Granted first claim submission reward to user ${userId}`,
          { correlationId, userId, rewardId: firstClaimRewardId }
        );
      }
    }

    // Check for milestone achievements (e.g., 5, 10, 25 claims)
    const milestones = this.configService.get<Record<number, string>>('gamificationEngine.rewards.claimMilestones', {
      5: 'claim-milestone-5',
      10: 'claim-milestone-10',
      25: 'claim-milestone-25',
    });

    // Check if the current count matches any milestone
    if (milestones[totalClaimsSubmitted]) {
      const milestoneRewardId = milestones[totalClaimsSubmitted];
      await this.rewardsService.grantReward(userId, milestoneRewardId);
      this.loggerService.log(
        `Granted claim milestone reward for ${totalClaimsSubmitted} claims to user ${userId}`,
        { correlationId, userId, rewardId: milestoneRewardId, milestone: totalClaimsSubmitted }
      );
    }

    // Grant XP for claim submission
    const claimSubmissionXp = this.configService.get<number>('gamificationEngine.xp.claimSubmission', 10);
    await this.profilesService.addXp(userId, claimSubmissionXp);
    this.loggerService.log(
      `Added ${claimSubmissionXp} XP to user ${userId} for claim submission`,
      { correlationId, userId, xp: claimSubmissionXp }
    );
  }

  /**
   * Processes benefit utilization events and grants appropriate rewards
   * 
   * @param event - The benefit utilization event
   * @param correlationId - Correlation ID for tracing
   */
  private async processBenefitUtilizationEvent(event: PlanJourney.IBenefitUtilizationRewardEvent, correlationId: string): Promise<void> {
    const { userId, benefitId, benefitType, totalBenefitsUtilized } = event.payload;

    this.loggerService.log(
      `Processing benefit utilization event for user ${userId}, benefit ${benefitId}`,
      { correlationId, userId, benefitId, benefitType, totalBenefitsUtilized }
    );

    // Check for first-time benefit utilization
    if (totalBenefitsUtilized === 1) {
      // Grant first benefit utilization reward
      const firstBenefitRewardId = this.configService.get<string>('gamificationEngine.rewards.firstBenefitUtilization');
      if (firstBenefitRewardId) {
        await this.rewardsService.grantReward(userId, firstBenefitRewardId);
        this.loggerService.log(
          `Granted first benefit utilization reward to user ${userId}`,
          { correlationId, userId, rewardId: firstBenefitRewardId }
        );
      }
    }

    // Check for benefit type-specific rewards
    const benefitTypeRewards = this.configService.get<Record<string, string>>('gamificationEngine.rewards.benefitTypes', {});
    if (benefitTypeRewards[benefitType]) {
      const typeRewardId = benefitTypeRewards[benefitType];
      await this.rewardsService.grantReward(userId, typeRewardId);
      this.loggerService.log(
        `Granted benefit type-specific reward for ${benefitType} to user ${userId}`,
        { correlationId, userId, rewardId: typeRewardId, benefitType }
      );
    }

    // Grant XP for benefit utilization
    const benefitUtilizationXp = this.configService.get<number>('gamificationEngine.xp.benefitUtilization', 15);
    await this.profilesService.addXp(userId, benefitUtilizationXp);
    this.loggerService.log(
      `Added ${benefitUtilizationXp} XP to user ${userId} for benefit utilization`,
      { correlationId, userId, xp: benefitUtilizationXp }
    );
  }

  /**
   * Processes plan selection events and grants appropriate rewards
   * 
   * @param event - The plan selection event
   * @param correlationId - Correlation ID for tracing
   */
  private async processPlanSelectionEvent(event: PlanJourney.IPlanSelectionRewardEvent, correlationId: string): Promise<void> {
    const { userId, planId, planType, isFirstSelection } = event.payload;

    this.loggerService.log(
      `Processing plan selection event for user ${userId}, plan ${planId}`,
      { correlationId, userId, planId, planType, isFirstSelection }
    );

    // Check for first-time plan selection
    if (isFirstSelection) {
      // Grant first plan selection reward
      const firstPlanRewardId = this.configService.get<string>('gamificationEngine.rewards.firstPlanSelection');
      if (firstPlanRewardId) {
        await this.rewardsService.grantReward(userId, firstPlanRewardId);
        this.loggerService.log(
          `Granted first plan selection reward to user ${userId}`,
          { correlationId, userId, rewardId: firstPlanRewardId }
        );
      }
    }

    // Check for plan type-specific rewards
    const planTypeRewards = this.configService.get<Record<string, string>>('gamificationEngine.rewards.planTypes', {});
    if (planTypeRewards[planType]) {
      const typeRewardId = planTypeRewards[planType];
      await this.rewardsService.grantReward(userId, typeRewardId);
      this.loggerService.log(
        `Granted plan type-specific reward for ${planType} to user ${userId}`,
        { correlationId, userId, rewardId: typeRewardId, planType }
      );
    }

    // Grant XP for plan selection
    const planSelectionXp = this.configService.get<number>('gamificationEngine.xp.planSelection', 20);
    await this.profilesService.addXp(userId, planSelectionXp);
    this.loggerService.log(
      `Added ${planSelectionXp} XP to user ${userId} for plan selection`,
      { correlationId, userId, xp: planSelectionXp }
    );
  }

  /**
   * Type guard to check if an event is a claim submission event
   * 
   * @param event - The event to check
   * @returns True if the event is a claim submission event
   */
  private isClaimSubmissionEvent(event: any): event is PlanJourney.IClaimSubmissionRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'claimId' in event.payload &&
      'claimType' in event.payload &&
      'totalClaimsSubmitted' in event.payload
    );
  }

  /**
   * Type guard to check if an event is a benefit utilization event
   * 
   * @param event - The event to check
   * @returns True if the event is a benefit utilization event
   */
  private isBenefitUtilizationEvent(event: any): event is PlanJourney.IBenefitUtilizationRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'benefitId' in event.payload &&
      'benefitType' in event.payload &&
      'totalBenefitsUtilized' in event.payload
    );
  }

  /**
   * Type guard to check if an event is a plan selection event
   * 
   * @param event - The event to check
   * @returns True if the event is a plan selection event
   */
  private isPlanSelectionEvent(event: any): event is PlanJourney.IPlanSelectionRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'planId' in event.payload &&
      'planType' in event.payload &&
      'isFirstSelection' in event.payload
    );
  }
}