import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { TelemedicineSession } from './entities/telemedicine-session.entity';
import { AppointmentType, AppointmentStatus } from '@app/shared/types/appointment.types';
import { PrismaService } from '@austa/database/connection';
import { LoggerService } from '@austa/logging';
import { KafkaService, KafkaRetryOptions } from '@austa/events/kafka';
import { 
  TelemedicineSessionNotFoundError,
  TelemedicineConnectionError,
  TelemedicineProviderOfflineError,
  CARE_TELEMEDICINE_CONNECTION_FAILED,
  CARE_TELEMEDICINE_DISABLED,
  CARE_TELEMEDICINE_UNAVAILABLE,
  CARE_APPOINTMENT_NOT_FOUND,
  CARE_APPOINTMENT_INVALID_TYPE,
  CARE_APPOINTMENT_INVALID_STATUS
} from '@austa/errors/journey/care';
import { ProvidersService } from '../providers/providers.service';
import { configuration } from '@app/shared/config';
import { TelemedicineSessionEvent } from '@austa/interfaces/care/telemedicine-session';

/**
 * Service responsible for managing telemedicine sessions, including session creation,
 * validation, and coordination between patients and healthcare providers.
 */
@Injectable()
export class TelemedicineService {
  private readonly config = configuration();

  /**
   * Initializes the TelemedicineService with required dependencies.
   * 
   * @param prisma - Database service for data access with connection pooling
   * @param logger - Logger service for structured logging
   * @param kafkaService - Event streaming service for publishing events with retry mechanisms
   * @param providersService - Service for validating provider information
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly kafkaService: KafkaService,
    private readonly providersService: ProvidersService
  ) {
    this.logger.log('TelemedicineService initialized', { context: 'TelemedicineService' });
  }

  /**
   * Starts a new telemedicine session between a patient and provider.
   * Validates provider availability, appointment eligibility, and creates
   * the necessary session records.
   * 
   * @param createSessionDto - Data required to create a telemedicine session
   * @returns The created telemedicine session
   * @throws Journey-specific error if validation fails or system error occurs
   */
  async startTelemedicineSession(createSessionDto: CreateSessionDto): Promise<TelemedicineSession> {
    try {
      // Validate that telemedicine is enabled in the configuration
      if (!this.config.telemedicine.enabled) {
        throw new TelemedicineConnectionError(
          'Telemedicine service is currently disabled',
          { errorCode: CARE_TELEMEDICINE_DISABLED }
        );
      }

      // Validate that the provider offers telemedicine
      const provider = await this.providersService.findById(createSessionDto.providerId);
      
      if (!provider.telemedicineAvailable) {
        throw new TelemedicineProviderOfflineError(
          `Provider ${provider.name} does not offer telemedicine services`,
          { 
            errorCode: CARE_TELEMEDICINE_UNAVAILABLE,
            providerId: provider.id 
          }
        );
      }
      
      // Get the appointment to validate eligibility using connection pooling
      const appointment = await this.prisma.withTransaction(async (tx) => {
        return tx.appointment.findUnique({
          where: { id: createSessionDto.appointmentId }
        });
      });
      
      if (!appointment) {
        throw new TelemedicineSessionNotFoundError(
          `Appointment with ID ${createSessionDto.appointmentId} not found`,
          { 
            errorCode: CARE_APPOINTMENT_NOT_FOUND,
            appointmentId: createSessionDto.appointmentId 
          }
        );
      }
      
      // Validate appointment type is telemedicine
      if (appointment.type !== AppointmentType.TELEMEDICINE) {
        throw new TelemedicineSessionNotFoundError(
          'Cannot start telemedicine session for a non-telemedicine appointment',
          { 
            errorCode: CARE_APPOINTMENT_INVALID_TYPE,
            appointmentId: appointment.id, 
            type: appointment.type 
          }
        );
      }
      
      // Validate appointment status
      if (appointment.status !== AppointmentStatus.SCHEDULED && 
          appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new TelemedicineSessionNotFoundError(
          `Cannot start telemedicine session for appointment with status ${appointment.status}`,
          { 
            errorCode: CARE_APPOINTMENT_INVALID_STATUS,
            appointmentId: appointment.id, 
            status: appointment.status 
          }
        );
      }
      
      // Create a new telemedicine session with transaction support
      const session = await this.prisma.withTransaction(async (tx) => {
        // Create the session
        const newSession = await tx.telemedicineSession.create({
          data: {
            appointmentId: createSessionDto.appointmentId,
            patientId: createSessionDto.userId,
            providerId: provider.id,
            startTime: new Date(),
            status: 'STARTED'
          }
        });
        
        // Update appointment status to IN_PROGRESS
        await tx.appointment.update({
          where: { id: appointment.id },
          data: { status: 'IN_PROGRESS' }
        });
        
        return newSession;
      });
      
      // Log session creation with structured logging
      this.logger.log(`Telemedicine session started: ${session.id}`, { 
        context: 'TelemedicineService',
        sessionId: session.id,
        appointmentId: session.appointmentId,
        patientId: session.patientId,
        providerId: session.providerId
      });
      
      // Create type-safe event payload using interface
      const eventPayload: TelemedicineSessionEvent = {
        sessionId: session.id,
        appointmentId: session.appointmentId,
        patientId: session.patientId,
        providerId: session.providerId,
        startTime: session.startTime,
        maxDuration: this.config.telemedicine.sessionDuration.default,
        journeyContext: 'care'
      };
      
      // Configure retry options for Kafka event publishing
      const retryOptions: KafkaRetryOptions = {
        retries: 3,
        backoffFactor: 1.5,
        initialDelayMs: 100,
        enableJitter: true,
        onFailure: (error, attemptCount) => {
          this.logger.warn(
            `Failed to publish telemedicine event (attempt ${attemptCount}): ${error.message}`,
            { 
              context: 'TelemedicineService',
              sessionId: session.id,
              error: error.message,
              attemptCount
            }
          );
        }
      };
      
      // Publish event to Kafka for gamification and notifications with retry mechanism
      await this.kafkaService.produce(
        'care.telemedicine.started',
        eventPayload,
        {
          key: session.id, // Use session ID as message key for ordering
          retry: retryOptions,
          headers: {
            'journey': 'care',
            'event-type': 'telemedicine-session-started',
            'correlation-id': session.id
          }
        }
      );
      
      return session;
    } catch (error) {
      // Handle journey-specific errors
      if (error instanceof TelemedicineSessionNotFoundError || 
          error instanceof TelemedicineConnectionError || 
          error instanceof TelemedicineProviderOfflineError) {
        throw error;
      }
      
      // Log error with structured logging
      this.logger.error(
        `Failed to start telemedicine session: ${error.message}`,
        { 
          context: 'TelemedicineService',
          error: error.message,
          stack: error.stack,
          dto: createSessionDto 
        }
      );
      
      // Throw appropriate error with context
      throw new TelemedicineConnectionError(
        'Failed to start telemedicine session',
        { 
          errorCode: CARE_TELEMEDICINE_CONNECTION_FAILED,
          dto: createSessionDto,
          cause: error 
        }
      );
    }
  }
}