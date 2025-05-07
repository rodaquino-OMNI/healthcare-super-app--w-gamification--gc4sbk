import { Injectable, Logger } from '@nestjs/common';
import { ProcessEventDto } from '../dto/process-event.dto';
import { AchievementsService } from '../../achievements/achievements.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { QuestsService } from '../../quests/quests.service';
import { RewardsService } from '../../rewards/rewards.service';
import { RulesService } from '../../rules/rules.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TelemetryService } from '@app/shared/telemetry/telemetry.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';

/**
 * Base abstract class for journey-specific event handlers.
 * Provides common functionality for all journey handlers.
 */
export abstract class JourneyHandler {
  protected readonly logger: Logger;

  /**
   * Creates a new journey handler instance.
   * 
   * @param journeyName The name of the journey this handler processes
   * @param achievementsService Service for managing achievements
   * @param profilesService Service for managing user profiles
   * @param questsService Service for managing quests
   * @param rewardsService Service for managing rewards
   * @param rulesService Service for evaluating rules
   * @param loggerService Service for logging
   * @param telemetryService Service for telemetry
   * @param kafkaService Service for Kafka interaction
   */
  constructor(
    protected readonly journeyName: string,
    protected readonly achievementsService: AchievementsService,
    protected readonly profilesService: ProfilesService,
    protected readonly questsService: QuestsService,
    protected readonly rewardsService: RewardsService,
    protected readonly rulesService: RulesService,
    protected readonly loggerService: LoggerService,
    protected readonly telemetryService: TelemetryService,
    protected readonly kafkaService: KafkaService,
  ) {
    this.logger = new Logger(`${journeyName}JourneyHandler`);
  }

  /**
   * Processes an event from this journey.
   * 
   * @param event The event to process
   * @returns A promise that resolves when the event has been processed
   */
  async processEvent(event: ProcessEventDto): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Start telemetry span for journey event processing
      const span = this.telemetryService.startSpan(`${this.journeyName}.event.process`, {
        eventType: event.type,
        userId: event.userId,
      });

      // Log event processing start
      this.loggerService.log(
        `Processing ${this.journeyName} journey event: ${event.type} for user ${event.userId}`,
        `${this.journeyName}JourneyHandler`
      );

      // Validate event data
      if (!this.validateEvent(event)) {
        this.loggerService.warn(
          `Invalid ${this.journeyName} journey event: ${event.type}`,
          `${this.journeyName}JourneyHandler`
        );
        return { success: false, error: 'Invalid event data' };
      }

      // Process journey-specific logic
      const result = await this.processJourneyEvent(event);

      // Process rules for this event
      await this.rulesService.processEvent(event);

      // Record processing time for metrics
      const processingTime = Date.now() - startTime;
      this.telemetryService.recordMetric(`${this.journeyName}.event.processingTime`, processingTime, {
        eventType: event.type,
      });

      // End telemetry span
      span.end();

      return result;
    } catch (error) {
      // Record error in telemetry
      this.telemetryService.recordError(`${this.journeyName}.event.error`, error, {
        eventType: event.type,
        userId: event.userId,
      });

      // Log error
      this.loggerService.error(
        `Error processing ${this.journeyName} journey event: ${error.message}`,
        error.stack,
        `${this.journeyName}JourneyHandler`
      );

      throw error;
    }
  }

  /**
   * Validates that an event has the required data for this journey.
   * 
   * @param event The event to validate
   * @returns Whether the event is valid for this journey
   */
  protected abstract validateEvent(event: ProcessEventDto): boolean;

  /**
   * Processes journey-specific event logic.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  protected abstract processJourneyEvent(event: ProcessEventDto): Promise<any>;

  /**
   * Checks if a cross-journey achievement should be awarded.
   * 
   * @param userId The user ID to check
   * @param journeyAchievementIds Achievement IDs from this journey to check
   * @param crossAchievementId The cross-journey achievement ID to potentially award
   * @returns A promise that resolves when the check is complete
   */
  protected async checkCrossJourneyAchievement(
    userId: string,
    journeyAchievementIds: string[],
    crossAchievementId: string
  ): Promise<void> {
    try {
      // Get user profile
      const profile = await this.profilesService.findOne(userId);
      if (!profile) {
        this.loggerService.warn(
          `User profile not found for cross-journey achievement check: ${userId}`,
          `${this.journeyName}JourneyHandler`
        );
        return;
      }

      // Check if user has all required journey achievements
      const hasAllAchievements = await this.achievementsService.userHasAchievements(
        profile.id,
        journeyAchievementIds
      );

      if (hasAllAchievements) {
        // Award the cross-journey achievement
        await this.achievementsService.unlockAchievement(profile.id, crossAchievementId);
        
        this.loggerService.log(
          `Awarded cross-journey achievement ${crossAchievementId} to user ${userId}`,
          `${this.journeyName}JourneyHandler`
        );
      }
    } catch (error) {
      this.loggerService.error(
        `Error checking cross-journey achievement: ${error.message}`,
        error.stack,
        `${this.journeyName}JourneyHandler`
      );
    }
  }
}

/**
 * Handler for Health journey events.
 * Processes events related to health metrics, goals, and device connections.
 */
@Injectable()
export class HealthJourneyHandler extends JourneyHandler {
  constructor(
    achievementsService: AchievementsService,
    profilesService: ProfilesService,
    questsService: QuestsService,
    rewardsService: RewardsService,
    rulesService: RulesService,
    loggerService: LoggerService,
    telemetryService: TelemetryService,
    kafkaService: KafkaService,
  ) {
    super(
      'health',
      achievementsService,
      profilesService,
      questsService,
      rewardsService,
      rulesService,
      loggerService,
      telemetryService,
      kafkaService,
    );
  }

  /**
   * Validates that a health journey event has the required data.
   * 
   * @param event The event to validate
   * @returns Whether the event is valid for the health journey
   */
  protected validateEvent(event: ProcessEventDto): boolean {
    // Ensure event has the correct journey
    if (event.journey && event.journey !== 'health') {
      return false;
    }

    // Validate based on event type
    switch (event.type) {
      case 'HEALTH_METRIC_RECORDED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'metricType' in event.data &&
          'value' in event.data &&
          'unit' in event.data
        );

      case 'HEALTH_GOAL_CREATED':
      case 'HEALTH_GOAL_UPDATED':
      case 'HEALTH_GOAL_ACHIEVED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'goalId' in event.data &&
          'goalType' in event.data
        );

      case 'DEVICE_CONNECTED':
      case 'DEVICE_DISCONNECTED':
      case 'DEVICE_SYNCED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'deviceId' in event.data &&
          'deviceType' in event.data
        );

      case 'MEDICAL_EVENT_RECORDED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'eventType' in event.data &&
          'date' in event.data
        );

      default:
        // Unknown event type for health journey
        return false;
    }
  }

  /**
   * Processes health journey-specific event logic.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  protected async processJourneyEvent(event: ProcessEventDto): Promise<any> {
    // Process based on event type
    switch (event.type) {
      case 'HEALTH_METRIC_RECORDED':
        return this.processHealthMetricRecorded(event);

      case 'HEALTH_GOAL_ACHIEVED':
        return this.processHealthGoalAchieved(event);

      case 'DEVICE_CONNECTED':
        return this.processDeviceConnected(event);

      case 'DEVICE_SYNCED':
        return this.processDeviceSynced(event);

      case 'MEDICAL_EVENT_RECORDED':
        return this.processMedicalEventRecorded(event);

      default:
        // For other event types, just pass through to rules engine
        return { processed: true, eventType: event.type };
    }
  }

  /**
   * Processes a HEALTH_METRIC_RECORDED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processHealthMetricRecorded(event: ProcessEventDto): Promise<any> {
    const { metricType, value, unit } = event.data as any;

    // Log the metric recording
    this.loggerService.log(
      `Health metric recorded: ${metricType} = ${value} ${unit} for user ${event.userId}`,
      'HealthJourneyHandler'
    );

    // Award XP for recording a health metric
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 5, {
      source: 'health_metric',
      metricType,
    });

    // Check for streak-based achievements
    const streakCount = await this.profilesService.incrementStreak(profile.id, 'health_metric');
    
    // Award streak achievements based on count
    if (streakCount >= 7) {
      await this.achievementsService.progressAchievement(
        profile.id,
        'health-streak-7days',
        100
      );
    }
    if (streakCount >= 30) {
      await this.achievementsService.progressAchievement(
        profile.id,
        'health-streak-30days',
        100
      );
    }

    // Check for metric-specific achievements
    switch (metricType) {
      case 'steps':
        if (value >= 10000) {
          await this.achievementsService.progressAchievement(
            profile.id,
            'health-10k-steps',
            100
          );
        }
        break;

      case 'heart_rate':
        await this.achievementsService.progressAchievement(
          profile.id,
          'health-track-heart-rate',
          20
        );
        break;

      case 'blood_pressure':
        await this.achievementsService.progressAchievement(
          profile.id,
          'health-track-blood-pressure',
          20
        );
        break;

      case 'weight':
        await this.achievementsService.progressAchievement(
          profile.id,
          'health-track-weight',
          20
        );
        break;

      case 'sleep':
        if (value >= 8) {
          await this.achievementsService.progressAchievement(
            profile.id,
            'health-good-sleep',
            25
          );
        }
        break;
    }

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'record_health_metric',
      { metricType }
    );

    return { processed: true, xpAwarded: 5, streakCount };
  }

  /**
   * Processes a HEALTH_GOAL_ACHIEVED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processHealthGoalAchieved(event: ProcessEventDto): Promise<any> {
    const { goalId, goalType } = event.data as any;

    // Log the goal achievement
    this.loggerService.log(
      `Health goal achieved: ${goalType} (${goalId}) for user ${event.userId}`,
      'HealthJourneyHandler'
    );

    // Award XP for achieving a health goal
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 20, {
      source: 'health_goal',
      goalType,
    });

    // Award achievement for completing a health goal
    await this.achievementsService.progressAchievement(
      profile.id,
      'health-goal-achiever',
      25
    );

    // Check for goal-specific achievements
    switch (goalType) {
      case 'steps':
        await this.achievementsService.progressAchievement(
          profile.id,
          'health-steps-goal',
          100
        );
        break;

      case 'weight':
        await this.achievementsService.progressAchievement(
          profile.id,
          'health-weight-goal',
          100
        );
        break;

      case 'activity':
        await this.achievementsService.progressAchievement(
          profile.id,
          'health-activity-goal',
          100
        );
        break;
    }

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'achieve_health_goal',
      { goalType }
    );

    // Check for cross-journey achievements
    await this.checkHealthCrossJourneyAchievements(profile.id);

    return { processed: true, xpAwarded: 20 };
  }

  /**
   * Processes a DEVICE_CONNECTED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processDeviceConnected(event: ProcessEventDto): Promise<any> {
    const { deviceId, deviceType } = event.data as any;

    // Log the device connection
    this.loggerService.log(
      `Device connected: ${deviceType} (${deviceId}) for user ${event.userId}`,
      'HealthJourneyHandler'
    );

    // Award XP for connecting a device
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 10, {
      source: 'device_connected',
      deviceType,
    });

    // Award achievement for connecting a device
    await this.achievementsService.progressAchievement(
      profile.id,
      'health-device-connected',
      100
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'connect_device',
      { deviceType }
    );

    return { processed: true, xpAwarded: 10 };
  }

  /**
   * Processes a DEVICE_SYNCED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processDeviceSynced(event: ProcessEventDto): Promise<any> {
    const { deviceId, deviceType, dataPoints } = event.data as any;

    // Log the device sync
    this.loggerService.log(
      `Device synced: ${deviceType} (${deviceId}) with ${dataPoints || 'unknown'} data points for user ${event.userId}`,
      'HealthJourneyHandler'
    );

    // Award XP for syncing a device
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 5, {
      source: 'device_synced',
      deviceType,
    });

    // Progress achievement for regular syncing
    await this.achievementsService.progressAchievement(
      profile.id,
      'health-regular-sync',
      10
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'sync_device',
      { deviceType }
    );

    return { processed: true, xpAwarded: 5 };
  }

  /**
   * Processes a MEDICAL_EVENT_RECORDED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processMedicalEventRecorded(event: ProcessEventDto): Promise<any> {
    const { eventType, date } = event.data as any;

    // Log the medical event
    this.loggerService.log(
      `Medical event recorded: ${eventType} on ${date} for user ${event.userId}`,
      'HealthJourneyHandler'
    );

    // Award XP for recording a medical event
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 15, {
      source: 'medical_event',
      eventType,
    });

    // Progress achievement for medical record keeping
    await this.achievementsService.progressAchievement(
      profile.id,
      'health-medical-records',
      25
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'record_medical_event',
      { eventType }
    );

    return { processed: true, xpAwarded: 15 };
  }

  /**
   * Checks for cross-journey achievements related to health.
   * 
   * @param profileId The profile ID to check
   */
  private async checkHealthCrossJourneyAchievements(profileId: string): Promise<void> {
    // Check for the "Health Master" achievement (requires multiple health achievements)
    await this.checkCrossJourneyAchievement(
      profileId,
      [
        'health-streak-7days',
        'health-10k-steps',
        'health-track-heart-rate',
        'health-good-sleep',
      ],
      'health-master'
    );

    // Check for the "Wellness Warrior" cross-journey achievement
    // This requires achievements from both Health and Care journeys
    const healthAchievements = [
      'health-goal-achiever',
      'health-device-connected',
    ];

    const careAchievements = [
      'care-appointment-attender',
      'care-medication-adherent',
    ];

    // Check if user has all required health achievements
    const hasHealthAchievements = await this.achievementsService.userHasAchievements(
      profileId,
      healthAchievements
    );

    if (hasHealthAchievements) {
      // Check if user has all required care achievements
      const hasCareAchievements = await this.achievementsService.userHasAchievements(
        profileId,
        careAchievements
      );

      if (hasCareAchievements) {
        // Award the cross-journey achievement
        await this.achievementsService.unlockAchievement(profileId, 'wellness-warrior');
        
        this.loggerService.log(
          `Awarded cross-journey achievement 'wellness-warrior' to profile ${profileId}`,
          'HealthJourneyHandler'
        );
      }
    }
  }
}

/**
 * Handler for Care journey events.
 * Processes events related to appointments, medications, and treatments.
 */
@Injectable()
export class CareJourneyHandler extends JourneyHandler {
  constructor(
    achievementsService: AchievementsService,
    profilesService: ProfilesService,
    questsService: QuestsService,
    rewardsService: RewardsService,
    rulesService: RulesService,
    loggerService: LoggerService,
    telemetryService: TelemetryService,
    kafkaService: KafkaService,
  ) {
    super(
      'care',
      achievementsService,
      profilesService,
      questsService,
      rewardsService,
      rulesService,
      loggerService,
      telemetryService,
      kafkaService,
    );
  }

  /**
   * Validates that a care journey event has the required data.
   * 
   * @param event The event to validate
   * @returns Whether the event is valid for the care journey
   */
  protected validateEvent(event: ProcessEventDto): boolean {
    // Ensure event has the correct journey
    if (event.journey && event.journey !== 'care') {
      return false;
    }

    // Validate based on event type
    switch (event.type) {
      case 'APPOINTMENT_BOOKED':
      case 'APPOINTMENT_ATTENDED':
      case 'APPOINTMENT_CANCELLED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'appointmentId' in event.data &&
          'appointmentType' in event.data
        );

      case 'MEDICATION_ADDED':
      case 'MEDICATION_TAKEN':
      case 'MEDICATION_SKIPPED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'medicationId' in event.data &&
          'medicationName' in event.data
        );

      case 'TELEMEDICINE_SESSION_STARTED':
      case 'TELEMEDICINE_SESSION_COMPLETED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'sessionId' in event.data &&
          'duration' in event.data
        );

      case 'TREATMENT_PLAN_CREATED':
      case 'TREATMENT_PLAN_UPDATED':
      case 'TREATMENT_PLAN_COMPLETED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'planId' in event.data &&
          'planType' in event.data
        );

      default:
        // Unknown event type for care journey
        return false;
    }
  }

  /**
   * Processes care journey-specific event logic.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  protected async processJourneyEvent(event: ProcessEventDto): Promise<any> {
    // Process based on event type
    switch (event.type) {
      case 'APPOINTMENT_BOOKED':
        return this.processAppointmentBooked(event);

      case 'APPOINTMENT_ATTENDED':
        return this.processAppointmentAttended(event);

      case 'MEDICATION_ADDED':
        return this.processMedicationAdded(event);

      case 'MEDICATION_TAKEN':
        return this.processMedicationTaken(event);

      case 'TELEMEDICINE_SESSION_COMPLETED':
        return this.processTelemedicineSessionCompleted(event);

      case 'TREATMENT_PLAN_COMPLETED':
        return this.processTreatmentPlanCompleted(event);

      default:
        // For other event types, just pass through to rules engine
        return { processed: true, eventType: event.type };
    }
  }

  /**
   * Processes an APPOINTMENT_BOOKED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processAppointmentBooked(event: ProcessEventDto): Promise<any> {
    const { appointmentId, appointmentType, providerId } = event.data as any;

    // Log the appointment booking
    this.loggerService.log(
      `Appointment booked: ${appointmentType} (${appointmentId}) for user ${event.userId}`,
      'CareJourneyHandler'
    );

    // Award XP for booking an appointment
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 10, {
      source: 'appointment_booked',
      appointmentType,
    });

    // Progress achievement for booking appointments
    await this.achievementsService.progressAchievement(
      profile.id,
      'care-appointment-booker',
      25
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'book_appointment',
      { appointmentType }
    );

    return { processed: true, xpAwarded: 10 };
  }

  /**
   * Processes an APPOINTMENT_ATTENDED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processAppointmentAttended(event: ProcessEventDto): Promise<any> {
    const { appointmentId, appointmentType, providerId } = event.data as any;

    // Log the appointment attendance
    this.loggerService.log(
      `Appointment attended: ${appointmentType} (${appointmentId}) for user ${event.userId}`,
      'CareJourneyHandler'
    );

    // Award XP for attending an appointment
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 20, {
      source: 'appointment_attended',
      appointmentType,
    });

    // Progress achievement for attending appointments
    await this.achievementsService.progressAchievement(
      profile.id,
      'care-appointment-attender',
      50
    );

    // Check for appointment-specific achievements
    switch (appointmentType) {
      case 'annual_checkup':
        await this.achievementsService.progressAchievement(
          profile.id,
          'care-annual-checkup',
          100
        );
        break;

      case 'dental':
        await this.achievementsService.progressAchievement(
          profile.id,
          'care-dental-visit',
          100
        );
        break;

      case 'specialist':
        await this.achievementsService.progressAchievement(
          profile.id,
          'care-specialist-visit',
          100
        );
        break;
    }

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'attend_appointment',
      { appointmentType }
    );

    // Check for cross-journey achievements
    await this.checkCareCrossJourneyAchievements(profile.id);

    return { processed: true, xpAwarded: 20 };
  }

  /**
   * Processes a MEDICATION_ADDED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processMedicationAdded(event: ProcessEventDto): Promise<any> {
    const { medicationId, medicationName } = event.data as any;

    // Log the medication addition
    this.loggerService.log(
      `Medication added: ${medicationName} (${medicationId}) for user ${event.userId}`,
      'CareJourneyHandler'
    );

    // Award XP for adding a medication
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 5, {
      source: 'medication_added',
      medicationName,
    });

    // Progress achievement for medication tracking
    await this.achievementsService.progressAchievement(
      profile.id,
      'care-medication-tracker',
      25
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'add_medication',
      {}
    );

    return { processed: true, xpAwarded: 5 };
  }

  /**
   * Processes a MEDICATION_TAKEN event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processMedicationTaken(event: ProcessEventDto): Promise<any> {
    const { medicationId, medicationName, scheduledTime } = event.data as any;

    // Log the medication taken
    this.loggerService.log(
      `Medication taken: ${medicationName} (${medicationId}) for user ${event.userId}`,
      'CareJourneyHandler'
    );

    // Award XP for taking medication
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 5, {
      source: 'medication_taken',
      medicationName,
    });

    // Check for streak-based achievements
    const streakCount = await this.profilesService.incrementStreak(profile.id, 'medication_taken');
    
    // Award streak achievements based on count
    if (streakCount >= 7) {
      await this.achievementsService.progressAchievement(
        profile.id,
        'care-medication-streak-7days',
        100
      );
    }
    if (streakCount >= 30) {
      await this.achievementsService.progressAchievement(
        profile.id,
        'care-medication-streak-30days',
        100
      );
    }

    // Progress achievement for medication adherence
    await this.achievementsService.progressAchievement(
      profile.id,
      'care-medication-adherent',
      10
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'take_medication',
      {}
    );

    return { processed: true, xpAwarded: 5, streakCount };
  }

  /**
   * Processes a TELEMEDICINE_SESSION_COMPLETED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processTelemedicineSessionCompleted(event: ProcessEventDto): Promise<any> {
    const { sessionId, duration, providerId } = event.data as any;

    // Log the telemedicine session completion
    this.loggerService.log(
      `Telemedicine session completed: ${sessionId} (${duration} minutes) for user ${event.userId}`,
      'CareJourneyHandler'
    );

    // Award XP for completing a telemedicine session
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 15, {
      source: 'telemedicine_session',
      duration,
    });

    // Progress achievement for telemedicine usage
    await this.achievementsService.progressAchievement(
      profile.id,
      'care-telemedicine-user',
      100
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'complete_telemedicine_session',
      {}
    );

    return { processed: true, xpAwarded: 15 };
  }

  /**
   * Processes a TREATMENT_PLAN_COMPLETED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processTreatmentPlanCompleted(event: ProcessEventDto): Promise<any> {
    const { planId, planType } = event.data as any;

    // Log the treatment plan completion
    this.loggerService.log(
      `Treatment plan completed: ${planType} (${planId}) for user ${event.userId}`,
      'CareJourneyHandler'
    );

    // Award XP for completing a treatment plan
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 30, {
      source: 'treatment_plan_completed',
      planType,
    });

    // Progress achievement for treatment plan completion
    await this.achievementsService.progressAchievement(
      profile.id,
      'care-treatment-completer',
      100
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'complete_treatment_plan',
      { planType }
    );

    // Check for cross-journey achievements
    await this.checkCareCrossJourneyAchievements(profile.id);

    return { processed: true, xpAwarded: 30 };
  }

  /**
   * Checks for cross-journey achievements related to care.
   * 
   * @param profileId The profile ID to check
   */
  private async checkCareCrossJourneyAchievements(profileId: string): Promise<void> {
    // Check for the "Care Master" achievement (requires multiple care achievements)
    await this.checkCrossJourneyAchievement(
      profileId,
      [
        'care-appointment-attender',
        'care-medication-adherent',
        'care-telemedicine-user',
        'care-treatment-completer',
      ],
      'care-master'
    );

    // Check for the "Wellness Warrior" cross-journey achievement
    // This requires achievements from both Health and Care journeys
    const careAchievements = [
      'care-appointment-attender',
      'care-medication-adherent',
    ];

    const healthAchievements = [
      'health-goal-achiever',
      'health-device-connected',
    ];

    // Check if user has all required care achievements
    const hasCareAchievements = await this.achievementsService.userHasAchievements(
      profileId,
      careAchievements
    );

    if (hasCareAchievements) {
      // Check if user has all required health achievements
      const hasHealthAchievements = await this.achievementsService.userHasAchievements(
        profileId,
        healthAchievements
      );

      if (hasHealthAchievements) {
        // Award the cross-journey achievement
        await this.achievementsService.unlockAchievement(profileId, 'wellness-warrior');
        
        this.loggerService.log(
          `Awarded cross-journey achievement 'wellness-warrior' to profile ${profileId}`,
          'CareJourneyHandler'
        );
      }
    }
  }
}

/**
 * Handler for Plan journey events.
 * Processes events related to insurance plans, claims, and benefits.
 */
@Injectable()
export class PlanJourneyHandler extends JourneyHandler {
  constructor(
    achievementsService: AchievementsService,
    profilesService: ProfilesService,
    questsService: QuestsService,
    rewardsService: RewardsService,
    rulesService: RulesService,
    loggerService: LoggerService,
    telemetryService: TelemetryService,
    kafkaService: KafkaService,
  ) {
    super(
      'plan',
      achievementsService,
      profilesService,
      questsService,
      rewardsService,
      rulesService,
      loggerService,
      telemetryService,
      kafkaService,
    );
  }

  /**
   * Validates that a plan journey event has the required data.
   * 
   * @param event The event to validate
   * @returns Whether the event is valid for the plan journey
   */
  protected validateEvent(event: ProcessEventDto): boolean {
    // Ensure event has the correct journey
    if (event.journey && event.journey !== 'plan') {
      return false;
    }

    // Validate based on event type
    switch (event.type) {
      case 'PLAN_SELECTED':
      case 'PLAN_RENEWED':
      case 'PLAN_CANCELLED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'planId' in event.data &&
          'planName' in event.data
        );

      case 'CLAIM_SUBMITTED':
      case 'CLAIM_APPROVED':
      case 'CLAIM_DENIED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'claimId' in event.data &&
          'claimType' in event.data &&
          'amount' in event.data
        );

      case 'BENEFIT_USED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'benefitId' in event.data &&
          'benefitType' in event.data
        );

      case 'DOCUMENT_UPLOADED':
        return (
          !!event.data &&
          typeof event.data === 'object' &&
          'documentId' in event.data &&
          'documentType' in event.data
        );

      default:
        // Unknown event type for plan journey
        return false;
    }
  }

  /**
   * Processes plan journey-specific event logic.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  protected async processJourneyEvent(event: ProcessEventDto): Promise<any> {
    // Process based on event type
    switch (event.type) {
      case 'PLAN_SELECTED':
        return this.processPlanSelected(event);

      case 'CLAIM_SUBMITTED':
        return this.processClaimSubmitted(event);

      case 'CLAIM_APPROVED':
        return this.processClaimApproved(event);

      case 'BENEFIT_USED':
        return this.processBenefitUsed(event);

      case 'DOCUMENT_UPLOADED':
        return this.processDocumentUploaded(event);

      default:
        // For other event types, just pass through to rules engine
        return { processed: true, eventType: event.type };
    }
  }

  /**
   * Processes a PLAN_SELECTED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processPlanSelected(event: ProcessEventDto): Promise<any> {
    const { planId, planName, planType } = event.data as any;

    // Log the plan selection
    this.loggerService.log(
      `Plan selected: ${planName} (${planId}) for user ${event.userId}`,
      'PlanJourneyHandler'
    );

    // Award XP for selecting a plan
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 20, {
      source: 'plan_selected',
      planName,
    });

    // Progress achievement for plan selection
    await this.achievementsService.progressAchievement(
      profile.id,
      'plan-selector',
      100
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'select_plan',
      { planType }
    );

    return { processed: true, xpAwarded: 20 };
  }

  /**
   * Processes a CLAIM_SUBMITTED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processClaimSubmitted(event: ProcessEventDto): Promise<any> {
    const { claimId, claimType, amount } = event.data as any;

    // Log the claim submission
    this.loggerService.log(
      `Claim submitted: ${claimType} (${claimId}) for $${amount} by user ${event.userId}`,
      'PlanJourneyHandler'
    );

    // Award XP for submitting a claim
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 10, {
      source: 'claim_submitted',
      claimType,
    });

    // Progress achievement for claim submission
    await this.achievementsService.progressAchievement(
      profile.id,
      'plan-claim-submitter',
      25
    );

    // Check for claim-specific achievements
    switch (claimType) {
      case 'medical':
        await this.achievementsService.progressAchievement(
          profile.id,
          'plan-medical-claim',
          50
        );
        break;

      case 'dental':
        await this.achievementsService.progressAchievement(
          profile.id,
          'plan-dental-claim',
          50
        );
        break;

      case 'vision':
        await this.achievementsService.progressAchievement(
          profile.id,
          'plan-vision-claim',
          50
        );
        break;
    }

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'submit_claim',
      { claimType }
    );

    return { processed: true, xpAwarded: 10 };
  }

  /**
   * Processes a CLAIM_APPROVED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processClaimApproved(event: ProcessEventDto): Promise<any> {
    const { claimId, claimType, amount } = event.data as any;

    // Log the claim approval
    this.loggerService.log(
      `Claim approved: ${claimType} (${claimId}) for $${amount} for user ${event.userId}`,
      'PlanJourneyHandler'
    );

    // Award XP for having a claim approved
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 15, {
      source: 'claim_approved',
      claimType,
    });

    // Progress achievement for successful claims
    await this.achievementsService.progressAchievement(
      profile.id,
      'plan-successful-claimer',
      50
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'get_claim_approved',
      { claimType }
    );

    // Check for cross-journey achievements
    await this.checkPlanCrossJourneyAchievements(profile.id);

    return { processed: true, xpAwarded: 15 };
  }

  /**
   * Processes a BENEFIT_USED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processBenefitUsed(event: ProcessEventDto): Promise<any> {
    const { benefitId, benefitType, benefitName } = event.data as any;

    // Log the benefit usage
    this.loggerService.log(
      `Benefit used: ${benefitName || benefitType} (${benefitId}) by user ${event.userId}`,
      'PlanJourneyHandler'
    );

    // Award XP for using a benefit
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 10, {
      source: 'benefit_used',
      benefitType,
    });

    // Progress achievement for benefit usage
    await this.achievementsService.progressAchievement(
      profile.id,
      'plan-benefit-user',
      25
    );

    // Check for benefit-specific achievements
    switch (benefitType) {
      case 'wellness':
        await this.achievementsService.progressAchievement(
          profile.id,
          'plan-wellness-benefit',
          100
        );
        break;

      case 'preventive':
        await this.achievementsService.progressAchievement(
          profile.id,
          'plan-preventive-benefit',
          100
        );
        break;
    }

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'use_benefit',
      { benefitType }
    );

    return { processed: true, xpAwarded: 10 };
  }

  /**
   * Processes a DOCUMENT_UPLOADED event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the processing result
   */
  private async processDocumentUploaded(event: ProcessEventDto): Promise<any> {
    const { documentId, documentType } = event.data as any;

    // Log the document upload
    this.loggerService.log(
      `Document uploaded: ${documentType} (${documentId}) by user ${event.userId}`,
      'PlanJourneyHandler'
    );

    // Award XP for uploading a document
    const profile = await this.profilesService.findOrCreate(event.userId);
    await this.profilesService.addXp(profile.id, 5, {
      source: 'document_uploaded',
      documentType,
    });

    // Progress achievement for document management
    await this.achievementsService.progressAchievement(
      profile.id,
      'plan-document-manager',
      20
    );

    // Check for quest progress
    await this.questsService.progressQuestByAction(
      profile.id,
      'upload_document',
      { documentType }
    );

    return { processed: true, xpAwarded: 5 };
  }

  /**
   * Checks for cross-journey achievements related to plan.
   * 
   * @param profileId The profile ID to check
   */
  private async checkPlanCrossJourneyAchievements(profileId: string): Promise<void> {
    // Check for the "Plan Master" achievement (requires multiple plan achievements)
    await this.checkCrossJourneyAchievement(
      profileId,
      [
        'plan-selector',
        'plan-claim-submitter',
        'plan-successful-claimer',
        'plan-benefit-user',
      ],
      'plan-master'
    );

    // Check for the "Complete Health Manager" cross-journey achievement
    // This requires achievements from all three journeys
    const planAchievements = [
      'plan-selector',
      'plan-benefit-user',
    ];

    const healthAchievements = [
      'health-goal-achiever',
      'health-device-connected',
    ];

    const careAchievements = [
      'care-appointment-attender',
      'care-medication-adherent',
    ];

    // Check if user has all required plan achievements
    const hasPlanAchievements = await this.achievementsService.userHasAchievements(
      profileId,
      planAchievements
    );

    if (hasPlanAchievements) {
      // Check if user has all required health achievements
      const hasHealthAchievements = await this.achievementsService.userHasAchievements(
        profileId,
        healthAchievements
      );

      // Check if user has all required care achievements
      const hasCareAchievements = await this.achievementsService.userHasAchievements(
        profileId,
        careAchievements
      );

      if (hasHealthAchievements && hasCareAchievements) {
        // Award the cross-journey achievement
        await this.achievementsService.unlockAchievement(profileId, 'complete-health-manager');
        
        this.loggerService.log(
          `Awarded cross-journey achievement 'complete-health-manager' to profile ${profileId}`,
          'PlanJourneyHandler'
        );
      }
    }
  }
}