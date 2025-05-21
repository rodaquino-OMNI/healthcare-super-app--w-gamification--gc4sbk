import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { TelemedicineSession } from './entities/telemedicine-session.entity';
import { AppointmentType, AppointmentStatus } from '@app/shared/appointments/entities/appointment.entity';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaProducer } from '@austa/events';
import { AppException, ErrorType } from '@austa/errors';
import { ProvidersService } from '../providers/providers.service';
import { configuration } from '../config/configuration';
import { TelemedicineConnectionError, TelemedicineDisabledError } from '@austa/errors/journey/care';
import { ITelemedicineSession } from '@austa/interfaces/journey/care';
import { TelemedicineEventDto } from '@austa/interfaces/gamification';

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
   * @param prisma - Enhanced database service with connection pooling and error handling
   * @param logger - Logger service for structured logging
   * @param kafkaProducer - Event streaming service for publishing events with retry mechanisms
   * @param providersService - Service for validating provider information
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly kafkaProducer: KafkaProducer,
    private readonly providersService: ProvidersService
  ) {
    this.logger.log('TelemedicineService initialized', 'TelemedicineService');
  }

  /**
   * Starts a new telemedicine session between a patient and provider.
   * Validates provider availability, appointment eligibility, and creates
   * the necessary session records.
   * 
   * @param createSessionDto - Data required to create a telemedicine session
   * @returns The created telemedicine session
   * @throws AppException if validation fails or system error occurs
   */
  async startTelemedicineSession(createSessionDto: CreateSessionDto): Promise<ITelemedicineSession> {
    try {
      // Validate that telemedicine is enabled in the configuration
      if (!this.config.telemedicine.enabled) {
        throw new TelemedicineDisabledError('Telemedicine service is currently disabled');
      }

      // Validate that the provider offers telemedicine
      const provider = await this.providersService.findById(createSessionDto.providerId);
      
      if (!provider.telemedicineAvailable) {
        throw new TelemedicineDisabledError(
          `Provider ${provider.name} does not offer telemedicine services`,
          { providerId: provider.id }
        );
      }
      
      // Get the appointment to validate eligibility
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: createSessionDto.appointmentId }
      });
      
      if (!appointment) {
        throw new AppException(
          `Appointment with ID ${createSessionDto.appointmentId} not found`,
          ErrorType.BUSINESS,
          'CARE_APPOINTMENT_NOT_FOUND',
          { appointmentId: createSessionDto.appointmentId }
        );
      }
      
      // Validate appointment type is telemedicine
      if (appointment.type !== AppointmentType.TELEMEDICINE) {
        throw new AppException(
          'Cannot start telemedicine session for a non-telemedicine appointment',
          ErrorType.BUSINESS,
          'CARE_APPOINTMENT_INVALID_TYPE',
          { appointmentId: appointment.id, type: appointment.type }
        );
      }
      
      // Validate appointment status
      if (appointment.status !== AppointmentStatus.SCHEDULED && 
          appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new AppException(
          `Cannot start telemedicine session for appointment with status ${appointment.status}`,
          ErrorType.BUSINESS,
          'CARE_APPOINTMENT_INVALID_STATUS',
          { appointmentId: appointment.id, status: appointment.status }
        );
      }
      
      // Use a transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // Create a new telemedicine session
        const session = await tx.telemedicineSession.create({
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
        
        // Log session creation
        this.logger.log(`Telemedicine session started: ${session.id}`, 'TelemedicineService');
        
        // Create event payload with type-safe schema
        const eventPayload: TelemedicineEventDto = {
          sessionId: session.id,
          appointmentId: session.appointmentId,
          patientId: session.patientId,
          providerId: session.providerId,
          startTime: session.startTime,
          maxDuration: this.config.telemedicine.sessionDuration.default,
          eventType: 'SESSION_STARTED'
        };
        
        // Publish event to Kafka with enhanced retry mechanism
        await this.kafkaProducer.produce({
          topic: 'care.telemedicine.events',
          messages: [{
            key: session.id, // Use session ID as message key for ordering
            value: JSON.stringify(eventPayload),
            headers: {
              'event-type': 'SESSION_STARTED',
              'journey': 'care',
              'source-service': 'care-service'
            }
          }],
          // Enable retry with exponential backoff
          retry: {
            retries: 3,
            initialRetryTime: 100,
            maxRetryTime: 30000
          },
          // Configure dead letter queue for failed events
          deadLetterQueue: {
            topic: 'care.telemedicine.events.dlq',
            headerName: 'x-original-topic'
          }
        });
        
        return session as ITelemedicineSession;
      });
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to start telemedicine session: ${error.message}`,
        error.stack,
        'TelemedicineService'
      );
      
      throw new TelemedicineConnectionError(
        'Failed to start telemedicine session',
        { dto: createSessionDto },
        error
      );
    }
  }
}