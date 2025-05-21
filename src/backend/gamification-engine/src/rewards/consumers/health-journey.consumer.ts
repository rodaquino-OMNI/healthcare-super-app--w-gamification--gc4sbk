/**
 * @file health-journey.consumer.ts
 * @description Kafka consumer that processes reward-related events from the Health Journey service.
 * Handles health metric achievements, goal completions, device synchronization rewards, and health insight-based rewards.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';

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
  HealthJourney,
  isValidRewardEvent,
  migrateRewardEvent,
} from './reward-events.types';

/**
 * Consumer options specific to the Health Journey
 */
const HEALTH_JOURNEY_CONSUMER_OPTIONS = {
  groupId: 'gamification-health-rewards-consumer',
  topics: ['health.reward.events', 'health.journey.events'],
  maxRetries: 5,
  initialRetryDelay: 1000,
  maxRetryDelay: 60000,
  jitterFactor: 0.1,
};

/**
 * Kafka consumer that processes reward-related events from the Health Journey service.
 * Handles health metric achievements, goal completions, device synchronization rewards, and health insight-based rewards.
 * Extends BaseConsumer with health-specific reward processing logic.
 */
@Injectable()
export class HealthJourneyConsumer extends BaseConsumer {
  private readonly logger = new Logger(HealthJourneyConsumer.name);

  /**
   * Creates a new HealthJourneyConsumer instance
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
        ...HEALTH_JOURNEY_CONSUMER_OPTIONS,
        // Allow overriding default options from config
        maxRetries: configService.get<number>('gamificationEngine.kafka.healthJourney.maxRetries', HEALTH_JOURNEY_CONSUMER_OPTIONS.maxRetries),
        initialRetryDelay: configService.get<number>('gamificationEngine.kafka.healthJourney.retryDelay', HEALTH_JOURNEY_CONSUMER_OPTIONS.initialRetryDelay),
        topics: configService.get<string[]>('gamificationEngine.kafka.healthJourney.topics', HEALTH_JOURNEY_CONSUMER_OPTIONS.topics),
      }
    );
  }

  /**
   * Processes Health Journey events and distributes rewards accordingly
   * 
   * @param payload - The event payload to process
   * @param correlationId - Correlation ID for tracing
   */
  protected async processEvent(payload: any, correlationId: string): Promise<void> {
    try {
      // Validate the event structure
      if (!isValidRewardEvent(payload)) {
        throw new EventProcessingError(
          'Invalid Health Journey event format',
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
          // For other event types, check if they are Health Journey specific events
          await this.processHealthJourneySpecificEvent(event, correlationId);
      }

      this.loggerService.debug(
        `Successfully processed Health Journey event: ${event.type}`,
        { correlationId, eventType: event.type, userId: event.payload.userId }
      );
    } catch (error) {
      const baseError = error instanceof BaseError
        ? error
        : new EventProcessingError(
          `Error processing Health Journey event: ${error.message}`,
          ErrorType.SYSTEM_ERROR,
          { correlationId, cause: error }
        );

      this.loggerService.error(
        `Failed to process Health Journey event: ${baseError.message}`,
        baseError.stack,
        { correlationId, errorType: baseError.type, errorContext: baseError.context }
      );

      throw baseError;
    }
  }

  /**
   * Processes reward granted events from the Health Journey
   * 
   * @param event - The reward granted event
   * @param correlationId - Correlation ID for tracing
   */
  private async processRewardGrantedEvent(event: any, correlationId: string): Promise<void> {
    const { userId, rewardId, journey } = event.payload;

    // Verify this is a Health Journey event
    if (journey !== JourneyType.HEALTH && journey !== JourneyType.GLOBAL) {
      this.loggerService.warn(
        `Received non-Health Journey reward event in Health Journey consumer`,
        { correlationId, journey, eventType: event.type }
      );
      return;
    }

    // Grant the reward to the user
    await this.rewardsService.grantReward(userId, rewardId);

    this.loggerService.log(
      `Granted reward ${rewardId} to user ${userId} from Health Journey`,
      { correlationId, rewardId, userId, journey }
    );
  }

  /**
   * Processes reward redeemed events from the Health Journey
   * 
   * @param event - The reward redeemed event
   * @param correlationId - Correlation ID for tracing
   */
  private async processRewardRedeemedEvent(event: any, correlationId: string): Promise<void> {
    const { userId, rewardId, journey, redemptionStatus } = event.payload;

    // Verify this is a Health Journey event
    if (journey !== JourneyType.HEALTH && journey !== JourneyType.GLOBAL) {
      this.loggerService.warn(
        `Received non-Health Journey reward redemption event in Health Journey consumer`,
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
   * Processes Health Journey specific events that may trigger rewards
   * 
   * @param event - The Health Journey specific event
   * @param correlationId - Correlation ID for tracing
   */
  private async processHealthJourneySpecificEvent(event: any, correlationId: string): Promise<void> {
    // Extract common fields from the payload
    const { userId, journey } = event.payload;

    // Verify this is a Health Journey event
    if (journey !== JourneyType.HEALTH) {
      this.loggerService.warn(
        `Received non-Health Journey event in Health Journey consumer`,
        { correlationId, journey, eventType: event.type }
      );
      return;
    }

    // Process based on the specific event payload type
    if (this.isHealthMetricEvent(event)) {
      await this.processHealthMetricEvent(event, correlationId);
    } else if (this.isHealthGoalEvent(event)) {
      await this.processHealthGoalEvent(event, correlationId);
    } else if (this.isDeviceConnectionEvent(event)) {
      await this.processDeviceConnectionEvent(event, correlationId);
    } else if (this.isHealthInsightEvent(event)) {
      await this.processHealthInsightEvent(event, correlationId);
    } else {
      this.loggerService.warn(
        `Unhandled Health Journey event type: ${event.type}`,
        { correlationId, eventType: event.type, userId }
      );
    }
  }

  /**
   * Processes health metric events and grants appropriate rewards
   * 
   * @param event - The health metric event
   * @param correlationId - Correlation ID for tracing
   */
  private async processHealthMetricEvent(event: HealthJourney.IHealthMetricRewardEvent, correlationId: string): Promise<void> {
    const { userId, metricType, metricValue, metricUnit, isPersonalRecord } = event.payload;

    this.loggerService.log(
      `Processing health metric event for user ${userId}, metric ${metricType}`,
      { correlationId, userId, metricType, metricValue, metricUnit, isPersonalRecord }
    );

    // Check for first-time metric recording
    const firstMetricRecordingRewardId = this.configService.get<Record<string, string>>(
      'gamificationEngine.rewards.firstMetricRecording', 
      {}
    )[metricType];

    if (firstMetricRecordingRewardId) {
      // Check if this is the first time recording this metric type
      // This would require additional logic to track which metrics have been recorded
      // For simplicity, we'll assume the health service tracks this and only sends events for new metrics
      await this.rewardsService.grantReward(userId, firstMetricRecordingRewardId);
      this.loggerService.log(
        `Granted first metric recording reward for ${metricType} to user ${userId}`,
        { correlationId, userId, rewardId: firstMetricRecordingRewardId, metricType }
      );
    }

    // Check for personal record achievements
    if (isPersonalRecord) {
      const personalRecordRewardId = this.configService.get<Record<string, string>>(
        'gamificationEngine.rewards.personalRecords', 
        {}
      )[metricType];

      if (personalRecordRewardId) {
        await this.rewardsService.grantReward(userId, personalRecordRewardId);
        this.loggerService.log(
          `Granted personal record reward for ${metricType} to user ${userId}`,
          { correlationId, userId, rewardId: personalRecordRewardId, metricType, metricValue }
        );
      }
    }

    // Check for metric value thresholds
    const metricThresholds = this.configService.get<Record<string, Record<number, string>>>(
      'gamificationEngine.rewards.metricThresholds', 
      {}
    )[metricType] || {};

    // Find the highest threshold that the user has reached
    const thresholds = Object.keys(metricThresholds).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (metricValue >= threshold) {
        const thresholdRewardId = metricThresholds[threshold];
        
        // Check if user already has this threshold reward to avoid duplicates
        // This would require additional logic to track which thresholds have been awarded
        // For simplicity, we'll assume the health service tracks this and only sends events for new thresholds
        await this.rewardsService.grantReward(userId, thresholdRewardId);
        this.loggerService.log(
          `Granted metric threshold reward for ${metricType} >= ${threshold} to user ${userId}`,
          { correlationId, userId, rewardId: thresholdRewardId, metricType, threshold, metricValue }
        );
        break; // Only grant the highest threshold reward
      }
    }

    // Grant XP for metric recording
    const baseMetricXp = this.configService.get<Record<string, number>>(
      'gamificationEngine.xp.metricRecording', 
      {}
    )[metricType] || 5;

    // Add bonus XP for personal records
    const personalRecordBonus = isPersonalRecord ? 
      this.configService.get<number>('gamificationEngine.xp.personalRecordBonus', 10) : 0;
    
    const earnedXp = baseMetricXp + personalRecordBonus;
    
    // Add XP to user profile
    await this.addXpToProfile(userId, earnedXp);
    
    this.loggerService.log(
      `Added ${earnedXp} XP to user ${userId} for recording ${metricType}`,
      { correlationId, userId, xp: earnedXp, metricType, baseXp: baseMetricXp, personalRecordBonus }
    );
  }

  /**
   * Processes health goal events and grants appropriate rewards
   * 
   * @param event - The health goal event
   * @param correlationId - Correlation ID for tracing
   */
  private async processHealthGoalEvent(event: HealthJourney.IHealthGoalRewardEvent, correlationId: string): Promise<void> {
    const { userId, goalId, goalType, goalTarget, streak } = event.payload;

    this.loggerService.log(
      `Processing health goal event for user ${userId}, goal ${goalId}`,
      { correlationId, userId, goalId, goalType, goalTarget, streak }
    );

    // Check for first goal completion
    const firstGoalCompletionRewardId = this.configService.get<Record<string, string>>(
      'gamificationEngine.rewards.firstGoalCompletion', 
      {}
    )[goalType];

    if (firstGoalCompletionRewardId) {
      // Check if this is the first time completing this goal type
      // This would require additional logic to track which goals have been completed
      // For simplicity, we'll assume the health service tracks this and only sends events for new completions
      await this.rewardsService.grantReward(userId, firstGoalCompletionRewardId);
      this.loggerService.log(
        `Granted first goal completion reward for ${goalType} to user ${userId}`,
        { correlationId, userId, rewardId: firstGoalCompletionRewardId, goalType }
      );
    }

    // Check for streak milestones (e.g., 7, 30, 90 days)
    if (streak) {
      const streakMilestones = this.configService.get<Record<number, string>>(
        'gamificationEngine.rewards.goalStreakMilestones', 
        {
          7: 'goal-streak-7',
          30: 'goal-streak-30',
          90: 'goal-streak-90',
        }
      );

      // Check if the current streak matches any milestone
      if (streakMilestones[streak]) {
        const streakRewardId = streakMilestones[streak];
        await this.rewardsService.grantReward(userId, streakRewardId);
        this.loggerService.log(
          `Granted goal streak reward for ${streak} days to user ${userId}`,
          { correlationId, userId, rewardId: streakRewardId, streak }
        );
      }
    }

    // Check for goal type-specific rewards
    const goalTypeRewards = this.configService.get<Record<string, string>>(
      'gamificationEngine.rewards.goalTypes', 
      {}
    );
    
    if (goalTypeRewards[goalType]) {
      const typeRewardId = goalTypeRewards[goalType];
      await this.rewardsService.grantReward(userId, typeRewardId);
      this.loggerService.log(
        `Granted goal type-specific reward for ${goalType} to user ${userId}`,
        { correlationId, userId, rewardId: typeRewardId, goalType }
      );
    }

    // Grant XP for goal completion
    const baseGoalXp = this.configService.get<Record<string, number>>(
      'gamificationEngine.xp.goalCompletion', 
      {}
    )[goalType] || 20;

    // Add streak bonus if applicable
    const streakMultiplier = streak ? Math.min(streak / 7, 3) : 1; // Cap at 3x for 21+ day streaks
    const earnedXp = Math.round(baseGoalXp * streakMultiplier);
    
    // Add XP to user profile
    await this.addXpToProfile(userId, earnedXp);
    
    this.loggerService.log(
      `Added ${earnedXp} XP to user ${userId} for completing ${goalType} goal`,
      { correlationId, userId, xp: earnedXp, goalType, baseXp: baseGoalXp, streakMultiplier }
    );
  }

  /**
   * Processes device connection events and grants appropriate rewards
   * 
   * @param event - The device connection event
   * @param correlationId - Correlation ID for tracing
   */
  private async processDeviceConnectionEvent(event: HealthJourney.IDeviceConnectionRewardEvent, correlationId: string): Promise<void> {
    const { userId, deviceType, deviceId, totalDevicesConnected } = event.payload;

    this.loggerService.log(
      `Processing device connection event for user ${userId}, device ${deviceId}`,
      { correlationId, userId, deviceType, deviceId, totalDevicesConnected }
    );

    // Check for first device connection
    if (totalDevicesConnected === 1) {
      const firstDeviceRewardId = this.configService.get<string>('gamificationEngine.rewards.firstDeviceConnection');
      if (firstDeviceRewardId) {
        await this.rewardsService.grantReward(userId, firstDeviceRewardId);
        this.loggerService.log(
          `Granted first device connection reward to user ${userId}`,
          { correlationId, userId, rewardId: firstDeviceRewardId }
        );
      }
    }

    // Check for device type-specific rewards
    const deviceTypeRewards = this.configService.get<Record<string, string>>(
      'gamificationEngine.rewards.deviceTypes', 
      {}
    );
    
    if (deviceTypeRewards[deviceType]) {
      const typeRewardId = deviceTypeRewards[deviceType];
      await this.rewardsService.grantReward(userId, typeRewardId);
      this.loggerService.log(
        `Granted device type-specific reward for ${deviceType} to user ${userId}`,
        { correlationId, userId, rewardId: typeRewardId, deviceType }
      );
    }

    // Check for multiple device connection milestones
    const deviceMilestones = this.configService.get<Record<number, string>>(
      'gamificationEngine.rewards.deviceMilestones', 
      {
        3: 'device-milestone-3',
        5: 'device-milestone-5',
      }
    );

    // Check if the current count matches any milestone
    if (deviceMilestones[totalDevicesConnected]) {
      const milestoneRewardId = deviceMilestones[totalDevicesConnected];
      await this.rewardsService.grantReward(userId, milestoneRewardId);
      this.loggerService.log(
        `Granted device milestone reward for ${totalDevicesConnected} devices to user ${userId}`,
        { correlationId, userId, rewardId: milestoneRewardId, milestone: totalDevicesConnected }
      );
    }

    // Grant XP for device connection
    const deviceConnectionXp = this.configService.get<number>('gamificationEngine.xp.deviceConnection', 15);
    
    // Add XP to user profile
    await this.addXpToProfile(userId, deviceConnectionXp);
    
    this.loggerService.log(
      `Added ${deviceConnectionXp} XP to user ${userId} for connecting ${deviceType}`,
      { correlationId, userId, xp: deviceConnectionXp, deviceType }
    );
  }

  /**
   * Processes health insight events and grants appropriate rewards
   * 
   * @param event - The health insight event
   * @param correlationId - Correlation ID for tracing
   */
  private async processHealthInsightEvent(event: any, correlationId: string): Promise<void> {
    const { userId, insightId, insightType } = event.payload;

    this.loggerService.log(
      `Processing health insight event for user ${userId}, insight ${insightId}`,
      { correlationId, userId, insightId, insightType }
    );

    // Check for first insight generation
    const firstInsightRewardId = this.configService.get<Record<string, string>>(
      'gamificationEngine.rewards.firstInsight', 
      {}
    )[insightType];

    if (firstInsightRewardId) {
      // Check if this is the first time generating this insight type
      // This would require additional logic to track which insights have been generated
      // For simplicity, we'll assume the health service tracks this and only sends events for new insights
      await this.rewardsService.grantReward(userId, firstInsightRewardId);
      this.loggerService.log(
        `Granted first insight reward for ${insightType} to user ${userId}`,
        { correlationId, userId, rewardId: firstInsightRewardId, insightType }
      );
    }

    // Check for insight type-specific rewards
    const insightTypeRewards = this.configService.get<Record<string, string>>(
      'gamificationEngine.rewards.insightTypes', 
      {}
    );
    
    if (insightTypeRewards[insightType]) {
      const typeRewardId = insightTypeRewards[insightType];
      await this.rewardsService.grantReward(userId, typeRewardId);
      this.loggerService.log(
        `Granted insight type-specific reward for ${insightType} to user ${userId}`,
        { correlationId, userId, rewardId: typeRewardId, insightType }
      );
    }

    // Grant XP for insight generation
    const insightXp = this.configService.get<Record<string, number>>(
      'gamificationEngine.xp.insightGeneration', 
      {}
    )[insightType] || 10;
    
    // Add XP to user profile
    await this.addXpToProfile(userId, insightXp);
    
    this.loggerService.log(
      `Added ${insightXp} XP to user ${userId} for generating ${insightType} insight`,
      { correlationId, userId, xp: insightXp, insightType }
    );
  }

  /**
   * Helper method to add XP to a user's profile
   * 
   * @param userId - The user ID to add XP to
   * @param xpAmount - The amount of XP to add
   */
  private async addXpToProfile(userId: string, xpAmount: number): Promise<void> {
    try {
      // Get current profile
      const profile = await this.profilesService.findById(userId);
      
      // Calculate new XP total
      const newXpTotal = profile.xp + xpAmount;
      
      // Update profile with new XP
      await this.profilesService.update(userId, { xp: newXpTotal });
      
      // Check for level up
      const currentLevel = profile.level;
      const newLevel = this.calculateLevel(newXpTotal);
      
      if (newLevel > currentLevel) {
        // Level up!
        await this.profilesService.update(userId, { level: newLevel });
        
        this.loggerService.log(
          `User ${userId} leveled up from ${currentLevel} to ${newLevel}`,
          { userId, previousLevel: currentLevel, newLevel, totalXp: newXpTotal }
        );
        
        // Grant level-up rewards if configured
        const levelUpRewardId = this.configService.get<Record<number, string>>(
          'gamificationEngine.rewards.levelUp', 
          {}
        )[newLevel];
        
        if (levelUpRewardId) {
          await this.rewardsService.grantReward(userId, levelUpRewardId);
          this.loggerService.log(
            `Granted level-up reward for reaching level ${newLevel} to user ${userId}`,
            { userId, rewardId: levelUpRewardId, level: newLevel }
          );
        }
      }
    } catch (error) {
      this.loggerService.error(
        `Failed to add XP to user ${userId}: ${error.message}`,
        error.stack,
        { userId, xpAmount, error }
      );
      throw error;
    }
  }

  /**
   * Calculates the level based on total XP
   * Uses a simple formula where each level requires more XP than the previous
   * 
   * @param totalXp - The total XP to calculate level from
   * @returns The calculated level
   */
  private calculateLevel(totalXp: number): number {
    // Get level calculation formula from config or use default
    const baseXp = this.configService.get<number>('gamificationEngine.levelCalculation.baseXp', 100);
    const growthFactor = this.configService.get<number>('gamificationEngine.levelCalculation.growthFactor', 1.5);
    
    // Simple level calculation formula: level = 1 + floor(log(1 + xp/baseXp) / log(growthFactor))
    // This creates an exponential curve where each level requires more XP than the previous
    const level = 1 + Math.floor(Math.log(1 + totalXp / baseXp) / Math.log(growthFactor));
    
    return level;
  }

  /**
   * Type guard to check if an event is a health metric event
   * 
   * @param event - The event to check
   * @returns True if the event is a health metric event
   */
  private isHealthMetricEvent(event: any): event is HealthJourney.IHealthMetricRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'metricType' in event.payload &&
      'metricValue' in event.payload &&
      'metricUnit' in event.payload
    );
  }

  /**
   * Type guard to check if an event is a health goal event
   * 
   * @param event - The event to check
   * @returns True if the event is a health goal event
   */
  private isHealthGoalEvent(event: any): event is HealthJourney.IHealthGoalRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'goalId' in event.payload &&
      'goalType' in event.payload &&
      'goalTarget' in event.payload
    );
  }

  /**
   * Type guard to check if an event is a device connection event
   * 
   * @param event - The event to check
   * @returns True if the event is a device connection event
   */
  private isDeviceConnectionEvent(event: any): event is HealthJourney.IDeviceConnectionRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'deviceType' in event.payload &&
      'deviceId' in event.payload &&
      'totalDevicesConnected' in event.payload
    );
  }

  /**
   * Type guard to check if an event is a health insight event
   * 
   * @param event - The event to check
   * @returns True if the event is a health insight event
   */
  private isHealthInsightEvent(event: any): boolean {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'insightId' in event.payload &&
      'insightType' in event.payload
    );
  }
}