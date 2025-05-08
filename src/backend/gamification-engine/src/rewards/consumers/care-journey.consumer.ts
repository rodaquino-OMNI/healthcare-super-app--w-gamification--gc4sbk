/**
 * @file care-journey.consumer.ts
 * @description Kafka consumer that processes reward-related events from the Care Journey service.
 * Handles appointment bookings, medication adherence tracking, telemedicine sessions, and care plan progress rewards.
 * Extends BaseConsumer with care-specific reward processing logic.
 * 
 * This consumer is responsible for:
 * - Processing appointment booking reward events
 * - Handling medication adherence tracking events
 * - Processing telemedicine session reward events
 * - Managing care plan progress reward events
 * - Integrating with the cross-journey achievement system
 * 
 * @author AUSTA SuperApp Team
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { BaseConsumer } from './base.consumer';
import { RewardsService } from '../rewards.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { RulesService } from '../../rules/rules.service';
import { DlqService } from '../../common/kafka/dlq.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { AchievementsService } from '../../achievements/achievements.service';
import { EventErrorCategory } from '../../common/enums/event-error-category.enum';
import { JourneyType } from '@austa/interfaces/common/dto';
import {
  IRewardEvent,
  RewardEventType,
  CareRewardTriggeredPayload,
  isCareRewardTriggeredPayload,
  RewardEventPayload,
} from './reward-events.types';

/**
 * Kafka consumer that processes reward-related events from the Care Journey service.
 * Handles appointment bookings, medication adherence tracking, telemedicine sessions, and care plan progress rewards.
 * Extends BaseConsumer with care-specific reward processing logic.
 */
@Injectable()
export class CareJourneyConsumer extends BaseConsumer {
  private readonly logger = new Logger(CareJourneyConsumer.name);

  /**
   * Creates a new instance of the CareJourneyConsumer
   * 
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for structured logging
   * @param tracingService - Service for distributed tracing
   * @param configService - Service for accessing configuration
   * @param achievementsService - Service for managing achievements
   * @param profilesService - Service for managing user profiles
   * @param rulesService - Service for evaluating achievement rules
   * @param dlqService - Service for managing the dead letter queue
   * @param metricsService - Service for recording metrics
   * @param rewardsService - Service for managing rewards
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly loggerService: LoggerService,
    protected readonly tracingService: TracingService,
    protected readonly configService: ConfigService,
    protected readonly achievementsService: AchievementsService,
    protected readonly profilesService: ProfilesService,
    protected readonly rulesService: RulesService,
    protected readonly dlqService: DlqService,
    protected readonly metricsService: MetricsService,
    private readonly rewardsService: RewardsService,
  ) {
    super(
      kafkaService,
      loggerService,
      tracingService,
      configService,
      achievementsService,
      profilesService,
      rulesService,
      dlqService,
      metricsService,
      {
        topic: configService.get<string>('KAFKA_CARE_REWARD_TOPICS', 'care-reward-events'),
        groupId: 'gamification-care-rewards-consumer',
        maxRetries: configService.get<number>('KAFKA_MAX_RETRIES', 3),
        initialRetryDelay: configService.get<number>('KAFKA_INITIAL_RETRY_DELAY', 1000),
        maxRetryDelay: configService.get<number>('KAFKA_MAX_RETRY_DELAY', 30000),
        useJitter: configService.get<boolean>('KAFKA_USE_RETRY_JITTER', true),
      },
    );
  }

  /**
   * Connects to Kafka and subscribes to care journey reward topics
   */
  async connect(): Promise<void> {
    try {
      const careTopics = this.configService.get<string[]>('KAFKA_CARE_REWARD_TOPICS', [
        'care-appointment-rewards',
        'care-medication-rewards',
        'care-telemedicine-rewards',
        'care-plan-rewards',
      ]);

      this.logger.log(`Connecting to Kafka topics: ${careTopics.join(', ')}`);

      // Subscribe to all care journey topics
      for (const topic of careTopics) {
        await this.kafkaService.consume(
          topic,
          'gamification-care-rewards-consumer',
          this.processMessage.bind(this)
        );
      }

      this.logger.log('Successfully connected to all care journey reward topics');
    } catch (error) {
      this.logger.error(
        'Failed to connect to care journey reward topics',
        error.stack
      );
      throw error;
    }
  }

  /**
   * Processes a reward event from the Care Journey service
   * @param event - The reward event to process
   * @returns A promise that resolves to the event processing result
   */
  protected async processEvent(event: IRewardEvent): Promise<any> {
    // Create a correlation ID for tracking this event through the system
    const correlationId = this.tracingService.generateCorrelationId();
    
    // Create a logger context with the correlation ID
    const contextLogger = this.loggerService.createContextLogger({
      correlationId,
      eventType: event.type,
      userId: event.userId,
      journey: JourneyType.CARE,
    });
    
    // Create a trace span for this event processing
    const span = this.tracingService.createSpan(
      'process_care_reward_event',
      { eventType: event.type, userId: event.userId, correlationId }
    );

    // Start metrics tracking
    const processingTimer = this.metricsService.startTimer(
      'care_reward_processing_duration',
      { eventType: event.type }
    );

    try {
      contextLogger.log(`Processing care reward event: ${event.type} for user ${event.userId}`);

      // Validate that this is a care journey event
      if (!this.isSupportedEvent(event)) {
        contextLogger.warn(`Unsupported event type: ${event.type}`, {
          eventId: event.eventId,
          journey: event.journey,
        });
        
        return {
          success: false,
          error: 'Unsupported event type',
          errorCategory: EventErrorCategory.VALIDATION,
          correlationId,
        };
      }

      // Process the event based on its type
      let result;
      switch (event.type) {
        case RewardEventType.CARE_APPOINTMENT_REWARD:
          result = await this.processAppointmentReward(event);
          break;

        case RewardEventType.CARE_MEDICATION_REWARD:
          result = await this.processMedicationReward(event);
          break;

        case RewardEventType.CARE_TELEMEDICINE_REWARD:
          result = await this.processTelemedicineReward(event);
          break;

        case RewardEventType.CARE_PLAN_PROGRESS_REWARD:
          result = await this.processCareProgressReward(event);
          break;

        case RewardEventType.CARE_REWARD_TRIGGERED:
          result = await this.processCareRewardTriggered(event);
          break;

        default:
          contextLogger.warn(`Unhandled care event type: ${event.type}`);
          return {
            success: false,
            error: `Unhandled care event type: ${event.type}`,
            errorCategory: EventErrorCategory.VALIDATION,
            correlationId,
          };
      }
      
      // Add correlation ID to the result
      result.correlationId = correlationId;
      
      // Log success
      contextLogger.log(
        `Successfully processed care reward event: ${event.type} for user ${event.userId}`,
        { result }
      );
      
      // Record success metric
      this.metricsService.incrementCounter('care_reward_events_processed', {
        eventType: event.type,
        success: 'true',
      });
      
      return result;
    } catch (error) {
      // Classify the error
      const errorCategory = this.classifyError(error);
      
      contextLogger.error(
        `Error processing care reward event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          errorCategory,
          eventId: event.eventId,
        }
      );

      // Record error metric
      this.metricsService.incrementCounter('care_reward_events_processed', {
        eventType: event.type,
        success: 'false',
        errorCategory,
        errorType: error.name || 'UnknownError',
      });

      // Rethrow with additional context
      error.correlationId = correlationId;
      error.eventType = event.type;
      error.userId = event.userId;
      error.category = errorCategory;
      throw error;
    } finally {
      // End the trace span
      span.end();
      
      // Stop the metrics timer
      processingTimer.end();
    }
  }

  /**
   * Processes an appointment booking reward event
   * @param event - The appointment reward event
   * @returns The processing result
   */
  private async processAppointmentReward(event: IRewardEvent): Promise<any> {
    const payload = this.mapEventToPayload<CareRewardTriggeredPayload>(event);
    const { userId } = event;
    const { appointmentId } = payload.careContext;

    // Create a correlation ID for tracking this specific reward processing
    const correlationId = this.tracingService.generateCorrelationId();
    
    // Create a logger context with the correlation ID
    const contextLogger = this.loggerService.createContextLogger({
      correlationId,
      eventType: event.type,
      userId,
      appointmentId,
    });

    contextLogger.log(
      `Processing appointment reward for user ${userId} and appointment ${appointmentId}`,
      { 
        eventId: event.eventId,
        timestamp: event.timestamp,
        appointmentType: payload.careContext.additionalData?.appointmentType,
      }
    );

    // Start metrics timer
    const timer = this.metricsService.startTimer('appointment_reward_processing_time', {
      appointmentType: payload.careContext.additionalData?.appointmentType as string || 'unknown',
    });

    try {
      // Validate the appointment data
      if (!appointmentId) {
        contextLogger.warn('Missing appointmentId in care context');
        return { 
          success: false, 
          error: 'Missing appointmentId in care context',
          errorCategory: EventErrorCategory.VALIDATION,
        };
      }

      // Check if this is a duplicate event (appointment already rewarded)
      // This would typically involve checking a database or cache to see if this appointment
      // has already been processed for rewards
      const isDuplicate = await this.checkDuplicateAppointmentReward(userId, appointmentId);
      if (isDuplicate) {
        contextLogger.log(`Duplicate appointment reward event detected for appointment ${appointmentId}`);
        return { 
          success: true, 
          message: 'Appointment already rewarded', 
          duplicate: true,
        };
      }

      // Find appropriate reward based on appointment type
      // This is a simplified example - in a real implementation, you would have more complex logic
      // to determine which reward to grant based on the appointment details
      const appointmentType = payload.careContext.additionalData?.appointmentType as string;
      const rewardId = await this.determineAppointmentReward(payload);

      if (!rewardId) {
        contextLogger.log(
          `No reward applicable for appointment type: ${appointmentType || 'unknown'}`,
          { appointmentId }
        );
        return { 
          success: true, 
          message: 'No reward applicable for this appointment type',
          appointmentType,
        };
      }

      // Grant the reward to the user
      contextLogger.log(`Granting reward ${rewardId} for appointment ${appointmentId}`);
      const userReward = await this.rewardsService.grantReward(userId, rewardId);

      // Record the appointment as rewarded to prevent duplicate rewards
      await this.recordAppointmentRewarded(userId, appointmentId, rewardId);

      // Record success metric
      this.metricsService.incrementCounter('appointment_rewards_granted', {
        success: 'true',
        appointmentType: appointmentType || 'unknown',
      });

      // Check if this appointment contributes to cross-journey achievements
      await this.checkCrossJourneyAchievements(userId, event);

      contextLogger.log(
        `Successfully processed appointment reward for user ${userId}`,
        { 
          appointmentId, 
          rewardId: userReward.rewardId, 
          xpAwarded: userReward.reward.xpReward,
          appointmentType,
        }
      );

      return {
        success: true,
        rewardId: userReward.rewardId,
        xpAwarded: userReward.reward.xpReward,
        appointmentType,
        appointmentId,
      };
    } catch (error) {
      // Record failure metric
      this.metricsService.incrementCounter('appointment_rewards_granted', {
        success: 'false',
        errorType: error.name || 'UnknownError',
        appointmentType: payload.careContext.additionalData?.appointmentType as string || 'unknown',
      });

      contextLogger.error(
        `Error processing appointment reward: ${error.message}`,
        { 
          error: error.message, 
          stack: error.stack,
          appointmentId,
          userId,
        }
      );

      throw error;
    } finally {
      // End metrics timer
      timer.end();
    }
  }

  /**
   * Checks if an appointment has already been rewarded to prevent duplicates
   * @param userId - The user ID
   * @param appointmentId - The appointment ID
   * @returns True if the appointment has already been rewarded
   */
  private async checkDuplicateAppointmentReward(userId: string, appointmentId: string): Promise<boolean> {
    // In a real implementation, this would check a database or cache
    // For now, we'll just return false to simulate a new appointment
    // This is a placeholder for the actual implementation
    return false;
  }

  /**
   * Records that an appointment has been rewarded to prevent duplicate rewards
   * @param userId - The user ID
   * @param appointmentId - The appointment ID
   * @param rewardId - The reward ID that was granted
   */
  private async recordAppointmentRewarded(userId: string, appointmentId: string, rewardId: string): Promise<void> {
    // In a real implementation, this would record in a database or cache
    // This is a placeholder for the actual implementation
    this.logger.log(
      `Recording appointment ${appointmentId} as rewarded for user ${userId} with reward ${rewardId}`,
      { userId, appointmentId, rewardId }
    );
  }

  /**
   * Processes a medication adherence reward event
   * @param event - The medication reward event
   * @returns The processing result
   */
  private async processMedicationReward(event: IRewardEvent): Promise<any> {
    const payload = this.mapEventToPayload<CareRewardTriggeredPayload>(event);
    const { userId } = event;
    const { medicationId } = payload.careContext;

    this.logger.log(
      `Processing medication adherence reward for user ${userId} and medication ${medicationId}`,
      { eventType: event.type, userId, medicationId }
    );

    // Start metrics timer
    const timer = this.metricsService.startTimer('medication_reward_processing_time');

    try {
      // Determine if this is a streak-based reward (e.g., took medication for 7 days in a row)
      const streakCount = payload.careContext.additionalData?.streakCount as number;
      let rewardId: string | null = null;

      // Grant different rewards based on streak length
      if (streakCount >= 30) {
        // 30-day streak reward
        rewardId = await this.determineMedicationReward(payload, 'monthly');
      } else if (streakCount >= 7) {
        // 7-day streak reward
        rewardId = await this.determineMedicationReward(payload, 'weekly');
      } else if (streakCount >= 3) {
        // 3-day streak reward
        rewardId = await this.determineMedicationReward(payload, 'mini');
      }

      if (!rewardId) {
        this.logger.log(`No reward applicable for this medication adherence event`);
        return { success: true, message: 'No reward applicable' };
      }

      // Grant the reward to the user
      const userReward = await this.rewardsService.grantReward(userId, rewardId);

      // Record success metric
      this.metricsService.incrementCounter('medication_rewards_granted', {
        success: 'true',
        streakType: streakCount >= 30 ? 'monthly' : streakCount >= 7 ? 'weekly' : 'mini',
      });

      // Check if this medication adherence contributes to cross-journey achievements
      await this.checkCrossJourneyAchievements(userId, event);

      return {
        success: true,
        rewardId: userReward.rewardId,
        xpAwarded: userReward.reward.xpReward,
        streakCount,
      };
    } catch (error) {
      // Record failure metric
      this.metricsService.incrementCounter('medication_rewards_granted', {
        success: 'false',
        errorType: error.name || 'UnknownError',
      });

      throw error;
    } finally {
      // End metrics timer
      timer.end();
    }
  }

  /**
   * Processes a telemedicine session reward event
   * @param event - The telemedicine reward event
   * @returns The processing result
   */
  private async processTelemedicineReward(event: IRewardEvent): Promise<any> {
    const payload = this.mapEventToPayload<CareRewardTriggeredPayload>(event);
    const { userId } = event;
    const { telemedicineSessionId } = payload.careContext;

    this.logger.log(
      `Processing telemedicine reward for user ${userId} and session ${telemedicineSessionId}`,
      { eventType: event.type, userId, telemedicineSessionId }
    );

    // Start metrics timer
    const timer = this.metricsService.startTimer('telemedicine_reward_processing_time');

    try {
      // Determine the appropriate reward based on session type and duration
      const sessionType = payload.careContext.additionalData?.sessionType as string;
      const sessionDuration = payload.careContext.additionalData?.durationMinutes as number;

      // Find appropriate reward based on session details
      const rewardId = await this.determineTelemedicineReward(payload, sessionType, sessionDuration);

      if (!rewardId) {
        this.logger.log(`No reward applicable for this telemedicine session type`);
        return { success: true, message: 'No reward applicable' };
      }

      // Grant the reward to the user
      const userReward = await this.rewardsService.grantReward(userId, rewardId);

      // Record success metric
      this.metricsService.incrementCounter('telemedicine_rewards_granted', {
        success: 'true',
        sessionType: sessionType || 'unknown',
      });

      // Check if this telemedicine session contributes to cross-journey achievements
      await this.checkCrossJourneyAchievements(userId, event);

      return {
        success: true,
        rewardId: userReward.rewardId,
        xpAwarded: userReward.reward.xpReward,
        sessionType,
        sessionDuration,
      };
    } catch (error) {
      // Record failure metric
      this.metricsService.incrementCounter('telemedicine_rewards_granted', {
        success: 'false',
        errorType: error.name || 'UnknownError',
      });

      throw error;
    } finally {
      // End metrics timer
      timer.end();
    }
  }

  /**
   * Processes a care plan progress reward event
   * @param event - The care plan progress reward event
   * @returns The processing result
   */
  private async processCareProgressReward(event: IRewardEvent): Promise<any> {
    const payload = this.mapEventToPayload<CareRewardTriggeredPayload>(event);
    const { userId } = event;

    // Extract care plan progress details
    const planId = payload.careContext.additionalData?.planId as string;
    const progressPercentage = payload.careContext.additionalData?.progressPercentage as number;
    const completedTasks = payload.careContext.additionalData?.completedTasks as number;
    const totalTasks = payload.careContext.additionalData?.totalTasks as number;

    this.logger.log(
      `Processing care plan progress reward for user ${userId} and plan ${planId}`,
      { eventType: event.type, userId, planId, progressPercentage, completedTasks, totalTasks }
    );

    // Start metrics timer
    const timer = this.metricsService.startTimer('care_plan_reward_processing_time');

    try {
      // Determine if this progress milestone deserves a reward
      // Typically rewards at 25%, 50%, 75%, and 100% completion
      let rewardId: string | null = null;

      if (progressPercentage >= 100) {
        // Plan completed reward
        rewardId = await this.determineCareProgressReward(payload, 'completed');
      } else if (progressPercentage >= 75) {
        // 75% milestone reward
        rewardId = await this.determineCareProgressReward(payload, 'major_progress');
      } else if (progressPercentage >= 50) {
        // 50% milestone reward
        rewardId = await this.determineCareProgressReward(payload, 'half_way');
      } else if (progressPercentage >= 25) {
        // 25% milestone reward
        rewardId = await this.determineCareProgressReward(payload, 'getting_started');
      }

      if (!rewardId) {
        this.logger.log(`No reward applicable for this care plan progress milestone`);
        return { success: true, message: 'No reward applicable' };
      }

      // Grant the reward to the user
      const userReward = await this.rewardsService.grantReward(userId, rewardId);

      // Record success metric
      this.metricsService.incrementCounter('care_plan_rewards_granted', {
        success: 'true',
        progressMilestone: progressPercentage >= 100 ? 'completed' :
                           progressPercentage >= 75 ? 'major_progress' :
                           progressPercentage >= 50 ? 'half_way' : 'getting_started',
      });

      // Check if this care plan progress contributes to cross-journey achievements
      await this.checkCrossJourneyAchievements(userId, event);

      return {
        success: true,
        rewardId: userReward.rewardId,
        xpAwarded: userReward.reward.xpReward,
        progressPercentage,
        completedTasks,
        totalTasks,
      };
    } catch (error) {
      // Record failure metric
      this.metricsService.incrementCounter('care_plan_rewards_granted', {
        success: 'false',
        errorType: error.name || 'UnknownError',
      });

      throw error;
    } finally {
      // End metrics timer
      timer.end();
    }
  }

  /**
   * Processes a generic care reward triggered event
   * @param event - The care reward triggered event
   * @returns The processing result
   */
  private async processCareRewardTriggered(event: IRewardEvent): Promise<any> {
    const payload = this.mapEventToPayload<CareRewardTriggeredPayload>(event);
    const { userId } = event;
    const { rewardId, xpValue, granted } = payload;

    this.logger.log(
      `Processing care reward triggered event for user ${userId} and reward ${rewardId}`,
      { eventType: event.type, userId, rewardId, xpValue, granted }
    );

    // If the reward is already determined and should be granted
    if (granted && rewardId) {
      try {
        // Grant the reward to the user
        const userReward = await this.rewardsService.grantReward(userId, rewardId);

        // Record success metric
        this.metricsService.incrementCounter('care_rewards_granted', {
          success: 'true',
          triggerEvent: payload.triggerEvent,
        });

        // Check if this reward contributes to cross-journey achievements
        await this.checkCrossJourneyAchievements(userId, event);

        return {
          success: true,
          rewardId: userReward.rewardId,
          xpAwarded: userReward.reward.xpReward,
        };
      } catch (error) {
        // Record failure metric
        this.metricsService.incrementCounter('care_rewards_granted', {
          success: 'false',
          errorType: error.name || 'UnknownError',
        });

        throw error;
      }
    } else {
      // If the reward should not be granted, just acknowledge the event
      return {
        success: true,
        message: 'Reward not granted as specified in the event',
      };
    }
  }

  /**
   * Determines the appropriate reward for an appointment event
   * @param payload - The appointment event payload
   * @returns The reward ID or null if no reward is applicable
   */
  private async determineAppointmentReward(payload: CareRewardTriggeredPayload): Promise<string | null> {
    // In a real implementation, this would query the database or a rules engine
    // to determine the appropriate reward based on the appointment details
    const appointmentType = payload.careContext.additionalData?.appointmentType as string;
    
    // Example implementation - in a real system, this would be more sophisticated
    // and would likely involve database queries or rules engine evaluation
    switch (appointmentType?.toLowerCase()) {
      case 'annual_checkup':
        return 'reward-annual-checkup'; // ID of the annual checkup reward
      case 'specialist':
        return 'reward-specialist-visit'; // ID of the specialist visit reward
      case 'follow_up':
        return 'reward-follow-up'; // ID of the follow-up visit reward
      case 'preventive':
        return 'reward-preventive-care'; // ID of the preventive care reward
      default:
        return 'reward-general-appointment'; // ID of the general appointment reward
    }
  }

  /**
   * Determines the appropriate reward for a medication adherence event
   * @param payload - The medication event payload
   * @param streakType - The type of streak (mini, weekly, monthly)
   * @returns The reward ID or null if no reward is applicable
   */
  private async determineMedicationReward(
    payload: CareRewardTriggeredPayload,
    streakType: 'mini' | 'weekly' | 'monthly'
  ): Promise<string | null> {
    // In a real implementation, this would query the database or a rules engine
    // to determine the appropriate reward based on the medication details and streak type
    
    // Example implementation - in a real system, this would be more sophisticated
    switch (streakType) {
      case 'monthly':
        return 'reward-medication-monthly-streak'; // ID of the 30-day streak reward
      case 'weekly':
        return 'reward-medication-weekly-streak'; // ID of the 7-day streak reward
      case 'mini':
        return 'reward-medication-mini-streak'; // ID of the 3-day streak reward
      default:
        return null;
    }
  }

  /**
   * Determines the appropriate reward for a telemedicine session event
   * @param payload - The telemedicine event payload
   * @param sessionType - The type of telemedicine session
   * @param sessionDuration - The duration of the session in minutes
   * @returns The reward ID or null if no reward is applicable
   */
  private async determineTelemedicineReward(
    payload: CareRewardTriggeredPayload,
    sessionType: string,
    sessionDuration: number
  ): Promise<string | null> {
    // In a real implementation, this would query the database or a rules engine
    // to determine the appropriate reward based on the session details
    
    // Example implementation - in a real system, this would be more sophisticated
    if (sessionType?.toLowerCase() === 'initial_consultation') {
      return 'reward-telemedicine-first-visit'; // ID of the first telemedicine visit reward
    } else if (sessionDuration >= 30) {
      return 'reward-telemedicine-extended'; // ID of the extended telemedicine session reward
    } else {
      return 'reward-telemedicine-standard'; // ID of the standard telemedicine session reward
    }
  }

  /**
   * Determines the appropriate reward for a care plan progress event
   * @param payload - The care plan progress event payload
   * @param milestone - The progress milestone (getting_started, half_way, major_progress, completed)
   * @returns The reward ID or null if no reward is applicable
   */
  private async determineCareProgressReward(
    payload: CareRewardTriggeredPayload,
    milestone: 'getting_started' | 'half_way' | 'major_progress' | 'completed'
  ): Promise<string | null> {
    // In a real implementation, this would query the database or a rules engine
    // to determine the appropriate reward based on the care plan details and milestone
    
    // Example implementation - in a real system, this would be more sophisticated
    switch (milestone) {
      case 'completed':
        return 'reward-care-plan-completed'; // ID of the completed care plan reward
      case 'major_progress':
        return 'reward-care-plan-major-progress'; // ID of the 75% milestone reward
      case 'half_way':
        return 'reward-care-plan-half-way'; // ID of the 50% milestone reward
      case 'getting_started':
        return 'reward-care-plan-getting-started'; // ID of the 25% milestone reward
      default:
        return null;
    }
  }

  /**
   * Checks if the event contributes to cross-journey achievements
   * @param userId - The user ID
   * @param event - The reward event
   */
  private async checkCrossJourneyAchievements(userId: string, event: IRewardEvent): Promise<void> {
    try {
      // Create a trace span for cross-journey achievement checking
      const span = this.tracingService.createSpan(
        'check_cross_journey_achievements',
        { userId, eventType: event.type, journey: JourneyType.CARE }
      );

      try {
        // Check if this care event contributes to any cross-journey achievements
        // This would typically involve querying the achievements service to see if
        // this event, combined with events from other journeys, unlocks any achievements
        
        const contributesToCrossJourney = await this.achievementsService.checkCrossJourneyAchievements(
          userId,
          JourneyType.CARE,
          event.type,
          event.payload
        );
        
        if (contributesToCrossJourney) {
          this.logger.log(
            `Care event ${event.type} contributes to cross-journey achievements for user ${userId}`,
            { userId, eventType: event.type }
          );
          
          // Record metric for cross-journey contribution
          this.metricsService.incrementCounter('cross_journey_contributions', {
            journey: 'care',
            eventType: event.type,
          });

          // Grant journey-specific rewards if applicable
          await this.rewardsService.grantJourneyRewards(userId, JourneyType.GLOBAL);
        }
      } finally {
        // End the trace span
        span.end();
      }
    } catch (error) {
      // Log error but don't fail the main reward processing
      this.logger.error(
        `Error checking cross-journey achievements: ${error.message}`,
        error.stack
      );
      
      // Record error metric
      this.metricsService.incrementCounter('cross_journey_check_errors', {
        journey: 'care',
        eventType: event.type,
        errorType: error.name || 'UnknownError',
      });
    }
  }

  /**
   * Validates that an event is supported by this consumer
   * @param event - The event to validate
   * @returns True if the event is supported, false otherwise
   */
  protected isSupportedEvent(event: IRewardEvent): boolean {
    // Check if this is a care journey event
    if (event.journey !== JourneyType.CARE) {
      return false;
    }

    // Check if the event type is one that we handle
    const supportedTypes = [
      RewardEventType.CARE_APPOINTMENT_REWARD,
      RewardEventType.CARE_MEDICATION_REWARD,
      RewardEventType.CARE_TELEMEDICINE_REWARD,
      RewardEventType.CARE_PLAN_PROGRESS_REWARD,
      RewardEventType.CARE_REWARD_TRIGGERED,
    ];

    return supportedTypes.includes(event.type as RewardEventType);
  }

  /**
   * Maps an event to the appropriate payload type based on the event type
   * @param event - The event to map
   * @returns The typed event payload
   */
  protected mapEventToPayload<T extends RewardEventPayload>(event: IRewardEvent): T {
    // For care journey events, validate that the payload has the expected structure
    if (
      event.type === RewardEventType.CARE_REWARD_TRIGGERED ||
      event.type === RewardEventType.CARE_APPOINTMENT_REWARD ||
      event.type === RewardEventType.CARE_MEDICATION_REWARD ||
      event.type === RewardEventType.CARE_TELEMEDICINE_REWARD ||
      event.type === RewardEventType.CARE_PLAN_PROGRESS_REWARD
    ) {
      if (!isCareRewardTriggeredPayload(event.payload)) {
        throw new Error(`Invalid payload for event type ${event.type}`);
      }
    }

    return event.payload as T;
  }
}