import { Injectable } from '@nestjs/common'; // v10.3.0
import { CreateAppointmentDto } from '@app/care/appointments/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '@app/care/appointments/dto/update-appointment.dto';
import { Service } from '@app/shared/interfaces/service.interface';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto, PaginatedResponse } from '@app/shared/dto/pagination.dto';
import { Repository } from '@app/shared/interfaces/repository.interface';
import { ProvidersService } from '@app/care/providers/providers.service';
import { TelemedicineService } from '@app/care/telemedicine/telemedicine.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { PrismaService } from '@app/database/connection/prisma.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { configuration } from '@app/care/config/configuration';

// Import from @austa/interfaces for type-safe data models
import { Appointment, AppointmentStatus, AppointmentType } from '@austa/interfaces/care';

// Import error handling and transaction management
import { BaseError, ErrorType } from '@austa/errors';
import { RetryWithBackoff, WithCircuitBreaker, WithFallback, Resilient } from '@austa/errors/decorators';
import { TransactionService } from '@austa/database/transactions';
import { Transactional } from '@austa/database/transactions';

/**
 * Handles the business logic for managing appointments within the Care Service.
 * This service provides methods for creating, retrieving, updating, and deleting appointments,
 * ensuring proper data validation and interaction with the data access layer.
 * 
 * Implements the requirements for appointment booking and management in the Care Now journey.
 */
@Injectable()
export class AppointmentsService implements Service<Appointment, CreateAppointmentDto, UpdateAppointmentDto> {
  private readonly logger = new LoggerService('AppointmentsService');
  private readonly config = configuration();

  /**
   * Initializes the AppointmentsService with required dependencies.
   * 
   * @param prisma Database service for appointment data access
   * @param providersService Service for managing healthcare providers
   * @param telemedicineService Service for managing telemedicine sessions
   * @param kafkaService Service for event streaming
   * @param transactionService Service for managing database transactions
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly telemedicineService: TelemedicineService,
    private readonly kafkaService: KafkaService,
    private readonly transactionService: TransactionService
  ) {
    this.logger.log('AppointmentsService initialized');
  }

  /**
   * Retrieves an appointment by its unique identifier.
   * 
   * @param id Appointment ID
   * @returns The requested appointment or null if not found
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.DATABASE_CONNECTION]
  })
  async findById(id: string): Promise<Appointment | null> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          provider: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return appointment;
    } catch (error) {
      this.logger.error(`Failed to find appointment: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to retrieve appointment with ID ${id}`,
        ErrorType.DATABASE_READ,
        'CARE_101',
        { id },
        error
      );
    }
  }

  /**
   * Retrieves a paginated list of appointments based on filter criteria.
   * 
   * @param pagination Pagination parameters
   * @param filter Filter criteria for appointments
   * @returns Paginated list of appointments
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.DATABASE_CONNECTION]
  })
  async findAll(pagination?: PaginationDto, filter?: FilterDto): Promise<PaginatedResponse<Appointment>> {
    try {
      const { page = 1, limit = 10 } = pagination || {};
      const skip = (page - 1) * limit;

      // Prepare where clause from filter
      const where = filter?.where || {};

      // Get appointments with pagination
      const appointments = await this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: filter?.orderBy || { dateTime: 'desc' },
        include: {
          provider: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      // Get total count for pagination
      const totalItems = await this.count(filter);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: appointments,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      this.logger.error(`Failed to find appointments: ${error.message}`, error.stack);
      throw new BaseError(
        'Failed to retrieve appointments',
        ErrorType.DATABASE_READ,
        'CARE_102',
        { pagination, filter },
        error
      );
    }
  }

  /**
   * Creates a new appointment.
   * 
   * @param data Appointment data
   * @returns The created appointment
   */
  @Transactional({
    isolationLevel: 'READ_COMMITTED',
    timeout: 5000
  })
  async create(data: CreateAppointmentDto): Promise<Appointment> {
    try {
      // Check if provider exists
      const provider = await this.providersService.findById(data.providerId);

      // Check appointment time is in the future
      const appointmentDate = new Date(data.dateTime);
      const now = new Date();
      if (appointmentDate < now) {
        throw new BaseError(
          'Appointment date must be in the future',
          ErrorType.VALIDATION,
          'CARE_103',
          { dateTime: data.dateTime }
        );
      }

      // Check if the appointment time is within allowed advance booking range
      const maxAdvanceDays = this.config.appointments.maxAdvanceDays;
      const maxAdvanceDate = new Date();
      maxAdvanceDate.setDate(maxAdvanceDate.getDate() + maxAdvanceDays);

      if (appointmentDate > maxAdvanceDate) {
        throw new BaseError(
          `Appointments can only be booked up to ${maxAdvanceDays} days in advance`,
          ErrorType.VALIDATION,
          'CARE_104',
          { dateTime: data.dateTime, maxAdvanceDate }
        );
      }

      // Check provider availability for the requested time
      const isAvailable = await this.checkProviderAvailability(
        data.providerId, 
        appointmentDate
      );

      if (!isAvailable) {
        throw new BaseError(
          `Provider is not available at the requested time`,
          ErrorType.BUSINESS,
          'CARE_105',
          { providerId: data.providerId, dateTime: data.dateTime }
        );
      }

      // For telemedicine, check if provider offers it
      if (data.type === AppointmentType.TELEMEDICINE && !provider.telemedicineAvailable) {
        throw new BaseError(
          `Provider does not offer telemedicine services`,
          ErrorType.BUSINESS,
          'CARE_106',
          { providerId: data.providerId }
        );
      }

      // Check for user appointment conflicts
      const hasConflict = await this.checkUserAppointmentConflict(data.userId, appointmentDate);
      if (hasConflict) {
        throw new BaseError(
          `User already has an appointment scheduled around this time`,
          ErrorType.BUSINESS,
          'CARE_107',
          { userId: data.userId, dateTime: data.dateTime }
        );
      }

      // Create appointment within transaction
      const appointment = await this.prisma.appointment.create({
        data: {
          userId: data.userId,
          providerId: data.providerId,
          dateTime: appointmentDate,
          type: data.type as AppointmentType,
          status: AppointmentStatus.SCHEDULED,
          reason: data.reason || null,
          notes: null
        },
        include: {
          provider: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      // Publish appointment creation event for gamification and notifications
      await this.publishAppointmentCreatedEvent(appointment);

      this.logger.log(`Appointment created: ${appointment.id}`);
      return appointment;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to create appointment: ${error.message}`, error.stack);
      throw new BaseError(
        'Failed to create appointment',
        ErrorType.DATABASE_WRITE,
        'CARE_108',
        { data },
        error
      );
    }
  }

  /**
   * Updates an existing appointment.
   * 
   * @param id Appointment ID
   * @param data Updated appointment data
   * @returns The updated appointment
   */
  @Transactional({
    isolationLevel: 'READ_COMMITTED',
    timeout: 5000
  })
  async update(id: string, data: UpdateAppointmentDto): Promise<Appointment> {
    try {
      // Check if appointment exists
      const existingAppointment = await this.findById(id);
      
      if (!existingAppointment) {
        throw new BaseError(
          `Appointment with ID ${id} not found`,
          ErrorType.NOT_FOUND,
          'CARE_109',
          { id }
        );
      }

      // Check if the appointment is already completed or cancelled
      if (
        existingAppointment.status === AppointmentStatus.COMPLETED || 
        existingAppointment.status === AppointmentStatus.CANCELLED
      ) {
        throw new BaseError(
          `Cannot update a ${existingAppointment.status.toLowerCase()} appointment`,
          ErrorType.BUSINESS,
          'CARE_110',
          { id, status: existingAppointment.status }
        );
      }

      // If changing date/time, validate availability
      if (data.dateTime && data.dateTime !== existingAppointment.dateTime) {
        const newDateTime = new Date(data.dateTime);
        const now = new Date();
        
        // Check if the new date is in the future
        if (newDateTime < now) {
          throw new BaseError(
            'Appointment date must be in the future',
            ErrorType.VALIDATION,
            'CARE_111',
            { dateTime: data.dateTime }
          );
        }

        // Check if the new date is within allowed rescheduling window
        const maxAdvanceDays = this.config.appointments.maxAdvanceDays;
        const maxAdvanceDate = new Date();
        maxAdvanceDate.setDate(maxAdvanceDate.getDate() + maxAdvanceDays);

        if (newDateTime > maxAdvanceDate) {
          throw new BaseError(
            `Appointments can only be rescheduled up to ${maxAdvanceDays} days in advance`,
            ErrorType.VALIDATION,
            'CARE_112',
            { dateTime: data.dateTime, maxAdvanceDate }
          );
        }

        // Check provider availability for the new time
        const isAvailable = await this.checkProviderAvailability(
          existingAppointment.providerId, 
          newDateTime
        );

        if (!isAvailable) {
          throw new BaseError(
            `Provider is not available at the requested time`,
            ErrorType.BUSINESS,
            'CARE_113',
            { providerId: existingAppointment.providerId, dateTime: data.dateTime }
          );
        }
        
        // Check for user appointment conflicts
        const hasConflict = await this.checkUserAppointmentConflict(
          existingAppointment.userId, 
          newDateTime,
          id // Exclude current appointment from conflict check
        );
        
        if (hasConflict) {
          throw new BaseError(
            `User already has an appointment scheduled around this time`,
            ErrorType.BUSINESS,
            'CARE_114',
            { userId: existingAppointment.userId, dateTime: data.dateTime }
          );
        }
      }

      // If changing type to telemedicine, check if provider offers it
      if (
        data.type === AppointmentType.TELEMEDICINE && 
        existingAppointment.type !== AppointmentType.TELEMEDICINE
      ) {
        const provider = await this.providersService.findById(existingAppointment.providerId);
        
        if (!provider.telemedicineAvailable) {
          throw new BaseError(
            `Provider does not offer telemedicine services`,
            ErrorType.BUSINESS,
            'CARE_115',
            { providerId: existingAppointment.providerId }
          );
        }
      }

      // Check if cancelling an appointment
      const isCancelling = data.status === AppointmentStatus.CANCELLED && 
                          existingAppointment.status !== AppointmentStatus.CANCELLED;

      // Apply cancellation policy if applicable
      let xpLoss = 0;
      if (isCancelling && this.config.appointments.cancellationPolicy.enabled) {
        const appointmentDate = new Date(existingAppointment.dateTime);
        const now = new Date();
        const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilAppointment < this.config.appointments.cancellationPolicy.minimumNoticeHours) {
          xpLoss = this.config.appointments.cancellationPolicy.penaltyXpLoss;
        }
      }

      // Update appointment within transaction
      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: {
          dateTime: data.dateTime,
          type: data.type,
          status: data.status,
          notes: data.notes
        },
        include: {
          provider: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      // Publish event for appointment update
      await this.publishAppointmentUpdatedEvent(updatedAppointment, isCancelling, xpLoss);

      this.logger.log(`Appointment updated: ${id}`);
      return updatedAppointment;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to update appointment: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to update appointment with ID ${id}`,
        ErrorType.DATABASE_WRITE,
        'CARE_116',
        { id, data },
        error
      );
    }
  }

  /**
   * Deletes an appointment.
   * Note: This is a soft delete operation that cancels the appointment instead of removing it.
   * 
   * @param id Appointment ID
   * @returns True if the appointment was successfully cancelled
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Check if appointment exists
      const existingAppointment = await this.findById(id);
      
      if (!existingAppointment) {
        throw new BaseError(
          `Appointment with ID ${id} not found`,
          ErrorType.NOT_FOUND,
          'CARE_117',
          { id }
        );
      }

      // Cancel the appointment instead of deleting it
      await this.update(id, { status: AppointmentStatus.CANCELLED });
      
      this.logger.log(`Appointment cancelled: ${id}`);
      return true;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to delete appointment: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to delete appointment with ID ${id}`,
        ErrorType.DATABASE_WRITE,
        'CARE_118',
        { id },
        error
      );
    }
  }

  /**
   * Counts appointments based on filter criteria.
   * 
   * @param filter Filter criteria for appointments
   * @returns The count of matching appointments
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.DATABASE_CONNECTION]
  })
  async count(filter?: FilterDto): Promise<number> {
    try {
      const where = filter?.where || {};
      return await this.prisma.appointment.count({ where });
    } catch (error) {
      this.logger.error(`Failed to count appointments: ${error.message}`, error.stack);
      throw new BaseError(
        'Failed to count appointments',
        ErrorType.DATABASE_READ,
        'CARE_119',
        { filter },
        error
      );
    }
  }

  /**
   * Marks an appointment as completed.
   * 
   * @param id Appointment ID
   * @returns The updated appointment
   */
  @Transactional({
    isolationLevel: 'READ_COMMITTED',
    timeout: 5000
  })
  async completeAppointment(id: string): Promise<Appointment> {
    try {
      // Check if appointment exists
      const existingAppointment = await this.findById(id);
      
      if (!existingAppointment) {
        throw new BaseError(
          `Appointment with ID ${id} not found`,
          ErrorType.NOT_FOUND,
          'CARE_120',
          { id }
        );
      }

      // Check if the appointment is already completed or cancelled
      if (
        existingAppointment.status === AppointmentStatus.COMPLETED || 
        existingAppointment.status === AppointmentStatus.CANCELLED
      ) {
        throw new BaseError(
          `Cannot complete a ${existingAppointment.status.toLowerCase()} appointment`,
          ErrorType.BUSINESS,
          'CARE_121',
          { id, status: existingAppointment.status }
        );
      }

      // Update appointment status
      const completedAppointment = await this.update(id, { 
        status: AppointmentStatus.COMPLETED 
      });

      // Publish event for appointment completion and gamification
      await this.publishAppointmentCompletedEvent(completedAppointment);

      this.logger.log(`Appointment completed: ${id}`);
      return completedAppointment;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to complete appointment: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to complete appointment with ID ${id}`,
        ErrorType.DATABASE_WRITE,
        'CARE_122',
        { id },
        error
      );
    }
  }

  /**
   * Gets upcoming appointments for a user.
   * 
   * @param userId User ID
   * @param pagination Pagination parameters
   * @returns Paginated list of upcoming appointments
   */
  async getUpcomingAppointments(userId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Appointment>> {
    try {
      const now = new Date();
      
      return this.findAll(pagination, {
        where: {
          userId,
          dateTime: { gte: now },
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] }
        },
        orderBy: { dateTime: 'asc' }
      });
    } catch (error) {
      this.logger.error(`Failed to get upcoming appointments: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to retrieve upcoming appointments for user ${userId}`,
        ErrorType.DATABASE_READ,
        'CARE_123',
        { userId, pagination },
        error
      );
    }
  }

  /**
   * Gets past appointments for a user.
   * 
   * @param userId User ID
   * @param pagination Pagination parameters
   * @returns Paginated list of past appointments
   */
  async getPastAppointments(userId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Appointment>> {
    try {
      const now = new Date();
      
      return this.findAll(pagination, {
        where: {
          userId,
          OR: [
            { dateTime: { lt: now } },
            { status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED] } }
          ]
        },
        orderBy: { dateTime: 'desc' }
      });
    } catch (error) {
      this.logger.error(`Failed to get past appointments: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to retrieve past appointments for user ${userId}`,
        ErrorType.DATABASE_READ,
        'CARE_124',
        { userId, pagination },
        error
      );
    }
  }

  /**
   * Confirms an appointment.
   * 
   * @param id Appointment ID
   * @returns The updated appointment
   */
  @Transactional({
    isolationLevel: 'READ_COMMITTED',
    timeout: 5000
  })
  async confirmAppointment(id: string): Promise<Appointment> {
    try {
      // Check if appointment exists
      const existingAppointment = await this.findById(id);
      
      if (!existingAppointment) {
        throw new BaseError(
          `Appointment with ID ${id} not found`,
          ErrorType.NOT_FOUND,
          'CARE_125',
          { id }
        );
      }

      // Check if the appointment is in a valid state for confirmation
      if (existingAppointment.status !== AppointmentStatus.SCHEDULED) {
        throw new BaseError(
          `Cannot confirm appointment with status ${existingAppointment.status}`,
          ErrorType.BUSINESS,
          'CARE_126',
          { id, status: existingAppointment.status }
        );
      }

      // Update appointment status
      const confirmedAppointment = await this.update(id, { 
        status: AppointmentStatus.CONFIRMED 
      });

      // Publish event for appointment confirmation
      await this.publishAppointmentConfirmedEvent(confirmedAppointment);

      this.logger.log(`Appointment confirmed: ${id}`);
      return confirmedAppointment;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to confirm appointment: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to confirm appointment with ID ${id}`,
        ErrorType.DATABASE_WRITE,
        'CARE_127',
        { id },
        error
      );
    }
  }

  /**
   * Initiates a telemedicine session for an appointment.
   * 
   * @param appointmentId Appointment ID
   * @param userId User ID initiating the session
   * @returns The created telemedicine session
   */
  @Resilient({
    retry: {
      maxAttempts: 3,
      initialDelayMs: 200,
      maxDelayMs: 2000,
      retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL_SERVICE]
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      halfOpenMaxCalls: 2
    },
    fallback: {
      handler: (appointmentId, userId) => {
        return {
          status: 'degraded',
          message: 'Telemedicine service is currently experiencing issues. Please try again later.',
          appointmentId,
          fallbackMode: true
        };
      }
    }
  })
  async startTelemedicineSession(appointmentId: string, userId: string): Promise<any> {
    try {
      // Check if appointment exists
      const appointment = await this.findById(appointmentId);
      
      if (!appointment) {
        throw new BaseError(
          `Appointment with ID ${appointmentId} not found`,
          ErrorType.NOT_FOUND,
          'CARE_128',
          { appointmentId }
        );
      }

      // Check if the appointment is of type telemedicine
      if (appointment.type !== AppointmentType.TELEMEDICINE) {
        throw new BaseError(
          `Cannot start telemedicine session for non-telemedicine appointment`,
          ErrorType.BUSINESS,
          'CARE_129',
          { appointmentId, type: appointment.type }
        );
      }

      // Check if the user is either the patient or the provider
      if (appointment.userId !== userId && appointment.providerId !== userId) {
        throw new BaseError(
          `User ${userId} is not authorized for this appointment`,
          ErrorType.UNAUTHORIZED,
          'CARE_130',
          { appointmentId, userId }
        );
      }

      // Create telemedicine session using the telemedicine service
      const session = await this.telemedicineService.startTelemedicineSession({
        userId,
        appointmentId,
        providerId: appointment.providerId
      });

      this.logger.log(`Telemedicine session started for appointment: ${appointmentId}`);
      return session;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      this.logger.error(`Failed to start telemedicine session: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to start telemedicine session for appointment ${appointmentId}`,
        ErrorType.EXTERNAL_SERVICE,
        'CARE_131',
        { appointmentId, userId },
        error
      );
    }
  }

  /**
   * Checks for appointment conflicts for a user.
   * 
   * @param userId User ID
   * @param dateTime Proposed appointment date and time
   * @param excludeAppointmentId Optional appointment ID to exclude from conflict check
   * @returns True if a conflict exists
   */
  @RetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.DATABASE_CONNECTION]
  })
  async checkUserAppointmentConflict(userId: string, dateTime: Date, excludeAppointmentId?: string): Promise<boolean> {
    try {
      const proposedTime = new Date(dateTime);
      
      // Check for existing appointments within a buffer time (e.g., 1 hour before and after)
      const bufferMinutes = this.config.appointments.availabilityBuffer;
      const startTime = new Date(proposedTime.getTime() - bufferMinutes * 60000);
      const endTime = new Date(proposedTime.getTime() + bufferMinutes * 60000);
      
      const where: any = {
        userId,
        dateTime: {
          gte: startTime,
          lte: endTime
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        }
      };
      
      // Exclude the current appointment if provided (for updates)
      if (excludeAppointmentId) {
        where.id = { not: excludeAppointmentId };
      }
      
      const conflictingAppointments = await this.prisma.appointment.findMany({ where });
      
      return conflictingAppointments.length > 0;
    } catch (error) {
      this.logger.error(`Failed to check appointment conflict: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to check appointment conflict for user ${userId}`,
        ErrorType.DATABASE_READ,
        'CARE_132',
        { userId, dateTime, excludeAppointmentId },
        error
      );
    }
  }

  /**
   * Checks provider availability for a specific time.
   * Uses circuit breaker pattern to handle provider service failures.
   * 
   * @param providerId Provider ID
   * @param dateTime Proposed appointment date and time
   * @returns True if the provider is available
   */
  @WithCircuitBreaker({
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    halfOpenMaxCalls: 2
  })
  @RetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 200,
    maxDelayMs: 2000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL_SERVICE]
  })
  @WithFallback({
    handler: () => false, // Conservative approach: if provider service is down, assume unavailable
    logFailure: true
  })
  async checkProviderAvailability(providerId: string, dateTime: Date): Promise<boolean> {
    try {
      return await this.providersService.checkAvailability(providerId, dateTime);
    } catch (error) {
      this.logger.error(`Failed to check provider availability: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to check availability for provider ${providerId}`,
        ErrorType.EXTERNAL_SERVICE,
        'CARE_133',
        { providerId, dateTime },
        error
      );
    }
  }

  /**
   * Gets appointments for a provider.
   * 
   * @param providerId Provider ID
   * @param pagination Pagination parameters
   * @param filter Filter criteria
   * @returns Paginated list of provider appointments
   */
  async getProviderAppointments(
    providerId: string, 
    pagination?: PaginationDto, 
    filter?: FilterDto
  ): Promise<PaginatedResponse<Appointment>> {
    try {
      const providerFilter = {
        ...filter,
        where: {
          ...filter?.where,
          providerId
        }
      };
      
      return this.findAll(pagination, providerFilter);
    } catch (error) {
      this.logger.error(`Failed to get provider appointments: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to retrieve appointments for provider ${providerId}`,
        ErrorType.DATABASE_READ,
        'CARE_134',
        { providerId, pagination, filter },
        error
      );
    }
  }

  /**
   * Gets today's appointments for a provider.
   * 
   * @param providerId Provider ID
   * @returns List of today's appointments
   */
  async getProviderTodayAppointments(providerId: string): Promise<Appointment[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await this.findAll(
        { limit: 100 }, // Higher limit to get all of today's appointments
        {
          where: {
            providerId,
            dateTime: {
              gte: today,
              lt: tomorrow
            },
            status: {
              in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
            }
          },
          orderBy: { dateTime: 'asc' }
        }
      );
      
      return result.data;
    } catch (error) {
      this.logger.error(`Failed to get provider's today appointments: ${error.message}`, error.stack);
      throw new BaseError(
        `Failed to retrieve today's appointments for provider ${providerId}`,
        ErrorType.DATABASE_READ,
        'CARE_135',
        { providerId },
        error
      );
    }
  }

  /**
   * Publishes an event when an appointment is created.
   * Uses retry with backoff to handle Kafka service failures.
   * 
   * @param appointment The created appointment
   */
  @RetryWithBackoff({
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL_SERVICE]
  })
  private async publishAppointmentCreatedEvent(appointment: Appointment): Promise<void> {
    try {
      await this.kafkaService.produce(
        'care.appointment.created',
        {
          appointmentId: appointment.id,
          userId: appointment.userId,
          providerId: appointment.providerId,
          dateTime: appointment.dateTime,
          type: appointment.type,
          eventType: this.config.gamification.defaultEvents.appointmentBooked
        },
        appointment.id
      );
    } catch (error) {
      this.logger.error(`Failed to publish appointment created event: ${error.message}`, error.stack);
      throw new BaseError(
        'Failed to publish appointment created event',
        ErrorType.EVENT_PUBLISHING,
        'CARE_136',
        { appointmentId: appointment.id },
        error
      );
    }
  }

  /**
   * Publishes an event when an appointment is updated.
   * Uses retry with backoff to handle Kafka service failures.
   * 
   * @param appointment The updated appointment
   * @param isCancelling Whether the appointment is being cancelled
   * @param xpLoss XP loss for cancellation (if applicable)
   */
  @RetryWithBackoff({
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL_SERVICE]
  })
  private async publishAppointmentUpdatedEvent(
    appointment: Appointment, 
    isCancelling: boolean, 
    xpLoss: number
  ): Promise<void> {
    try {
      const eventType = isCancelling ? 
        this.config.gamification.defaultEvents.appointmentCancelled : 
        'APPOINTMENT_UPDATED';

      await this.kafkaService.produce(
        'care.appointment.updated',
        {
          appointmentId: appointment.id,
          userId: appointment.userId,
          providerId: appointment.providerId,
          dateTime: appointment.dateTime,
          type: appointment.type,
          status: appointment.status,
          eventType,
          xpLoss
        },
        appointment.id
      );
    } catch (error) {
      this.logger.error(`Failed to publish appointment updated event: ${error.message}`, error.stack);
      throw new BaseError(
        'Failed to publish appointment updated event',
        ErrorType.EVENT_PUBLISHING,
        'CARE_137',
        { appointmentId: appointment.id },
        error
      );
    }
  }

  /**
   * Publishes an event when an appointment is completed.
   * Uses retry with backoff to handle Kafka service failures.
   * 
   * @param appointment The completed appointment
   */
  @RetryWithBackoff({
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL_SERVICE]
  })
  private async publishAppointmentCompletedEvent(appointment: Appointment): Promise<void> {
    try {
      await this.kafkaService.produce(
        'care.appointment.completed',
        {
          appointmentId: appointment.id,
          userId: appointment.userId,
          providerId: appointment.providerId,
          dateTime: appointment.dateTime,
          type: appointment.type,
          eventType: this.config.gamification.defaultEvents.appointmentAttended,
          xpReward: this.config.gamification.pointValues.appointmentAttended
        },
        appointment.id
      );
    } catch (error) {
      this.logger.error(`Failed to publish appointment completed event: ${error.message}`, error.stack);
      throw new BaseError(
        'Failed to publish appointment completed event',
        ErrorType.EVENT_PUBLISHING,
        'CARE_138',
        { appointmentId: appointment.id },
        error
      );
    }
  }

  /**
   * Publishes an event when an appointment is confirmed.
   * Uses retry with backoff to handle Kafka service failures.
   * 
   * @param appointment The confirmed appointment
   */
  @RetryWithBackoff({
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    retryableErrors: [ErrorType.TRANSIENT, ErrorType.EXTERNAL_SERVICE]
  })
  private async publishAppointmentConfirmedEvent(appointment: Appointment): Promise<void> {
    try {
      await this.kafkaService.produce(
        'care.appointment.confirmed',
        {
          appointmentId: appointment.id,
          userId: appointment.userId,
          providerId: appointment.providerId,
          dateTime: appointment.dateTime,
          type: appointment.type
        },
        appointment.id
      );
    } catch (error) {
      this.logger.error(`Failed to publish appointment confirmed event: ${error.message}`, error.stack);
      throw new BaseError(
        'Failed to publish appointment confirmed event',
        ErrorType.EVENT_PUBLISHING,
        'CARE_139',
        { appointmentId: appointment.id },
        error
      );
    }
  }
}