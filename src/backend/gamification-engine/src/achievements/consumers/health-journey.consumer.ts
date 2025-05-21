import { Injectable, Logger } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { AchievementsService } from '../achievements.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { EventsService } from '../../events/events.service';
import { IEventResponse } from '../../events/interfaces/event-response.interface';
import { JourneyType } from '../../common/interfaces/journey.interface';
import { IBaseEvent } from '../../common/interfaces/base-event.interface';
import { IRetryPolicy } from '../../common/interfaces/retry-policy.interface';
import { IEventMetadata } from '../../common/interfaces/event-metadata.interface';

/**
 * Health journey event types processed by this consumer
 */
enum HealthEventType {
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  HEALTH_INSIGHT_GENERATED = 'HEALTH_INSIGHT_GENERATED',
  DEVICE_SYNCHRONIZED = 'DEVICE_SYNCHRONIZED'
}

/**
 * Interface for health metric recorded event payload
 */
interface IHealthMetricRecordedPayload {
  userId: string;
  metricType: string; // e.g., 'steps', 'weight', 'blood_pressure', 'heart_rate'
  value: number;
  unit: string;
  timestamp: string;
  source?: string; // Optional source of the metric (manual, device, etc.)
}

/**
 * Interface for goal achieved event payload
 */
interface IGoalAchievedPayload {
  userId: string;
  goalId: string;
  goalType: string; // e.g., 'steps', 'weight_loss', 'activity_minutes'
  targetValue: number;
  actualValue: number;
  completedAt: string;
}

/**
 * Interface for health insight generated event payload
 */
interface IHealthInsightGeneratedPayload {
  userId: string;
  insightId: string;
  insightType: string; // e.g., 'trend', 'anomaly', 'recommendation'
  description: string;
  relatedMetrics: string[];
  generatedAt: string;
}

/**
 * Interface for device synchronized event payload
 */
interface IDeviceSynchronizedPayload {
  userId: string;
  deviceId: string;
  deviceType: string; // e.g., 'fitbit', 'apple_watch', 'glucose_monitor'
  syncedAt: string;
  metricsCount: number;
  lastSyncedAt?: string; // Optional previous sync timestamp
}

/**
 * Type for all possible health journey event payloads
 */
type HealthEventPayload = 
  | IHealthMetricRecordedPayload 
  | IGoalAchievedPayload 
  | IHealthInsightGeneratedPayload 
  | IDeviceSynchronizedPayload;

/**
 * Interface for health journey events
 */
interface IHealthJourneyEvent extends IBaseEvent {
  type: HealthEventType;
  payload: HealthEventPayload;
  metadata: IEventMetadata;
}

/**
 * Kafka consumer that processes achievement-related events from the Health Journey service.
 * Handles health metric recordings, goal achievements, health insights, and device synchronization events.
 * Extends BaseConsumer with health-specific event processing logic to trigger appropriate achievements.
 */
@Injectable()
export class HealthJourneyConsumer {
  private readonly logger = new Logger(HealthJourneyConsumer.name);
  private readonly CONSUMER_GROUP = 'gamification-health-achievements';
  private readonly TOPIC = 'health-journey-events';
  
  // Retry policy configuration for health journey events
  private readonly retryPolicy: IRetryPolicy = {
    maxRetries: 3,
    initialBackoffMs: 1000,
    backoffMultiplier: 2,
    maxBackoffMs: 10000
  };

  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly profilesService: ProfilesService,
    private readonly eventsService: EventsService
  ) {}

  /**
   * Process health journey events from Kafka
   * @param data The event data
   * @param context Kafka message context
   * @returns Promise with event processing result
   */
  async onMessage(data: IHealthJourneyEvent, context: KafkaContext): Promise<IEventResponse> {
    const messageId = context.getMessage().headers['message-id']?.toString() || 'unknown';
    const correlationId = context.getMessage().headers['correlation-id']?.toString() || 'unknown';
    
    this.logger.debug(
      `Processing health journey event: ${data.type} with messageId: ${messageId}`,
      { correlationId, eventType: data.type }
    );

    try {
      // Validate the event data
      this.validateEvent(data);
      
      // Process the event based on its type
      switch (data.type) {
        case HealthEventType.HEALTH_METRIC_RECORDED:
          return await this.processHealthMetricRecorded(data.payload as IHealthMetricRecordedPayload, correlationId);
        
        case HealthEventType.GOAL_ACHIEVED:
          return await this.processGoalAchieved(data.payload as IGoalAchievedPayload, correlationId);
        
        case HealthEventType.HEALTH_INSIGHT_GENERATED:
          return await this.processHealthInsightGenerated(data.payload as IHealthInsightGeneratedPayload, correlationId);
        
        case HealthEventType.DEVICE_SYNCHRONIZED:
          return await this.processDeviceSynchronized(data.payload as IDeviceSynchronizedPayload, correlationId);
        
        default:
          throw new Error(`Unsupported health journey event type: ${data.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing health journey event: ${error.message}`,
        { correlationId, eventType: data.type, error: error.stack }
      );
      
      // Return error response
      return {
        success: false,
        error: {
          message: error.message,
          code: 'HEALTH_EVENT_PROCESSING_ERROR',
          details: error.stack
        },
        metadata: {
          correlationId,
          messageId,
          eventType: data.type
        }
      };
    }
  }

  /**
   * Validates the health journey event structure
   * @param event The event to validate
   * @throws Error if validation fails
   */
  private validateEvent(event: IHealthJourneyEvent): void {
    if (!event) {
      throw new Error('Event is required');
    }
    
    if (!event.type) {
      throw new Error('Event type is required');
    }
    
    if (!Object.values(HealthEventType).includes(event.type as HealthEventType)) {
      throw new Error(`Invalid health journey event type: ${event.type}`);
    }
    
    if (!event.payload) {
      throw new Error('Event payload is required');
    }
    
    // Validate payload based on event type
    switch (event.type) {
      case HealthEventType.HEALTH_METRIC_RECORDED:
        this.validateHealthMetricPayload(event.payload as IHealthMetricRecordedPayload);
        break;
      
      case HealthEventType.GOAL_ACHIEVED:
        this.validateGoalAchievedPayload(event.payload as IGoalAchievedPayload);
        break;
      
      case HealthEventType.HEALTH_INSIGHT_GENERATED:
        this.validateHealthInsightPayload(event.payload as IHealthInsightGeneratedPayload);
        break;
      
      case HealthEventType.DEVICE_SYNCHRONIZED:
        this.validateDeviceSynchronizedPayload(event.payload as IDeviceSynchronizedPayload);
        break;
    }
  }

  /**
   * Validates health metric recorded payload
   * @param payload The payload to validate
   * @throws Error if validation fails
   */
  private validateHealthMetricPayload(payload: IHealthMetricRecordedPayload): void {
    if (!payload.userId) {
      throw new Error('Health metric payload requires userId');
    }
    
    if (!payload.metricType) {
      throw new Error('Health metric payload requires metricType');
    }
    
    if (payload.value === undefined || payload.value === null) {
      throw new Error('Health metric payload requires value');
    }
    
    if (!payload.unit) {
      throw new Error('Health metric payload requires unit');
    }
    
    if (!payload.timestamp) {
      throw new Error('Health metric payload requires timestamp');
    }
  }

  /**
   * Validates goal achieved payload
   * @param payload The payload to validate
   * @throws Error if validation fails
   */
  private validateGoalAchievedPayload(payload: IGoalAchievedPayload): void {
    if (!payload.userId) {
      throw new Error('Goal achieved payload requires userId');
    }
    
    if (!payload.goalId) {
      throw new Error('Goal achieved payload requires goalId');
    }
    
    if (!payload.goalType) {
      throw new Error('Goal achieved payload requires goalType');
    }
    
    if (payload.targetValue === undefined || payload.targetValue === null) {
      throw new Error('Goal achieved payload requires targetValue');
    }
    
    if (payload.actualValue === undefined || payload.actualValue === null) {
      throw new Error('Goal achieved payload requires actualValue');
    }
    
    if (!payload.completedAt) {
      throw new Error('Goal achieved payload requires completedAt');
    }
  }

  /**
   * Validates health insight generated payload
   * @param payload The payload to validate
   * @throws Error if validation fails
   */
  private validateHealthInsightPayload(payload: IHealthInsightGeneratedPayload): void {
    if (!payload.userId) {
      throw new Error('Health insight payload requires userId');
    }
    
    if (!payload.insightId) {
      throw new Error('Health insight payload requires insightId');
    }
    
    if (!payload.insightType) {
      throw new Error('Health insight payload requires insightType');
    }
    
    if (!payload.description) {
      throw new Error('Health insight payload requires description');
    }
    
    if (!Array.isArray(payload.relatedMetrics)) {
      throw new Error('Health insight payload requires relatedMetrics array');
    }
    
    if (!payload.generatedAt) {
      throw new Error('Health insight payload requires generatedAt');
    }
  }

  /**
   * Validates device synchronized payload
   * @param payload The payload to validate
   * @throws Error if validation fails
   */
  private validateDeviceSynchronizedPayload(payload: IDeviceSynchronizedPayload): void {
    if (!payload.userId) {
      throw new Error('Device synchronized payload requires userId');
    }
    
    if (!payload.deviceId) {
      throw new Error('Device synchronized payload requires deviceId');
    }
    
    if (!payload.deviceType) {
      throw new Error('Device synchronized payload requires deviceType');
    }
    
    if (!payload.syncedAt) {
      throw new Error('Device synchronized payload requires syncedAt');
    }
    
    if (payload.metricsCount === undefined || payload.metricsCount === null) {
      throw new Error('Device synchronized payload requires metricsCount');
    }
  }

  /**
   * Processes health metric recorded events
   * @param payload The event payload
   * @param correlationId Correlation ID for tracing
   * @returns Promise with event processing result
   */
  private async processHealthMetricRecorded(
    payload: IHealthMetricRecordedPayload,
    correlationId: string
  ): Promise<IEventResponse> {
    this.logger.debug(
      `Processing health metric recorded: ${payload.metricType} with value ${payload.value} ${payload.unit}`,
      { correlationId, userId: payload.userId, metricType: payload.metricType }
    );

    try {
      // Get user profile
      const userProfile = await this.profilesService.findByUserId(payload.userId);
      if (!userProfile) {
        throw new Error(`User profile not found for userId: ${payload.userId}`);
      }

      // Track achievements based on metric type
      const achievementsToCheck = [];
      const xpAwarded = 0;
      
      // Different logic based on metric type
      switch (payload.metricType) {
        case 'steps':
          // Check for step-related achievements
          achievementsToCheck.push(
            'daily_steps_5000',
            'daily_steps_10000',
            'weekly_steps_50000'
          );
          
          // Award XP for recording steps
          await this.profilesService.addExperiencePoints(userProfile.id, 5, {
            source: 'health_metric',
            metricType: payload.metricType,
            journey: JourneyType.HEALTH
          });
          break;
          
        case 'weight':
          // Check for weight tracking achievements
          achievementsToCheck.push(
            'weight_tracking_streak_7',
            'weight_tracking_streak_30'
          );
          
          // Award XP for recording weight
          await this.profilesService.addExperiencePoints(userProfile.id, 10, {
            source: 'health_metric',
            metricType: payload.metricType,
            journey: JourneyType.HEALTH
          });
          break;
          
        case 'blood_pressure':
          // Check for blood pressure tracking achievements
          achievementsToCheck.push(
            'blood_pressure_tracking_streak_7',
            'blood_pressure_tracking_streak_30'
          );
          
          // Award XP for recording blood pressure
          await this.profilesService.addExperiencePoints(userProfile.id, 15, {
            source: 'health_metric',
            metricType: payload.metricType,
            journey: JourneyType.HEALTH
          });
          break;
          
        case 'heart_rate':
          // Check for heart rate tracking achievements
          achievementsToCheck.push(
            'heart_rate_tracking_streak_7',
            'heart_rate_tracking_streak_30'
          );
          
          // Award XP for recording heart rate
          await this.profilesService.addExperiencePoints(userProfile.id, 10, {
            source: 'health_metric',
            metricType: payload.metricType,
            journey: JourneyType.HEALTH
          });
          break;
          
        default:
          // Generic health metric tracking
          achievementsToCheck.push('health_tracking_enthusiast');
          
          // Award XP for recording any health metric
          await this.profilesService.addExperiencePoints(userProfile.id, 5, {
            source: 'health_metric',
            metricType: payload.metricType,
            journey: JourneyType.HEALTH
          });
      }

      // Check for achievements
      const unlockedAchievements = [];
      for (const achievementCode of achievementsToCheck) {
        const achievement = await this.achievementsService.findByCode(achievementCode);
        if (!achievement) {
          this.logger.warn(
            `Achievement not found with code: ${achievementCode}`,
            { correlationId, userId: payload.userId }
          );
          continue;
        }
        
        // Check if achievement is already unlocked
        const userAchievement = await this.achievementsService.getUserAchievement(
          userProfile.id,
          achievement.id
        );
        
        if (userAchievement && userAchievement.unlocked) {
          continue; // Already unlocked
        }
        
        // Process achievement based on its code
        // This is simplified logic - in a real implementation, this would be more complex
        // and would likely involve checking historical data
        let shouldUnlock = false;
        let progress = 0;
        
        // Example logic for step achievements
        if (achievementCode === 'daily_steps_5000' && payload.metricType === 'steps' && payload.value >= 5000) {
          shouldUnlock = true;
          progress = 100;
        } else if (achievementCode === 'daily_steps_10000' && payload.metricType === 'steps' && payload.value >= 10000) {
          shouldUnlock = true;
          progress = 100;
        } else if (achievementCode === 'health_tracking_enthusiast') {
          // Update progress for general health tracking
          progress = userAchievement ? Math.min(userAchievement.progress + 5, 100) : 5;
          shouldUnlock = progress >= 100;
        }
        
        // Update achievement progress or unlock it
        if (shouldUnlock) {
          await this.achievementsService.unlockAchievement(userProfile.id, achievement.id);
          unlockedAchievements.push(achievement);
        } else if (progress > 0) {
          await this.achievementsService.updateAchievementProgress(
            userProfile.id,
            achievement.id,
            progress
          );
        }
      }

      return {
        success: true,
        metadata: {
          correlationId,
          userId: payload.userId,
          journey: JourneyType.HEALTH,
          xpAwarded,
          unlockedAchievements: unlockedAchievements.map(a => a.id)
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing health metric recorded event: ${error.message}`,
        { correlationId, userId: payload.userId, error: error.stack }
      );
      
      throw error;
    }
  }

  /**
   * Processes goal achieved events
   * @param payload The event payload
   * @param correlationId Correlation ID for tracing
   * @returns Promise with event processing result
   */
  private async processGoalAchieved(
    payload: IGoalAchievedPayload,
    correlationId: string
  ): Promise<IEventResponse> {
    this.logger.debug(
      `Processing goal achieved: ${payload.goalType} with target ${payload.targetValue}`,
      { correlationId, userId: payload.userId, goalId: payload.goalId }
    );

    try {
      // Get user profile
      const userProfile = await this.profilesService.findByUserId(payload.userId);
      if (!userProfile) {
        throw new Error(`User profile not found for userId: ${payload.userId}`);
      }

      // Award XP for achieving a goal (base XP + bonus based on goal type)
      let xpAwarded = 50; // Base XP for any goal
      
      // Additional XP based on goal type
      switch (payload.goalType) {
        case 'steps':
          xpAwarded += 10;
          break;
        case 'weight_loss':
          xpAwarded += 25;
          break;
        case 'activity_minutes':
          xpAwarded += 15;
          break;
        default:
          xpAwarded += 5;
      }
      
      // Award XP
      await this.profilesService.addExperiencePoints(userProfile.id, xpAwarded, {
        source: 'goal_achieved',
        goalType: payload.goalType,
        journey: JourneyType.HEALTH
      });

      // Check for goal-related achievements
      const achievementsToCheck = [
        'first_goal_achieved',
        'five_goals_achieved',
        'ten_goals_achieved',
        `${payload.goalType}_master` // e.g., steps_master, weight_loss_master
      ];
      
      // Check for achievements
      const unlockedAchievements = [];
      for (const achievementCode of achievementsToCheck) {
        const achievement = await this.achievementsService.findByCode(achievementCode);
        if (!achievement) {
          this.logger.warn(
            `Achievement not found with code: ${achievementCode}`,
            { correlationId, userId: payload.userId }
          );
          continue;
        }
        
        // Check if achievement is already unlocked
        const userAchievement = await this.achievementsService.getUserAchievement(
          userProfile.id,
          achievement.id
        );
        
        if (userAchievement && userAchievement.unlocked) {
          continue; // Already unlocked
        }
        
        // Process achievement based on its code
        let shouldUnlock = false;
        let progress = 0;
        
        // Example logic for goal achievements
        if (achievementCode === 'first_goal_achieved') {
          shouldUnlock = true;
          progress = 100;
        } else if (achievementCode.endsWith('_master') && achievementCode.startsWith(payload.goalType)) {
          // Update progress for goal type mastery
          progress = userAchievement ? Math.min(userAchievement.progress + 20, 100) : 20;
          shouldUnlock = progress >= 100;
        } else if (achievementCode === 'five_goals_achieved' || achievementCode === 'ten_goals_achieved') {
          // These would require checking historical data in a real implementation
          // For now, just update progress as an example
          progress = userAchievement ? Math.min(userAchievement.progress + 20, 100) : 20;
          shouldUnlock = progress >= 100;
        }
        
        // Update achievement progress or unlock it
        if (shouldUnlock) {
          await this.achievementsService.unlockAchievement(userProfile.id, achievement.id);
          unlockedAchievements.push(achievement);
        } else if (progress > 0) {
          await this.achievementsService.updateAchievementProgress(
            userProfile.id,
            achievement.id,
            progress
          );
        }
      }

      return {
        success: true,
        metadata: {
          correlationId,
          userId: payload.userId,
          journey: JourneyType.HEALTH,
          xpAwarded,
          unlockedAchievements: unlockedAchievements.map(a => a.id)
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing goal achieved event: ${error.message}`,
        { correlationId, userId: payload.userId, error: error.stack }
      );
      
      throw error;
    }
  }

  /**
   * Processes health insight generated events
   * @param payload The event payload
   * @param correlationId Correlation ID for tracing
   * @returns Promise with event processing result
   */
  private async processHealthInsightGenerated(
    payload: IHealthInsightGeneratedPayload,
    correlationId: string
  ): Promise<IEventResponse> {
    this.logger.debug(
      `Processing health insight generated: ${payload.insightType}`,
      { correlationId, userId: payload.userId, insightId: payload.insightId }
    );

    try {
      // Get user profile
      const userProfile = await this.profilesService.findByUserId(payload.userId);
      if (!userProfile) {
        throw new Error(`User profile not found for userId: ${payload.userId}`);
      }

      // Award XP for receiving a health insight
      const xpAwarded = 20;
      await this.profilesService.addExperiencePoints(userProfile.id, xpAwarded, {
        source: 'health_insight',
        insightType: payload.insightType,
        journey: JourneyType.HEALTH
      });

      // Check for insight-related achievements
      const achievementsToCheck = [
        'first_health_insight',
        'health_data_analyst',
        'insight_explorer'
      ];
      
      // Check for achievements
      const unlockedAchievements = [];
      for (const achievementCode of achievementsToCheck) {
        const achievement = await this.achievementsService.findByCode(achievementCode);
        if (!achievement) {
          this.logger.warn(
            `Achievement not found with code: ${achievementCode}`,
            { correlationId, userId: payload.userId }
          );
          continue;
        }
        
        // Check if achievement is already unlocked
        const userAchievement = await this.achievementsService.getUserAchievement(
          userProfile.id,
          achievement.id
        );
        
        if (userAchievement && userAchievement.unlocked) {
          continue; // Already unlocked
        }
        
        // Process achievement based on its code
        let shouldUnlock = false;
        let progress = 0;
        
        // Example logic for insight achievements
        if (achievementCode === 'first_health_insight') {
          shouldUnlock = true;
          progress = 100;
        } else if (achievementCode === 'health_data_analyst' || achievementCode === 'insight_explorer') {
          // Update progress for insight-related achievements
          progress = userAchievement ? Math.min(userAchievement.progress + 25, 100) : 25;
          shouldUnlock = progress >= 100;
        }
        
        // Update achievement progress or unlock it
        if (shouldUnlock) {
          await this.achievementsService.unlockAchievement(userProfile.id, achievement.id);
          unlockedAchievements.push(achievement);
        } else if (progress > 0) {
          await this.achievementsService.updateAchievementProgress(
            userProfile.id,
            achievement.id,
            progress
          );
        }
      }

      return {
        success: true,
        metadata: {
          correlationId,
          userId: payload.userId,
          journey: JourneyType.HEALTH,
          xpAwarded,
          unlockedAchievements: unlockedAchievements.map(a => a.id)
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing health insight generated event: ${error.message}`,
        { correlationId, userId: payload.userId, error: error.stack }
      );
      
      throw error;
    }
  }

  /**
   * Processes device synchronized events
   * @param payload The event payload
   * @param correlationId Correlation ID for tracing
   * @returns Promise with event processing result
   */
  private async processDeviceSynchronized(
    payload: IDeviceSynchronizedPayload,
    correlationId: string
  ): Promise<IEventResponse> {
    this.logger.debug(
      `Processing device synchronized: ${payload.deviceType} with ${payload.metricsCount} metrics`,
      { correlationId, userId: payload.userId, deviceId: payload.deviceId }
    );

    try {
      // Get user profile
      const userProfile = await this.profilesService.findByUserId(payload.userId);
      if (!userProfile) {
        throw new Error(`User profile not found for userId: ${payload.userId}`);
      }

      // Award XP for syncing a device (base XP + bonus based on metrics count)
      let xpAwarded = 10; // Base XP for any sync
      
      // Bonus XP based on metrics count
      if (payload.metricsCount > 100) {
        xpAwarded += 15;
      } else if (payload.metricsCount > 50) {
        xpAwarded += 10;
      } else if (payload.metricsCount > 10) {
        xpAwarded += 5;
      }
      
      // Award XP
      await this.profilesService.addExperiencePoints(userProfile.id, xpAwarded, {
        source: 'device_sync',
        deviceType: payload.deviceType,
        journey: JourneyType.HEALTH
      });

      // Check for device-related achievements
      const achievementsToCheck = [
        'first_device_sync',
        'device_sync_streak_7',
        'device_sync_streak_30',
        'multi_device_user'
      ];
      
      // Check for achievements
      const unlockedAchievements = [];
      for (const achievementCode of achievementsToCheck) {
        const achievement = await this.achievementsService.findByCode(achievementCode);
        if (!achievement) {
          this.logger.warn(
            `Achievement not found with code: ${achievementCode}`,
            { correlationId, userId: payload.userId }
          );
          continue;
        }
        
        // Check if achievement is already unlocked
        const userAchievement = await this.achievementsService.getUserAchievement(
          userProfile.id,
          achievement.id
        );
        
        if (userAchievement && userAchievement.unlocked) {
          continue; // Already unlocked
        }
        
        // Process achievement based on its code
        let shouldUnlock = false;
        let progress = 0;
        
        // Example logic for device sync achievements
        if (achievementCode === 'first_device_sync') {
          shouldUnlock = true;
          progress = 100;
        } else if (achievementCode === 'device_sync_streak_7' || achievementCode === 'device_sync_streak_30') {
          // These would require checking historical data in a real implementation
          // For now, just update progress as an example
          progress = userAchievement ? Math.min(userAchievement.progress + 15, 100) : 15;
          shouldUnlock = progress >= 100;
        } else if (achievementCode === 'multi_device_user') {
          // This would require checking if the user has synced multiple device types
          // For now, just update progress as an example
          progress = userAchievement ? Math.min(userAchievement.progress + 25, 100) : 25;
          shouldUnlock = progress >= 100;
        }
        
        // Update achievement progress or unlock it
        if (shouldUnlock) {
          await this.achievementsService.unlockAchievement(userProfile.id, achievement.id);
          unlockedAchievements.push(achievement);
        } else if (progress > 0) {
          await this.achievementsService.updateAchievementProgress(
            userProfile.id,
            achievement.id,
            progress
          );
        }
      }

      return {
        success: true,
        metadata: {
          correlationId,
          userId: payload.userId,
          journey: JourneyType.HEALTH,
          xpAwarded,
          unlockedAchievements: unlockedAchievements.map(a => a.id)
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing device synchronized event: ${error.message}`,
        { correlationId, userId: payload.userId, error: error.stack }
      );
      
      throw error;
    }
  }
}