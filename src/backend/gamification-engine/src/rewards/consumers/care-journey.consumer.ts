/**
 * @file care-journey.consumer.ts
 * @description Kafka consumer that processes reward-related events from the Care Journey service.
 * Handles appointment bookings, medication adherence tracking, telemedicine sessions, and care plan progress rewards.
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
  CareJourney,
  isValidRewardEvent,
  migrateRewardEvent,
} from './reward-events.types';

/**
 * Consumer options specific to the Care Journey
 */
const CARE_JOURNEY_CONSUMER_OPTIONS = {
  groupId: 'gamification-care-rewards-consumer',
  topics: ['care.reward.events', 'care.journey.events'],
  maxRetries: 5,
  initialRetryDelay: 1000,
  maxRetryDelay: 60000,
  jitterFactor: 0.1,
};

/**
 * Kafka consumer that processes reward-related events from the Care Journey service.
 * Handles appointment bookings, medication adherence tracking, telemedicine sessions, and care plan progress rewards.
 * Extends BaseConsumer with care-specific reward processing logic.
 */
@Injectable()
export class CareJourneyConsumer extends BaseConsumer {
  private readonly logger = new Logger(CareJourneyConsumer.name);

  /**
   * Creates a new CareJourneyConsumer instance
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
        ...CARE_JOURNEY_CONSUMER_OPTIONS,
        // Allow overriding default options from config
        maxRetries: configService.get<number>('gamificationEngine.kafka.careJourney.maxRetries', CARE_JOURNEY_CONSUMER_OPTIONS.maxRetries),
        initialRetryDelay: configService.get<number>('gamificationEngine.kafka.careJourney.retryDelay', CARE_JOURNEY_CONSUMER_OPTIONS.initialRetryDelay),
        topics: configService.get<string[]>('gamificationEngine.kafka.careJourney.topics', CARE_JOURNEY_CONSUMER_OPTIONS.topics),
      }
    );
  }

  /**
   * Processes Care Journey events and distributes rewards accordingly
   * 
   * @param payload - The event payload to process
   * @param correlationId - Correlation ID for tracing
   */
  protected async processEvent(payload: any, correlationId: string): Promise<void> {
    try {
      // Validate the event structure
      if (!isValidRewardEvent(payload)) {
        throw new EventProcessingError(
          'Invalid Care Journey event format',
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
          // For other event types, check if they are Care Journey specific events
          await this.processCareJourneySpecificEvent(event, correlationId);
      }

      this.loggerService.debug(
        `Successfully processed Care Journey event: ${event.type}`,
        { correlationId, eventType: event.type, userId: event.payload.userId }
      );
    } catch (error) {
      const baseError = error instanceof BaseError
        ? error
        : new EventProcessingError(
          `Error processing Care Journey event: ${error.message}`,
          ErrorType.SYSTEM_ERROR,
          { correlationId, cause: error }
        );

      this.loggerService.error(
        `Failed to process Care Journey event: ${baseError.message}`,
        baseError.stack,
        { correlationId, errorType: baseError.type, errorContext: baseError.context }
      );

      throw baseError;
    }
  }

  /**
   * Processes reward granted events from the Care Journey
   * 
   * @param event - The reward granted event
   * @param correlationId - Correlation ID for tracing
   */
  private async processRewardGrantedEvent(event: any, correlationId: string): Promise<void> {
    const { userId, rewardId, journey } = event.payload;

    // Verify this is a Care Journey event
    if (journey !== JourneyType.CARE && journey !== JourneyType.GLOBAL) {
      this.loggerService.warn(
        `Received non-Care Journey reward event in Care Journey consumer`,
        { correlationId, journey, eventType: event.type }
      );
      return;
    }

    // Grant the reward to the user
    await this.rewardsService.grantReward(userId, rewardId);

    this.loggerService.log(
      `Granted reward ${rewardId} to user ${userId} from Care Journey`,
      { correlationId, rewardId, userId, journey }
    );
  }

  /**
   * Processes reward redeemed events from the Care Journey
   * 
   * @param event - The reward redeemed event
   * @param correlationId - Correlation ID for tracing
   */
  private async processRewardRedeemedEvent(event: any, correlationId: string): Promise<void> {
    const { userId, rewardId, journey, redemptionStatus } = event.payload;

    // Verify this is a Care Journey event
    if (journey !== JourneyType.CARE && journey !== JourneyType.GLOBAL) {
      this.loggerService.warn(
        `Received non-Care Journey reward redemption event in Care Journey consumer`,
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
   * Processes Care Journey specific events that may trigger rewards
   * 
   * @param event - The Care Journey specific event
   * @param correlationId - Correlation ID for tracing
   */
  private async processCareJourneySpecificEvent(event: any, correlationId: string): Promise<void> {
    // Extract common fields from the payload
    const { userId, journey } = event.payload;

    // Verify this is a Care Journey event
    if (journey !== JourneyType.CARE) {
      this.loggerService.warn(
        `Received non-Care Journey event in Care Journey consumer`,
        { correlationId, journey, eventType: event.type }
      );
      return;
    }

    // Process based on the specific event payload type
    if (this.isAppointmentBookingEvent(event)) {
      await this.processAppointmentBookingEvent(event, correlationId);
    } else if (this.isMedicationAdherenceEvent(event)) {
      await this.processMedicationAdherenceEvent(event, correlationId);
    } else if (this.isTelemedicineSessionEvent(event)) {
      await this.processTelemedicineSessionEvent(event, correlationId);
    } else if (this.isCarePlanProgressEvent(event)) {
      await this.processCarePlanProgressEvent(event, correlationId);
    } else {
      this.loggerService.warn(
        `Unhandled Care Journey event type: ${event.type}`,
        { correlationId, eventType: event.type, userId }
      );
    }
  }

  /**
   * Processes appointment booking events and grants appropriate rewards
   * 
   * @param event - The appointment booking event
   * @param correlationId - Correlation ID for tracing
   */
  private async processAppointmentBookingEvent(event: CareJourney.IAppointmentBookingRewardEvent, correlationId: string): Promise<void> {
    const { userId, appointmentId, appointmentType, totalAppointmentsBooked } = event.payload;

    this.loggerService.log(
      `Processing appointment booking event for user ${userId}, appointment ${appointmentId}`,
      { correlationId, userId, appointmentId, appointmentType, totalAppointmentsBooked }
    );

    // Check for first-time appointment booking
    if (totalAppointmentsBooked === 1) {
      // Grant first appointment booking reward
      const firstAppointmentRewardId = this.configService.get<string>('gamificationEngine.rewards.firstAppointmentBooking');
      if (firstAppointmentRewardId) {
        await this.rewardsService.grantReward(userId, firstAppointmentRewardId);
        this.loggerService.log(
          `Granted first appointment booking reward to user ${userId}`,
          { correlationId, userId, rewardId: firstAppointmentRewardId }
        );
      }
    }

    // Check for milestone achievements (e.g., 5, 10, 25 appointments)
    const milestones = this.configService.get<Record<number, string>>('gamificationEngine.rewards.appointmentMilestones', {
      5: 'appointment-milestone-5',
      10: 'appointment-milestone-10',
      25: 'appointment-milestone-25',
    });

    // Check if the current count matches any milestone
    if (milestones[totalAppointmentsBooked]) {
      const milestoneRewardId = milestones[totalAppointmentsBooked];
      await this.rewardsService.grantReward(userId, milestoneRewardId);
      this.loggerService.log(
        `Granted appointment milestone reward for ${totalAppointmentsBooked} appointments to user ${userId}`,
        { correlationId, userId, rewardId: milestoneRewardId, milestone: totalAppointmentsBooked }
      );
    }

    // Check for appointment type-specific rewards
    const appointmentTypeRewards = this.configService.get<Record<string, string>>('gamificationEngine.rewards.appointmentTypes', {});
    if (appointmentTypeRewards[appointmentType]) {
      const typeRewardId = appointmentTypeRewards[appointmentType];
      await this.rewardsService.grantReward(userId, typeRewardId);
      this.loggerService.log(
        `Granted appointment type-specific reward for ${appointmentType} to user ${userId}`,
        { correlationId, userId, rewardId: typeRewardId, appointmentType }
      );
    }

    // Grant XP for appointment booking
    const appointmentBookingXp = this.configService.get<number>('gamificationEngine.xp.appointmentBooking', 10);
    await this.profilesService.addXp(userId, appointmentBookingXp);
    this.loggerService.log(
      `Added ${appointmentBookingXp} XP to user ${userId} for appointment booking`,
      { correlationId, userId, xp: appointmentBookingXp }
    );
  }

  /**
   * Processes medication adherence events and grants appropriate rewards
   * 
   * @param event - The medication adherence event
   * @param correlationId - Correlation ID for tracing
   */
  private async processMedicationAdherenceEvent(event: CareJourney.IMedicationAdherenceRewardEvent, correlationId: string): Promise<void> {
    const { userId, medicationId, medicationName, adherenceStreak, adherencePercentage } = event.payload;

    this.loggerService.log(
      `Processing medication adherence event for user ${userId}, medication ${medicationId}`,
      { correlationId, userId, medicationId, medicationName, adherenceStreak, adherencePercentage }
    );

    // Check for streak milestones (e.g., 7, 30, 90 days)
    const streakMilestones = this.configService.get<Record<number, string>>('gamificationEngine.rewards.medicationStreakMilestones', {
      7: 'medication-streak-7',
      30: 'medication-streak-30',
      90: 'medication-streak-90',
    });

    // Check if the current streak matches any milestone
    if (streakMilestones[adherenceStreak]) {
      const streakRewardId = streakMilestones[adherenceStreak];
      await this.rewardsService.grantReward(userId, streakRewardId);
      this.loggerService.log(
        `Granted medication adherence streak reward for ${adherenceStreak} days to user ${userId}`,
        { correlationId, userId, rewardId: streakRewardId, streak: adherenceStreak }
      );
    }

    // Check for high adherence percentage (e.g., 80%, 90%, 100%)
    const adherenceThresholds = this.configService.get<Record<number, string>>('gamificationEngine.rewards.medicationAdherenceThresholds', {
      80: 'medication-adherence-80',
      90: 'medication-adherence-90',
      100: 'medication-adherence-100',
    });

    // Find the highest threshold that the user has reached
    const thresholds = Object.keys(adherenceThresholds).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (adherencePercentage >= threshold) {
        const thresholdRewardId = adherenceThresholds[threshold];
        await this.rewardsService.grantReward(userId, thresholdRewardId);
        this.loggerService.log(
          `Granted medication adherence percentage reward for ${threshold}% to user ${userId}`,
          { correlationId, userId, rewardId: thresholdRewardId, threshold, adherencePercentage }
        );
        break; // Only grant the highest threshold reward
      }
    }

    // Grant XP for medication adherence
    const baseAdherenceXp = this.configService.get<number>('gamificationEngine.xp.medicationAdherenceBase', 5);
    const streakMultiplier = Math.min(adherenceStreak / 7, 3); // Cap at 3x for 21+ day streaks
    const earnedXp = Math.round(baseAdherenceXp * (1 + streakMultiplier));
    
    await this.profilesService.addXp(userId, earnedXp);
    this.loggerService.log(
      `Added ${earnedXp} XP to user ${userId} for medication adherence (streak: ${adherenceStreak})`,
      { correlationId, userId, xp: earnedXp, streak: adherenceStreak, baseXp: baseAdherenceXp, multiplier: streakMultiplier }
    );
  }

  /**
   * Processes telemedicine session events and grants appropriate rewards
   * 
   * @param event - The telemedicine session event
   * @param correlationId - Correlation ID for tracing
   */
  private async processTelemedicineSessionEvent(event: CareJourney.ITelemedicineSessionRewardEvent, correlationId: string): Promise<void> {
    const { userId, sessionId, sessionDuration, totalSessionsCompleted } = event.payload;

    this.loggerService.log(
      `Processing telemedicine session event for user ${userId}, session ${sessionId}`,
      { correlationId, userId, sessionId, sessionDuration, totalSessionsCompleted }
    );

    // Check for first-time telemedicine session
    if (totalSessionsCompleted === 1) {
      // Grant first telemedicine session reward
      const firstSessionRewardId = this.configService.get<string>('gamificationEngine.rewards.firstTelemedicineSession');
      if (firstSessionRewardId) {
        await this.rewardsService.grantReward(userId, firstSessionRewardId);
        this.loggerService.log(
          `Granted first telemedicine session reward to user ${userId}`,
          { correlationId, userId, rewardId: firstSessionRewardId }
        );
      }
    }

    // Check for session count milestones (e.g., 3, 5, 10 sessions)
    const sessionMilestones = this.configService.get<Record<number, string>>('gamificationEngine.rewards.telemedicineSessionMilestones', {
      3: 'telemedicine-session-3',
      5: 'telemedicine-session-5',
      10: 'telemedicine-session-10',
    });

    // Check if the current count matches any milestone
    if (sessionMilestones[totalSessionsCompleted]) {
      const milestoneRewardId = sessionMilestones[totalSessionsCompleted];
      await this.rewardsService.grantReward(userId, milestoneRewardId);
      this.loggerService.log(
        `Granted telemedicine session milestone reward for ${totalSessionsCompleted} sessions to user ${userId}`,
        { correlationId, userId, rewardId: milestoneRewardId, milestone: totalSessionsCompleted }
      );
    }

    // Grant XP for telemedicine session completion
    // Base XP plus bonus for longer sessions
    const baseSessionXp = this.configService.get<number>('gamificationEngine.xp.telemedicineSessionBase', 15);
    const durationBonus = Math.floor(sessionDuration / 10); // Bonus XP for every 10 minutes
    const earnedXp = baseSessionXp + durationBonus;
    
    await this.profilesService.addXp(userId, earnedXp);
    this.loggerService.log(
      `Added ${earnedXp} XP to user ${userId} for telemedicine session (duration: ${sessionDuration} minutes)`,
      { correlationId, userId, xp: earnedXp, sessionDuration, baseXp: baseSessionXp, durationBonus }
    );
  }

  /**
   * Processes care plan progress events and grants appropriate rewards
   * 
   * @param event - The care plan progress event
   * @param correlationId - Correlation ID for tracing
   */
  private async processCarePlanProgressEvent(event: any, correlationId: string): Promise<void> {
    const { userId, carePlanId, progressPercentage, completedTasks, totalTasks } = event.payload;

    this.loggerService.log(
      `Processing care plan progress event for user ${userId}, plan ${carePlanId}`,
      { correlationId, userId, carePlanId, progressPercentage, completedTasks, totalTasks }
    );

    // Check for progress milestones (e.g., 25%, 50%, 75%, 100%)
    const progressMilestones = this.configService.get<Record<number, string>>('gamificationEngine.rewards.carePlanProgressMilestones', {
      25: 'care-plan-progress-25',
      50: 'care-plan-progress-50',
      75: 'care-plan-progress-75',
      100: 'care-plan-progress-100',
    });

    // Find all milestones that the user has reached
    const thresholds = Object.keys(progressMilestones).map(Number).sort((a, b) => a - b);
    for (const threshold of thresholds) {
      if (progressPercentage >= threshold) {
        const milestoneRewardId = progressMilestones[threshold];
        
        // Check if user already has this milestone reward to avoid duplicates
        // This would require additional logic to track which milestones have been awarded
        // For simplicity, we'll assume the care service tracks this and only sends events for new milestones
        await this.rewardsService.grantReward(userId, milestoneRewardId);
        this.loggerService.log(
          `Granted care plan progress milestone reward for ${threshold}% to user ${userId}`,
          { correlationId, userId, rewardId: milestoneRewardId, threshold, progressPercentage }
        );
      }
    }

    // Grant XP for care plan progress
    // XP is proportional to the number of tasks completed
    const taskCompletionXp = this.configService.get<number>('gamificationEngine.xp.carePlanTaskCompletion', 5);
    const earnedXp = taskCompletionXp * completedTasks;
    
    await this.profilesService.addXp(userId, earnedXp);
    this.loggerService.log(
      `Added ${earnedXp} XP to user ${userId} for completing ${completedTasks} care plan tasks`,
      { correlationId, userId, xp: earnedXp, completedTasks, totalTasks }
    );

    // Check for care plan completion
    if (progressPercentage === 100) {
      // Grant additional completion bonus
      const completionBonusXp = this.configService.get<number>('gamificationEngine.xp.carePlanCompletionBonus', 50);
      await this.profilesService.addXp(userId, completionBonusXp);
      this.loggerService.log(
        `Added ${completionBonusXp} XP bonus to user ${userId} for completing care plan`,
        { correlationId, userId, xp: completionBonusXp, carePlanId }
      );
    }
  }

  /**
   * Type guard to check if an event is an appointment booking event
   * 
   * @param event - The event to check
   * @returns True if the event is an appointment booking event
   */
  private isAppointmentBookingEvent(event: any): event is CareJourney.IAppointmentBookingRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'appointmentId' in event.payload &&
      'appointmentType' in event.payload &&
      'totalAppointmentsBooked' in event.payload
    );
  }

  /**
   * Type guard to check if an event is a medication adherence event
   * 
   * @param event - The event to check
   * @returns True if the event is a medication adherence event
   */
  private isMedicationAdherenceEvent(event: any): event is CareJourney.IMedicationAdherenceRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'medicationId' in event.payload &&
      'medicationName' in event.payload &&
      'adherenceStreak' in event.payload &&
      'adherencePercentage' in event.payload
    );
  }

  /**
   * Type guard to check if an event is a telemedicine session event
   * 
   * @param event - The event to check
   * @returns True if the event is a telemedicine session event
   */
  private isTelemedicineSessionEvent(event: any): event is CareJourney.ITelemedicineSessionRewardEvent {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'sessionId' in event.payload &&
      'sessionDuration' in event.payload &&
      'totalSessionsCompleted' in event.payload
    );
  }

  /**
   * Type guard to check if an event is a care plan progress event
   * 
   * @param event - The event to check
   * @returns True if the event is a care plan progress event
   */
  private isCarePlanProgressEvent(event: any): boolean {
    return (
      event.type === RewardEventType.REWARD_GRANTED &&
      event.payload &&
      'carePlanId' in event.payload &&
      'progressPercentage' in event.payload &&
      'completedTasks' in event.payload &&
      'totalTasks' in event.payload
    );
  }
}