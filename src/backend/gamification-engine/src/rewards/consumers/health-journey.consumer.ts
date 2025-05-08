import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../../../common/kafka';
import { LoggerService } from '@app/shared/logging/logger.service';
import { LOGGER_SERVICE } from '@app/shared/logging/logger.constants';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { TRACING_SERVICE } from '@app/shared/tracing/tracing.constants';
import { RewardsService } from '../rewards.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { BaseConsumer } from './base.consumer';
import { DlqService } from '../../common/kafka/dlq.service';
import { MetricsService } from '../../common/metrics/metrics.service';

// Import interfaces from @austa/interfaces package
import { JourneyType } from '@austa/interfaces/common/dto';
import { EventMetadata } from '@austa/interfaces/common';
import { MetricType, GoalType, GoalStatus, DeviceType } from '@austa/interfaces/journey/health';
import { IBaseEvent, IEventResponse } from '../../events/interfaces';
import {
  RewardEventType,
  HealthRewardTriggeredPayload,
  isHealthRewardTriggeredPayload,
  createHealthRewardEvent
} from './reward-events.types';

/**
 * Enum for Health Journey event types
 */
enum HealthEventType {
  // Health metric events
  METRIC_RECORDED = 'METRIC_RECORDED',
  METRIC_MILESTONE_REACHED = 'METRIC_MILESTONE_REACHED',
  METRIC_STREAK_ACHIEVED = 'METRIC_STREAK_ACHIEVED',
  
  // Goal events
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_PROGRESS_UPDATED = 'GOAL_PROGRESS_UPDATED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  GOAL_STREAK_ACHIEVED = 'GOAL_STREAK_ACHIEVED',
  
  // Health insight events
  INSIGHT_GENERATED = 'INSIGHT_GENERATED',
  INSIGHT_VIEWED = 'INSIGHT_VIEWED',
  INSIGHT_SHARED = 'INSIGHT_SHARED',
  
  // Device events
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  DEVICE_MILESTONE_REACHED = 'DEVICE_MILESTONE_REACHED'
}

/**
 * Interface for health metric events
 */
interface HealthMetricEvent extends IBaseEvent {
  data: {
    metricType: MetricType;
    value: number;
    unit: string;
    source?: string;
    recordedAt: string;
    metricCount?: number;
    streakDays?: number;
    isImprovement?: boolean;
  };
  metadata?: EventMetadata;
}

/**
 * Interface for health goal events
 */
interface HealthGoalEvent extends IBaseEvent {
  data: {
    goalId: string;
    goalType: GoalType;
    targetValue?: number;
    currentValue?: number;
    progress?: number;
    status?: GoalStatus;
    achievedAt?: string;
    streakDays?: number;
    goalCount?: number;
  };
  metadata?: EventMetadata;
}

/**
 * Interface for health insight events
 */
interface HealthInsightEvent extends IBaseEvent {
  data: {
    insightId: string;
    insightType: string;
    relatedMetrics?: MetricType[];
    generatedAt?: string;
    viewedAt?: string;
    sharedAt?: string;
    insightCount?: number;
  };
  metadata?: EventMetadata;
}

/**
 * Interface for device events
 */
interface DeviceEvent extends IBaseEvent {
  data: {
    deviceId: string;
    deviceType: DeviceType;
    connectedAt?: string;
    syncedAt?: string;
    syncCount?: number;
    dataPoints?: number;
    deviceCount?: number;
  };
  metadata?: EventMetadata;
}

/**
 * Kafka consumer that processes reward-related events from the Health Journey service.
 * Handles health metric achievements, goal completions, device synchronization rewards, and health insight-based rewards.
 * Extends BaseConsumer with health-specific reward processing logic.
 */
@Injectable()
export class HealthJourneyConsumer extends BaseConsumer {
  /**
   * Creates an instance of HealthJourneyConsumer.
   * 
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for structured logging
   * @param configService - Service for accessing configuration values
   * @param tracingService - Service for distributed tracing
   * @param rewardsService - Service for managing rewards
   * @param profilesService - Service for managing user profiles
   * @param dlqService - Service for managing the dead letter queue
   * @param metricsService - Service for recording metrics
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly loggerService: LoggerService,
    protected readonly configService: ConfigService,
    protected readonly tracingService: TracingService,
    private readonly rewardsService: RewardsService,
    private readonly profilesService: ProfilesService,
    protected readonly dlqService: DlqService,
    protected readonly metricsService: MetricsService
  ) {
    super(
      kafkaService,
      loggerService,
      tracingService,
      configService,
      null, // achievementsService not needed for rewards consumer
      profilesService,
      null, // rulesService not needed for rewards consumer
      dlqService,
      metricsService,
      {
        topic: configService.get<string>('KAFKA_HEALTH_REWARDS_TOPIC', 'health-rewards'),
        groupId: configService.get<string>('KAFKA_REWARDS_CONSUMER_GROUP', 'gamification-rewards-consumers'),
        maxRetries: configService.get<number>('KAFKA_REWARDS_MAX_RETRIES', 3),
        initialRetryDelay: configService.get<number>('KAFKA_REWARDS_INITIAL_RETRY_DELAY', 1000),
        maxRetryDelay: configService.get<number>('KAFKA_REWARDS_MAX_RETRY_DELAY', 30000),
        useJitter: configService.get<boolean>('KAFKA_REWARDS_USE_JITTER', true)
      }
    );
    
    this.logger = new Logger(HealthJourneyConsumer.name);
  }
  
  /**
   * Processes an event received from Kafka.
   * Routes the event to the appropriate handler based on event type.
   * 
   * @param event - The event to process
   * @returns A promise that resolves to the event processing result
   */
  protected async processEvent(event: IBaseEvent): Promise<IEventResponse> {
    // Create a span for tracing this event processing
    const span = this.tracingService.createSpan('health-journey.process-reward-event', {
      'event.type': event.type,
      'event.user_id': event.userId,
      'event.journey': JourneyType.HEALTH
    });
    
    try {
      this.logger.log(`Processing health journey reward event: ${event.type}`);
      
      // Process event based on type
      switch (event.type) {
        // Health metric reward events
        case RewardEventType.HEALTH_METRIC_REWARD:
          return await this.processHealthMetricReward(event);
          
        // Health goal reward events
        case RewardEventType.HEALTH_GOAL_REWARD:
          return await this.processHealthGoalReward(event);
          
        // Health insight reward events
        case RewardEventType.HEALTH_INSIGHT_REWARD:
          return await this.processHealthInsightReward(event);
          
        // Device sync reward events
        case RewardEventType.HEALTH_DEVICE_SYNC_REWARD:
          return await this.processHealthDeviceSyncReward(event);
          
        // Health journey triggered reward events
        case RewardEventType.HEALTH_REWARD_TRIGGERED:
          return await this.processHealthRewardTriggered(event);
          
        default:
          this.logger.warn(`Unsupported health journey reward event type: ${event.type}`);
          return {
            success: false,
            error: `Unsupported event type: ${event.type}`
          };
      }
    } catch (error) {
      // Record error in the tracing span
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message }); // 2 = ERROR
      
      this.logger.error(
        `Error processing health journey reward event: ${error.message}`,
        error.stack
      );
      
      throw error;
    } finally {
      // End the span regardless of success or failure
      span.end();
    }
  }
  
  /**
   * Checks if an event is supported by this consumer.
   * 
   * @param event - The event to check
   * @returns True if the event is supported, false otherwise
   */
  protected isSupportedEvent(event: IBaseEvent): boolean {
    const supportedEventTypes = [
      RewardEventType.HEALTH_METRIC_REWARD,
      RewardEventType.HEALTH_GOAL_REWARD,
      RewardEventType.HEALTH_INSIGHT_REWARD,
      RewardEventType.HEALTH_DEVICE_SYNC_REWARD,
      RewardEventType.HEALTH_REWARD_TRIGGERED
    ];
    
    return supportedEventTypes.includes(event.type as RewardEventType);
  }
  
  /**
   * Maps an event to the appropriate payload type based on the event type.
   * 
   * @param event - The event to map
   * @returns The typed event payload
   */
  protected mapEventToPayload<T>(event: IBaseEvent): T {
    if (event.type === RewardEventType.HEALTH_REWARD_TRIGGERED && isHealthRewardTriggeredPayload(event.data)) {
      return event.data as unknown as T;
    }
    
    return event.data as T;
  }
  
  /**
   * Processes a health metric reward event.
   * Grants rewards based on health metric recordings and achievements.
   * 
   * @param event - The health metric reward event
   * @returns A promise that resolves to the event processing result
   */
  private async processHealthMetricReward(event: IBaseEvent): Promise<IEventResponse> {
    try {
      const { userId, data } = event;
      const metricEvent = data as HealthMetricEvent['data'];
      const metricType = metricEvent.metricType;
      
      this.logger.log(`Processing health metric reward for user ${userId}, metric type: ${metricType}`);
      
      // Determine reward ID based on metric type and context
      let rewardId: string;
      
      switch (metricType) {
        case MetricType.HEART_RATE:
          rewardId = 'health-heart-rate-tracker-reward';
          break;
        case MetricType.BLOOD_PRESSURE:
          rewardId = 'health-blood-pressure-monitor-reward';
          break;
        case MetricType.WEIGHT:
          rewardId = 'health-weight-tracker-reward';
          break;
        case MetricType.STEPS:
          rewardId = 'health-step-counter-reward';
          break;
        case MetricType.SLEEP:
          rewardId = 'health-sleep-tracker-reward';
          break;
        case MetricType.BLOOD_GLUCOSE:
          rewardId = 'health-glucose-monitor-reward';
          break;
        default:
          rewardId = 'health-metric-tracker-reward';
      }
      
      // Check for streak achievements
      if (metricEvent.streakDays && metricEvent.streakDays >= 7) {
        // Grant streak-specific reward
        const streakRewardId = `health-${metricType.toLowerCase()}-streak-reward`;
        await this.rewardsService.grantReward(userId, streakRewardId);
      }
      
      // Check for improvement achievements
      if (metricEvent.isImprovement) {
        // Grant improvement-specific reward
        const improvementRewardId = `health-${metricType.toLowerCase()}-improvement-reward`;
        await this.rewardsService.grantReward(userId, improvementRewardId);
      }
      
      // Grant the main metric reward
      const userReward = await this.rewardsService.grantReward(userId, rewardId);
      
      // Create a health reward triggered event for cross-journey tracking
      const healthRewardPayload: HealthRewardTriggeredPayload = {
        rewardId: userReward.rewardId,
        userId,
        triggeredAt: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        triggerEvent: RewardEventType.HEALTH_METRIC_REWARD,
        granted: true,
        xpValue: userReward.reward.xpReward,
        healthContext: {
          metricType: metricType,
          additionalData: {
            value: metricEvent.value,
            unit: metricEvent.unit,
            recordedAt: metricEvent.recordedAt,
            streakDays: metricEvent.streakDays,
            isImprovement: metricEvent.isImprovement
          }
        }
      };
      
      // Publish the health reward triggered event
      await this.kafkaService.produce(
        'reward-events',
        createHealthRewardEvent(
          RewardEventType.HEALTH_REWARD_TRIGGERED,
          userId,
          healthRewardPayload,
          'gamification-engine'
        ),
        userId
      );
      
      this.logger.log(`Successfully processed health metric reward for user ${userId}`);
      
      return {
        success: true,
        points: userReward.reward.xpReward,
        rewards: [userReward]
      };
    } catch (error) {
      this.logger.error(
        `Failed to process health metric reward: ${error.message}`,
        error.stack
      );
      
      throw error;
    }
  }
  
  /**
   * Processes a health goal reward event.
   * Grants rewards based on health goal achievements and progress.
   * 
   * @param event - The health goal reward event
   * @returns A promise that resolves to the event processing result
   */
  private async processHealthGoalReward(event: IBaseEvent): Promise<IEventResponse> {
    try {
      const { userId, data } = event;
      const goalEvent = data as HealthGoalEvent['data'];
      const goalType = goalEvent.goalType;
      const goalStatus = goalEvent.status;
      
      this.logger.log(`Processing health goal reward for user ${userId}, goal type: ${goalType}`);
      
      // Only grant rewards for achieved goals
      if (goalStatus !== GoalStatus.ACHIEVED) {
        this.logger.log(`Goal not achieved yet, no reward granted for user ${userId}`);
        return {
          success: true,
          points: 0,
          rewards: []
        };
      }
      
      // Determine reward ID based on goal type
      let rewardId: string;
      
      switch (goalType) {
        case GoalType.STEPS:
          rewardId = 'health-step-goal-reward';
          break;
        case GoalType.WEIGHT:
          rewardId = 'health-weight-goal-reward';
          break;
        case GoalType.SLEEP:
          rewardId = 'health-sleep-goal-reward';
          break;
        case GoalType.NUTRITION:
          rewardId = 'health-nutrition-goal-reward';
          break;
        case GoalType.HYDRATION:
          rewardId = 'health-hydration-goal-reward';
          break;
        default:
          rewardId = 'health-goal-achiever-reward';
      }
      
      // Check for streak achievements
      if (goalEvent.streakDays && goalEvent.streakDays >= 7) {
        // Grant streak-specific reward
        const streakRewardId = `health-${goalType.toLowerCase()}-streak-reward`;
        await this.rewardsService.grantReward(userId, streakRewardId);
      }
      
      // Grant the main goal reward
      const userReward = await this.rewardsService.grantReward(userId, rewardId);
      
      // Create a health reward triggered event for cross-journey tracking
      const healthRewardPayload: HealthRewardTriggeredPayload = {
        rewardId: userReward.rewardId,
        userId,
        triggeredAt: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        triggerEvent: RewardEventType.HEALTH_GOAL_REWARD,
        granted: true,
        xpValue: userReward.reward.xpReward,
        healthContext: {
          goalId: goalEvent.goalId,
          additionalData: {
            goalType: goalEvent.goalType,
            targetValue: goalEvent.targetValue,
            achievedAt: goalEvent.achievedAt,
            streakDays: goalEvent.streakDays
          }
        }
      };
      
      // Publish the health reward triggered event
      await this.kafkaService.produce(
        'reward-events',
        createHealthRewardEvent(
          RewardEventType.HEALTH_REWARD_TRIGGERED,
          userId,
          healthRewardPayload,
          'gamification-engine'
        ),
        userId
      );
      
      this.logger.log(`Successfully processed health goal reward for user ${userId}`);
      
      return {
        success: true,
        points: userReward.reward.xpReward,
        rewards: [userReward]
      };
    } catch (error) {
      this.logger.error(
        `Failed to process health goal reward: ${error.message}`,
        error.stack
      );
      
      throw error;
    }
  }
  
  /**
   * Processes a health insight reward event.
   * Grants rewards based on health insights generated, viewed, or shared.
   * 
   * @param event - The health insight reward event
   * @returns A promise that resolves to the event processing result
   */
  private async processHealthInsightReward(event: IBaseEvent): Promise<IEventResponse> {
    try {
      const { userId, data } = event;
      const insightEvent = data as HealthInsightEvent['data'];
      const insightType = insightEvent.insightType;
      
      this.logger.log(`Processing health insight reward for user ${userId}, insight type: ${insightType}`);
      
      // Determine reward ID based on insight action
      let rewardId: string;
      let action: string;
      
      if (insightEvent.generatedAt) {
        rewardId = 'health-insight-generator-reward';
        action = 'generated';
      } else if (insightEvent.viewedAt) {
        rewardId = 'health-insight-viewer-reward';
        action = 'viewed';
      } else if (insightEvent.sharedAt) {
        rewardId = 'health-insight-sharer-reward';
        action = 'shared';
      } else {
        rewardId = 'health-insight-reward';
        action = 'interacted with';
      }
      
      // Grant the insight reward
      const userReward = await this.rewardsService.grantReward(userId, rewardId);
      
      // Create a health reward triggered event for cross-journey tracking
      const healthRewardPayload: HealthRewardTriggeredPayload = {
        rewardId: userReward.rewardId,
        userId,
        triggeredAt: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        triggerEvent: RewardEventType.HEALTH_INSIGHT_REWARD,
        granted: true,
        xpValue: userReward.reward.xpReward,
        healthContext: {
          additionalData: {
            insightId: insightEvent.insightId,
            insightType: insightEvent.insightType,
            relatedMetrics: insightEvent.relatedMetrics,
            action,
            timestamp: insightEvent.generatedAt || insightEvent.viewedAt || insightEvent.sharedAt
          }
        }
      };
      
      // Publish the health reward triggered event
      await this.kafkaService.produce(
        'reward-events',
        createHealthRewardEvent(
          RewardEventType.HEALTH_REWARD_TRIGGERED,
          userId,
          healthRewardPayload,
          'gamification-engine'
        ),
        userId
      );
      
      this.logger.log(`Successfully processed health insight reward for user ${userId}`);
      
      return {
        success: true,
        points: userReward.reward.xpReward,
        rewards: [userReward]
      };
    } catch (error) {
      this.logger.error(
        `Failed to process health insight reward: ${error.message}`,
        error.stack
      );
      
      throw error;
    }
  }
  
  /**
   * Processes a health device sync reward event.
   * Grants rewards based on device synchronization and data collection.
   * 
   * @param event - The health device sync reward event
   * @returns A promise that resolves to the event processing result
   */
  private async processHealthDeviceSyncReward(event: IBaseEvent): Promise<IEventResponse> {
    try {
      const { userId, data } = event;
      const deviceEvent = data as DeviceEvent['data'];
      const deviceType = deviceEvent.deviceType;
      
      this.logger.log(`Processing health device sync reward for user ${userId}, device type: ${deviceType}`);
      
      // Determine reward ID based on device type and action
      let rewardId: string;
      let action: string;
      
      if (deviceEvent.connectedAt) {
        rewardId = 'health-device-connector-reward';
        action = 'connected';
      } else if (deviceEvent.syncedAt) {
        rewardId = 'health-device-syncer-reward';
        action = 'synced';
      } else {
        rewardId = 'health-device-user-reward';
        action = 'used';
      }
      
      // Add device type to reward ID for specific device rewards
      if (deviceType) {
        rewardId = `health-${deviceType.toLowerCase()}-${action}-reward`;
      }
      
      // Check for milestone achievements
      if (deviceEvent.syncCount && deviceEvent.syncCount >= 30) {
        // Grant milestone-specific reward
        const milestoneRewardId = `health-${deviceType.toLowerCase()}-milestone-reward`;
        await this.rewardsService.grantReward(userId, milestoneRewardId);
      }
      
      // Grant the main device reward
      const userReward = await this.rewardsService.grantReward(userId, rewardId);
      
      // Create a health reward triggered event for cross-journey tracking
      const healthRewardPayload: HealthRewardTriggeredPayload = {
        rewardId: userReward.rewardId,
        userId,
        triggeredAt: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        triggerEvent: RewardEventType.HEALTH_DEVICE_SYNC_REWARD,
        granted: true,
        xpValue: userReward.reward.xpReward,
        healthContext: {
          deviceId: deviceEvent.deviceId,
          additionalData: {
            deviceType: deviceEvent.deviceType,
            action,
            timestamp: deviceEvent.connectedAt || deviceEvent.syncedAt,
            syncCount: deviceEvent.syncCount,
            dataPoints: deviceEvent.dataPoints
          }
        }
      };
      
      // Publish the health reward triggered event
      await this.kafkaService.produce(
        'reward-events',
        createHealthRewardEvent(
          RewardEventType.HEALTH_REWARD_TRIGGERED,
          userId,
          healthRewardPayload,
          'gamification-engine'
        ),
        userId
      );
      
      this.logger.log(`Successfully processed health device sync reward for user ${userId}`);
      
      return {
        success: true,
        points: userReward.reward.xpReward,
        rewards: [userReward]
      };
    } catch (error) {
      this.logger.error(
        `Failed to process health device sync reward: ${error.message}`,
        error.stack
      );
      
      throw error;
    }
  }
  
  /**
   * Processes a health reward triggered event.
   * Handles rewards triggered directly by the health journey service.
   * 
   * @param event - The health reward triggered event
   * @returns A promise that resolves to the event processing result
   */
  private async processHealthRewardTriggered(event: IBaseEvent): Promise<IEventResponse> {
    try {
      const { userId } = event;
      const payload = this.mapEventToPayload<HealthRewardTriggeredPayload>(event);
      
      this.logger.log(`Processing health reward triggered for user ${userId}, trigger: ${payload.triggerEvent}`);
      
      // Grant all journey rewards for the user
      const userRewards = await this.rewardsService.grantJourneyRewards(userId, JourneyType.HEALTH);
      
      // Calculate total XP from all granted rewards
      const totalXp = userRewards.reduce((sum, userReward) => sum + userReward.reward.xpReward, 0);
      
      this.logger.log(`Successfully processed health reward triggered for user ${userId}, granted ${userRewards.length} rewards`);
      
      return {
        success: true,
        points: totalXp,
        rewards: userRewards
      };
    } catch (error) {
      this.logger.error(
        `Failed to process health reward triggered: ${error.message}`,
        error.stack
      );
      
      throw error;
    }
  }
}