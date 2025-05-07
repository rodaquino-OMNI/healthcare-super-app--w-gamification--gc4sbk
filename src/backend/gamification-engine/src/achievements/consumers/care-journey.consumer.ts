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
import { CareEventType } from '@austa/interfaces/journey/care';
import { CareAppointmentEvent, CareMedicationEvent, CareTelemedicineEvent, CarePlanEvent } from '@austa/interfaces/journey/care';

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
 * Kafka consumer that processes achievement-related events from the Care Journey service.
 * Handles appointment bookings, medication adherence tracking, telemedicine sessions, and care plan progress events.
 * Extends BaseConsumer with care-specific event processing logic.
 */
@Injectable()
export class CareJourneyConsumer extends BaseConsumer {
  /**
   * Creates an instance of CareJourneyConsumer.
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
    super(kafkaService, loggerService, configService, tracingService, 'CareJourneyConsumer');
    
    // Configure topics for care journey events
    this.topics = this.configService.get<string[]>('KAFKA_CARE_TOPICS', [
      'care-appointments',
      'care-medications',
      'care-telemedicine',
      'care-plans'
    ]);
  }
  
  /**
   * Processes a validated care journey event message.
   * Routes the message to the appropriate handler based on event type.
   * 
   * @param message - The validated message to process
   */
  protected async processMessage(message: any): Promise<void> {
    // Create a span for tracing this event processing
    const span = this.tracingService.createSpan('care-journey.process-event', {
      'event.type': message.type,
      'event.user_id': message.userId,
      'event.journey': 'care'
    });
    try {
      this.loggerService.log(
        `Processing care journey event: ${message.type}`,
        { 
          userId: message.userId, 
          eventType: message.type,
          traceId: span.context().traceId,
          spanId: span.context().spanId
        },
        'CareJourneyConsumer'
      );
      
      // Get or create user profile
      const profile = await this.profilesService.findOrCreateByUserId(message.userId);
      
      // Process event based on type
      switch (message.type) {
        // Appointment booking events
        case CareEventType.APPOINTMENT_BOOKED:
          await this.processAppointmentBookedEvent(profile.id, message);
          break;
        case CareEventType.APPOINTMENT_COMPLETED:
          await this.processAppointmentCompletedEvent(profile.id, message);
          break;
        case CareEventType.APPOINTMENT_SERIES_BOOKED:
          await this.processAppointmentSeriesBookedEvent(profile.id, message);
          break;
          
        // Medication adherence events
        case CareEventType.MEDICATION_TAKEN:
          await this.processMedicationTakenEvent(profile.id, message);
          break;
        case CareEventType.MEDICATION_SCHEDULE_CREATED:
          await this.processMedicationScheduleCreatedEvent(profile.id, message);
          break;
        case CareEventType.MEDICATION_ADHERENCE_STREAK:
          await this.processMedicationAdherenceStreakEvent(profile.id, message);
          break;
          
        // Telemedicine session events
        case CareEventType.TELEMEDICINE_SESSION_STARTED:
          await this.processTelemedicineSessionStartedEvent(profile.id, message);
          break;
        case CareEventType.TELEMEDICINE_SESSION_COMPLETED:
          await this.processTelemedicineSessionCompletedEvent(profile.id, message);
          break;
        case CareEventType.TELEMEDICINE_FEEDBACK_SUBMITTED:
          await this.processTelemedicineFeedbackSubmittedEvent(profile.id, message);
          break;
          
        // Care plan progress events
        case CareEventType.CARE_PLAN_CREATED:
          await this.processCarePlanCreatedEvent(profile.id, message);
          break;
        case CareEventType.CARE_PLAN_TASK_COMPLETED:
          await this.processCarePlanTaskCompletedEvent(profile.id, message);
          break;
        case CareEventType.CARE_PLAN_MILESTONE_REACHED:
          await this.processCarePlanMilestoneReachedEvent(profile.id, message);
          break;
        case CareEventType.CARE_PLAN_COMPLETED:
          await this.processCarePlanCompletedEvent(profile.id, message);
          break;
          
        default:
          this.loggerService.warn(
            `Unhandled care journey event type: ${message.type}`,
            { userId: message.userId, eventType: message.type },
            'CareJourneyConsumer'
          );
      }
    } catch (error) {
      // Record error in the tracing span
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message }); // 2 = ERROR
      
      this.loggerService.error(
        `Error processing care journey event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          userId: message.userId,
          eventType: message.type,
          traceId: span.context().traceId,
          spanId: span.context().spanId
        },
        'CareJourneyConsumer'
      );
      throw error;
    } finally {
      // End the span regardless of success or failure
      span.end();
    }
  }
  
  /**
   * Processes an appointment booked event.
   * Awards XP and potentially unlocks achievements related to booking appointments.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The appointment booked event data
   */
  private async processAppointmentBookedEvent(profileId: string, event: CareAppointmentEvent): Promise<void> {
    try {
      // Extract appointment data
      const { data } = event;
      const appointmentType = data.appointmentType || 'general';
      
      // Award XP for booking an appointment
      await this.profilesService.addXp(profileId, 10, {
        source: 'care_journey',
        eventType: CareEventType.APPOINTMENT_BOOKED,
        appointmentType
      });
      
      // Update progress for "First Appointment" achievement
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_FIRST_APPOINTMENT',
        100 // Instantly complete this achievement
      );
      
      // Update progress for "Appointment Booker" achievement based on count
      const appointmentCount = data.userAppointmentCount || 1;
      const appointmentBookerProgress = Math.min(appointmentCount / 5 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_APPOINTMENT_BOOKER',
        appointmentBookerProgress
      );
      
      // Update progress for specialist appointment achievement if applicable
      if (appointmentType === 'specialist') {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'CARE_SPECIALIST_VISIT',
          100
        );
      }
      
      this.loggerService.log(
        'Processed appointment booked event',
        { profileId, appointmentType, appointmentCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing appointment booked event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.APPOINTMENT_BOOKED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes an appointment completed event.
   * Awards XP and potentially unlocks achievements related to completing appointments.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The appointment completed event data
   */
  private async processAppointmentCompletedEvent(profileId: string, event: CareAppointmentEvent): Promise<void> {
    try {
      // Extract appointment data
      const { data } = event;
      const appointmentType = data.appointmentType || 'general';
      
      // Award XP for completing an appointment
      await this.profilesService.addXp(profileId, 25, {
        source: 'care_journey',
        eventType: CareEventType.APPOINTMENT_COMPLETED,
        appointmentType
      });
      
      // Update progress for "Appointment Keeper" achievement based on count
      const completedAppointmentCount = data.completedAppointmentCount || 1;
      const appointmentKeeperProgress = Math.min(completedAppointmentCount / 3 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_APPOINTMENT_KEEPER',
        appointmentKeeperProgress
      );
      
      // Update progress for annual checkup achievement if applicable
      if (appointmentType === 'annual_checkup') {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'CARE_ANNUAL_CHECKUP',
          100
        );
      }
      
      this.loggerService.log(
        'Processed appointment completed event',
        { profileId, appointmentType, completedAppointmentCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing appointment completed event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.APPOINTMENT_COMPLETED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes an appointment series booked event.
   * Awards XP and potentially unlocks achievements related to booking a series of appointments.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The appointment series booked event data
   */
  private async processAppointmentSeriesBookedEvent(profileId: string, event: CareAppointmentEvent): Promise<void> {
    try {
      // Extract appointment data
      const { data } = event;
      const appointmentCount = data.appointmentCount || 0;
      
      // Award XP for booking a series of appointments
      await this.profilesService.addXp(profileId, 15 * appointmentCount, {
        source: 'care_journey',
        eventType: CareEventType.APPOINTMENT_SERIES_BOOKED,
        appointmentCount
      });
      
      // Update progress for "Care Planner" achievement
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_PLANNER',
        100 // Instantly complete this achievement
      );
      
      this.loggerService.log(
        'Processed appointment series booked event',
        { profileId, appointmentCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing appointment series booked event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.APPOINTMENT_SERIES_BOOKED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a medication taken event.
   * Awards XP and potentially unlocks achievements related to medication adherence.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The medication taken event data
   */
  private async processMedicationTakenEvent(profileId: string, event: CareMedicationEvent): Promise<void> {
    try {
      // Extract medication data
      const { data } = event;
      const medicationName = data.medicationName || 'Unknown';
      const isOnTime = data.isOnTime || false;
      
      // Award XP for taking medication (bonus for on-time)
      const xpAmount = isOnTime ? 15 : 10;
      await this.profilesService.addXp(profileId, xpAmount, {
        source: 'care_journey',
        eventType: CareEventType.MEDICATION_TAKEN,
        medicationName,
        isOnTime
      });
      
      // Update progress for "Medication Tracker" achievement based on count
      const medicationTakenCount = data.medicationTakenCount || 1;
      const medicationTrackerProgress = Math.min(medicationTakenCount / 30 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_MEDICATION_TRACKER',
        medicationTrackerProgress
      );
      
      // Update progress for "On-Time Medication" achievement if applicable
      if (isOnTime) {
        const onTimeMedicationCount = data.onTimeMedicationCount || 1;
        const onTimeMedicationProgress = Math.min(onTimeMedicationCount / 15 * 100, 100);
        
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'CARE_ON_TIME_MEDICATION',
          onTimeMedicationProgress
        );
      }
      
      this.loggerService.log(
        'Processed medication taken event',
        { profileId, medicationName, isOnTime, medicationTakenCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing medication taken event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.MEDICATION_TAKEN
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a medication schedule created event.
   * Awards XP and potentially unlocks achievements related to creating medication schedules.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The medication schedule created event data
   */
  private async processMedicationScheduleCreatedEvent(profileId: string, event: CareMedicationEvent): Promise<void> {
    try {
      // Extract medication data
      const { data } = event;
      const medicationCount = data.medicationCount || 1;
      
      // Award XP for creating a medication schedule
      await this.profilesService.addXp(profileId, 20, {
        source: 'care_journey',
        eventType: CareEventType.MEDICATION_SCHEDULE_CREATED,
        medicationCount
      });
      
      // Update progress for "Medication Manager" achievement
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_MEDICATION_MANAGER',
        100 // Instantly complete this achievement
      );
      
      this.loggerService.log(
        'Processed medication schedule created event',
        { profileId, medicationCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing medication schedule created event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.MEDICATION_SCHEDULE_CREATED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a medication adherence streak event.
   * Awards XP and potentially unlocks achievements related to maintaining medication adherence streaks.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The medication adherence streak event data
   */
  private async processMedicationAdherenceStreakEvent(profileId: string, event: CareMedicationEvent): Promise<void> {
    try {
      // Extract streak data
      const { data } = event;
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
          source: 'care_journey',
          eventType: CareEventType.MEDICATION_ADHERENCE_STREAK,
          streakDays
        });
      }
      
      // Update progress for streak achievements
      if (streakDays >= 7) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'CARE_MEDICATION_STREAK_7',
          100
        );
      }
      
      if (streakDays >= 14) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'CARE_MEDICATION_STREAK_14',
          100
        );
      }
      
      if (streakDays >= 30) {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'CARE_MEDICATION_STREAK_30',
          100
        );
      }
      
      this.loggerService.log(
        'Processed medication adherence streak event',
        { profileId, streakDays, xpAmount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing medication adherence streak event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.MEDICATION_ADHERENCE_STREAK
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a telemedicine session started event.
   * Awards XP and potentially unlocks achievements related to starting telemedicine sessions.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The telemedicine session started event data
   */
  private async processTelemedicineSessionStartedEvent(profileId: string, event: CareTelemedicineEvent): Promise<void> {
    try {
      // Extract session data
      const { data } = event;
      const providerType = data.providerType || 'general';
      
      // Award XP for starting a telemedicine session
      await this.profilesService.addXp(profileId, 15, {
        source: 'care_journey',
        eventType: CareEventType.TELEMEDICINE_SESSION_STARTED,
        providerType
      });
      
      // Update progress for "First Telemedicine" achievement
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_FIRST_TELEMEDICINE',
        100 // Instantly complete this achievement
      );
      
      this.loggerService.log(
        'Processed telemedicine session started event',
        { profileId, providerType },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing telemedicine session started event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.TELEMEDICINE_SESSION_STARTED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a telemedicine session completed event.
   * Awards XP and potentially unlocks achievements related to completing telemedicine sessions.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The telemedicine session completed event data
   */
  private async processTelemedicineSessionCompletedEvent(profileId: string, event: CareTelemedicineEvent): Promise<void> {
    try {
      // Extract session data
      const { data } = event;
      const sessionDuration = data.sessionDuration || 0; // in minutes
      const providerType = data.providerType || 'general';
      
      // Award XP for completing a telemedicine session
      await this.profilesService.addXp(profileId, 30, {
        source: 'care_journey',
        eventType: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
        providerType,
        sessionDuration
      });
      
      // Update progress for "Telemedicine Pro" achievement based on count
      const completedSessionCount = data.completedSessionCount || 1;
      const telemedicineProProgress = Math.min(completedSessionCount / 5 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_TELEMEDICINE_PRO',
        telemedicineProProgress
      );
      
      this.loggerService.log(
        'Processed telemedicine session completed event',
        { profileId, providerType, sessionDuration, completedSessionCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing telemedicine session completed event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.TELEMEDICINE_SESSION_COMPLETED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a telemedicine feedback submitted event.
   * Awards XP and potentially unlocks achievements related to providing feedback for telemedicine sessions.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The telemedicine feedback submitted event data
   */
  private async processTelemedicineFeedbackSubmittedEvent(profileId: string, event: CareTelemedicineEvent): Promise<void> {
    try {
      // Extract feedback data
      const { data } = event;
      const rating = data.rating || 0;
      const hasComments = data.hasComments || false;
      
      // Award XP for submitting feedback (bonus for detailed feedback)
      const xpAmount = hasComments ? 20 : 10;
      await this.profilesService.addXp(profileId, xpAmount, {
        source: 'care_journey',
        eventType: CareEventType.TELEMEDICINE_FEEDBACK_SUBMITTED,
        rating,
        hasComments
      });
      
      // Update progress for "Feedback Provider" achievement based on count
      const feedbackCount = data.feedbackCount || 1;
      const feedbackProviderProgress = Math.min(feedbackCount / 3 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_FEEDBACK_PROVIDER',
        feedbackProviderProgress
      );
      
      this.loggerService.log(
        'Processed telemedicine feedback submitted event',
        { profileId, rating, hasComments, feedbackCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing telemedicine feedback submitted event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.TELEMEDICINE_FEEDBACK_SUBMITTED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a care plan created event.
   * Awards XP and potentially unlocks achievements related to creating care plans.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The care plan created event data
   */
  private async processCarePlanCreatedEvent(profileId: string, event: CarePlanEvent): Promise<void> {
    try {
      // Extract care plan data
      const { data } = event;
      const planType = data.planType || 'general';
      const taskCount = data.taskCount || 0;
      
      // Award XP for creating a care plan
      await this.profilesService.addXp(profileId, 25, {
        source: 'care_journey',
        eventType: CareEventType.CARE_PLAN_CREATED,
        planType,
        taskCount
      });
      
      // Update progress for "Care Plan Creator" achievement
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_PLAN_CREATOR',
        100 // Instantly complete this achievement
      );
      
      this.loggerService.log(
        'Processed care plan created event',
        { profileId, planType, taskCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing care plan created event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.CARE_PLAN_CREATED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a care plan task completed event.
   * Awards XP and potentially unlocks achievements related to completing care plan tasks.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The care plan task completed event data
   */
  private async processCarePlanTaskCompletedEvent(profileId: string, event: CarePlanEvent): Promise<void> {
    try {
      // Extract task data
      const { data } = event;
      const taskType = data.taskType || 'general';
      const isOnTime = data.isOnTime || false;
      
      // Award XP for completing a care plan task (bonus for on-time)
      const xpAmount = isOnTime ? 15 : 10;
      await this.profilesService.addXp(profileId, xpAmount, {
        source: 'care_journey',
        eventType: CareEventType.CARE_PLAN_TASK_COMPLETED,
        taskType,
        isOnTime
      });
      
      // Update progress for "Care Plan Adherent" achievement based on count
      const completedTaskCount = data.completedTaskCount || 1;
      const carePlanAdherentProgress = Math.min(completedTaskCount / 10 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_PLAN_ADHERENT',
        carePlanAdherentProgress
      );
      
      this.loggerService.log(
        'Processed care plan task completed event',
        { profileId, taskType, isOnTime, completedTaskCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing care plan task completed event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.CARE_PLAN_TASK_COMPLETED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a care plan milestone reached event.
   * Awards XP and potentially unlocks achievements related to reaching care plan milestones.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The care plan milestone reached event data
   */
  private async processCarePlanMilestoneReachedEvent(profileId: string, event: CarePlanEvent): Promise<void> {
    try {
      // Extract milestone data
      const { data } = event;
      const milestoneName = data.milestoneName || 'Unknown';
      const milestoneIndex = data.milestoneIndex || 0;
      
      // Award XP for reaching a care plan milestone
      await this.profilesService.addXp(profileId, 30, {
        source: 'care_journey',
        eventType: CareEventType.CARE_PLAN_MILESTONE_REACHED,
        milestoneName,
        milestoneIndex
      });
      
      // Update progress for "Care Plan Milestone" achievement based on count
      const milestoneCount = data.milestoneCount || 1;
      const milestoneMasterProgress = Math.min(milestoneCount / 3 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_MILESTONE_MASTER',
        milestoneMasterProgress
      );
      
      this.loggerService.log(
        'Processed care plan milestone reached event',
        { profileId, milestoneName, milestoneIndex, milestoneCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing care plan milestone reached event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.CARE_PLAN_MILESTONE_REACHED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
  
  /**
   * Processes a care plan completed event.
   * Awards XP and potentially unlocks achievements related to completing care plans.
   * 
   * @param profileId - The ID of the user's game profile
   * @param event - The care plan completed event data
   */
  private async processCarePlanCompletedEvent(profileId: string, event: CarePlanEvent): Promise<void> {
    try {
      // Extract care plan data
      const { data } = event;
      const planType = data.planType || 'general';
      const completionPercentage = data.completionPercentage || 100;
      
      // Award XP for completing a care plan
      await this.profilesService.addXp(profileId, 50, {
        source: 'care_journey',
        eventType: CareEventType.CARE_PLAN_COMPLETED,
        planType,
        completionPercentage
      });
      
      // Update progress for "Care Plan Completer" achievement based on count
      const completedPlanCount = data.completedPlanCount || 1;
      const carePlanCompleterProgress = Math.min(completedPlanCount / 2 * 100, 100);
      
      await this.achievementsService.updateAchievementProgress(
        profileId,
        'CARE_PLAN_COMPLETER',
        carePlanCompleterProgress
      );
      
      // If this is a chronic condition plan, update that achievement
      if (planType === 'chronic_condition') {
        await this.achievementsService.updateAchievementProgress(
          profileId,
          'CARE_CHRONIC_CONDITION_MANAGER',
          100
        );
      }
      
      this.loggerService.log(
        'Processed care plan completed event',
        { profileId, planType, completionPercentage, completedPlanCount },
        'CareJourneyConsumer'
      );
    } catch (error) {
      this.loggerService.error(
        `Error processing care plan completed event: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          profileId,
          eventType: CareEventType.CARE_PLAN_COMPLETED
        },
        'CareJourneyConsumer'
      );
      throw error;
    }
  }
}