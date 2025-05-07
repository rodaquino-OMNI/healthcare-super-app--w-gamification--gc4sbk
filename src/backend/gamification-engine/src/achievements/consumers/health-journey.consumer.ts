import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../../../common/kafka';
import { LoggerService } from '@app/shared/logging/logger.service';
import { LOGGER_SERVICE } from '@app/shared/logging/logger.constants';
import { AchievementsService } from '../achievements.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { TRACING_SERVICE } from '@app/shared/tracing/tracing.constants';

// Import interfaces from @austa/interfaces package
import { JourneyType } from '@austa/interfaces/common';
import { EventMetadata } from '@austa/interfaces/common';
import { MetricType, GoalType, GoalStatus, DeviceType } from '@austa/interfaces/journey/health';

/**
 * Base consumer class that all journey-specific consumers will extend.
 * Provides common functionality for Kafka consumer setup and error handling.
 * 
 * Implements dead letter queue handling, exponential backoff retry strategies,
 * structured error handling, and centralized event processing.
 */
abstract class BaseConsumer implements OnModuleInit {
  protected readonly logger: Logger;
  protected readonly topics: string[];
  protected readonly consumerGroup: string;
  protected readonly dlqEnabled: boolean;
  protected readonly maxRetries: number;
  
  /**
   * Creates an instance of BaseConsumer.
   * 
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for structured logging
   * @param configService - Service for accessing configuration values
   * @param consumerName - Name of the consumer for logging purposes
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly loggerService: LoggerService,
    protected readonly configService: ConfigService,
    @Inject(TRACING_SERVICE) protected readonly tracingService: TracingService,
    protected readonly consumerName: string
  ) {
    this.logger = new Logger(consumerName);
    this.consumerGroup = this.configService.get<string>('KAFKA_CONSUMER_GROUP', 'gamification-achievements-consumers');
    this.dlqEnabled = this.configService.get<boolean>('KAFKA_DLQ_ENABLED', true);
    this.maxRetries = this.configService.get<number>('KAFKA_DLQ_MAX_RETRIES', 3);
  }
  
  /**
   * Lifecycle hook that runs when the module is initialized.
   * Connects to Kafka and subscribes to the configured topics.
   */
  async onModuleInit(): Promise<void> {
    await this.connect();
  }
  
  /**
   * Connects to Kafka and subscribes to the configured topics.
   * Implements dead letter queue pattern for handling failed events.
   */
  async connect(): Promise<void> {
    try {
      this.loggerService.log(
        `Connecting ${this.consumerName} to Kafka topics: ${this.topics.join(', ')}`,
        {},
        this.consumerName
      );
      
      // Subscribe to each topic
      for (const topic of this.topics) {
        await this.kafkaService.consume(
          topic,
          this.consumerGroup,
          this.createMessageHandler(topic)
        );
        
        this.loggerService.log(
          `Successfully subscribed to topic: ${topic}`,
          { consumerGroup: this.consumerGroup },
          this.consumerName
        );
      }
    } catch (error) {
      this.loggerService.error(
        `Failed to connect to Kafka topics: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          topics: this.topics,
          consumerGroup: this.consumerGroup
        },
        this.consumerName
      );
      throw error;
    }
  }
  
  /**
   * Creates a message handler function for the specified topic.
   * Implements retry logic with exponential backoff.
   * 
   * @param topic - The Kafka topic being consumed
   * @returns A function that handles Kafka messages
   */
  private createMessageHandler(topic: string) {
    return async (message: any) => {
      try {
        // Log the received message for debugging
        this.loggerService.log(
          `Received message from topic: ${topic}`,
          { messageId: message.key?.toString() },
          this.consumerName
        );
        
        // Parse the message value
        const payload = this.parseMessage(message);
        
        // Skip invalid messages
        if (!this.isValidMessage(payload)) {
          this.loggerService.warn(
            'Skipping invalid message',
            { topic, messageId: message.key?.toString() },
            this.consumerName
          );
          return;
        }
        
        // Process the message
        await this.processMessage(payload);
        
        this.loggerService.log(
          'Successfully processed message',
          { topic, messageId: message.key?.toString(), eventType: payload.type },
          this.consumerName
        );
      } catch (error) {
        // Get retry count from message headers
        const retryCount = this.getRetryCount(message);
        
        if (this.dlqEnabled && retryCount >= this.maxRetries) {
          // Send to dead letter queue if max retries exceeded
          await this.sendToDlq(topic, message);
          
          this.loggerService.warn(
            `Max retries exceeded, sent message to DLQ: ${error.message}`,
            {
              error: error.message,
              stack: error.stack,
              topic,
              messageId: message.key?.toString(),
              retryCount
            },
            this.consumerName
          );
        } else {
          // Retry with exponential backoff
          const nextRetryCount = retryCount + 1;
          const delayMs = this.calculateBackoff(nextRetryCount);
          
          this.loggerService.warn(
            `Processing failed, scheduling retry in ${delayMs}ms: ${error.message}`,
            {
              error: error.message,
              stack: error.stack,
              topic,
              messageId: message.key?.toString(),
              retryCount: nextRetryCount,
              delayMs
            },
            this.consumerName
          );
          
          // Schedule retry after delay
          setTimeout(async () => {
            try {
              // Update retry count in headers
              message.headers = {
                ...message.headers,
                'retry-count': Buffer.from(nextRetryCount.toString())
              };
              
              // Retry processing
              await this.createMessageHandler(topic)(message);
            } catch (retryError) {
              this.loggerService.error(
                `Retry failed: ${retryError.message}`,
                {
                  error: retryError.message,
                  stack: retryError.stack,
                  topic,
                  messageId: message.key?.toString(),
                  retryCount: nextRetryCount
                },
                this.consumerName
              );
            }
          }, delayMs);
        }
      }
    };
  }
  
  /**
   * Parses a Kafka message into a JavaScript object.
   * 
   * @param message - The Kafka message to parse
   * @returns The parsed message payload
   */
  private parseMessage(message: any): any {
    try {
      return JSON.parse(message.value.toString());
    } catch (error) {
      this.loggerService.error(
        `Failed to parse message: ${error.message}`,
        {
          error: error.message,
          messageValue: message.value?.toString(),
          topic: message.topic
        },
        this.consumerName
      );
      throw error;
    }
  }
  
  /**
   * Gets the retry count from message headers.
   * 
   * @param message - The Kafka message
   * @returns The current retry count
   */
  private getRetryCount(message: any): number {
    try {
      const retryHeader = message.headers?.['retry-count'];
      return retryHeader ? parseInt(retryHeader.toString(), 10) : 0;
    } catch {
      return 0;
    }
  }
  
  /**
   * Calculates the backoff delay for retries using exponential backoff.
   * 
   * @param retryCount - The current retry count
   * @returns The delay in milliseconds before the next retry
   */
  private calculateBackoff(retryCount: number): number {
    const initialRetryTime = 300; // 300ms initial retry time
    const factor = 2; // Exponential factor
    const maxRetryTime = 30000; // 30 seconds max retry time
    
    // Calculate exponential backoff with jitter
    const exponentialDelay = initialRetryTime * Math.pow(factor, retryCount - 1);
    const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85 and 1.15
    const delay = Math.min(exponentialDelay * jitter, maxRetryTime);
    
    return Math.floor(delay);
  }
  
  /**
   * Sends a failed message to the dead letter queue.
   * 
   * @param originalTopic - The original topic of the message
   * @param message - The Kafka message to send to DLQ
   */
  private async sendToDlq(originalTopic: string, message: any): Promise<void> {
    try {
      const dlqTopic = `dlq-achievements-${originalTopic}`;
      
      // Add metadata to the message headers
      const headers = {
        ...message.headers,
        'original-topic': Buffer.from(originalTopic),
        'dlq-timestamp': Buffer.from(Date.now().toString()),
        'consumer-group': Buffer.from(this.consumerGroup)
      };
      
      // Send to DLQ topic
      await this.kafkaService.produce({
        topic: dlqTopic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers
          }
        ]
      });
      
      this.loggerService.log(
        `Message sent to DLQ topic: ${dlqTopic}`,
        { originalTopic, messageId: message.key?.toString() },
        this.consumerName
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to send message to DLQ: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          originalTopic,
          messageId: message.key?.toString()
        },
        this.consumerName
      );
    }
  }
  
  /**
   * Validates that a message has the required fields.
   * 
   * @param message - The message to validate
   * @returns True if the message is valid, false otherwise
   */
  protected isValidMessage(message: any): boolean {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      typeof message.userId === 'string' &&
      message.data &&
      typeof message.data === 'object'
    );
  }
  
  /**
   * Processes a validated message.
   * This method should be implemented by journey-specific consumers.
   * 
   * @param message - The validated message to process
   */
  protected abstract processMessage(message: any): Promise<void>;
}

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
interface HealthMetricEvent {
  userId: string;
  type: HealthEventType;
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
interface HealthGoalEvent {
  userId: string;
  type: HealthEventType;
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
interface HealthInsightEvent {
  userId: string;
  type: HealthEventType;
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
interface DeviceEvent {
  userId: string;
  type: HealthEventType;
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
 * Kafka consumer that processes achievement-related events from the Health Journey service.
 * Handles health metric recordings, goal achievements, health insights, and device synchronization events.
 * Extends BaseConsumer with health-specific event processing logic.
 */
@Injectable()
export class HealthJourneyConsumer extends BaseConsumer {
  /**
   * Creates an instance of HealthJourneyConsumer.
   * 
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for structured logging
   * @param configService - Service for accessing configuration values
   * @param achievementsService - Service for managing achievements
   * @param profilesService - Service for managing user profiles
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    @Inject(LOGGER_SERVICE) protected readonly loggerService: LoggerService,
    protected readonly configService: ConfigService,
    @Inject(TRACING_SERVICE) protected readonly tracingService: TracingService,
    private readonly achievementsService: AchievementsService,
    private readonly profilesService: ProfilesService
  ) {
    super(kafkaService, loggerService, configService, tracingService, 'HealthJourneyConsumer');
    
    // Configure topics for health journey events
    this.topics = this.configService.get<string[]>('KAFKA_HEALTH_TOPICS', [
      'health-metrics',
      'health-goals',
      'health-insights',
      'health-devices'
    ]);
  }
  
  /**
   * Processes a validated health journey event message.
   * Routes the message to the appropriate handler based on event type.
   * 
   * @param message - The validated message to process
   */
  protected async processMessage(message: any): Promise<void> {
    // Create a span for tracing this event processing
    const span = this.tracingService.createSpan('health-journey.process-event', {
      'event.type': message.type,
      'event.user_id': message.userId,
      'event.journey': 'health'
    });
    try {
      this.loggerService.log(
        `Processing health journey event: ${message.type}`,
        { 
          userId: message.userId, 
          eventType: message.type,
          traceId: span.context().traceId,
          spanId: span.context().spanId
        },
        'HealthJourneyConsumer'
      );
      
      // Get or create user profile
      const profile = await this.profilesService.findOrCreateByUserId(message.userId);
      
      // Process event based on type
      switch (message.type) {
        // Health metric events
        case HealthEventType.METRIC_RECORDED:
          await this.processMetricRecordedEvent(profile.id, message);
          break;
        case HealthEventType.METRIC_MILESTONE_REACHED:
          await this.processMetricMilestoneReachedEvent(profile.id, message);
          break;
        case HealthEventType.METRIC_STREAK_ACHIEVED:
          await this.processMetricStreakAchievedEvent(profile.id, message);
          break;
          
        // Goal events
        case HealthEventType.GOAL_CREATED:
          await this.processGoalCreatedEvent(profile.id, message);
          break;
        case HealthEventType.GOAL_PROGRESS_UPDATED:
          await this.processGoalProgressUpdatedEvent(profile.id, message);
          break;
        case HealthEventType.GOAL_ACHIEVED:
          await this.processGoalAchievedEvent(profile.id, message);
          break;
        case HealthEventType.GOAL_STREAK_ACHIEVED:
          await this.processGoalStreakAchievedEvent(profile.id, message);
          break;
          
        // Health insight events
        case HealthEventType.INSIGHT_GENERATED:
          await this.processInsightGeneratedEvent(profile.id, message);
          break;
        case HealthEventType.INSIGHT_VIEWED:
          await this.processInsightViewedEvent(profile.id, message);
          break;
        case HealthEventType.INSIGHT_SHARED:
          await this.processInsightSharedEvent(profile.id, message);
          break;
          
        // Device events
        case HealthEventType.DEVICE_CONNECTED:
          await this.processDeviceConnectedEvent(profile.id, message);
          break;
        case HealthEventType.DEVICE_SYNCED:
          await this.processDeviceSyncedEvent(profile.id, message);
          break;
        case HealthEventType.DEVICE_MILESTONE_REACHED:
          await this.processDeviceMilestoneReachedEvent(profile.id, message);
          break;
          
        default:
          this.loggerService.warn(
            `Unhandled health journey event type: ${message.type}`,
            { userId: message.userId, eventType: message.type },
            'HealthJourneyConsumer'
          );
      }
    } catch (error) {
      // Record error in the tracing span
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message }); // 2 = ERROR
      
      this.loggerService.error(
        `Error processing health journey event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          userId: message.userId,
          eventType: message.type,
          traceId: span.context().traceId,
          spanId: span.context().spanId
        },
        'HealthJourneyConsumer'
      );
      throw error;
    } finally {
      // End the span regardless of success or failure
      span.end();
    }
  }
  
  /**
   * Processes a metric recorded event.
   * Awards XP and potentially unlocks achievements related to recording health metrics.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The metric recorded event data
   */
  private async processMetricRecordedEvent(profileId: string, event: HealthMetricEvent): Promise<void> {
    try {
      // Extract metric data
      const { data } = event;
      const metricType = data.metricType;
      
      // Award XP for recording a health metric
      await this.profilesService.addXp(profileId, 5, {
        source: 'health_journey',
        eventType: HealthEventType.METRIC_RECORDED,
        metricType
      });
      
      // Update progress for "Health Tracker" achievement based on count
      const metricCount = data.metricCount || 1;
      const healthTrackerProgress = Math.min(metricCount / 50 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_TRACKER',
        healthTrackerProgress
      );
      
      // Update metric-specific achievements
      switch (metricType) {
        case MetricType.HEART_RATE:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_HEART_RATE_TRACKER',
            Math.min(metricCount / 30 * 100, 100)
          );
          break;
        case MetricType.BLOOD_PRESSURE:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_BLOOD_PRESSURE_MONITOR',
            Math.min(metricCount / 30 * 100, 100)
          );
          break;
        case MetricType.WEIGHT:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_WEIGHT_TRACKER',
            Math.min(metricCount / 30 * 100, 100)
          );
          break;
        case MetricType.STEPS:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_STEP_COUNTER',
            Math.min(metricCount / 30 * 100, 100)
          );
          break;
        case MetricType.SLEEP:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_SLEEP_TRACKER',
            Math.min(metricCount / 30 * 100, 100)
          );
          break;
        case MetricType.BLOOD_GLUCOSE:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_GLUCOSE_MONITOR',
            Math.min(metricCount / 30 * 100, 100)
          );
          break;
      }
      
      this.loggerService.log(
        'Processed metric recorded event',
        { profileId, metricType, metricCount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing metric recorded event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.METRIC_RECORDED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a metric milestone reached event.
   * Awards XP and potentially unlocks achievements related to reaching health metric milestones.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The metric milestone reached event data
   */
  private async processMetricMilestoneReachedEvent(profileId: string, event: HealthMetricEvent): Promise<void> {
    try {
      // Extract metric data
      const { data } = event;
      const metricType = data.metricType;
      const isImprovement = data.isImprovement || false;
      
      // Award XP for reaching a metric milestone (bonus for improvement)
      const xpAmount = isImprovement ? 25 : 15;
      await this.profilesService.addXp(profileId, xpAmount, {
        source: 'health_journey',
        eventType: HealthEventType.METRIC_MILESTONE_REACHED,
        metricType,
        isImprovement
      });
      
      // Update progress for "Health Improver" achievement if applicable
      if (isImprovement) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_IMPROVER',
          100 // Instantly complete this achievement
        );
      }
      
      // Update metric-specific milestone achievements
      switch (metricType) {
        case MetricType.STEPS:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_STEP_MILESTONE',
            100
          );
          break;
        case MetricType.WEIGHT:
          if (isImprovement) {
            await this.achievementsService.updateAchievementProgress(
              profileId,
              'HEALTH_WEIGHT_GOAL_REACHED',
              100
            );
          }
          break;
        case MetricType.SLEEP:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_SLEEP_QUALITY',
            100
          );
          break;
      }
      
      this.loggerService.log(
        'Processed metric milestone reached event',
        { profileId, metricType, isImprovement },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing metric milestone reached event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.METRIC_MILESTONE_REACHED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a metric streak achieved event.
   * Awards XP and potentially unlocks achievements related to maintaining health metric streaks.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The metric streak achieved event data
   */
  private async processMetricStreakAchievedEvent(profileId: string, event: HealthMetricEvent): Promise<void> {
    try {
      // Extract streak data
      const { data } = event;
      const metricType = data.metricType;
      const streakDays = data.streakDays || 0;
      
      // Award XP based on streak length
      let xpAmount = 0;
      if (streakDays >= 30) {
        xpAmount = 100;
      } else if (streakDays >= 14) {
        xpAmount = 50;
      } else if (streakDays >= 7) {
        xpAmount = 25;
      }
      
      if (xpAmount > 0) {
        await this.profilesService.addXp(profileId, xpAmount, {
          source: 'health_journey',
          eventType: HealthEventType.METRIC_STREAK_ACHIEVED,
          metricType,
          streakDays
        });
      }
      
      // Update progress for streak achievements
      if (streakDays >= 7) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_STREAK_7',
          100
        );
      }
      
      if (streakDays >= 14) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_STREAK_14',
          100
        );
      }
      
      if (streakDays >= 30) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_STREAK_30',
          100
        );
      }
      
      // Update metric-specific streak achievements
      if (metricType === MetricType.STEPS && streakDays >= 7) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_STEP_STREAK',
          100
        );
      }
      
      this.loggerService.log(
        'Processed metric streak achieved event',
        { profileId, metricType, streakDays, xpAmount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing metric streak achieved event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.METRIC_STREAK_ACHIEVED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a goal created event.
   * Awards XP and potentially unlocks achievements related to creating health goals.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The goal created event data
   */
  private async processGoalCreatedEvent(profileId: string, event: HealthGoalEvent): Promise<void> {
    try {
      // Extract goal data
      const { data } = event;
      const goalType = data.goalType;
      
      // Award XP for creating a health goal
      await this.profilesService.addXp(profileId, 10, {
        source: 'health_journey',
        eventType: HealthEventType.GOAL_CREATED,
        goalType
      });
      
      // Update progress for "Goal Setter" achievement based on count
      const goalCount = data.goalCount || 1;
      const goalSetterProgress = Math.min(goalCount / 3 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_GOAL_SETTER',
        goalSetterProgress
      );
      
      this.loggerService.log(
        'Processed goal created event',
        { profileId, goalType, goalCount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing goal created event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.GOAL_CREATED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a goal progress updated event.
   * Awards XP and potentially unlocks achievements related to making progress on health goals.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The goal progress updated event data
   */
  private async processGoalProgressUpdatedEvent(profileId: string, event: HealthGoalEvent): Promise<void> {
    try {
      // Extract goal data
      const { data } = event;
      const goalType = data.goalType;
      const progress = data.progress || 0;
      
      // Only award XP for significant progress (25%, 50%, 75%)
      let xpAmount = 0;
      if (progress >= 75 && progress < 100) {
        xpAmount = 15;
      } else if (progress >= 50 && progress < 75) {
        xpAmount = 10;
      } else if (progress >= 25 && progress < 50) {
        xpAmount = 5;
      }
      
      if (xpAmount > 0) {
        await this.profilesService.addXp(profileId, xpAmount, {
          source: 'health_journey',
          eventType: HealthEventType.GOAL_PROGRESS_UPDATED,
          goalType,
          progress
        });
      }
      
      // Update progress for "Goal Tracker" achievement
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_GOAL_TRACKER',
        Math.min(progress, 100)
      );
      
      this.loggerService.log(
        'Processed goal progress updated event',
        { profileId, goalType, progress, xpAmount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing goal progress updated event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.GOAL_PROGRESS_UPDATED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a goal achieved event.
   * Awards XP and potentially unlocks achievements related to achieving health goals.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The goal achieved event data
   */
  private async processGoalAchievedEvent(profileId: string, event: HealthGoalEvent): Promise<void> {
    try {
      // Extract goal data
      const { data } = event;
      const goalType = data.goalType;
      
      // Award XP for achieving a health goal
      await this.profilesService.addXp(profileId, 30, {
        source: 'health_journey',
        eventType: HealthEventType.GOAL_ACHIEVED,
        goalType
      });
      
      // Update progress for "Goal Achiever" achievement based on count
      const goalCount = data.goalCount || 1;
      const goalAchieverProgress = Math.min(goalCount / 5 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_GOAL_ACHIEVER',
        goalAchieverProgress
      );
      
      // Update goal-specific achievements
      switch (goalType) {
        case GoalType.STEPS:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_STEP_GOAL_ACHIEVED',
            100
          );
          break;
        case GoalType.WEIGHT:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_WEIGHT_GOAL_ACHIEVED',
            100
          );
          break;
        case GoalType.SLEEP:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_SLEEP_GOAL_ACHIEVED',
            100
          );
          break;
        case GoalType.NUTRITION:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_NUTRITION_GOAL_ACHIEVED',
            100
          );
          break;
        case GoalType.HYDRATION:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_HYDRATION_GOAL_ACHIEVED',
            100
          );
          break;
      }
      
      this.loggerService.log(
        'Processed goal achieved event',
        { profileId, goalType, goalCount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing goal achieved event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.GOAL_ACHIEVED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a goal streak achieved event.
   * Awards XP and potentially unlocks achievements related to maintaining health goal streaks.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The goal streak achieved event data
   */
  private async processGoalStreakAchievedEvent(profileId: string, event: HealthGoalEvent): Promise<void> {
    try {
      // Extract streak data
      const { data } = event;
      const goalType = data.goalType;
      const streakDays = data.streakDays || 0;
      
      // Award XP based on streak length
      let xpAmount = 0;
      if (streakDays >= 30) {
        xpAmount = 150;
      } else if (streakDays >= 14) {
        xpAmount = 75;
      } else if (streakDays >= 7) {
        xpAmount = 40;
      }
      
      if (xpAmount > 0) {
        await this.profilesService.addXp(profileId, xpAmount, {
          source: 'health_journey',
          eventType: HealthEventType.GOAL_STREAK_ACHIEVED,
          goalType,
          streakDays
        });
      }
      
      // Update progress for streak achievements
      if (streakDays >= 7) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_GOAL_STREAK_7',
          100
        );
      }
      
      if (streakDays >= 14) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_GOAL_STREAK_14',
          100
        );
      }
      
      if (streakDays >= 30) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_GOAL_STREAK_30',
          100
        );
      }
      
      this.loggerService.log(
        'Processed goal streak achieved event',
        { profileId, goalType, streakDays, xpAmount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing goal streak achieved event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.GOAL_STREAK_ACHIEVED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes an insight generated event.
   * Awards XP and potentially unlocks achievements related to generating health insights.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The insight generated event data
   */
  private async processInsightGeneratedEvent(profileId: string, event: HealthInsightEvent): Promise<void> {
    try {
      // Extract insight data
      const { data } = event;
      const insightType = data.insightType;
      
      // Award XP for generating a health insight
      await this.profilesService.addXp(profileId, 15, {
        source: 'health_journey',
        eventType: HealthEventType.INSIGHT_GENERATED,
        insightType
      });
      
      // Update progress for "Insight Generator" achievement based on count
      const insightCount = data.insightCount || 1;
      const insightGeneratorProgress = Math.min(insightCount / 5 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_INSIGHT_GENERATOR',
        insightGeneratorProgress
      );
      
      this.loggerService.log(
        'Processed insight generated event',
        { profileId, insightType, insightCount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing insight generated event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.INSIGHT_GENERATED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes an insight viewed event.
   * Awards XP and potentially unlocks achievements related to viewing health insights.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The insight viewed event data
   */
  private async processInsightViewedEvent(profileId: string, event: HealthInsightEvent): Promise<void> {
    try {
      // Extract insight data
      const { data } = event;
      const insightType = data.insightType;
      
      // Award XP for viewing a health insight
      await this.profilesService.addXp(profileId, 5, {
        source: 'health_journey',
        eventType: HealthEventType.INSIGHT_VIEWED,
        insightType
      });
      
      // Update progress for "Health Conscious" achievement based on count
      const insightCount = data.insightCount || 1;
      const healthConsciousProgress = Math.min(insightCount / 10 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_CONSCIOUS',
        healthConsciousProgress
      );
      
      this.loggerService.log(
        'Processed insight viewed event',
        { profileId, insightType, insightCount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing insight viewed event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.INSIGHT_VIEWED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes an insight shared event.
   * Awards XP and potentially unlocks achievements related to sharing health insights.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The insight shared event data
   */
  private async processInsightSharedEvent(profileId: string, event: HealthInsightEvent): Promise<void> {
    try {
      // Extract insight data
      const { data } = event;
      const insightType = data.insightType;
      
      // Award XP for sharing a health insight
      await this.profilesService.addXp(profileId, 10, {
        source: 'health_journey',
        eventType: HealthEventType.INSIGHT_SHARED,
        insightType
      });
      
      // Update progress for "Health Advocate" achievement based on count
      const insightCount = data.insightCount || 1;
      const healthAdvocateProgress = Math.min(insightCount / 3 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_ADVOCATE',
        healthAdvocateProgress
      );
      
      this.loggerService.log(
        'Processed insight shared event',
        { profileId, insightType, insightCount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing insight shared event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.INSIGHT_SHARED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a device connected event.
   * Awards XP and potentially unlocks achievements related to connecting health devices.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The device connected event data
   */
  private async processDeviceConnectedEvent(profileId: string, event: DeviceEvent): Promise<void> {
    try {
      // Extract device data
      const { data } = event;
      const deviceType = data.deviceType;
      
      // Award XP for connecting a health device
      await this.profilesService.addXp(profileId, 20, {
        source: 'health_journey',
        eventType: HealthEventType.DEVICE_CONNECTED,
        deviceType
      });
      
      // Update progress for "Device Connector" achievement based on count
      const deviceCount = data.deviceCount || 1;
      const deviceConnectorProgress = Math.min(deviceCount / 2 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_DEVICE_CONNECTOR',
        deviceConnectorProgress
      );
      
      // Update device-specific achievements
      switch (deviceType) {
        case DeviceType.SMARTWATCH:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_SMARTWATCH_CONNECTED',
            100
          );
          break;
        case DeviceType.FITNESS_TRACKER:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_FITNESS_TRACKER_CONNECTED',
            100
          );
          break;
        case DeviceType.SMART_SCALE:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_SMART_SCALE_CONNECTED',
            100
          );
          break;
        case DeviceType.BLOOD_PRESSURE_MONITOR:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_BP_MONITOR_CONNECTED',
            100
          );
          break;
        case DeviceType.GLUCOSE_MONITOR:
          await this.achievementsService.updateAchievementProgress(
            profileId,
            'HEALTH_GLUCOSE_MONITOR_CONNECTED',
            100
          );
          break;
      }
      
      this.loggerService.log(
        'Processed device connected event',
        { profileId, deviceType, deviceCount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing device connected event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.DEVICE_CONNECTED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a device synced event.
   * Awards XP and potentially unlocks achievements related to syncing health devices.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The device synced event data
   */
  private async processDeviceSyncedEvent(profileId: string, event: DeviceEvent): Promise<void> {
    try {
      // Extract device data
      const { data } = event;
      const deviceType = data.deviceType;
      const dataPoints = data.dataPoints || 0;
      
      // Award XP for syncing a health device (bonus for more data points)
      let xpAmount = 5;
      if (dataPoints > 1000) {
        xpAmount = 15;
      } else if (dataPoints > 100) {
        xpAmount = 10;
      }
      
      await this.profilesService.addXp(profileId, xpAmount, {
        source: 'health_journey',
        eventType: HealthEventType.DEVICE_SYNCED,
        deviceType,
        dataPoints
      });
      
      // Update progress for "Device Syncer" achievement based on count
      const syncCount = data.syncCount || 1;
      const deviceSyncerProgress = Math.min(syncCount / 10 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'HEALTH_DEVICE_SYNCER',
        deviceSyncerProgress
      );
      
      this.loggerService.log(
        'Processed device synced event',
        { profileId, deviceType, syncCount, dataPoints },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing device synced event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.DEVICE_SYNCED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a device milestone reached event.
   * Awards XP and potentially unlocks achievements related to reaching device usage milestones.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The device milestone reached event data
   */
  private async processDeviceMilestoneReachedEvent(profileId: string, event: DeviceEvent): Promise<void> {
    try {
      // Extract device data
      const { data } = event;
      const deviceType = data.deviceType;
      const syncCount = data.syncCount || 0;
      
      // Award XP for reaching a device milestone
      await this.profilesService.addXp(profileId, 25, {
        source: 'health_journey',
        eventType: HealthEventType.DEVICE_MILESTONE_REACHED,
        deviceType,
        syncCount
      });
      
      // Update progress for "Device Master" achievement
      if (syncCount >= 30) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_DEVICE_MASTER',
          100
        );
      }
      
      // Update device-specific milestone achievements
      if (deviceType === DeviceType.FITNESS_TRACKER && syncCount >= 30) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'HEALTH_FITNESS_TRACKER_MASTER',
          100
        );
      }
      
      this.loggerService.log(
        'Processed device milestone reached event',
        { profileId, deviceType, syncCount },
        'HealthJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing device milestone reached event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: HealthEventType.DEVICE_MILESTONE_REACHED
        },
        'HealthJourneyConsumer'
      );
      throw error;
    }
  }
}