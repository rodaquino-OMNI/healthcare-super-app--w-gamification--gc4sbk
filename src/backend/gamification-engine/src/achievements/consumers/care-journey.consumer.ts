import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaContext } from '@nestjs/microservices';
import { AchievementsService } from '../achievements.service';
import { JourneyType } from '../../common/interfaces/journey.interface';
import { IEventPayload } from '@austa/interfaces/gamification';
import { 
  AppointmentType, 
  AppointmentStatus, 
  IAppointment,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan
} from '@austa/interfaces/journey/care';

/**
 * Base consumer class that all journey-specific consumers extend.
 * Provides common functionality for event processing, error handling, and retry logic.
 */
abstract class BaseConsumer {
  protected readonly logger: Logger;
  
  constructor(
    protected readonly achievementsService: AchievementsService,
    protected readonly configService: ConfigService,
    loggerName: string
  ) {
    this.logger = new Logger(loggerName);
  }

  /**
   * Process an event message from Kafka
   * 
   * @param payload - The event payload
   * @param context - The Kafka message context
   * @returns Promise resolving to the processing result
   */
  async process(payload: any, context: KafkaContext): Promise<IEventPayload> {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;
    const key = context.getMessage().key?.toString();
    
    this.logger.debug(`Processing message from ${topic}[${partition}:${offset}] with key ${key}`);
    
    try {
      // Validate the event payload
      this.validateEvent(payload);
      
      // Process the event based on its type
      return await this.processEvent(payload);
    } catch (error) {
      this.logger.error(
        `Error processing message from ${topic}[${partition}:${offset}]: ${error.message}`,
        error.stack
      );
      
      // Determine if the message should be retried or sent to DLQ
      const shouldRetry = this.shouldRetryMessage(error, payload);
      
      if (shouldRetry) {
        throw error; // Let Kafka retry the message
      } else {
        // Send to dead letter queue
        await this.sendToDLQ(payload, error, topic, partition, offset);
        
        // Return error response
        return {
          success: false,
          message: `Failed to process event: ${error.message}`,
          error: {
            code: error.code || 'PROCESSING_ERROR',
            message: error.message,
            details: error.details || {}
          }
        };
      }
    }
  }
  
  /**
   * Validate the event payload structure
   * 
   * @param payload - The event payload to validate
   * @throws Error if validation fails
   */
  protected validateEvent(payload: any): void {
    if (!payload) {
      throw new Error('Event payload is empty');
    }
    
    if (!payload.eventType) {
      throw new Error('Event type is missing');
    }
    
    if (!payload.userId) {
      throw new Error('User ID is missing');
    }
    
    if (!payload.timestamp) {
      throw new Error('Event timestamp is missing');
    }
  }
  
  /**
   * Determine if a failed message should be retried
   * 
   * @param error - The error that occurred
   * @param payload - The event payload
   * @returns True if the message should be retried, false otherwise
   */
  protected shouldRetryMessage(error: any, payload: any): boolean {
    // Don't retry validation errors
    if (error.message.includes('validation') || 
        error.message.includes('missing') ||
        error.message.includes('invalid')) {
      return false;
    }
    
    // Don't retry if the error is marked as non-retryable
    if (error.retryable === false) {
      return false;
    }
    
    // Default to retry for other errors
    return true;
  }
  
  /**
   * Send a failed message to the dead letter queue
   * 
   * @param payload - The original event payload
   * @param error - The error that occurred
   * @param topic - The original topic
   * @param partition - The original partition
   * @param offset - The original offset
   */
  protected async sendToDLQ(
    payload: any,
    error: any,
    topic: string,
    partition: number,
    offset: string
  ): Promise<void> {
    try {
      this.logger.warn(
        `Sending message from ${topic}[${partition}:${offset}] to DLQ: ${error.message}`
      );
      
      // In a real implementation, this would publish to a DLQ topic
      // For now, we just log the event
      this.logger.debug('DLQ payload', {
        originalTopic: topic,
        originalPartition: partition,
        originalOffset: offset,
        payload,
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code || 'UNKNOWN_ERROR'
        },
        timestamp: new Date().toISOString()
      });
    } catch (dlqError) {
      this.logger.error(
        `Failed to send message to DLQ: ${dlqError.message}`,
        dlqError.stack
      );
    }
  }
  
  /**
   * Process an event based on its type
   * 
   * @param payload - The event payload
   * @returns Promise resolving to the processing result
   */
  protected abstract processEvent(payload: any): Promise<IEventPayload>;
}

/**
 * Kafka consumer that processes achievement-related events from the Care Journey service.
 * Handles appointment bookings, medication adherence tracking, telemedicine sessions,
 * and care plan progress events.
 */
@Injectable()
export class CareJourneyConsumer extends BaseConsumer {
  /**
   * Creates an instance of the CareJourneyConsumer.
   * 
   * @param achievementsService - Service for managing achievements
   * @param configService - Service for accessing configuration
   */
  constructor(
    protected readonly achievementsService: AchievementsService,
    protected readonly configService: ConfigService
  ) {
    super(achievementsService, configService, CareJourneyConsumer.name);
  }

  /**
   * Process a Care Journey event based on its type
   * 
   * @param payload - The event payload
   * @returns Promise resolving to the processing result
   */
  protected async processEvent(payload: any): Promise<IEventPayload> {
    this.logger.log(`Processing Care Journey event: ${payload.eventType}`);
    
    switch (payload.eventType) {
      case 'APPOINTMENT_BOOKED':
        return this.handleAppointmentBookedEvent(payload);
      case 'APPOINTMENT_COMPLETED':
        return this.handleAppointmentCompletedEvent(payload);
      case 'MEDICATION_ADHERENCE_TRACKED':
        return this.handleMedicationAdherenceEvent(payload);
      case 'TELEMEDICINE_SESSION_COMPLETED':
        return this.handleTelemedicineSessionEvent(payload);
      case 'CARE_PLAN_PROGRESS_UPDATED':
        return this.handleCarePlanProgressEvent(payload);
      default:
        this.logger.warn(`Unsupported Care Journey event type: ${payload.eventType}`);
        return {
          success: false,
          message: `Unsupported event type: ${payload.eventType}`,
          error: {
            code: 'UNSUPPORTED_EVENT_TYPE',
            message: `Event type ${payload.eventType} is not supported by the Care Journey consumer`,
            details: { eventType: payload.eventType }
          }
        };
    }
  }

  /**
   * Handle an appointment booked event
   * 
   * @param payload - The event payload containing appointment data
   * @returns Promise resolving to the processing result
   */
  private async handleAppointmentBookedEvent(payload: any): Promise<IEventPayload> {
    try {
      this.logger.log(`Processing appointment booked event for user ${payload.userId}`);
      
      // Validate appointment data
      if (!payload.data || !payload.data.appointment) {
        throw new Error('Appointment data is missing');
      }
      
      const appointment: IAppointment = payload.data.appointment;
      
      // Process different achievement types based on appointment type
      let achievementId: string | null = null;
      
      switch (appointment.type) {
        case AppointmentType.CONSULTATION:
          achievementId = this.getConsultationAchievementId(payload);
          break;
        case AppointmentType.CHECKUP:
          achievementId = this.getCheckupAchievementId(payload);
          break;
        case AppointmentType.SPECIALIST:
          achievementId = this.getSpecialistAchievementId(payload);
          break;
        case AppointmentType.EXAM:
          achievementId = this.getExamAchievementId(payload);
          break;
        default:
          // Generic appointment achievement
          achievementId = 'care-first-appointment';
      }
      
      if (!achievementId) {
        return {
          success: true,
          message: 'No applicable achievement for this appointment type',
          data: { processed: true, achievementTriggered: false }
        };
      }
      
      // Check if this is the user's first appointment (for first-time achievements)
      const isFirstAppointment = payload.data.isFirstAppointment === true;
      
      // Process first appointment achievement if applicable
      if (isFirstAppointment) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-first-appointment',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: {
            appointmentId: appointment.id,
            appointmentType: appointment.type,
            provider: appointment.provider?.name || 'Unknown Provider',
            scheduledAt: appointment.scheduledAt
          },
          timestamp: new Date()
        });
      }
      
      // Process the specific achievement for this appointment type
      if (achievementId !== 'care-first-appointment') {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId,
          eventType: 'ACHIEVEMENT_PROGRESS',
          metadata: {
            appointmentId: appointment.id,
            appointmentType: appointment.type,
            provider: appointment.provider?.name || 'Unknown Provider',
            scheduledAt: appointment.scheduledAt,
            progress: this.calculateAppointmentProgress(payload)
          },
          timestamp: new Date()
        });
      }
      
      // Track appointment count for milestone achievements
      await this.trackAppointmentMilestone(payload);
      
      return {
        success: true,
        message: 'Appointment booked event processed successfully',
        data: {
          processed: true,
          achievementTriggered: true,
          achievementId
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing appointment booked event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Handle an appointment completed event
   * 
   * @param payload - The event payload containing appointment data
   * @returns Promise resolving to the processing result
   */
  private async handleAppointmentCompletedEvent(payload: any): Promise<IEventPayload> {
    try {
      this.logger.log(`Processing appointment completed event for user ${payload.userId}`);
      
      // Validate appointment data
      if (!payload.data || !payload.data.appointment) {
        throw new Error('Appointment data is missing');
      }
      
      const appointment: IAppointment = payload.data.appointment;
      
      // Only process completed appointments
      if (appointment.status !== AppointmentStatus.COMPLETED) {
        return {
          success: true,
          message: 'Appointment not completed, no achievement progress',
          data: { processed: true, achievementTriggered: false }
        };
      }
      
      // Process different achievement types based on appointment type
      let achievementId: string | null = null;
      
      switch (appointment.type) {
        case AppointmentType.CONSULTATION:
          achievementId = 'care-complete-consultation';
          break;
        case AppointmentType.CHECKUP:
          achievementId = 'care-complete-checkup';
          break;
        case AppointmentType.SPECIALIST:
          achievementId = 'care-complete-specialist';
          break;
        case AppointmentType.EXAM:
          achievementId = 'care-complete-exam';
          break;
        default:
          // Generic appointment completion achievement
          achievementId = 'care-complete-appointment';
      }
      
      // Process the achievement
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId,
        eventType: 'ACHIEVEMENT_UNLOCKED',
        metadata: {
          appointmentId: appointment.id,
          appointmentType: appointment.type,
          provider: appointment.provider?.name || 'Unknown Provider',
          completedAt: appointment.completedAt || new Date()
        },
        timestamp: new Date()
      });
      
      // Track completed appointment count for milestone achievements
      await this.trackCompletedAppointmentMilestone(payload);
      
      return {
        success: true,
        message: 'Appointment completed event processed successfully',
        data: {
          processed: true,
          achievementTriggered: true,
          achievementId
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing appointment completed event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Handle a medication adherence event
   * 
   * @param payload - The event payload containing medication adherence data
   * @returns Promise resolving to the processing result
   */
  private async handleMedicationAdherenceEvent(payload: any): Promise<IEventPayload> {
    try {
      this.logger.log(`Processing medication adherence event for user ${payload.userId}`);
      
      // Validate medication data
      if (!payload.data || !payload.data.medication) {
        throw new Error('Medication data is missing');
      }
      
      const medication: IMedication = payload.data.medication;
      const adherenceRate = payload.data.adherenceRate || 0;
      
      // Process first medication tracking achievement if applicable
      const isFirstTracking = payload.data.isFirstTracking === true;
      
      if (isFirstTracking) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-first-medication-tracking',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: {
            medicationId: medication.id,
            medicationName: medication.name,
            trackedAt: new Date()
          },
          timestamp: new Date()
        });
      }
      
      // Process adherence streak achievements
      const streakDays = payload.data.streakDays || 0;
      
      if (streakDays >= 7) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-medication-streak-7days',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: {
            medicationId: medication.id,
            medicationName: medication.name,
            streakDays,
            achievedAt: new Date()
          },
          timestamp: new Date()
        });
      }
      
      if (streakDays >= 30) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-medication-streak-30days',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: {
            medicationId: medication.id,
            medicationName: medication.name,
            streakDays,
            achievedAt: new Date()
          },
          timestamp: new Date()
        });
      }
      
      // Process adherence rate achievements
      if (adherenceRate >= 80) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-medication-adherence-80',
          eventType: 'ACHIEVEMENT_PROGRESS',
          metadata: {
            medicationId: medication.id,
            medicationName: medication.name,
            adherenceRate,
            progress: Math.min(100, adherenceRate)
          },
          timestamp: new Date()
        });
      }
      
      // Track medication count for milestone achievements
      await this.trackMedicationMilestone(payload);
      
      return {
        success: true,
        message: 'Medication adherence event processed successfully',
        data: {
          processed: true,
          achievementTriggered: true,
          adherenceRate,
          streakDays
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing medication adherence event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Handle a telemedicine session event
   * 
   * @param payload - The event payload containing telemedicine session data
   * @returns Promise resolving to the processing result
   */
  private async handleTelemedicineSessionEvent(payload: any): Promise<IEventPayload> {
    try {
      this.logger.log(`Processing telemedicine session event for user ${payload.userId}`);
      
      // Validate telemedicine session data
      if (!payload.data || !payload.data.session) {
        throw new Error('Telemedicine session data is missing');
      }
      
      const session: ITelemedicineSession = payload.data.session;
      
      // Process first telemedicine session achievement if applicable
      const isFirstSession = payload.data.isFirstSession === true;
      
      if (isFirstSession) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-first-telemedicine',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: {
            sessionId: session.id,
            provider: session.appointment?.provider?.name || 'Unknown Provider',
            completedAt: session.endTime || new Date()
          },
          timestamp: new Date()
        });
      }
      
      // Process session duration achievement
      const durationMinutes = this.calculateSessionDuration(session);
      
      if (durationMinutes >= 15) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-telemedicine-complete',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: {
            sessionId: session.id,
            provider: session.appointment?.provider?.name || 'Unknown Provider',
            durationMinutes,
            completedAt: session.endTime || new Date()
          },
          timestamp: new Date()
        });
      }
      
      // Track telemedicine session count for milestone achievements
      await this.trackTelemedicineMilestone(payload);
      
      return {
        success: true,
        message: 'Telemedicine session event processed successfully',
        data: {
          processed: true,
          achievementTriggered: true,
          durationMinutes
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing telemedicine session event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Handle a care plan progress event
   * 
   * @param payload - The event payload containing care plan progress data
   * @returns Promise resolving to the processing result
   */
  private async handleCarePlanProgressEvent(payload: any): Promise<IEventPayload> {
    try {
      this.logger.log(`Processing care plan progress event for user ${payload.userId}`);
      
      // Validate care plan data
      if (!payload.data || !payload.data.treatmentPlan) {
        throw new Error('Care plan data is missing');
      }
      
      const treatmentPlan: ITreatmentPlan = payload.data.treatmentPlan;
      const progressPercentage = payload.data.progressPercentage || 0;
      
      // Process care plan creation achievement if applicable
      const isNewPlan = payload.data.isNewPlan === true;
      
      if (isNewPlan) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-plan-created',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: {
            planId: treatmentPlan.id,
            planTitle: treatmentPlan.title,
            createdAt: treatmentPlan.createdAt || new Date()
          },
          timestamp: new Date()
        });
      }
      
      // Process care plan progress achievements
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-plan-progress',
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: {
          planId: treatmentPlan.id,
          planTitle: treatmentPlan.title,
          progressPercentage,
          progress: progressPercentage
        },
        timestamp: new Date()
      });
      
      // Process care plan completion achievement if applicable
      if (progressPercentage >= 100) {
        await this.achievementsService.processAchievementEvent({
          userId: payload.userId,
          achievementId: 'care-plan-completed',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: {
            planId: treatmentPlan.id,
            planTitle: treatmentPlan.title,
            completedAt: new Date()
          },
          timestamp: new Date()
        });
      }
      
      // Track care plan count for milestone achievements
      await this.trackCarePlanMilestone(payload);
      
      return {
        success: true,
        message: 'Care plan progress event processed successfully',
        data: {
          processed: true,
          achievementTriggered: true,
          progressPercentage
        }
      };
    } catch (error) {
      this.logger.error(
        `Error processing care plan progress event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get the achievement ID for a consultation appointment
   * 
   * @param payload - The event payload
   * @returns The achievement ID or null if not applicable
   */
  private getConsultationAchievementId(payload: any): string | null {
    return 'care-book-consultation';
  }

  /**
   * Get the achievement ID for a checkup appointment
   * 
   * @param payload - The event payload
   * @returns The achievement ID or null if not applicable
   */
  private getCheckupAchievementId(payload: any): string | null {
    return 'care-book-checkup';
  }

  /**
   * Get the achievement ID for a specialist appointment
   * 
   * @param payload - The event payload
   * @returns The achievement ID or null if not applicable
   */
  private getSpecialistAchievementId(payload: any): string | null {
    return 'care-book-specialist';
  }

  /**
   * Get the achievement ID for an exam appointment
   * 
   * @param payload - The event payload
   * @returns The achievement ID or null if not applicable
   */
  private getExamAchievementId(payload: any): string | null {
    return 'care-book-exam';
  }

  /**
   * Calculate the progress percentage for an appointment achievement
   * 
   * @param payload - The event payload
   * @returns The progress percentage (0-100)
   */
  private calculateAppointmentProgress(payload: any): number {
    // For booking achievements, we consider it 100% complete when booked
    return 100;
  }

  /**
   * Calculate the duration of a telemedicine session in minutes
   * 
   * @param session - The telemedicine session data
   * @returns The duration in minutes
   */
  private calculateSessionDuration(session: ITelemedicineSession): number {
    if (!session.startTime || !session.endTime) {
      return 0;
    }
    
    const startTime = new Date(session.startTime).getTime();
    const endTime = new Date(session.endTime).getTime();
    
    // Calculate duration in minutes
    return Math.round((endTime - startTime) / (1000 * 60));
  }

  /**
   * Track appointment milestones for achievements
   * 
   * @param payload - The event payload
   */
  private async trackAppointmentMilestone(payload: any): Promise<void> {
    // Get the total appointment count from the payload
    const appointmentCount = payload.data.totalAppointments || 1;
    
    // Process milestone achievements based on count
    if (appointmentCount >= 5) {
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-book-5-appointments',
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: {
          appointmentCount,
          progress: Math.min(100, (appointmentCount / 5) * 100)
        },
        timestamp: new Date()
      });
    }
    
    if (appointmentCount >= 10) {
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-book-10-appointments',
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: {
          appointmentCount,
          progress: Math.min(100, (appointmentCount / 10) * 100)
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Track completed appointment milestones for achievements
   * 
   * @param payload - The event payload
   */
  private async trackCompletedAppointmentMilestone(payload: any): Promise<void> {
    // Get the total completed appointment count from the payload
    const completedCount = payload.data.totalCompletedAppointments || 1;
    
    // Process milestone achievements based on count
    if (completedCount >= 3) {
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-complete-3-appointments',
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: {
          completedCount,
          progress: Math.min(100, (completedCount / 3) * 100)
        },
        timestamp: new Date()
      });
    }
    
    if (completedCount >= 5) {
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-complete-5-appointments',
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: {
          completedCount,
          progress: Math.min(100, (completedCount / 5) * 100)
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Track medication milestones for achievements
   * 
   * @param payload - The event payload
   */
  private async trackMedicationMilestone(payload: any): Promise<void> {
    // Get the total medication count from the payload
    const medicationCount = payload.data.totalMedications || 1;
    
    // Process milestone achievements based on count
    if (medicationCount >= 3) {
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-track-3-medications',
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: {
          medicationCount,
          progress: Math.min(100, (medicationCount / 3) * 100)
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Track telemedicine milestones for achievements
   * 
   * @param payload - The event payload
   */
  private async trackTelemedicineMilestone(payload: any): Promise<void> {
    // Get the total telemedicine session count from the payload
    const sessionCount = payload.data.totalSessions || 1;
    
    // Process milestone achievements based on count
    if (sessionCount >= 3) {
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-complete-3-telemedicine',
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: {
          sessionCount,
          progress: Math.min(100, (sessionCount / 3) * 100)
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Track care plan milestones for achievements
   * 
   * @param payload - The event payload
   */
  private async trackCarePlanMilestone(payload: any): Promise<void> {
    // Get the total completed care plan count from the payload
    const completedPlans = payload.data.totalCompletedPlans || 0;
    
    // Process milestone achievements based on count
    if (completedPlans >= 1) {
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-complete-first-plan',
        eventType: 'ACHIEVEMENT_UNLOCKED',
        metadata: {
          completedPlans,
          achievedAt: new Date()
        },
        timestamp: new Date()
      });
    }
    
    if (completedPlans >= 3) {
      await this.achievementsService.processAchievementEvent({
        userId: payload.userId,
        achievementId: 'care-complete-3-plans',
        eventType: 'ACHIEVEMENT_PROGRESS',
        metadata: {
          completedPlans,
          progress: Math.min(100, (completedPlans / 3) * 100)
        },
        timestamp: new Date()
      });
    }
  }
}